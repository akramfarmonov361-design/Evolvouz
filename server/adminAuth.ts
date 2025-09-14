import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting for login endpoint - 5 attempts per 15 minutes per IP
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.',
    error: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from the count
  skipSuccessfulRequests: true,
  // Use default IP key generator (properly handles IPv6)
  keyGenerator: undefined // Let express-rate-limit use its default IP-based key generator
});

// Security logging helper
function logSecurityEvent(event: string, details: any, req?: Request) {
  const timestamp = new Date().toISOString();
  const ip = req ? (req.ip || req.connection.remoteAddress || 'unknown') : 'unknown';
  const userAgent = req ? req.get('User-Agent') || 'unknown' : 'unknown';
  
  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    ip,
    userAgent,
    ...details
  });
}

// Validate email format
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

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
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[COOKIE_NAME];
    
    if (!token) {
      logSecurityEvent('AUTH_MISSING_TOKEN', { endpoint: req.path }, req);
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin' || decoded.role !== 'admin') {
      logSecurityEvent('AUTH_INVALID_TOKEN', { 
        endpoint: req.path,
        tokenValid: !!decoded,
        tokenType: decoded?.type,
        tokenRole: decoded?.role
      }, req);
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // CRITICAL SECURITY: Verify user still exists and has admin role in database
    const currentUser = await storage.getUser(decoded.userId);
    if (!currentUser) {
      logSecurityEvent('AUTH_USER_NOT_FOUND', { 
        userId: decoded.userId,
        endpoint: req.path
      }, req);
      // Clear invalid cookie
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(403).json({ message: 'Admin access revoked' });
    }
    
    if (currentUser.role !== 'admin') {
      logSecurityEvent('AUTH_ROLE_REVOKED', { 
        userId: decoded.userId,
        currentRole: currentUser.role,
        endpoint: req.path
      }, req);
      // Clear invalid cookie
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(403).json({ message: 'Admin privileges revoked' });
    }
    
    // Attach admin user info to request
    (req as any).adminUser = decoded;
    next();
  } catch (error) {
    logSecurityEvent('AUTH_MIDDLEWARE_ERROR', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path
    }, req);
    return res.status(500).json({ message: 'Authentication error' });
  }
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

// Admin login handler with security hardening
export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      logSecurityEvent('LOGIN_MISSING_CREDENTIALS', { email: !!email, password: !!password }, req);
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      logSecurityEvent('LOGIN_INVALID_EMAIL_FORMAT', { email }, req);
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Get user by email from database
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.role !== 'admin') {
      logSecurityEvent('LOGIN_FAILED', { 
        email,
        reason: !user ? 'user_not_found' : 'not_admin',
        userExists: !!user,
        userRole: user?.role
      }, req);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password using dedicated passwordHash field
    const storedHashedPassword = user.passwordHash;
    if (!storedHashedPassword) {
      logSecurityEvent('LOGIN_FAILED', { 
        email,
        reason: 'missing_password_hash',
        userId: user.id
      }, req);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await verifyPassword(password, storedHashedPassword);
    if (!isValidPassword) {
      logSecurityEvent('LOGIN_FAILED', { 
        email,
        reason: 'invalid_password',
        userId: user.id
      }, req);
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
    
    // Log successful login
    logSecurityEvent('LOGIN_SUCCESS', { 
      email,
      userId: user.id
    }, req);
    
    res.json({ 
      message: 'Login successful',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    logSecurityEvent('LOGIN_ERROR', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body?.email
    }, req);
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// Admin logout handler
export function adminLogout(req: Request, res: Response) {
  const adminUser = (req as any).adminUser;
  
  // Log logout event
  logSecurityEvent('LOGOUT', { 
    userId: adminUser?.userId,
    email: adminUser?.email
  }, req);
  
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