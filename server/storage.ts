import { 
  users, type User, type InsertUser, 
  contexts, type Context, type InsertContext, 
  queries, type Query, type InsertQuery,
  namingConventions, type NamingConvention, type InsertNamingConvention
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAzureId(azureId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserLastLogin(id: number): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User>;
  
  // Context operations
  getContext(id: number): Promise<Context | undefined>;
  getAllContexts(): Promise<Context[]>;
  createContext(context: InsertContext): Promise<Context>;
  updateContext(id: number, updates: Partial<Context>): Promise<Context | undefined>;
  updateContextStatus(id: number, status: string): Promise<Context | undefined>;
  deleteContext(id: number): Promise<void>;
  
  // Query operations
  createQuery(query: InsertQuery): Promise<Query>;
  getQuery(id: number): Promise<Query | undefined>;
  getQueriesByUser(userId: number): Promise<Query[]>;
  getRecentQueriesByUser(userId: number, limit: number): Promise<Query[]>;
  getSavedQueriesByUser(userId: number): Promise<Query[]>;
  updateQuerySaveStatus(id: number, isSaved: boolean): Promise<Query>;
  
  // Naming Convention operations
  createNamingConvention(convention: InsertNamingConvention): Promise<NamingConvention>;
  getAllNamingConventions(): Promise<NamingConvention[]>;
  getNamingConvention(id: number): Promise<NamingConvention | undefined>;
  deleteNamingConvention(id: number): Promise<void>;
  
  // Context Files operations
  createContextFile(file: InsertContextFile): Promise<ContextFile>;
  getContextFiles(contextId: number): Promise<ContextFile[]>;
  deleteContextFile(id: number): Promise<void>;
  deleteContextFiles(contextId: number): Promise<void>;
  
  // Analytics operations
  getTotalQueriesCount(): Promise<number>;
  getActiveUsersCount(): Promise<number>;
  getActiveContextsCount(): Promise<number>;
  getQueriesOverTime(days: number): Promise<{ date: string; count: number }[]>;
  getQueryDistributionByContext(): Promise<{ name: string; value: number }[]>;
  getTopQueries(limit: number): Promise<{ query: string; count: number }[]>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private contextsMap: Map<number, Context>;
  private queriesMap: Map<number, Query>;
  private namingConventionsMap: Map<number, NamingConvention>;
  private contextFilesMap: Map<number, ContextFile>;
  private currentUserId: number;
  private currentContextId: number;
  private currentQueryId: number;
  private currentNamingConventionId: number;
  private currentContextFileId: number;

  constructor() {
    this.usersMap = new Map();
    this.contextsMap = new Map();
    this.queriesMap = new Map();
    this.namingConventionsMap = new Map();
    this.currentUserId = 1;
    this.currentContextId = 5; // Start after your existing Test Upload Context (ID 4)
    this.currentQueryId = 1;
    this.currentNamingConventionId = 1;
    
    // Add demo users for HRSD
    this.createUser({
      username: "lab_technician",
      email: "lab_technician@hrsd.example.com",
      displayName: "Lab Technician",
      azureId: "demo-lab-technician-id",
      role: "user",
    });
    
    this.createUser({
      username: "tsd_supervisor",
      email: "tsd_supervisor@hrsd.example.com",
      displayName: "TSD Supervisor",
      azureId: "demo-tsd-supervisor-id",
      role: "admin",
    });
    
    this.createUser({
      username: "plant_lead_operator",
      email: "plant_lead_operator@hrsd.example.com",
      displayName: "Plant Lead Operator",
      azureId: "demo-plant-lead-operator-id",
      role: "superadmin",
    });
    
    this.createUser({
      username: "dig_water_eng",
      email: "dig_water_eng@hrsd.example.com",
      displayName: "Digital Water Engineer",
      azureId: "demo-dig-water-eng-id",
      role: "superadmin",
    });
    
    // No initial contexts - users will create their own
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByAzureId(azureId: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.azureId === azureId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, lastLogin: now };
    this.usersMap.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }
  
  async updateUserLastLogin(id: number): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, lastLogin: new Date() };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserRole(id: number, role: string): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, role };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  // Context operations
  async getContext(id: number): Promise<Context | undefined> {
    return this.contextsMap.get(id);
  }
  
  async getAllContexts(): Promise<Context[]> {
    return Array.from(this.contextsMap.values());
  }
  
  async createContext(insertContext: InsertContext): Promise<Context> {
    const id = this.currentContextId++;
    const now = new Date();
    
    // Ensure file data is properly handled
    const uploadedFiles = insertContext.uploadedFiles || [];
    const documentCount = Array.isArray(uploadedFiles) ? uploadedFiles.length : 0;
    
    const context: Context = { 
      id, 
      name: insertContext.name,
      description: insertContext.description || null,
      sharePointUrl: insertContext.sharePointUrl || null,
      status: insertContext.status || 'active',
      lastUpdated: now,
      createdBy: insertContext.createdBy || 1,
      documentCount: documentCount,
      uploadedFiles: uploadedFiles
    };
    
    this.contextsMap.set(id, context);
    console.log(`STORAGE: Created context ${id} with ${documentCount} files`);
    
    return context;
  }
  
  async updateContext(id: number, updates: Partial<Context>): Promise<Context | undefined> {
    const context = this.contextsMap.get(id);
    if (!context) {
      return undefined;
    }
    
    const now = new Date();
    const updatedContext = { ...context, ...updates, lastUpdated: now };
    this.contextsMap.set(id, updatedContext);
    return updatedContext;
  }
  
  async updateContextStatus(id: number, status: string): Promise<Context | undefined> {
    return this.updateContext(id, { status });
  }
  
  async deleteContext(id: number): Promise<void> {
    this.contextsMap.delete(id);
    
    // Also delete all queries associated with this context
    const queriesToDelete = Array.from(this.queriesMap.values()).filter(
      (query) => query.contextId === id
    );
    
    for (const query of queriesToDelete) {
      this.queriesMap.delete(query.id);
    }
  }
  
  // Query operations
  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const id = this.currentQueryId++;
    const now = new Date();
    const query: Query = { ...insertQuery, id, timestamp: now };
    this.queriesMap.set(id, query);
    return query;
  }
  
  async getQuery(id: number): Promise<Query | undefined> {
    return this.queriesMap.get(id);
  }
  
  async getQueriesByUser(userId: number): Promise<Query[]> {
    return Array.from(this.queriesMap.values())
      .filter((query) => query.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getRecentQueriesByUser(userId: number, limit: number): Promise<Query[]> {
    const queries = await this.getQueriesByUser(userId);
    return queries.slice(0, limit);
  }
  
  async getSavedQueriesByUser(userId: number): Promise<Query[]> {
    return Array.from(this.queriesMap.values())
      .filter((query) => query.userId === userId && query.isSaved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async updateQuerySaveStatus(id: number, isSaved: boolean): Promise<Query> {
    const query = this.queriesMap.get(id);
    if (!query) {
      throw new Error(`Query with ID ${id} not found`);
    }
    
    const updatedQuery = { ...query, isSaved };
    this.queriesMap.set(id, updatedQuery);
    return updatedQuery;
  }
  
  // Analytics operations
  async getTotalQueriesCount(): Promise<number> {
    return this.queriesMap.size;
  }
  
  async getActiveUsersCount(): Promise<number> {
    // Count users who have made queries in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUserIds = new Set<number>();
    
    for (const query of this.queriesMap.values()) {
      if (query.timestamp.getTime() >= thirtyDaysAgo.getTime()) {
        activeUserIds.add(query.userId);
      }
    }
    
    return activeUserIds.size;
  }
  
  async getActiveContextsCount(): Promise<number> {
    return Array.from(this.contextsMap.values()).filter(
      (context) => context.status === 'active'
    ).length;
  }
  
  async getQueriesOverTime(days: number): Promise<{ date: string; count: number }[]> {
    const result: { date: string; count: number }[] = [];
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    // Create a map for each day
    const dayMap: Map<string, number> = new Map();
    
    // Initialize the map with zeros for each day
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dayMap.set(dateString, 0);
    }
    
    // Count queries for each day
    for (const query of this.queriesMap.values()) {
      if (query.timestamp.getTime() >= daysAgo.getTime()) {
        const dateString = query.timestamp.toISOString().split('T')[0];
        const count = dayMap.get(dateString) || 0;
        dayMap.set(dateString, count + 1);
      }
    }
    
    // Convert map to array and sort by date
    for (const [date, count] of dayMap.entries()) {
      result.push({ date, count });
    }
    
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  async getQueryDistributionByContext(): Promise<{ name: string; value: number }[]> {
    const contextCounts: Map<number, number> = new Map();
    
    // Count queries for each context
    for (const query of this.queriesMap.values()) {
      const count = contextCounts.get(query.contextId) || 0;
      contextCounts.set(query.contextId, count + 1);
    }
    
    // Convert to array with context names
    const result: { name: string; value: number }[] = [];
    
    for (const [contextId, count] of contextCounts.entries()) {
      const context = this.contextsMap.get(contextId);
      if (context) {
        result.push({ name: context.name, value: count });
      }
    }
    
    return result;
  }
  
  async getTopQueries(limit: number): Promise<{ query: string; count: number }[]> {
    const queryCounts: Map<string, number> = new Map();
    
    // Count occurrences of each query
    for (const query of this.queriesMap.values()) {
      const count = queryCounts.get(query.query) || 0;
      queryCounts.set(query.query, count + 1);
    }
    
    // Convert to array and sort by count
    const result = Array.from(queryCounts.entries()).map(([query, count]) => ({
      query,
      count
    }));
    
    // Sort by count (descending) and take the top N
    return result.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  // Naming Convention operations
  async createNamingConvention(convention: InsertNamingConvention): Promise<NamingConvention> {
    const id = this.currentNamingConventionId++;
    const now = new Date();
    
    const namingConvention: NamingConvention = {
      ...convention,
      id,
      createdAt: now
    };
    
    this.namingConventionsMap.set(id, namingConvention);
    return namingConvention;
  }
  
  async getAllNamingConventions(): Promise<NamingConvention[]> {
    return Array.from(this.namingConventionsMap.values());
  }
  
  async getNamingConvention(id: number): Promise<NamingConvention | undefined> {
    return this.namingConventionsMap.get(id);
  }
  
  async deleteNamingConvention(id: number): Promise<void> {
    this.namingConventionsMap.delete(id);
  }
}

// Switch to database storage for persistence
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByAzureId(azureId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.azureId, azureId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      lastLogin: new Date()
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserLastLogin(id: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getContext(id: number): Promise<Context | undefined> {
    const [context] = await db.select().from(contexts).where(eq(contexts.id, id));
    return context || undefined;
  }

  async getAllContexts(): Promise<Context[]> {
    return await db.select().from(contexts);
  }

  async createContext(insertContext: InsertContext): Promise<Context> {
    const [context] = await db.insert(contexts).values({
      ...insertContext,
      lastUpdated: new Date()
    }).returning();
    return context;
  }

  async updateContext(id: number, updates: Partial<Context>): Promise<Context | undefined> {
    const [context] = await db.update(contexts)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(contexts.id, id))
      .returning();
    return context || undefined;
  }

  async updateContextStatus(id: number, status: string): Promise<Context | undefined> {
    const [context] = await db.update(contexts)
      .set({ status, lastUpdated: new Date() })
      .where(eq(contexts.id, id))
      .returning();
    return context || undefined;
  }

  async deleteContext(id: number): Promise<void> {
    await db.delete(contexts).where(eq(contexts.id, id));
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const [query] = await db.insert(queries).values({
      ...insertQuery,
      timestamp: new Date()
    }).returning();
    return query;
  }

  async getQuery(id: number): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query || undefined;
  }

  async getQueriesByUser(userId: number): Promise<Query[]> {
    return await db.select().from(queries).where(eq(queries.userId, userId));
  }

  async getRecentQueriesByUser(userId: number, limit: number): Promise<Query[]> {
    return await db.select().from(queries)
      .where(eq(queries.userId, userId))
      .orderBy(desc(queries.timestamp))
      .limit(limit);
  }

  async getSavedQueriesByUser(userId: number): Promise<Query[]> {
    return await db.select().from(queries)
      .where(and(eq(queries.userId, userId), eq(queries.isSaved, true)));
  }

  async updateQuerySaveStatus(id: number, isSaved: boolean): Promise<Query> {
    const [query] = await db.update(queries)
      .set({ isSaved })
      .where(eq(queries.id, id))
      .returning();
    return query;
  }

  async createNamingConvention(convention: InsertNamingConvention): Promise<NamingConvention> {
    const [namingConvention] = await db.insert(namingConventions).values(convention).returning();
    return namingConvention;
  }

  async getAllNamingConventions(): Promise<NamingConvention[]> {
    return await db.select().from(namingConventions);
  }

  async getNamingConvention(id: number): Promise<NamingConvention | undefined> {
    const [convention] = await db.select().from(namingConventions).where(eq(namingConventions.id, id));
    return convention || undefined;
  }

  async deleteNamingConvention(id: number): Promise<void> {
    await db.delete(namingConventions).where(eq(namingConventions.id, id));
  }

  async getTotalQueriesCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(queries);
    return result[0].count;
  }

  async getActiveUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async getActiveContextsCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(contexts);
    return result[0].count;
  }

  async getQueriesOverTime(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db.select({
      date: sql<string>`DATE(${queries.timestamp})`,
      count: count()
    })
    .from(queries)
    .where(gte(queries.timestamp, startDate))
    .groupBy(sql`DATE(${queries.timestamp})`)
    .orderBy(sql`DATE(${queries.timestamp})`);
    
    return result;
  }

  async getQueryDistributionByContext(): Promise<{ name: string; value: number }[]> {
    const result = await db.select({
      name: contexts.name,
      value: count()
    })
    .from(queries)
    .innerJoin(contexts, eq(queries.contextId, contexts.id))
    .groupBy(contexts.name);
    
    return result;
  }

  async getTopQueries(limit: number): Promise<{ query: string; count: number }[]> {
    const result = await db.select({
      query: queries.query,
      count: count()
    })
    .from(queries)
    .groupBy(queries.query)
    .orderBy(desc(count()))
    .limit(limit);
    
    return result;
  }
}

export const storage = new MemStorage();
