# Copilot Instructions for Growth Echo Nexus (Newomen Project)

## Project Overview

**Growth Echo Nexus** is a sophisticated React-based self-discovery and personal growth platform designed specifically for women. The project combines AI-powered insights, mobile-first design, and community features to create transformative user experiences.

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI components
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Animations**: Framer Motion for gestures and micro-interactions
- **Voice**: OpenAI Realtime API + WebRTC for voice conversations
- **Build System**: Vite with production optimization

## Design System: Liquid Glassmorphism

### Color Palette & Theming
The project uses a sophisticated **Liquid Glassmorphism** design system defined in `/src/index.css`:

```css
/* Core Colors - Ethereal Purple & Blue Palette */
--background: 240 15% 4%;
--foreground: 310 25% 95%;

/* Glass Morphism System */
--glass-bg: 255 255 255 / 0.08;
--glass-border: 255 255 255 / 0.12;
--glass-blur: 18px;

/* Primary Brand Colors */
--primary: 320 85% 65%;
--primary-glow: 320 100% 75%;
--secondary: 280 70% 60%;
```

### Design Patterns
1. **Glass Components**: Use `.glass`, `.glass-card`, `.glass-nav` classes for consistent glassmorphism
2. **Gradient System**: Leverage predefined gradients (`--gradient-primary`, `--gradient-aurora`)
3. **Interactive States**: All interactive elements use spring animations with `.interactive` class
4. **Mobile-First**: Every component starts with mobile design, then scales up

### Typography Scale
```css
--text-hero: clamp(2.5rem, 8vw, 5rem);
--text-display: clamp(1.875rem, 5vw, 3.5rem);
--text-heading: clamp(1.5rem, 4vw, 2.5rem);
```

## Mobile-First Architecture

### Responsive Components
The project prioritizes mobile experience with dedicated responsive utilities in `/src/components/responsive/MobileOptimized.tsx`:

- **MobileContainer**: Responsive container with proper padding
- **MobileGrid**: Flexible grid system (1-4 columns with responsive gaps)
- **MobileCard**: Enhanced cards with touch optimization
- **MobileTypography**: Responsive text components

### Swipe Navigation System
Key feature in `/src/pages/MobileAssessment.tsx`:
```tsx
// Core swipe gesture handling with framer-motion
const swipeControls = useDragControls();
const x = useMotionValue(0);
const xRange = [-100, 0, 100];
const opacityRange = [0, 1, 0];
const opacity = useTransform(x, xRange, opacityRange);

// Swipe threshold and animation
const handleDragEnd = (event: any, info: any) => {
  const threshold = 100;
  if (info.offset.x > threshold) {
    // Previous question logic
  } else if (info.offset.x < -threshold) {
    // Next question logic
  }
};
```

## Assessment & Personality System

### Core Assessment Architecture
The mobile assessment system (`/src/pages/MobileAssessment.tsx`) implements:

1. **8-Question Personality Analysis**: Each question has 4 personality-mapped options
2. **Swipe Navigation**: Touch-optimized gesture-based navigation
3. **Personality Scoring Algorithm**: Mathematical personality type calculation
4. **Progress Tracking**: Visual progress indicators with animations

### Personality Type Calculation
```tsx
// Personality scoring system
const personalityMapping = {
  'Deep emotional connection': { E: 2, F: 3 },
  'Intellectual compatibility': { T: 3, N: 2 },
  'Shared adventures': { E: 3, S: 2 },
  'Stability and security': { J: 3, S: 2 }
};

// Calculate final personality type
const getPersonalityType = (scores: PersonalityScores) => {
  const E_I = scores.E > scores.I ? 'E' : 'I';
  const S_N = scores.S > scores.N ? 'S' : 'N';
  const T_F = scores.T > scores.F ? 'T' : 'F';
  const J_P = scores.J > scores.P ? 'J' : 'P';
  return `${E_I}${S_N}${T_F}${J_P}`;
};
```

## Supabase Integration Patterns

### Database Architecture
The project uses comprehensive RLS policies for security:

```sql
-- Example RLS pattern
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));
```

### Authentication & Role Management
- **Role-based authorization**: Uses `role` column instead of boolean flags
- **Admin system**: Centralized admin function `is_admin(uuid)` for security
- **Profile management**: Automatic profile creation via database triggers

### Real-time Features
```tsx
// Supabase client configuration
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
    }
  }
);
```

## Voice Technology Integration

### OpenAI Realtime API
The project implements sophisticated voice interactions through:

1. **Real-time Voice Chat** (`/src/utils/RealtimeVoiceChat.ts`)
2. **Audio Processing** with WebRTC and Web Audio API
3. **Supabase Edge Functions** for voice proxying

