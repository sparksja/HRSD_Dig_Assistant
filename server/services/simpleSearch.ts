// Simple but effective document search service
// This provides immediate document search capabilities without external dependencies

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    contextId: number;
    chunkIndex: number;
  };
}

class SimpleSearchService {
  private documents: Map<string, DocumentChunk[]> = new Map();

  async addDocument(contextId: number, filename: string, content: string): Promise<void> {
    console.log(`Processing ${filename} with Simple Search: ${content.length} characters`);
    
    const contextKey = contextId.toString();
    if (!this.documents.has(contextKey)) {
      this.documents.set(contextKey, []);
    }
    
    // Split document into chunks for better search
    const chunks = this.splitIntoChunks(content, 500);
    const existingChunks = this.documents.get(contextKey)!;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk: DocumentChunk = {
        id: `${contextId}_${filename}_${i}`,
        content: chunks[i],
        metadata: {
          filename,
          contextId,
          chunkIndex: i
        }
      };
      existingChunks.push(chunk);
    }
    
    console.log(`Added ${chunks.length} chunks for ${filename}`);
  }

  async searchAndGenerate(query: string, contextId: number): Promise<string> {
    const contextKey = contextId.toString();
    const chunks = this.documents.get(contextKey) || [];
    
    if (chunks.length === 0) {
      return "No documents found in this context. Please upload some documents first.";
    }
    
    // Find relevant chunks using keyword matching
    const relevantChunks = this.findRelevantChunks(query, chunks);
    
    if (relevantChunks.length === 0) {
      return `I couldn't find information about "${query}" in the uploaded documents. Try a different search term or check if the relevant documents are uploaded.`;
    }
    
    // Generate a helpful response
    return this.generateResponse(query, relevantChunks);
  }

  private findRelevantChunks(query: string, chunks: DocumentChunk[]): DocumentChunk[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const scoredChunks: { chunk: DocumentChunk; score: number }[] = [];
    
    for (const chunk of chunks) {
      const content = chunk.content.toLowerCase();
      let score = 0;
      
      // Score based on exact matches and proximity
      for (const word of queryWords) {
        const matches = content.match(new RegExp(word, 'gi')) || [];
        score += matches.length;
        
        // Bonus for exact phrase matches
        if (content.includes(query.toLowerCase())) {
          score += 10;
        }
      }
      
      if (score > 0) {
        scoredChunks.push({ chunk, score });
      }
    }
    
    // Return top 3 most relevant chunks
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.chunk);
  }

  private generateResponse(query: string, chunks: DocumentChunk[]): string {
    let response = `Based on the documents, here's what I found about "${query}":\n\n`;
    
    for (const chunk of chunks) {
      const content = this.highlightRelevantInfo(query, chunk.content);
      response += `From ${chunk.metadata.filename}:\n${content}\n\n`;
    }
    
    return response.trim();
  }

  private highlightRelevantInfo(query: string, content: string): string {
    // Find the most relevant sentences containing the query terms
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return queryWords.some(word => lowerSentence.includes(word));
    });
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 3).join('. ').trim() + '.';
    }
    
    // Fallback to first part of content
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\s*\n/);
    
    let currentChunk = "";
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 10);
  }

  clearContext(contextId: number): void {
    this.documents.delete(contextId.toString());
  }

  getDocumentCount(contextId: number): number {
    const chunks = this.documents.get(contextId.toString()) || [];
    const uniqueFiles = new Set(chunks.map(chunk => chunk.metadata.filename));
    return uniqueFiles.size;
  }
}

export const simpleSearch = new SimpleSearchService();