import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { adminLogin, adminLogout, getCurrentAdmin, authenticateAdmin, loginRateLimit } from "./adminAuth";
import { generateBusinessRecommendations, generateServiceContent } from "./services/openai";
import { insertServiceSchema, insertRecommendationSchema, insertInquirySchema, insertOrderSchema, publicInsertOrderSchema, insertBlogPostSchema, insertClientSchema, updateServiceSchema, updateOrderSchema, updateClientSchema, updateBlogPostSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin authentication routes
  app.post('/api/auth/login', loginRateLimit, adminLogin);
  app.post('/api/auth/logout', adminLogout);
  app.get('/api/auth/admin', authenticateAdmin, getCurrentAdmin);

  // Service routes
  app.get('/api/services', async (req, res) => {
    try {
      const { category } = req.query;
      
      // Validate category parameter if provided
      if (category && (typeof category !== 'string' || category.trim() === '')) {
        return res.status(400).json({ message: "Invalid category parameter" });
      }
      
      // Get services and filter for active ones only
      const allServices = category 
        ? await storage.getServicesByCategory(category as string)
        : await storage.getServices();
      
      // Security: Only return active services to public
      const activeServices = allServices.filter(service => service.isActive === true);
      
      res.json(activeServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate ID parameter
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Security: Only return active services to public
      if (service.isActive !== true) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Public order creation endpoint
  app.post('/api/orders', async (req, res) => {
    try {
      // Validate only safe public fields
      const publicData = publicInsertOrderSchema.parse(req.body);
      
      // Explicitly set server-controlled fields for security
      const orderData = {
        ...publicData,
        status: 'pending' as const,
        priority: 'medium' as const,
        // userId and clientId are intentionally omitted - will be null for public orders
        // notes is intentionally omitted - internal use only
      };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Public blog endpoints
  app.get('/api/blog-posts', async (req, res) => {
    try {
      const blogPosts = await storage.getPublishedBlogPosts();
      res.json(blogPosts);
    } catch (error) {
      console.error("Error fetching published blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog-posts/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      // Validate slug parameter
      if (!slug || typeof slug !== 'string' || slug.trim() === '') {
        return res.status(400).json({ message: "Invalid blog post slug" });
      }
      
      const blogPost = await storage.getBlogPostBySlug(slug);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Security: Only return published blog posts to public
      if (blogPost.status !== 'published') {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(blogPost);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/blog-posts/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate ID parameter
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      // Check if blog post exists and is published before incrementing view count
      const blogPost = await storage.getBlogPost(id);
      if (!blogPost || blogPost.status !== 'published') {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      await storage.incrementViewCount(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  // Protected admin routes
  app.post('/api/services', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = updateServiceSchema.parse(req.body);
      const service = await storage.updateService(req.params.id, validatedData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', authenticateAdmin, async (req: any, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Admin GET services (includes all services, even inactive)
  app.get('/api/admin/services', authenticateAdmin, async (req: any, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching all services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Admin Orders CRUD
  app.get('/api/admin/orders', authenticateAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/admin/orders/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/admin/orders', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/admin/orders/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = updateOrderSchema.parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/admin/orders/:id', authenticateAdmin, async (req: any, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Admin Clients CRUD
  app.get('/api/admin/clients', authenticateAdmin, async (req: any, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/admin/clients/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/admin/clients', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/admin/clients/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = updateClientSchema.parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/admin/clients/:id', authenticateAdmin, async (req: any, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Admin Blog Posts CRUD
  app.get('/api/admin/blog-posts', authenticateAdmin, async (req: any, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      res.json(blogPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/admin/blog-posts/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const blogPost = await storage.getBlogPost(req.params.id);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(blogPost);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/admin/blog-posts', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPost = await storage.createBlogPost(validatedData);
      res.status(201).json(blogPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put('/api/admin/blog-posts/:id', authenticateAdmin, async (req: any, res) => {
    try {
      const validatedData = updateBlogPostSchema.parse(req.body);
      const blogPost = await storage.updateBlogPost(req.params.id, validatedData);
      res.json(blogPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete('/api/admin/blog-posts/:id', authenticateAdmin, async (req: any, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // AI Recommendation routes
  app.post('/api/recommendations', async (req, res) => {
    try {
      const { businessType, businessSize, currentChallenges, industry, budget, language } = req.body;
      
      // Get available services
      const services = await storage.getServices();
      
      // Generate AI recommendations
      const recommendations = await generateBusinessRecommendations({
        businessType,
        businessSize,
        currentChallenges,
        industry,
        budget,
        language: language || 'uz'
      }, services.map(s => ({
        id: s.id,
        title: language === 'en' ? (s.titleEn || s.title) : s.title,
        description: language === 'en' ? (s.descriptionEn || s.description || '') : (s.description || ''),
        category: language === 'en' ? (s.categoryEn || s.category || '') : (s.category || ''),
        features: language === 'en' ? (s.featuresEn || s.features || []) : (s.features || [])
      })));

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post('/api/recommendations/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertRecommendationSchema.parse({
        ...req.body,
        userId
      });
      
      const recommendation = await storage.createRecommendation(validatedData);
      res.status(201).json(recommendation);
    } catch (error) {
      console.error("Error saving recommendation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save recommendation" });
    }
  });

  app.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = await storage.getUserRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Service Inquiry routes
  app.post('/api/inquiries', async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.get('/api/inquiries', authenticateAdmin, async (req: any, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.put('/api/inquiries/:id/status', authenticateAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      const inquiry = await storage.updateInquiryStatus(req.params.id, status);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });

  // AI Service Content Generation (Admin only)
  app.post('/api/ai/generate-service', authenticateAdmin, async (req: any, res) => {
    try {
      const { serviceType, language } = req.body;
      const content = await generateServiceContent(serviceType, language);
      res.json(content);
    } catch (error) {
      console.error("Error generating service content:", error);
      res.status(500).json({ message: "Failed to generate service content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
