# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interior Designer AI is a Next.js 14 application that transforms room photos using AI-powered design generation via Replicate API. The app uses the App Router architecture with TypeScript, Tailwind CSS, and Framer Motion for animations.

## Development Commands

### Essential Commands

- **Start dev server**: `bun dev` (runs on http://localhost:3000)
- **Build production**: `bun build`
- **Start production**: `bun start`
- **Lint code**: `bun lint`
- **Format code**: `bunx prettier --write .` (automatically runs on commit via husky)

### Package Management

- **Install dependencies**: `bun install`
- **Add dependency**: `bun add <package>`
- **Add dev dependency**: `bun add -d <package>`
- **Remove dependency**: `bun remove <package>`
- **Execute package binary**: `bunx <command>`

**Note:** This project uses Bun as the package manager. Bun is recommended for optimal performance, though NPM/Node.js will also work (see .nvmrc).

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Add your Replicate API token: `REPLICATE_API_TOKEN=your_token_here`
3. Get token from https://replicate.com/ → API tokens page

## Architecture Overview

### Application Structure

This is a **Next.js 14 App Router** application with the following architecture:

```
app/
├── api/replicate/route.ts    # API route for Replicate AI integration
├── components/               # Reusable UI components
├── hooks/                    # Custom React hooks
├── page.tsx                  # Main application page (client component)
├── layout.tsx                # Root layout with metadata
├── sidebar.tsx               # Sidebar orchestration
├── header.tsx                # Mobile header
├── desktop-sidebar.tsx       # Desktop navigation
├── mobile-sidebar.tsx        # Mobile navigation drawer
└── selectmenu.tsx            # Dropdown select component
```

### Key Architectural Patterns

**1. Client-Side State Management**

- All state is managed locally using React hooks (`useState`, `useCallback`, `useEffect`)
- No external state management library (Redux, Zustand, etc.)
- Main state lives in `app/page.tsx`: uploaded image, output image, theme, room type, loading, error

**2. API Integration Pattern**

- Single API route at `app/api/replicate/route.ts`
- Uses Next.js Route Handlers (not Pages Router API routes)
- Request flow: Client (page.tsx) → POST `/api/replicate` → Replicate API → Response
- Request payload: `{ image: base64String, theme: string, room: string }`
- Response format: `{ output: string[], error?: string }`

**3. Component Organization**

- **Page components** (`app/components/page-components.tsx`): UI elements specific to main page (ImageDropzone, UploadedImage, ImageOutput, ActionPanel, ErrorNotification)
- **Layout components** (sidebar, header): Navigation and shell
- **Utility components** (selectmenu): Reusable form controls
- All components use TypeScript with proper type definitions in `types/index.ts`

**4. Custom Hooks Pattern**

- `app/hooks/useDropzone.ts`: Implements drag-and-drop file upload functionality
- Returns `getRootProps`, `getInputProps`, and `isDragActive` (similar to react-dropzone API)
- Validates file type (JPEG/PNG) and size (max 5MB)

### Styling Architecture

**Tailwind CSS + Custom CSS Variables**

- Uses Tailwind utility classes throughout
- Custom animations and keyframes defined in `tailwind.config.js`
- CSS variables in `app/globals.css` for consistent theming (accent colors, background gradients)
- Glassmorphism effects via utility classes (`.glassmorphism`, `.glassmorphism-dark`)
- Custom scrollbar styling for modern appearance

**Animation Strategy**

- Framer Motion for component animations (entry/exit transitions, hover effects)
- Tailwind custom animations for background effects and loading states
- AnimatePresence for mount/unmount animations (intro screen, error notifications, image swaps)

### Image Processing Flow

1. **Upload**: User drops/selects image → `useDropzone` validates → converts to base64
2. **Submit**: Client sends base64 image + theme + room type to `/api/replicate`
3. **Processing**: API route calls Replicate model `jagilley/controlnet-hough` with structured prompt
4. **Display**: Output image URL received and displayed in `ImageOutput` component
5. **Download**: Users can download result via `file-saver` library

### Type System

- TypeScript strict mode enabled (`tsconfig.json`)
- Path aliases configured: `@/*` maps to project root
- Shared types in `types/index.ts` (NavItem, ImageAreaProps)
- Component-specific types defined inline (ErrorNotificationProps, ActionPanelProps, etc.)

## Code Style & Formatting

- **Prettier** configured with Tailwind plugin (`.prettierrc`)
- **Husky** pre-commit hook runs Prettier on staged files (`lint-staged`)
- 2-space indentation, semicolons enabled, double quotes
- Prettier automatically sorts Tailwind classes

## Important Implementation Details

### Replicate API Integration

- Model used: `jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b`
- Prompt structure combines: theme + room type + design keywords + quality modifiers
- API token must be set in environment variable `REPLICATE_API_TOKEN`

### Responsive Design

- Desktop: Permanent sidebar (lg:pl-72 on main content)
- Mobile: Header with hamburger menu → slide-out sidebar
- Sidebar closes on Escape key press
- Two-column grid for image upload/output on xl screens, stacks on smaller screens

### Performance Considerations

- Images converted to base64 for API submission (client-side processing)
- Loading states managed during API calls to prevent double-submission
- File validation happens before base64 conversion to fail fast
- Intro animation auto-dismisses after 2.5s to reduce initial interaction delay

## Common Development Patterns

When adding new features:

- Keep state in the relevant component (prefer local state over lifting)
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Wrap animations in `<AnimatePresence>` for smooth transitions
- Follow existing TypeScript patterns (explicit return types for functions)
- Use Tailwind utilities; avoid inline styles unless dynamically computed

When modifying API routes:

- Always validate request data before processing
- Return consistent error shape: `{ error: string }`
- Log errors to console for debugging (logs visible in development)
- Use proper HTTP status codes (201 for success, 500 for errors)

## Dependencies of Note

- **Next.js 14**: App Router architecture (not Pages Router)
- **Replicate**: AI model execution platform
- **Framer Motion**: Animation library (declarative animations)
- **Headless UI**: Accessible UI primitives (used for transitions)
- **file-saver**: Client-side file download
- **react-loader-spinner**: Loading indicators
- **Vercel Analytics**: Integrated for production metrics
