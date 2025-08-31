import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary-glow animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-secondary-glow animate-pulse delay-1000 opacity-40" />
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 rounded-full bg-primary animate-pulse delay-2000 opacity-30" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-500 opacity-50" />
      </div>

      {/* Main Content */}
      <div className="text-center max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Meet NewMe - Your AI Growth Companion
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-hero font-bold leading-tight px-4">
          <span className="bg-gradient-primary bg-clip-text text-transparent text-shadow-lg shadow-primary/30">
            Discover Your
          </span>
          <br />
          <span className="relative inline-block bg-gradient-secondary bg-clip-text text-transparent animate-pulse">
            Authentic Self
            <div className="absolute -inset-4 bg-gradient-glow rounded-lg opacity-30 blur-2xl animate-ping"></div>
            <div className="absolute -inset-2 bg-gradient-primary rounded-lg opacity-10 blur-lg"></div>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4 text-balance">
          Transform your personal journey with NewMe, an emotionally intelligent AI companion designed for women seeking growth, empowerment, and authentic self-discovery.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
          <Button
            size="lg"
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-2xl hover:shadow-primary/25 transform hover:scale-105 transition-all duration-300 group px-8 py-4 text-lg font-semibold w-full sm:w-auto min-h-[3.5rem]"
            onClick={() => navigate("/mobile-assessment-hub")}
          >
            Start Free Discovery
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="glass hover:glass-glow border-primary/20 hover:border-primary/40 px-8 py-4 text-lg font-medium w-full sm:w-auto min-h-[3.5rem]"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-8 text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="whitespace-nowrap">Culturally Sensitive</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/40"></div>
          <div className="whitespace-nowrap">Voice & Text AI Support</div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/40"></div>
          <div className="whitespace-nowrap">Available in Arabic & English</div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};
