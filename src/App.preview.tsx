import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileNavigation } from "@/components/MobileNavigation";
import React, { useEffect } from "react";
import { debugPointerEvents, autoFixPointerEvents } from "@/utils/debugPointerEvents";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PublicAssessment from "./pages/PublicAssessment";
import MobileAssessment from "./pages/MobileAssessment";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Library from "./pages/Library";
import Explorations from "./pages/Explorations";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ui/error-boundary";
import ExplorationSession from "./components/exploration/ExplorationSession";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";

const queryClient = new QueryClient();

const AppPreview = () => {
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
    <ErrorBoundary>
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
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
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
                  <Route path="/library" element={
                    <ProtectedRoute>
                      <Library />
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
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MobileNavigation />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppPreview;