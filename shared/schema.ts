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
  integer,
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
  passwordHash: varchar("password_hash", { length: 255 }), // For admin users - nullable for migration safety
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

// Orders table for service purchases
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: uuid("service_id").references(() => services.id),
  userId: varchar("user_id").references(() => users.id),
  clientId: uuid("client_id").references(() => clients.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  clientPhone: varchar("client_phone", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  projectDescription: text("project_description"),
  budget: varchar("budget", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog Posts table for content management
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  slugEn: varchar("slug_en", { length: 255 }).unique(),
  excerpt: text("excerpt"),
  excerptEn: text("excerpt_en"),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  featuredImageUrl: varchar("featured_image_url", { length: 500 }),
  category: varchar("category", { length: 100 }),
  categoryEn: varchar("category_en", { length: 100 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  tagsEn: jsonb("tags_en").$type<string[]>().default([]),
  authorId: varchar("author_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("draft"), // draft, published, scheduled
  publishedAt: timestamp("published_at"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoTitleEn: varchar("seo_title_en", { length: 255 }),
  seoDescription: varchar("seo_description", { length: 500 }),
  seoDescriptionEn: varchar("seo_description_en", { length: 500 }),
  viewCount: integer("view_count").default(0),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table for customer management
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  position: varchar("position", { length: 100 }),
  address: text("address"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, potential
  source: varchar("source", { length: 100 }), // website, referral, social, advertising
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  recommendations: many(aiRecommendations),
  inquiries: many(serviceInquiries),
  orders: many(orders),
  blogPosts: many(blogPosts),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  inquiries: many(serviceInquiries),
  orders: many(orders),
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

export const ordersRelations = relations(orders, ({ one }) => ({
  service: one(services, {
    fields: [orders.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  orders: many(orders),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Special upsert schema for users that includes id (required for Replit Auth)
export const upsertUserSchema = createInsertSchema(users).omit({
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

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Public-safe order creation schema - only allows fields that clients should control
export const publicInsertOrderSchema = createInsertSchema(orders).pick({
  serviceId: true,
  clientName: true,
  clientEmail: true,
  clientPhone: true,
  companyName: true,
  projectDescription: true,
  budget: true,
  timeline: true,
  requirements: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type ServiceInquiry = typeof serviceInquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type PublicInsertOrder = z.infer<typeof publicInsertOrderSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
