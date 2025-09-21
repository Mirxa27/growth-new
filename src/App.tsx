import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileNavigation } from "@/components/MobileNavigation";
import { MobileWrapper } from "@/components/mobile/MobileWrapper";
import { useEffect } from "react";
import { debugPointerEvents, autoFixPointerEvents } from "@/utils/debugPointerEvents";
import { useViewportHeight } from "@/hooks/useResponsive";
import { performanceOptimizer } from "@/services/performance/performance-optimization.service";
import { accessibilityService } from "@/services/accessibility/accessibility.service";
import { environmentValidator } from "@/services/configuration/environment-validator.service";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const PublicAssessment = lazy(() => import("./pages/PublicAssessment"));
const MobileAssessment = lazy(() => import("./pages/MobileAssessment"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explorations = lazy(() => import("./pages/Explorations"));
const Chat = lazy(() => import("./pages/Chat"));
const Library = lazy(() => import("./pages/Library"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SimpleAdmin = lazy(() => import("./pages/SimpleAdmin"));
const AdminTest = lazy(() => import("./pages/AdminTest"));
const Community = lazy(() => import("./pages/Community"));
const TranscriptionPage = lazy(() => import("./pages/TranscriptionPage"));
const ConfigurationPage = lazy(() => import("./pages/ConfigurationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Visitor Assessment Components
const VisitorAssessmentsList = lazy(() => import("./components/assessments/VisitorAssessmentsList"));
const VisitorAssessmentComponent = lazy(() => import("./components/assessments/VisitorAssessment"));
import ExplorationSession from "./components/exploration/ExplorationSession";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { NewomenOnboardingFlow } from "./components/onboarding/NewomenOnboardingFlow";
import { NarrativeIdentityExploration } from "./components/exploration/NarrativeIdentityExploration";
import { FreeAssessmentHub } from "./components/assessments/FreeAssessmentHub";
import MobileAssessmentHub from "./pages/MobileAssessmentHub";
import AssessmentPage from "./pages/AssessmentPage";
import ResultsPage from "./pages/ResultsPage";
import VisitorLayout from "./components/layouts/VisitorLayout";

const queryClient = new QueryClient();

const App = () => {
  // Fix viewport height on mobile devices
  useViewportHeight();
  
  useEffect(() => {
    // Validate environment configuration
    environmentValidator.validateEnvironment().then(() => {
      // Show configuration status (only if there are issues)
      environmentValidator.showStartupNotification();
    });

    // Initialize performance optimizations
    performanceOptimizer.preloadCriticalResources();
    performanceOptimizer.lazyLoadImages();
    
    // Initialize accessibility features
    accessibilityService.initialize();
    accessibilityService.setupReducedMotion();
    
    // Register service worker for caching
    performanceOptimizer.registerServiceWorker();
    
    // Monitor web vitals in production
    if (process.env.NODE_ENV === 'production') {
      performanceOptimizer.monitorWebVitals();
    }
    
    // Debug and fix pointer events issues in development
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        debugPointerEvents();
        autoFixPointerEvents();
      }, 1000);
      
      return () => clearTimeout(timer);
    }

    // Cleanup function
    return () => {
      performanceOptimizer.cleanup();
      accessibilityService.cleanup();
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MobileWrapper>
            <div className="relative">
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10">
                  <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-muted-foreground">Loading Newomen...</p>
                  </div>
                </div>
              }>
                <main id="main-content" className="focus:outline-none" tabIndex={-1}>
              <VisitorLayout>
                <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/login" element={<Auth />} />
              <Route path="/auth/register" element={<Auth />} />
              
              {/* Visitor Assessment Routes */}
              <Route path="/assessments" element={<VisitorAssessmentsList />} />
              <Route path="/assessment/:slug" element={<VisitorAssessmentComponent />} />
              
              {/* Legacy Assessment Routes */}
              <Route path="/assessment" element={<PublicAssessment />} />
              <Route path="/mobile-assessment" element={<MobileAssessment />} />
              <Route path="/mobile-assessment-hub" element={<MobileAssessmentHub />} />
              <Route path="/assessment/:id" element={<AssessmentPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/explorations" element={
                <ProtectedRoute>
                  <Explorations />
                </ProtectedRoute>
              } />
              <Route path="/explorations/:explorationId" element={
                <ProtectedRoute>
                  <ExplorationSession />
                </ProtectedRoute>
              } />
              <Route path="/narrative-identity" element={
                <ProtectedRoute>
                  <NarrativeIdentityExploration />
                </ProtectedRoute>
              } />
              <Route path="/free-assessments" element={<FreeAssessmentHub />} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <NewomenOnboardingFlow />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/library" element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              } />
              <Route path="/community" element={
                <ProtectedRoute>
                  <Community />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/simple-admin" element={
                <ProtectedRoute>
                  <SimpleAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin-test" element={
                <ProtectedRoute>
                  <AdminTest />
                </ProtectedRoute>
              } />
              <Route path="/transcription" element={
                <ProtectedRoute>
                  <TranscriptionPage />
                </ProtectedRoute>
              } />
              <Route path="/configuration" element={
                <ProtectedRoute>
                  <ConfigurationPage />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
              </VisitorLayout>
                </main>
              </Suspense>
              <MobileNavigation />
            </div>
          </MobileWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;