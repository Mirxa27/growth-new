import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Heart, MessageCircle, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const handleStartDiscovery = async () => {
    try {
      await navigate("/mobile-assessment-hub");
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await navigate("/auth");
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 xl:px-12 pt-20 sm:pt-24 pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      {/* Floating Elements - Enhanced for better visual hierarchy */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-in-out">
        <div className="absolute top-[20%] left-[15%] sm:left-[20%] lg:left-[25%] w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary-glow animate-pulse opacity-60 transition-all duration-500" />
        <div className="absolute top-[25%] right-[20%] sm:right-[25%] lg:right-[30%] w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-secondary-glow animate-pulse delay-1000 opacity-40 transition-all duration-500" />
        <div className="absolute bottom-[30%] left-[10%] sm:left-[15%] lg:left-[20%] w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary animate-pulse delay-2000 opacity-30 transition-all duration-500" />
        <div className="absolute top-[45%] right-[15%] sm:right-[20%] lg:right-[25%] w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-secondary animate-pulse delay-500 opacity-50 transition-all duration-500" />
        <div className="absolute top-[60%] left-[25%] sm:left-[30%] lg:left-[35%] w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-glow animate-pulse delay-3000 opacity-25 transition-all duration-500" />
      </div>

      {/* Main Content - Enhanced fluid layout */}
      <div className="text-center w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10 relative z-10">
        {/* Badge - Improved spacing and responsiveness */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-muted-foreground hover:scale-105 transition-transform">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          <span className="hidden xs:inline">Meet NewMe — Your Growth Companion</span>
          <span className="xs:hidden">NewMe Companion</span>
        </div>

        {/* Hero Title - Using clamp() for smoother fluid typography */}
        <h1 className="text-[clamp(1.875rem,5vw,9rem)] font-hero font-bold leading-[1.1] sm:leading-tight px-2 sm:px-4 lg:px-6">
          <span className="text-foreground drop-shadow-2xl shadow-black/50 block sm:inline font-extrabold">
            Discover Your Hidden Self
          </span>
          <br className="hidden sm:block" />
          <span className="relative inline-block text-foreground font-extrabold drop-shadow-2xl shadow-black/50 mt-2 sm:mt-0">
            Unlock Your Natural Talents
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-glow rounded-lg opacity-20 blur-2xl animate-ping duration-[2000ms] ease-in-out"></div>
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-primary rounded-lg opacity-5 blur-lg transition-all duration-500"></div>
          </span>
        </h1>

        {/* Subtitle - Better responsive text sizing */}
        <p className="text-[clamp(1rem,2vw,1.875rem)] text-muted-foreground leading-relaxed max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 text-balance">
          Discover your hidden self, grow your talents, and become a pro at handling people. A safe, culturally sensitive space for women to learn, connect, and level up in real life.
        </p>

        {/* CTA Buttons - Enhanced touch targets and responsive layout */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 lg:gap-6 pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-0">
          <Button
            size="lg"
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-2xl hover:shadow-primary/25 transform hover:scale-105 transition-all duration-300 group px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl font-semibold w-full sm:w-auto min-h-[44px] sm:min-h-[48px] lg:min-h-[56px] rounded-xl sm:rounded-2xl"
            onClick={handleStartDiscovery}
          >
            Start Free Discovery
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="glass hover:glass-glow border-primary/20 hover:border-primary/40 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl font-medium w-full sm:w-auto min-h-[44px] sm:min-h-[48px] lg:min-h-[56px] rounded-xl sm:rounded-2xl"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </div>

        {/* Trust Indicators - Improved responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center gap-3 sm:gap-4 lg:gap-6 pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">Culturally Sensitive</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
            <span className="whitespace-nowrap">Voice & Text Support</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base">
            <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">Arabic & English</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Enhanced positioning and responsiveness */}
      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce duration-1000 ease-in-out transition-all">
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-primary rounded-full mt-1.5 sm:mt-2"></div>
        </div>
      </div>
    </section>
  );
};
