import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// Type for document data
interface DocumentInfo {
  id: string;
  title: string;
  content: string;
  url: string;
}

// Type for search result
interface SearchResult {
  title: string;
  content: string;
  source: string;
  relevance: number;
}

// Cache for document data by context (cleared to remove mock data)
const documentCache: Map<number, DocumentInfo[]> = new Map();

// Function to retrieve documents for a context
async function getDocumentsForContext(contextId: number): Promise<DocumentInfo[]> {
  // Check cache first
  if (documentCache.has(contextId)) {
    return documentCache.get(contextId)!;
  }
  
  // In a real implementation, this would retrieve documents from a vector database
  // or other storage system that's been indexed from SharePoint
  // For now, we'll return mock documents based on context
  const context = await storage.getContext(contextId);
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  // Return real context information instead of mock data
  const documents: DocumentInfo[] = [
    {
      id: `${contextId}-real`,
      title: context.name,
      content: `Context: ${context.name}\nDescription: ${context.description}\nThis context contains information relevant to user queries about ${context.name}.`,
      url: context.sharePointUrl || `uploaded-files-${contextId}`
    }
  ];
  
  // Cache the documents
  documentCache.set(contextId, documents);
  
  return documents;
}

// Process a user query using OpenAI and context documents
export async function processQuery(query: string, contextId: number): Promise<{ response: string; sources: any[] }> {
  // Get the actual context information
  const context = await storage.getContext(contextId);
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  // Get documents for the context
  const documents = await getDocumentsForContext(contextId);
  
  // Prepare documents as context for the AI
  const documentContext = documents.map(doc => 
    `Document: ${doc.title}\nContent: ${doc.content}\n`
  ).join("\n");
  
  // Create the prompt with the query and document context
  const systemPrompt = `You are HRSD Digital Assistant, an AI assistant for the Hampton Roads Sanitation District. 
Answer the question based only on the selected context: "${context.name}" - ${context.description}. 
If you cannot answer based on this specific context, say so clearly. Do not use information from other sources.

Document Context:
${documentContext}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    // Extract the AI's response
    const aiResponse = response.choices[0].message.content || "Sorry, I couldn't process your request.";
    
    // For sources, we'd normally use a vector database to find the most relevant documents
    // Here we'll just return the documents used as context
    const sources = documents.map(doc => ({
      title: doc.title,
      url: doc.url
    }));
    
    return {
      response: aiResponse,
      sources
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to process query with AI");
  }
}

// Search documents based on a query
export async function searchDocuments(query: string, contextId: number, maxResults: number = 5): Promise<SearchResult[]> {
  // Get documents for the context
  const documents = await getDocumentsForContext(contextId);
  
  try {
    // In a real implementation, this would use a vector database or embeddings search
    // For now, we'll simulate a search by asking OpenAI to rank documents by relevance
    const searchPrompt = `Given the following documents and a search query, rank the documents by relevance to the query. 
Return a JSON array of objects with the following fields:
- title: the document title
- content: a relevant excerpt from the document (or the full content if short)
- source: the URL of the document
- relevance: a score from 0 to 1 indicating relevance

Documents:
${documents.map(doc => `Title: ${doc.title}\nContent: ${doc.content}\nURL: ${doc.url}`).join('\n\n')}

Query: ${query}

Return ONLY a valid JSON array of ranked results, from most to least relevant, without any introduction or explanation.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a document search engine that ranks documents by relevance to a query." },
        { role: "user", content: searchPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1500
    });
    
    const responseText = response.choices[0].message.content || "[]";
    
    // Parse the response
    try {
      const results = JSON.parse(responseText);
      return Array.isArray(results.results) ? results.results.slice(0, maxResults) : [];
    } catch (parseError) {
      console.error("Error parsing OpenAI search response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error searching documents with OpenAI:", error);
    throw new Error("Failed to search documents");
  }
}

// Generate suggested follow-up questions
export async function generateSuggestedQuestions(originalQuery: string, previousResponse: string): Promise<string[]> {
  try {
    const prompt = `Based on the following question and answer, suggest 3 relevant follow-up questions that the user might want to ask next.
Return ONLY a JSON array of strings, with each string being a suggested question. Do not include any explanations or other text.

Original Question: ${originalQuery}

Answer: ${previousResponse}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You generate relevant follow-up questions based on previous conversation context." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    
    const responseText = response.choices[0].message.content || "[]";
    
    // Parse the response
    try {
      const results = JSON.parse(responseText);
      return Array.isArray(results.suggestions) ? results.suggestions : [];
    } catch (parseError) {
      console.error("Error parsing OpenAI suggestions response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error generating suggestions with OpenAI:", error);
    return [];
  }
}
