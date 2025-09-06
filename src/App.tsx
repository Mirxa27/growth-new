import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, useEffect } from "react";
import { debugPointerEvents, autoFixPointerEvents } from "@/utils/debugPointerEvents";
import { useViewportHeight } from "@/hooks/useResponsive";
import webVitals from "@/utils/webVitals";
import { createLazyRoute, preloadRoutes } from "@/utils/lazyRoutes";
import bundleAnalyzer from "@/utils/bundleAnalyzer";
import { RoutePreloader } from "@/components/RoutePreloader";
import { AccessibilityMonitor } from "@/components/AccessibilityMonitor";
import { SkipLink } from "@/components/SkipLink";

// Critical pages loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Advanced lazy loading with intelligent preloading and error recovery
const PublicAssessment = createLazyRoute(() => import("./pages/PublicAssessment"), {
  chunkName: 'public-assessment',
  preloadDelay: 2000,
  enablePreload: true
});

const MobileAssessment = createLazyRoute(() => import("./pages/MobileAssessment"), {
  chunkName: 'mobile-assessment',
  preloadDelay: 3000
});

const Explorations = createLazyRoute(() => import("./pages/Explorations"), {
  chunkName: 'explorations',
  preloadDelay: 5000
});

const Chat = createLazyRoute(() => import("./pages/Chat"), {
  chunkName: 'chat',
  preloadDelay: 4000
});

const Library = createLazyRoute(() => import("./pages/Library"), {
  chunkName: 'library',
  preloadDelay: 6000
});

const Profile = createLazyRoute(() => import("./pages/Profile"), {
  chunkName: 'profile',
  preloadDelay: 7000
});

const AdminDashboard = createLazyRoute(() => import("./pages/AdminDashboard"), {
  chunkName: 'admin-dashboard',
  preloadDelay: 10000 // Lower priority for admin features
});

const Community = createLazyRoute(() => import("./pages/Community"), {
  chunkName: 'community',
  preloadDelay: 8000
});

const ExplorationSession = createLazyRoute(() => import("./components/exploration/ExplorationSession"), {
  chunkName: 'exploration-session',
  enablePreload: false // Load on demand
});

