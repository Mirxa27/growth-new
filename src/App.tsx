import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileNavigation } from "@/components/MobileNavigation";
import { useEffect } from "react";
// import { debugPointerEvents, autoFixPointerEvents } from "@/utils/debugPointerEvents";
import { useViewportHeight } from "@/hooks/useResponsive";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { addResourceHints, registerServiceWorker } from "@/utils/performance";

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
const AdminTest = lazy(() => import("./pages/AdminTest"));
const Community = lazy(() => import("./pages/Community"));
const NotFound = lazy(() => import("./pages/NotFound"));
import ExplorationSession from "./components/exploration/ExplorationSession";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { NewomenOnboardingFlow } from "./components/onboarding/NewomenOnboardingFlow";
import { NarrativeIdentityExploration } from "./components/exploration/NarrativeIdentityExploration";
import { FreeAssessmentHub } from "./components/assessments/FreeAssessmentHub";
import MobileAssessmentHub from "./pages/MobileAssessmentHub";
import AssessmentPage from "./pages/AssessmentPage";
import ResultsPage from "./pages/ResultsPage";

const queryClient = new QueryClient();

const App = () => {
  // Fix viewport height on mobile devices
  useViewportHeight();
  
  // Performance optimizations
  useEffect(() => {
    // Add resource hints for better loading performance
    addResourceHints();
    
    // Register service worker for caching
    registerServiceWorker();
  }, []);
  
  // Remove debug code for production - keep only viewport height fix
  // useEffect(() => {
  //   // Debug and fix pointer events issues in development
  //   if (process.env.NODE_ENV === 'development') {
  //     const timer = setTimeout(() => {
  //       debugPointerEvents();
  //       autoFixPointerEvents();
  //     }, 1000);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  return (
  <EnhancedErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="relative">
              <Suspense fallback={
                <EnhancedLoading 
                  variant="page" 
                  message="Loading Newomen..." 
                  animated={true}
                />
              }>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin-test" element={
                <ProtectedRoute>
                  <AdminTest />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <MobileNavigation />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </EnhancedErrorBoundary>
  );
};

export default App;
