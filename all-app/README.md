# All-App - Comprehensive Assessment & Learning Platform

A full-featured web and mobile application for assessments, quizzes, courses, and AI-powered content generation with voice agent support.

## Features

### For Visitors
- **6 Free Assessments** (no signup required):
  - Personality Assessment
  - Career Aptitude Test
  - Learning Style Assessment
  - Emotional Intelligence Test
  - Stress Management Evaluation
  - Communication Style Quiz
- **Voice Assistant** - AI-powered voice agent using OpenAI Realtime API
- **Instant Results** - Get immediate feedback from assessments

### For Registered Users
- **20+ Premium Assessments**
- **Personalized Learning Paths**
- **Progress Tracking & Analytics**
- **Course Enrollment**
- **Detailed Assessment Reports**

### For Administrators
- **AI Content Builder** - Generate assessments, courses, tests, and explorations using AI
- **Content Management** - Create and manage all platform content
- **User Management** - Monitor and manage user accounts
- **Analytics Dashboard** - Track platform usage and performance
- **Multi-AI Provider Support** - OpenAI, Anthropic, and Google AI integration

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Mobile**: Capacitor for iOS/Android
- **AI Integration**: 
  - OpenAI Realtime API for voice agent
  - GPT-4 for content generation
- **State Management**: Zustand
- **UI Components**: Custom components with Tailwind CSS
- **Authentication**: Supabase Auth with JWT

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account (credentials provided)
- OpenAI API key
- Xcode (for iOS development)

### Installation

1. **Clone and install dependencies:**
```bash
cd /workspace/all-app
npm install
```

2. **Environment Setup:**
The `.env.local` file is already configured with your Supabase credentials. You need to add:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Database Setup:**
Run the SQL schema in your Supabase dashboard:
```bash
# The schema file is located at:
/workspace/all-app/src/lib/database-schema.sql
```

4. **Run Development Server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

### iOS App Development

1. **Initialize Capacitor:**
```bash
npx cap init
```

2. **Add iOS Platform:**
```bash
npx cap add ios
```

3. **Build and Sync:**
```bash
npm run build
npx cap sync
```

4. **Open in Xcode:**
```bash
npx cap open ios
```

## Project Structure

```
all-app/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin panel pages
│   │   ├── assessments/       # Assessment pages
│   │   ├── auth/              # Authentication pages
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   ├── data/                  # Assessment data
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and configurations
│   ├── services/              # API services
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── capacitor.config.ts        # Capacitor configuration
└── package.json              # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out

### AI Services
- `POST /api/realtime-token` - Generate ephemeral token for voice agent
- `POST /api/ai-generate` - Generate content using AI

## Voice Agent Integration

The voice agent uses OpenAI's Realtime API for natural speech interactions:

1. **Connection**: WebRTC in browser, WebSocket on server
2. **Features**: 
   - Real-time speech recognition
   - Natural language understanding
   - Context-aware responses
   - Assessment guidance

## Deployment

### Web Deployment
```bash
npm run build
npm start
```

### Mobile Deployment
```bash
# iOS
npm run ios

# Android (if configured)
npm run android
```

## Security Notes

- All sensitive credentials are stored in environment variables
- Supabase Row Level Security (RLS) is enabled
- API keys should never be exposed to the client
- Use ephemeral tokens for Realtime API connections

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.