import { Brain, MessageCircle, Trophy, Users, Globe, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Features = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Brain,
      title: "Emotionally Intelligent AI",
      description: "NewMe understands emotions and adapts responses for culturally sensitive, empathetic conversations.",
      color: "text-primary"
    },
    {
      icon: MessageCircle,
      title: "Voice & Text Support",
      description: "Seamless communication through advanced speech-to-speech technology and text conversations.",
      color: "text-secondary"
    },
    {
      icon: Trophy,
      title: "Gamified Growth Journey",
      description: "Earn crystals, unlock achievements, and track your personal development progress with engaging rewards.",
      color: "text-primary-glow"
    },
    {
      icon: Users,
      title: "Global Community",
      description: "Connect with women worldwide in a safe, supportive environment designed for authentic connections.",
      color: "text-secondary-glow"
    },
    {
      icon: Globe,
      title: "Arabic & English Support",
      description: "Fully localized experience with RTL support, culturally adapted content, and bilingual AI assistance.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Safe & Private",
      description: "Your conversations and personal data are protected with enterprise-grade security and privacy measures.",
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" id="newme">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-display font-bold mb-4">Empowering Features</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how NewMe combines cutting-edge AI technology with culturally sensitive design to support your personal growth journey
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="glass p-8 interactive group border-card-border">
              <div className="mb-6">
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="glass rounded-3xl p-12 bg-gradient-primary/5">
            <h3 className="text-heading font-bold mb-4">Ready to Transform Your Journey?</h3>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of women who have discovered their authentic selves with NewMe's AI-powered guidance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => navigate("/mobile-assessment-hub")}
                className="transform hover:scale-105 transition-all duration-300"
              >
                Start Free Discovery Session
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="glass hover:glass-glow transition-all duration-300"
                onClick={() => navigate("/auth")}
              >
                Learn About Pricing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};