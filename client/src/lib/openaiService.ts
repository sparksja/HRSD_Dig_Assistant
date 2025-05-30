import { apiRequest } from './queryClient';

interface QueryParams {
  query: string;
  contextId: number;
}

interface SearchParams {
  query: string;
  contextId: number;
  maxResults?: number;
}

interface SearchResult {
  title: string;
  content: string;
  source: string;
  relevance: number;
}

interface QueryResponse {
  response: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

export class OpenAIService {
  // Process a natural language query
  async processQuery(params: QueryParams): Promise<QueryResponse> {
    try {
      const response = await apiRequest('POST', '/api/query', params);
      return await response.json();
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  // Search documents with natural language query
  async searchDocuments(params: SearchParams): Promise<SearchResult[]> {
    try {
      const response = await apiRequest('POST', '/api/search', params);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Get suggested follow-up questions based on previous query
  async getSuggestedQuestions(queryId: number): Promise<string[]> {
    try {
      const response = await apiRequest('GET', `/api/query/${queryId}/suggestions`);
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting suggested questions:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
export default openaiService;
