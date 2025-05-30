// Using local Llama models for embeddings instead of OpenAI

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

// In-memory vector store (in production, use a proper vector database like Pinecone or Chroma)
class SimpleVectorStore {
  private chunks: Map<string, DocumentChunk> = new Map();

  async addDocument(contextId: number, filename: string, content: string): Promise<void> {
    // Split document into chunks
    const chunks = this.splitIntoChunks(content, 1000); // 1000 char chunks
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${contextId}_${filename}_${i}`;
      
      try {
        // Generate embedding for this chunk
        const embedding = await this.generateEmbedding(chunks[i]);
        
        const chunk: DocumentChunk = {
          id: chunkId,
          content: chunks[i],
          embedding,
          metadata: {
            filename,
            contextId,
            chunkIndex: i
          }
        };
        
        this.chunks.set(chunkId, chunk);
        console.log(`Added chunk ${i + 1}/${chunks.length} for ${filename}`);
      } catch (error) {
        console.error(`Failed to create embedding for chunk ${i}:`, error);
      }
    }
  }

  async searchSimilar(query: string, contextId: number, limit: number = 5): Promise<DocumentChunk[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
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
    
    return chunks.filter(chunk => chunk.length > 10); // Filter out very short chunks
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use Ollama for local embeddings
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nomic-embed-text', // A good embedding model for Ollama
          prompt: text.substring(0, 8000), // Limit input length
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama embeddings failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding with Ollama:', error);
      // Fallback to simple hash-based embedding for development
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple TF-IDF style embedding as fallback
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const embedding = new Array(384).fill(0); // Standard embedding size
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const pos = Math.abs(hash) % embedding.length;
      embedding[pos] += 1 / Math.sqrt(words.length);
    });
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
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

  clearContext(contextId: number): void {
    for (const [key, chunk] of this.chunks) {
      if (chunk.metadata.contextId === contextId) {
        this.chunks.delete(key);
      }
    }
  }
}

export const vectorStore = new SimpleVectorStore();