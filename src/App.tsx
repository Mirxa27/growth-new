import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileNavigation } from "@/components/MobileNavigation";
import { useEffect } from "react";
import { debugPointerEvents, autoFixPointerEvents } from "@/utils/debugPointerEvents";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PublicAssessment from "./pages/PublicAssessment";
import MobileAssessment from "./pages/MobileAssessment";
import Dashboard from "./pages/Dashboard";
import Explorations from "./pages/Explorations";
import Chat from "./pages/Chat";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import ExplorationSession from "./components/exploration/ExplorationSession";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import MobileAssessmentHub from "./pages/MobileAssessmentHub";
import AssessmentPage from "./pages/AssessmentPage";
import ResultsPage from "./pages/ResultsPage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Debug and fix pointer events issues in development
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        debugPointerEvents();
        autoFixPointerEvents();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="relative">
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
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingFlow />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileNavigation />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
