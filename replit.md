# Translation Cost Calculator

## Overview

A professional web application for calculating translation costs based on word counts, language pairs, and pricing configurations. The application provides a calculator interface where users can create multiple translation tasks, configure pricing parameters (cost per word, repeat discounts, daily capacity), and export results to PDF or Excel formats. Built as a single-page application with a clean, Material Design-inspired interface optimized for business productivity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript using Vite as the build tool and development server.

**UI Component System**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling. The component library follows the "new-york" style variant with a neutral base color scheme and CSS variables for theming.

**Rationale**: Shadcn/UI provides accessible, customizable components without the overhead of a full component library. Components are copied into the project, allowing full control over implementation while maintaining consistency.

**State Management**: Local React state with hooks (useState, useCallback) for form data and task management. TanStack Query (React Query) is configured for server state management, though the current implementation appears to be primarily client-side.

**Routing**: Wouter for lightweight client-side routing. Single route architecture with the calculator as the primary page.

**Form Handling**: React Hook Form with Zod for validation (configured via @hookform/resolvers). Schemas defined in shared/schema.ts enable type-safe form validation.

**Styling Approach**: Tailwind CSS with custom design tokens defined in CSS variables. Spacing follows a standardized 4px-based scale. Typography uses system fonts with fallbacks, emphasizing clarity and readability for data-heavy interfaces.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**Rationale**: Express provides a minimal, flexible foundation for the REST API. The application uses ESM modules (type: "module" in package.json) for modern JavaScript syntax.

**API Structure**: Routes defined in server/routes.ts with separate handlers for PDF and Excel export functionality using jsPDF and xlsx libraries. The API handles calculation requests and file generation server-side.

**Development Server**: Custom Vite integration (server/vite.ts) provides HMR (Hot Module Replacement) in development mode with middleware-based serving of the React application.

**Production Build**: esbuild bundles the server code with selective dependency bundling (allowlist for specific packages to reduce syscalls and improve cold start times). Client builds via Vite to dist/public, server to dist/index.cjs.

### Data Storage Solutions

**Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in shared/schema.ts.

**Current State**: The application includes database infrastructure (Neon serverless PostgreSQL adapter, Drizzle configuration) but the active implementation uses in-memory storage (MemStorage class in server/storage.ts).

**Rationale**: The memory storage pattern suggests the application is either in development or intentionally stateless, with all calculation data being ephemeral. The database schema includes a User model with username/password fields, indicating authentication capabilities may be planned but not yet implemented.

**Session Management**: Express-session is configured (connect-pg-simple for PostgreSQL session storage) but not actively used in the current implementation.

### Schema and Type System

**Shared Types**: Zod schemas in shared/schema.ts define the data model for tasks and calculations, providing runtime validation and TypeScript type inference across both client and server.

**Task Model**: Each task includes language pair, word counts (new words, repeats, cross-file repeats), pricing configuration (cost per word, repeat discount percentage), and capacity constraints (words per day).

**Calculation Model**: Server calculates costs based on new word rates and discounted repeat rates, with optional time estimation based on daily capacity thresholds.

**Language Pairs**: Predefined set of 12 language pair options (bidirectional English, German, French, Spanish, Italian, Chinese with Russian).

### Export Functionality

**PDF Generation**: jsPDF with autoTable plugin creates formatted PDF reports containing task breakdowns and totals. Russian language labels are hardcoded in the export logic.

**Excel Generation**: xlsx (SheetJS) library generates Excel workbooks with calculation results. Enables data portability for further analysis in spreadsheet applications.

**Rationale**: Server-side generation ensures consistent formatting and handles complex document creation without client-side dependencies. Both formats support the business use case of sharing cost estimates with clients or stakeholders.

## External Dependencies

### UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives (@radix-ui/react-*) for accordions, dialogs, dropdowns, selects, tooltips, and other interactive elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **class-variance-authority**: Type-safe component variant management
- **lucide-react**: Icon library for UI elements

### Data Management
- **TanStack Query v5**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation library

### Server Dependencies
- **Express**: Web application framework
- **jsPDF + jspdf-autotable**: PDF document generation
- **xlsx**: Excel file generation
- **Drizzle ORM**: Database toolkit with Zod integration
- **@neondatabase/serverless**: Neon PostgreSQL adapter

### Development Tools
- **Vite**: Build tool and development server
- **esbuild**: JavaScript bundler for production builds
- **TypeScript**: Type system for both frontend and backend
- **tsx**: TypeScript execution for development server

### Additional Libraries
- **date-fns**: Date utility functions
- **wouter**: Lightweight routing library
- **cmdk**: Command palette component
- **react-day-picker**: Calendar/date picker component (via dependencies)

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation tool
- **@replit/vite-plugin-dev-banner**: Development environment indicator