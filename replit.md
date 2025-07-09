# Disc Throwing Game

## Overview

This is a full-stack web application featuring a Duck Hunt-style disc throwing game built with React, TypeScript, and Express.js. The game is a first-person 2D canvas game where players throw discs at single targets across levels using a two-stage control system. The application uses a modern tech stack with Vite for development, TailwindCSS for styling, and PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: TailwindCSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: Zustand for game state and audio management
- **Canvas Rendering**: HTML5 Canvas for 2D game graphics
- **3D Support**: React Three Fiber and Drei for potential 3D features

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API with `/api` prefix
- **Development**: Hot reload with tsx and Vite middleware integration
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **ORM**: Drizzle ORM with migrations support
- **Schema**: Shared TypeScript schemas between client and server
- **Validation**: Zod for runtime type validation
- **Connection**: Neon serverless database adapter

### Game Architecture
- **Game Loop**: Canvas-based rendering with requestAnimationFrame
- **Physics**: Custom physics engine with gravity, air resistance, spin-based disc curvature, and collision detection
- **State Management**: Zustand stores for game state, audio, and user preferences
- **Input Handling**: Two-stage control system: direction setting then tilt adjustment
- **Audio**: HTML5 Audio API with mute/unmute functionality
- **Level System**: Single target per level with progressive difficulty

## Key Components

### Game Components
- **DiscThrowingGame**: Main game component managing game state and flow
- **GameCanvas**: Canvas rendering component handling physics and visuals
- **GameUI**: Heads-up display showing score, targets, and controls
- **Physics Hook**: Custom hook for disc physics and collision detection
- **Input Hook**: Mouse/touch input handling with drag mechanics

### Shared Components
- **Schema**: Drizzle database schemas with Zod validation
- **Types**: TypeScript interfaces for game objects and API responses
- **Utils**: Game utility functions for target/obstacle generation

### UI System
- **Component Library**: Comprehensive Radix UI component set
- **Styling**: TailwindCSS with CSS custom properties
- **Responsive Design**: Mobile-first approach with touch support
- **Accessibility**: ARIA labels and keyboard navigation support

### State Management
- **Game Store**: Phase management (ready/playing/ended)
- **Audio Store**: Sound effects and mute state
- **Local Storage**: Persistent user preferences

## Data Flow

1. **Game Initialization**: Load audio assets and generate targets/obstacles
2. **Input Processing**: Capture mouse/touch events for aiming
3. **Physics Simulation**: Update disc positions with gravity and collisions
4. **Collision Detection**: Check disc-target and disc-obstacle intersections
5. **State Updates**: Update scores, hit states, and game phase
6. **Rendering**: Draw game objects on canvas with smooth animations
7. **Audio Feedback**: Play sound effects based on game events

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **@react-three/fiber**: 3D rendering capabilities
- **class-variance-authority**: Component variant styling
- **zustand**: Client-side state management
- **tailwindcss**: CSS framework

### Backend Dependencies
- **express**: Web server framework
- **drizzle-orm**: Database ORM
- **@neondatabase/serverless**: Database connection
- **zod**: Runtime type validation
- **connect-pg-simple**: Session storage

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution
- **esbuild**: JavaScript bundler
- **tailwindcss**: CSS processing

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: esbuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied with `db:push`
4. **Assets**: Static files served from build directory

### Production Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Server**: Express serves static files and API routes
- **Database**: PostgreSQL with connection pooling
- **Process**: NODE_ENV=production for optimization

### Development Workflow
- **Dev Server**: Vite dev server with HMR
- **API Proxy**: Vite proxies API requests to Express
- **Database**: Local PostgreSQL or Neon development instance
- **Hot Reload**: Both client and server support hot reloading

The application is designed as a single-page game with potential for multiplayer features, user accounts, and leaderboards through the prepared database schema and API structure.