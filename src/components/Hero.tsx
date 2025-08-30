import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6 py-20 overflow-hidden">
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
        <h1 className="text-hero font-hero leading-tight">
          Discover Your
          <br />
          <span className="relative inline-block">
            Authentic Self
            <div className="absolute -inset-2 bg-gradient-glow rounded-lg opacity-20 blur-xl"></div>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          Transform your personal journey with NewMe, an emotionally intelligent AI companion designed for women seeking growth, empowerment, and authentic self-discovery.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg" 
            className="glass glass-glow interactive group px-8 py-4 text-lg font-semibold"
            onClick={() => navigate("/mobile-assessment-hub")}
          >
            Start Free Discovery
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="glass interactive px-8 py-4 text-lg"
            onClick={() => navigate("/assessment")}
          >
            Desktop Assessment
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Culturally Sensitive
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/40"></div>
          <div>Voice & Text AI Support</div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/40"></div>
          <div>Available in Arabic & English</div>
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
