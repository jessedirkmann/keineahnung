# Overview

This is a comprehensive CSV AI enrichment application designed for lead enrichment and data processing. Users can upload CSV files and use OpenAI's GPT models to automatically fill or enhance data columns. The application supports parallel processing, real-time cost tracking, and provides a professional interface in German and English. Key features include column selection, custom prompt templates with placeholders, live progress monitoring, token usage tracking, and CSV export capabilities.

# User Preferences

- **Preferred communication style**: Simple, everyday language (non-technical users)
- **Language support**: German and English interface support requested
- **Primary use case**: Lead enrichment and CSV data processing for business workflows
- **Performance priority**: Parallel processing with configurable concurrency (5-20 requests)
- **Cost transparency**: Real-time token usage and cost tracking essential

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. It follows a component-based architecture with shadcn/ui components for consistent styling. The UI uses Tailwind CSS for styling and implements a multi-step wizard interface for the enrichment process.

Key architectural decisions:
- **React with TypeScript**: Provides type safety and better developer experience
- **Vite**: Fast development server and build tool optimized for modern frontend development
- **Wouter**: Lightweight routing library chosen over React Router for smaller bundle size
- **TanStack Query**: Handles server state management and caching for API calls
- **shadcn/ui**: Pre-built accessible components built on Radix UI primitives

## Backend Architecture
The backend uses Express.js with TypeScript running in ESM mode. It follows a modular structure with separate services and storage layers.

Key architectural decisions:
- **Express.js**: Mature and flexible web framework for Node.js
- **ESM modules**: Modern JavaScript module system for better tree-shaking and performance
- **Memory storage**: Simple in-memory storage implementation for development/demo purposes
- **Modular service layer**: Separate OpenAI service for API interactions and cost calculations

## Data Processing Flow
The application implements a multi-step enrichment process:
1. **CSV Upload & Parsing**: Uses Papa Parse for client-side CSV processing
2. **Column Selection**: Users select which columns to include in enrichment prompts
3. **Prompt Configuration**: Custom prompts with placeholder substitution
4. **Batch Processing**: Concurrent API calls to OpenAI with configurable concurrency
5. **Progress Tracking**: Real-time updates on processing status and token usage

## Database Schema
Uses Drizzle ORM with PostgreSQL schema definition but currently implements memory storage:
- **Users table**: Basic user management structure
- **Enrichment Jobs table**: Stores job metadata, progress, and results
- **JSON columns**: Used for storing CSV data, selected columns, and results

## Cost Management System
Implements a comprehensive cost estimation and tracking system:
- **Token estimation**: Calculates approximate tokens based on text length
- **Model pricing**: Maintains pricing data for different OpenAI models
- **Real-time tracking**: Updates token usage and costs during processing

# External Dependencies

## Primary Services
- **OpenAI API**: Core service for data enrichment using GPT models
- **Neon Database**: PostgreSQL database service (configured but not actively used)

## Frontend Libraries
- **Radix UI**: Accessible component primitives for UI components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for form data and API requests

## Backend Dependencies
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **Multer**: File upload handling middleware
- **Papa Parse**: CSV parsing library
- **Express**: Web application framework

## Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **Vite**: Frontend build tool and development server
- **ESBuild**: Fast bundler for production builds
- **Replit integrations**: Development environment specific tooling