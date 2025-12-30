# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interior Designer AI is a Next.js 16 application that transforms room photos using AI-powered design generation via Replicate API. The app uses the App Router architecture with TypeScript, Tailwind CSS 4, and shadcn/ui components.

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

This is a **Next.js 16 App Router** application with route groups and a component-based architecture:

```
app/
├── api/replicate/route.ts    # API route for Replicate AI integration
├── layout.tsx                # Root layout with providers (ThemeProvider)
└── (main)/
    ├── layout.tsx            # Main layout with SidebarProvider
    └── page.tsx              # Home page (client component)

components/
├── app-sidebar.tsx           # Main sidebar navigation (shadcn/ui Sidebar)
├── design-controls.tsx       # Theme/room selection with Combobox
├── image-dropzone.tsx        # Image upload dropzone
├── output-image.tsx          # Generated image display
├── site-header.jsx           # Header with sidebar trigger
├── theme-toggle.tsx          # Dark/light mode toggle
├── uploaded-image.tsx        # Uploaded image preview
└── ui/                       # shadcn/ui component primitives
    ├── combobox.tsx          # Searchable dropdown component
    ├── sidebar.tsx           # Sidebar primitives
    ├── button.tsx, card.tsx, etc.

hooks/
└── use-mobile.tsx            # Mobile detection hook

lib/
└── constants.ts              # Design themes, room types, validation constants
```

### Key Architectural Patterns

**1. Client-Side State Management**

- All state is managed locally using React hooks (`useState`, `useCallback`, `useEffect`)
- No external state management library (Redux, Zustand, etc.)
- Main state lives in `app/(main)/page.tsx`: uploaded image, output image, theme, room type, loading, error

**2. API Integration Pattern**

- Single API route at `app/api/replicate/route.ts`
- Uses Next.js Route Handlers (not Pages Router API routes)
- Request flow: Client (page.tsx) → POST `/api/replicate` → Replicate API → Response
- Request payload: `{ image: base64String, theme: string, room: string }`
- Response format: `{ output: string[], error?: string }`

**3. Component Organization**

- **Layout components**: `AppSidebar` (shadcn/ui Sidebar), `SiteHeader` with sidebar trigger
- **Design controls**: `DesignControls` with two `Combobox` components for theme/room selection
- **Image components**: `ImageDropzone`, `UploadedImage`, `OutputImage` in `components/`
- **UI primitives**: shadcn/ui library in `components/ui/` (Button, Card, Combobox, Sidebar, etc.)
- All components use TypeScript with proper type definitions in `types/index.ts`

**4. Custom Hooks Pattern**

- `hooks/use-mobile.tsx`: Detects mobile viewport for responsive behavior
- Validates file type (JPEG/PNG) and size (max 5MB) via constants in `lib/constants.ts`

### Styling Architecture

**Tailwind CSS + Custom CSS Variables**

- Uses Tailwind utility classes throughout
- Custom animations and keyframes defined in `tailwind.config.js`
- CSS variables in `app/globals.css` for consistent theming (accent colors, background gradients)
- Glassmorphism effects via utility classes (`.glassmorphism`, `.glassmorphism-dark`)
- Custom scrollbar styling for modern appearance

**Animation Strategy**

- Tailwind CSS animations and transitions for UI effects
- CSS-based loading states and hover effects
- `tailwindcss-animate` plugin for additional animation utilities

### UI Component Library (shadcn/ui)

The project uses **shadcn/ui** for consistent, accessible UI components:

- **Sidebar**: `SidebarProvider`, `SidebarInset`, `SidebarTrigger` for responsive navigation
- **Combobox**: Searchable dropdown built on `cmdk` Command component
- **Primitives**: Button, Card, Popover, Separator, and other composable UI elements
- All components in `components/ui/` are customizable and follow Radix UI patterns

**Combobox Pattern** (used for theme/room selection):

```tsx
<Combobox<DesignTheme>
  options={DESIGN_THEMES}
  value={selectedTheme}
  onValueChange={onThemeChange}
  placeholder="Select theme..."
/>
```

### Image Processing Flow

1. **Upload**: User drops/selects image → `ImageDropzone` validates → converts to base64
2. **Submit**: Client sends base64 image + theme + room type to `/api/replicate`
3. **Processing**: API route calls Replicate model `jagilley/controlnet-hough` with structured prompt
4. **Display**: Output image URL received and displayed in `OutputImage` component
5. **Download**: Users can download result via `file-saver` library

### Type System

- TypeScript strict mode enabled (`tsconfig.json`)
- Path aliases configured: `@/*` maps to project root
- Shared types in `types/index.ts`: `RoomType`, `DesignTheme`, `NavItem`
- Constants in `lib/constants.ts`: `ROOM_TYPES`, `DESIGN_THEMES`, `MAX_FILE_SIZE`

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

- **Sidebar**: Uses shadcn/ui `SidebarProvider` with CSS variables (`--sidebar-width`)
- **Collapsible**: Icon-only mode on smaller screens (`collapsible="icon"`)
- **Mobile**: `SidebarTrigger` in header toggles sidebar visibility
- **Layout**: `SidebarInset` handles content spacing automatically
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
- Use shadcn/ui components from `components/ui/` when possible
- Follow existing TypeScript patterns (explicit return types for functions)
- Use Tailwind utilities; avoid inline styles unless dynamically computed

When modifying API routes:

- Always validate request data before processing
- Return consistent error shape: `{ error: string }`
- Log errors to console for debugging (logs visible in development)
- Use proper HTTP status codes (201 for success, 500 for errors)

## Dependencies of Note

- **Next.js 16**: App Router architecture with React 19
- **Tailwind CSS 4**: Latest version with improved performance
- **Replicate**: AI model execution platform
- **shadcn/ui**: Accessible UI component library built on Radix UI
- **cmdk**: Command menu component (powers the searchable Combobox)
- **file-saver**: Client-side file download
- **Vercel Analytics**: Integrated for production metrics