### Voice Interface Patterns
```tsx
// Voice connection pattern
const connectToOpenAI = useCallback(async () => {
  const ws = new WebSocket(
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
  );
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: 'You are NewMe, an AI companion...'
      }
    }));
  };
}, []);
```

### Audio Processing
```tsx
// Audio recording with Web Audio API
this.audioRecorder = new AudioRecorder((audioData) => {
  if (this.isConnected && this.ws) {
    const encodedAudio = encodeAudioForAPI(audioData);
    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: encodedAudio
    }));
  }
});
```

## UI/UX Patterns & Best Practices

### Animation Philosophy
1. **Spring-based transitions**: Use `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for natural motion
2. **Micro-interactions**: Scale and transform feedback on user actions
3. **Reduced motion support**: Respect `prefers-reduced-motion` accessibility setting

### Interactive State Management
```tsx
// Standard interactive component pattern
const InteractiveCard = ({ children, onClick }: Props) => (
  <motion.div
    className="glass interactive"
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);
```

### Form & Input Patterns
- **Glass inputs**: Use `.glass-input` for consistent styling
- **Validation**: Real-time validation with Zod schemas
- **Touch optimization**: Larger hit targets for mobile (minimum 44px)

## Component Architecture

### File Organization
```
src/
├── components/
│   ├── responsive/        # Mobile-optimized components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── assessment/       # Assessment-specific components
│   ├── chat/            # Voice and chat interfaces
│   └── admin/           # Admin dashboard components
├── pages/               # Route components
├── hooks/               # Custom React hooks
└── utils/               # Utility functions
```

### Custom Hook Patterns
```tsx
// Example custom hook structure
export const useAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  
  const nextQuestion = useCallback(() => {
    // Question navigation logic
  }, [currentQuestion]);
  
  return {
    currentQuestion,
    answers,
    nextQuestion,
    // ... other methods
  };
};
```

## Security & Performance

### Security Best Practices
1. **RLS Policies**: Every table has comprehensive row-level security
2. **Environment Variables**: Use Vite's `import.meta.env` for client-side vars
3. **API Key Management**: Server-side only for sensitive operations
4. **Input Validation**: Zod schemas for all user inputs

### Performance Optimizations
1. **Code Splitting**: Lazy loading for route components
2. **Bundle Analysis**: Vite bundle analysis for optimization
3. **Image Optimization**: WebP format with fallbacks
4. **Caching Strategy**: Browser caching for static assets

## Development Workflow

### Coding Standards
1. **TypeScript First**: Strict type checking enabled
2. **Component Props**: Always define interfaces for component props
3. **Error Boundaries**: Implement error handling for user-facing features
4. **Accessibility**: Follow WCAG guidelines for all interactive elements

### Testing Approach
1. **Production Builds**: Regular production build testing
2. **Mobile Testing**: Test on actual devices when possible
3. **Voice Testing**: Use admin playground for voice feature validation

### Common Patterns

#### Database Queries
```tsx
// Standard query pattern with error handling
const { data, error, isLoading } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);

if (error) {
  console.error('Database error:', error);
  // Handle error appropriately
}
```

#### State Management
```tsx
// Use React's built-in state for local component state
const [state, setState] = useState(initialState);

// Use Context for app-wide state (auth, theme, etc.)
const { user, isAuthenticated } = useAuth();
```

#### Error Handling
```tsx
// Consistent error handling pattern
try {
  await performAction();
  toast({
    title: "Success",
    description: "Action completed successfully."
  });
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  });
}
```

## AI Agent Guidelines

### When Working on This Project:

1. **Respect the Design System**: Always use the glassmorphism utilities and color system
2. **Mobile-First Approach**: Start with mobile design, then enhance for desktop
3. **Maintain Consistency**: Follow existing patterns for components, hooks, and utilities
4. **Security Awareness**: Implement proper RLS policies for any new database features
5. **Performance Conscious**: Consider bundle size and loading performance
6. **Accessibility First**: Ensure all features work with keyboard navigation and screen readers

### Key Files to Reference:
- `/src/index.css` - Design system and theming
- `/src/pages/MobileAssessment.tsx` - Mobile UX patterns
- `/src/components/responsive/MobileOptimized.tsx` - Responsive utilities
- `/supabase/migrations/` - Database schema and security patterns
- `/src/integrations/supabase/client.ts` - Database client configuration

### Voice Feature Development:
- Use existing OpenAI Realtime API patterns
- Test voice features in admin playground first
- Ensure proper audio permissions handling
- Follow WebRTC best practices for browser compatibility

Remember: This project emphasizes **emotional intelligence, empathy, and user empowerment**. Every feature should contribute to helping women discover their authentic selves and build confidence in their personal growth journey.
