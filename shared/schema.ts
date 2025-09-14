import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table for AI business solutions
export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  description: text("description"),
  descriptionEn: text("description_en"),
  shortDescription: varchar("short_description", { length: 500 }),
  shortDescriptionEn: varchar("short_description_en", { length: 500 }),
  price: varchar("price", { length: 100 }),
  features: jsonb("features").$type<string[]>().default([]),
  featuresEn: jsonb("features_en").$type<string[]>().default([]),
  category: varchar("category", { length: 100 }),
  categoryEn: varchar("category_en", { length: 100 }),
  aiPrompt: text("ai_prompt"),
  isActive: boolean("is_active").default(true),
  iconType: varchar("icon_type", { length: 50 }), // chat, analytics, automation, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Recommendations table
export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  businessType: varchar("business_type", { length: 100 }),
  businessSize: varchar("business_size", { length: 50 }),
  currentChallenges: jsonb("current_challenges").$type<string[]>(),
  recommendedServices: jsonb("recommended_services").$type<string[]>(),
  aiResponse: text("ai_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service Inquiries table
export const serviceInquiries = pgTable("service_inquiries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: uuid("service_id").references(() => services.id),
  userId: varchar("user_id").references(() => users.id),
  companyName: varchar("company_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  message: text("message"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, contacted, closed
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  recommendations: many(aiRecommendations),
  inquiries: many(serviceInquiries),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  inquiries: many(serviceInquiries),
}));

export const aiRecommendationsRelations = relations(aiRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [aiRecommendations.userId],
    references: [users.id],
  }),
}));

export const serviceInquiriesRelations = relations(serviceInquiries, ({ one }) => ({
  service: one(services, {
    fields: [serviceInquiries.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [serviceInquiries.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(serviceInquiries).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type ServiceInquiry = typeof serviceInquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
