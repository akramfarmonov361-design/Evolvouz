# Evolvo.uz - AI Business Solutions Platform

## Overview

Evolvo.uz is a full-stack monorepo application that provides AI-powered business solutions and recommendations. The platform serves as a marketplace for AI services, featuring multilingual support (Uzbek and English), user authentication, admin management, and intelligent business consultation capabilities. Built with modern web technologies, it offers a comprehensive suite of AI tools and services tailored for the Uzbekistan market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing with conditional rendering based on authentication
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Shadcn/UI component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming and dark mode support
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session-based authentication using connect-pg-simple
- **Development**: Hot reloading with tsx for development server

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon Database for production data
- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Session Storage**: PostgreSQL table for user sessions (required for Replit Auth)
- **Schema Design**: Separate tables for users, services, AI recommendations, and service inquiries with proper relationships

### Authentication and Authorization
- **Authentication Provider**: Replit Auth with OpenID Connect (OIDC) for secure user authentication
- **Session Management**: Express session middleware with PostgreSQL storage
- **Authorization**: Role-based access control (user/admin roles)
- **Security**: Helmet.js for security headers and CORS configuration

### API Architecture
- **RESTful Design**: Clean REST endpoints for services, recommendations, and user management
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Request Logging**: Custom middleware for API request/response logging
- **Input Validation**: Zod schemas for API request validation

### Frontend-Backend Integration
- **API Communication**: Fetch-based API client with credential support
- **Proxy Configuration**: Vite dev server proxy for seamless development experience
- **Error Handling**: Unified error handling for authentication failures
- **Type Safety**: Shared TypeScript types between frontend and backend

### Internationalization
- **Multilingual Support**: Built-in support for Uzbek and English languages
- **Database Schema**: Separate fields for localized content (title/titleEn, description/descriptionEn)
- **UI Language Switching**: Dynamic language switching with state management

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL) for cloud-hosted database with connection pooling
- **Authentication**: Replit Auth service for user authentication and authorization
- **AI Service**: OpenAI API integration for generating business recommendations and service content

### UI and Styling
- **Component Library**: Shadcn/UI with Radix UI primitives for accessible, customizable components
- **Styling Framework**: Tailwind CSS for utility-first styling with custom design system
- **Icons**: Lucide React for consistent iconography across the platform

### Development Tools
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Type Checking**: TypeScript compiler for static type analysis
- **Database Tools**: Drizzle Kit for database migrations and schema management

### Runtime Dependencies
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: Various utility libraries for enhanced functionality (clsx, class-variance-authority)

### Security and Performance
- **Security**: Helmet.js for HTTP security headers
- **Performance**: Memoization with memoizee for optimized data fetching
- **Error Tracking**: Built-in error handling and logging mechanisms