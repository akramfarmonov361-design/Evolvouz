import {
  users,
  services,
  orders,
  blogPosts,
  clients,
  aiRecommendations,
  serviceInquiries,
  type User,
  type UpsertUser,
  type Service,
  type InsertService,
  type Order,
  type InsertOrder,
  type BlogPost,
  type InsertBlogPost,
  type Client,
  type InsertClient,
  type AiRecommendation,
  type InsertRecommendation,
  type ServiceInquiry,
  type InsertInquiry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getServicesByCategory(category: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrdersByService(serviceId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  
  // Blog Post operations
  getBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<void>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // AI Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<AiRecommendation>;
  getUserRecommendations(userId: string): Promise<AiRecommendation[]>;
  
  // Service Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<ServiceInquiry>;
  getInquiries(): Promise<ServiceInquiry[]>;
  getInquiriesByService(serviceId: string): Promise<ServiceInquiry[]>;
  updateInquiryStatus(id: string, status: string): Promise<ServiceInquiry>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(desc(services.createdAt));
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return await db.select().from(services).where(
      and(eq(services.category, category), eq(services.isActive, true))
    ).orderBy(desc(services.createdAt));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData as any)
      .returning();
    return service;
  }

  async updateService(id: string, serviceData: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({
        ...serviceData,
        updatedAt: new Date(),
      } as any)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // AI Recommendations
  async createRecommendation(recommendationData: InsertRecommendation): Promise<AiRecommendation> {
    const [recommendation] = await db
      .insert(aiRecommendations)
      .values(recommendationData as any)
      .returning();
    return recommendation;
  }

  async getUserRecommendations(userId: string): Promise<AiRecommendation[]> {
    return await db.select().from(aiRecommendations)
      .where(eq(aiRecommendations.userId, userId))
      .orderBy(desc(aiRecommendations.createdAt));
  }

  // Service Inquiries
  async createInquiry(inquiryData: InsertInquiry): Promise<ServiceInquiry> {
    const [inquiry] = await db
      .insert(serviceInquiries)
      .values(inquiryData)
      .returning();
    return inquiry;
  }

  async getInquiries(): Promise<ServiceInquiry[]> {
    return await db.select().from(serviceInquiries)
      .orderBy(desc(serviceInquiries.createdAt));
  }

  async getInquiriesByService(serviceId: string): Promise<ServiceInquiry[]> {
    return await db.select().from(serviceInquiries)
      .where(eq(serviceInquiries.serviceId, serviceId))
      .orderBy(desc(serviceInquiries.createdAt));
  }

  async updateInquiryStatus(id: string, status: string): Promise<ServiceInquiry> {
    const [inquiry] = await db
      .update(serviceInquiries)
      .set({ status })
      .where(eq(serviceInquiries.id, id))
      .returning();
    return inquiry;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByService(serviceId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.serviceId, serviceId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData as any)
      .returning();
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        ...orderData,
        updatedAt: new Date(),
      } as any)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Blog Post operations
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(and(eq(blogPosts.category, category), eq(blogPosts.status, 'published')))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async createBlogPost(postData: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values(postData as any)
      .returning();
    return post;
  }

  async updateBlogPost(id: string, postData: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set({
        ...postData,
        updatedAt: new Date(),
      } as any)
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, id));
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({
        ...clientData,
        updatedAt: new Date(),
      } as any)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }
}

export const storage = new DatabaseStorage();