const OnboardingFlow = createLazyRoute(
  () => import("./components/onboarding/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })),
  {
    chunkName: 'onboarding-flow',
    enablePreload: false
  }
);

const MobileAssessmentHub = createLazyRoute(() => import("./pages/MobileAssessmentHub"), {
  chunkName: 'mobile-assessment-hub',
  preloadDelay: 3500
});

const AssessmentPage = createLazyRoute(() => import("./pages/AssessmentPage"), {
  chunkName: 'assessment-page',
  enablePreload: false // Load when needed
});

const ResultsPage = createLazyRoute(() => import("./pages/ResultsPage"), {
  chunkName: 'results-page',
  enablePreload: false
});

const AssessmentTestPage = createLazyRoute(() => import("./pages/AssessmentTestPage"), {
  chunkName: 'assessment-test',
  enablePreload: false
});

const VoiceAssistantDemo = createLazyRoute(() => import("./pages/VoiceAssistantDemo"), {
  chunkName: 'voice-demo',
  enablePreload: false
});

const NotificationTestPage = createLazyRoute(() => import("./pages/NotificationTestPage"), {
  chunkName: 'notification-test',
  enablePreload: false
});

const AssessmentSystemDemo = createLazyRoute(() => import("./pages/AssessmentSystemDemo"), {
  chunkName: 'assessment-demo',
  enablePreload: false
});

const AssessmentLanding = createLazyRoute(() => import("./pages/AssessmentLanding"), {
  chunkName: 'assessment-landing',
  preloadDelay: 2500
});

const SimpleAssessmentLanding = createLazyRoute(() => import("./pages/SimpleAssessmentLanding"), {
  chunkName: 'simple-assessment-landing',
  preloadDelay: 2500
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Loading component for Suspense boundaries
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

const App = () => {
  // Fix viewport height on mobile devices
  useViewportHeight();
  
  useEffect(() => {
    // Initialize Web Vitals monitoring
    webVitals.init({
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableAnalytics: true,
      reportingEndpoint: process.env.NODE_ENV === 'production' ? '/api/analytics/vitals' : undefined,
    });

    // Initialize bundle analyzer for performance monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log('[App] Bundle analyzer initialized for performance monitoring');
    }

    // Strategic preloading of high-priority routes
    const highPriorityRoutes = [
      { importFn: () => import("./pages/PublicAssessment"), name: 'public-assessment', priority: 'high' as const },
      { importFn: () => import("./pages/SimpleAssessmentLanding"), name: 'simple-assessment-landing', priority: 'high' as const },
      { importFn: () => import("./pages/MobileAssessment"), name: 'mobile-assessment', priority: 'medium' as const },
      { importFn: () => import("./pages/Chat"), name: 'chat', priority: 'medium' as const }
    ];

    // Delay preloading to not impact initial load
    const preloadTimer = setTimeout(() => {
      preloadRoutes(highPriorityRoutes);
    }, 3000);

    // Debug and fix pointer events issues in development
    if (process.env.NODE_ENV === 'development') {
      const debugTimer = setTimeout(() => {
        debugPointerEvents();
        autoFixPointerEvents();
      }, 1000);
      
      return () => {
        clearTimeout(preloadTimer);
        clearTimeout(debugTimer);
      };
    }
    
    return () => clearTimeout(preloadTimer);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoutePreloader>
            <div className="relative">
              <SkipLink />
              <ErrorBoundary>
                <main id="main-content" tabIndex={-1}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                  {/* Critical routes - loaded immediately */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Lazy loaded assessment routes */}
                  <Route path="/assessment" element={
                    <Suspense fallback={<PageLoader />}>
                      <PublicAssessment />
                    </Suspense>
                  } />
                  <Route path="/assessment-hub" element={
                    <Suspense fallback={<PageLoader />}>
                      <SimpleAssessmentLanding />
                    </Suspense>
                  } />
                  <Route path="/assessment-system" element={
                    <Suspense fallback={<PageLoader />}>
                      <AssessmentLanding />
                    </Suspense>
                  } />
                  <Route path="/mobile-assessment" element={
                    <Suspense fallback={<PageLoader />}>
                      <MobileAssessment />
                    </Suspense>
                  } />
                  <Route path="/mobile-assessment-hub" element={
                    <Suspense fallback={<PageLoader />}>
                      <MobileAssessmentHub />
                    </Suspense>
                  } />
                  <Route path="/assessment/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <AssessmentPage />
                    </Suspense>
                  } />
                  <Route path="/results/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <ResultsPage />
                    </Suspense>
                  } />
                  
                  {/* Lazy loaded exploration routes */}
                  <Route path="/explorations" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Explorations />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/explorations/:explorationId" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <ExplorationSession />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <OnboardingFlow />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Lazy loaded feature routes */}
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Chat />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/library" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Library />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/community" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Community />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes - lazy loaded */}
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/assessments" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Demo and test routes - lazy loaded */}
                  <Route path="/assessment-test" element={
                    <Suspense fallback={<PageLoader />}>
                      <AssessmentTestPage />
                    </Suspense>
                  } />
                  <Route path="/assessment-demo" element={
                    <Suspense fallback={<PageLoader />}>
                      <AssessmentSystemDemo />
                    </Suspense>
                  } />
                  <Route path="/voice-demo" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <VoiceAssistantDemo />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications-test" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <NotificationTestPage />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </ErrorBoundary>
              <MobileNavigation />
              <AccessibilityMonitor 
                enabled={process.env.NODE_ENV === 'development' || process.env.REACT_APP_A11Y_MONITOR === 'true'}
                position="bottom-right"
                autoRun={true}
                showInProduction={process.env.REACT_APP_A11Y_MONITOR === 'true'}
              />
            </div>
          </RoutePreloader>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;