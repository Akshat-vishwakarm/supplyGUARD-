# Overview

This is a full-stack supply chain risk assessment application that leverages Google's Gemini AI to analyze and identify vulnerabilities in company supply chains. The application allows users to input detailed information about their suppliers, logistics routes, transportation methods, and risk factors, then generates comprehensive risk assessments with actionable recommendations.

The system provides real-time AI-powered analysis, risk scoring across multiple dimensions (supplier, logistics, geopolitical), and detailed vulnerability reports with prioritized recommendations for risk mitigation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in a single-page application (SPA) architecture
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design system
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured JSON responses
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Development**: Hot module replacement and development middleware integration

## Data Storage
- **Database**: PostgreSQL configured through Drizzle ORM with Neon serverless driver
- **Schema**: Single assessments table with JSONB fields for complex data structures
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Fallback Storage**: In-memory storage implementation for development/testing scenarios

## AI Integration
- **AI Provider**: Google Gemini 3.6 Flash model for supply chain vulnerability analysis
- **Response Format**: Structured JSON responses with defined schemas for consistent data parsing
- **Analysis Features**: Multi-dimensional risk scoring, vulnerability identification, and recommendation generation
- **Health Monitoring**: API health checks and connection status monitoring

## External Dependencies

- **Google Gemini AI**: Core AI analysis engine for supply chain risk assessment
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Radix UI**: Accessible component primitives for user interface elements
- **Replit Platform**: Development environment with specialized Replit integrations and plugins
- **PostCSS & Autoprefixer**: CSS processing and browser compatibility
- **ESBuild**: Fast JavaScript bundling for production builds

The application uses a modern, type-safe stack with shared schemas between client and server, ensuring data consistency and reducing runtime errors. The architecture supports both development and production environments with appropriate fallbacks and health monitoring.