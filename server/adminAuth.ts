import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Types for admin authentication
export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'admin';
}

// JWT configuration - CRITICAL: Must be set in environment
// For development: using secure fallback, but MUST set JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-testing-32-chars-minimum-required-secure';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: Using development JWT secret. Set JWT_SECRET environment variable for production!');
}
const JWT_EXPIRES_IN = '24h';
const COOKIE_NAME = 'admin_token';

// Hash password for admin user creation
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password during login
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: AdminUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'admin'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate admin users with JWT
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME];
  
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'admin' || decoded.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  // Attach admin user info to request
  (req as any).adminUser = decoded;
  next();
}

// Create admin user if doesn't exist - call this during app initialization
export async function initializeAdminUser(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@evolvo.uz';
    
    // SECURITY: In production, ADMIN_PASSWORD must be set explicitly
    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD environment variable is required in production for security');
    }
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'SecureAdmin123!';
    
    if (process.env.NODE_ENV !== 'production' && !process.env.ADMIN_PASSWORD) {
      console.warn('⚠️  WARNING: Using default admin password in development. Set ADMIN_PASSWORD environment variable for production!');
    }
    
    // Check if admin user exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }
    
    // Create admin user with hashed password in dedicated field
    const hashedPassword = await hashPassword(adminPassword);
    await storage.upsertUser({
      id: `admin-${Date.now()}`,
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      passwordHash: hashedPassword, // Now using dedicated password field
      profileImageUrl: null // Clear any inappropriate usage
    });
    
    console.log('Admin user created successfully:', adminEmail);
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    // In production, we should fail-fast on admin initialization errors
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// Admin login handler
export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Get user by email from database
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password using dedicated passwordHash field
    const storedHashedPassword = user.passwordHash;
    if (!storedHashedPassword) {
      console.error('Admin user missing password hash:', user.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await verifyPassword(password, storedHashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const adminUser: AdminUser = {
      id: user.id,
      email: user.email!,
      role: user.role!
    };
    
    const token = generateToken(adminUser);
    
    // Set secure httpOnly cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ 
      message: 'Login successful',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// Admin logout handler
export function adminLogout(req: Request, res: Response) {
  // Clear cookie with same options as when set to ensure proper removal
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'Logout successful' });
}

// Get current admin user
export async function getCurrentAdmin(req: Request, res: Response) {
  const adminUser = (req as any).adminUser;
  if (!adminUser) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  res.json({
    id: adminUser.userId,
    email: adminUser.email,
    role: adminUser.role
  });
}