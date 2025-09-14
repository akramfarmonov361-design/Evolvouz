import {
  users,
  services,
  aiRecommendations,
  serviceInquiries,
  type User,
  type UpsertUser,
  type Service,
  type InsertService,
  type AiRecommendation,
  type InsertRecommendation,
  type ServiceInquiry,
  type InsertInquiry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getServicesByCategory(category: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  
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
      .values(serviceData)
      .returning();
    return service;
  }

  async updateService(id: string, serviceData: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: new Date() })
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
      .values(recommendationData)
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
}

export const storage = new DatabaseStorage();
