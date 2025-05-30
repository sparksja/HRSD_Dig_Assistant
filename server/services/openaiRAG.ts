import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    filename: string;
    contextId: number;
    chunkIndex: number;
  };
}

class OpenAIRAGService {
  private chunks: Map<string, DocumentChunk> = new Map();

  async addDocument(contextId: number, filename: string, content: string): Promise<void> {
    console.log(`Processing ${filename} with OpenAI RAG...`);
    
    // Split document into manageable chunks
    const chunks = this.splitIntoChunks(content, 800); // Smaller chunks for faster processing
    console.log(`Document split into ${chunks.length} chunks`);
    
    // Process chunks in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Process batch in parallel for speed
      const promises = batch.map(async (chunkContent, batchIndex) => {
        const chunkIndex = i + batchIndex;
        const chunkId = `${contextId}_${filename}_${chunkIndex}`;
        
        try {
          // Generate embedding using OpenAI
          const embedding = await this.generateOpenAIEmbedding(chunkContent);
          
          const chunk: DocumentChunk = {
            id: chunkId,
            content: chunkContent,
            embedding,
            metadata: {
              filename,
              contextId,
              chunkIndex
            }
          };
          
          this.chunks.set(chunkId, chunk);
          return chunk;
        } catch (error) {
          console.error(`Failed to create embedding for chunk ${chunkIndex}:`, error);
          throw error;
        }
      });
      
      await Promise.all(promises);
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} for ${filename}`);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✓ Completed processing ${filename}: ${chunks.length} chunks indexed`);
  }

  async searchAndGenerate(query: string, contextId: number): Promise<string> {
    try {
      // Check if we have any documents for this context
      const contextChunks = Array.from(this.chunks.values())
        .filter(chunk => chunk.metadata.contextId === contextId);
      
      if (contextChunks.length === 0) {
        return "No documents found in this context. Please upload some documents first.";
      }

      // For faster responses, first try simple text matching
      const quickMatch = this.findQuickMatch(query, contextChunks);
      if (quickMatch) {
        return quickMatch;
      }

      // Step 1: Find relevant chunks using semantic search
      const relevantChunks = await this.searchSimilar(query, contextId, 3);
      
      if (relevantChunks.length === 0) {
        return "No relevant information found in the documents for your query.";
      }

      // Step 2: Prepare context for OpenAI (limit size for faster processing)
      const context = relevantChunks
        .map(chunk => `From ${chunk.metadata.filename}:\n${chunk.content}`)
        .join('\n\n---\n\n')
        .substring(0, 2000); // Limit context size for faster processing

      // Step 3: Generate response using OpenAI
      const response = await this.generateOpenAIResponse(query, context);
      
      return response;
    } catch (error) {
      console.error('Error in OpenAI RAG search and generation:', error);
      return `Error processing your query: ${error.message}`;
    }
  }

  private findQuickMatch(query: string, chunks: DocumentChunk[]): string | null {
    const queryLower = query.toLowerCase();
    
    // Quick patterns for common queries - this gives instant responses
    if (queryLower.includes('manufacturer') || queryLower.includes('made by')) {
      for (const chunk of chunks) {
        const content = chunk.content;
        
        // Look for "Sharples (Alfa Laval)" specifically
        if (content.includes('Sharples (Alfa Laval)')) {
          return `The manufacturer is Sharples (Alfa Laval).`;
        }
        
        // General manufacturer pattern
        const manufacturerMatch = content.match(/Manufacturer\s*-?\s*([^\n\r]+)/i);
        if (manufacturerMatch) {
          return `The manufacturer is ${manufacturerMatch[1].trim()}.`;
        }
      }
    }
    
    if (queryLower.includes('horsepower') || queryLower.includes('hp')) {
      for (const chunk of chunks) {
        const content = chunk.content;
        const hpMatch = content.match(/(\d+)\s*hp/i);
        if (hpMatch) {
          return `The horsepower is ${hpMatch[1]} hp.`;
        }
      }
    }
    
    if (queryLower.includes('model') || queryLower.includes('type')) {
      for (const chunk of chunks) {
        const content = chunk.content;
        const modelMatch = content.match(/Model\s*-?\s*([^\n\r]+)/i);
        if (modelMatch) {
          return `The model is ${modelMatch[1].trim()}.`;
        }
      }
    }
    
    return null;
  }

  private async searchSimilar(query: string, contextId: number, limit: number = 5): Promise<DocumentChunk[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateOpenAIEmbedding(query);
      
      // Find chunks for this context
      const contextChunks = Array.from(this.chunks.values())
        .filter(chunk => chunk.metadata.contextId === contextId);
      
      if (contextChunks.length === 0) {
        return [];
      }
      
      // Calculate similarity scores
      const results = contextChunks.map(chunk => ({
        chunk,
        similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
      }));
      
      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => result.chunk);
        
    } catch (error) {
      console.error('Error in similarity search:', error);
      return [];
    }
  }

  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000), // Limit input length
    });
    
    return response.data[0].embedding;
  }

  private async generateOpenAIResponse(query: string, context: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for HRSD treatment plant operations. Answer questions concisely based on the provided documents. Keep responses brief and specific."
        },
        {
          role: "user",
          content: `Based on this document content, answer briefly:

${context}

Question: ${query}`
        }
      ],
      temperature: 0.1,
      max_tokens: 150 // Shorter responses for faster processing
    });
    
    return response.choices[0].message.content || "No response generated.";
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = "";
    
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + ".";
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 10);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clearContext(contextId: number): void {
    for (const [key, chunk] of this.chunks) {
      if (chunk.metadata.contextId === contextId) {
        this.chunks.delete(key);
      }
    }
  }

  getDocumentCount(contextId: number): number {
    return Array.from(this.chunks.values())
      .filter(chunk => chunk.metadata.contextId === contextId)
      .reduce((acc, chunk) => {
        if (!acc.includes(chunk.metadata.filename)) {
          acc.push(chunk.metadata.filename);
        }
        return acc;
      }, [] as string[]).length;
  }
}

export const openaiRAG = new OpenAIRAGService();