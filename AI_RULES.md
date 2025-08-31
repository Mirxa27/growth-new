# AI Agent Development Rules for Growth Echo Nexus

This document provides strict guidelines for any AI agent working on this codebase. Adherence to these rules is mandatory to ensure consistency, maintainability, and adherence to the project's architectural vision.

## 1. Core Tech Stack

The application is built on a modern, robust tech stack. Your development must align with these core technologies:

-   **Framework & Build Tool**: React 18 and Vite. All components must be written using React functional components and hooks.
-   **Language**: TypeScript. All new code must be strictly typed. Use interfaces and types for props, state, and API responses.
-   **Backend & Database**: Supabase is the single source of truth for the backend. This includes the PostgreSQL database, authentication, file storage, and serverless Edge Functions.
-   **Styling**: Tailwind CSS is the exclusive styling library. All styling must be done using utility classes and the custom "Liquid Glassmorphism" design system defined in `src/index.css`.
-   **UI Components**: The component library is `shadcn/ui`, which is built upon Radix UI primitives.
-   **Routing**: Client-side routing is handled exclusively by `react-router-dom`.
-   **Server State Management**: Asynchronous operations, data fetching, and caching are managed by TanStack Query (React Query).
-   **Animations**: All animations and transitions are implemented using Framer Motion.
-   **AI & Voice**: The primary AI interaction is through the OpenAI Realtime API, managed via the `@openai/agents-realtime` SDK and custom hooks.

## 2. Library Usage Rules

To maintain a clean and simple codebase, use the following libraries for their specified purposes. **Do not introduce new libraries for these tasks.**

### UI & Components

-   **Component Library**: **ALWAYS** use `shadcn/ui` components from `@/components/ui` for common UI elements (Button, Card, Input, etc.). They are pre-styled and accessible.
-   **Icons**: **ONLY** use icons from the `lucide-react` package.
-   **Custom Components**: For application-specific UI, create new, small, single-purpose components in the `src/components/` directory.
-   **Headless Primitives**: If a `shadcn/ui` component is not available, use Radix UI primitives (`@radix-ui/react-*`) as a base for new components.
-   **PROHIBITED**: Do not use Material-UI, Ant Design, Chakra UI, Bootstrap, or any other component library.

### Styling

-   **Styling Engine**: **ALWAYS** use Tailwind CSS utility classes.
-   **Design System**: **STRICTLY** adhere to the custom CSS variables (`--primary`, `--glass-bg`, `--text-hero`, etc.) defined in `src/index.css`.
-   **Custom CSS**: **AVOID** writing new CSS files. If a style is not achievable with Tailwind, add it to the appropriate layer in `src/index.css`.
-   **PROHIBITED**: Do not use styled-components, Emotion, CSS Modules, or any other CSS-in-JS solution.

### State Management

-   **Server State (Data Fetching, Caching, Mutations)**: **ALWAYS** use TanStack Query (`@tanstack/react-query`) for all interactions with the Supabase backend.
-   **Global Client State (Auth, Theme, etc.)**: **ONLY** use React Context. Refer to `useAuth.tsx` as the pattern.
-   **Local Component State**: **ALWAYS** use React's built-in `useState` and `useReducer` hooks.
-   **PROHIBITED**: Do not introduce Redux, Zustand, MobX, Jotai, or any other state management library.

### Forms

-   **Form Handling**: **ALWAYS** use the `shadcn/ui` `Form` component, which is a wrapper around `react-hook-form`.
-   **Form Validation**: **ALWAYS** use Zod for schema-based validation.

### Backend & Data

-   **Database/Auth/Storage**: **ALL** backend interactions must use the Supabase client instance from `@/integrations/supabase/client.ts`.
-   **Serverless Logic**: For secure operations or logic that requires server-side execution, create a Supabase Edge Function in the `supabase/functions/` directory.

### Animations

-   **Motion & Transitions**: **ALL** animations must be implemented using `framer-motion`. Follow the project's spring-based animation philosophy.