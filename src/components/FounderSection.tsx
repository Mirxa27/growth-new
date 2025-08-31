import { Quote, MapPin, Users, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

const Sparkles = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

export const FounderSection = () => {
  return (
    <section id="founder" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-display font-bold mb-4">Meet Our Founder</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The visionary behind Newomen's mission of global women empowerment
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Founder Image */}
          <div className="relative">
            <div className="glass rounded-3xl p-2 interactive">
              <img
                src="/lovable-uploads/3ca516cd-6dbf-4a00-831a-85462d71db33.png"
                alt="Katrina Zhuk - Founder of Newomen"
                className="w-full h-[500px] object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-glow rounded-3xl opacity-10 pointer-events-none"></div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -right-4 top-20 glass rounded-2xl p-4 hidden md:block">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">Global Community</span>
              </div>
            </div>
            
            <div className="absolute -left-4 bottom-20 glass rounded-2xl p-4 hidden md:block">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                <span className="font-semibold">Belarus → Saudi Arabia</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div>
              <h3 className="text-heading font-bold mb-2">Katrina Zhuk</h3>
              <p className="text-primary font-semibold text-lg">Founder & Visionary</p>
            </div>

            {/* Quote */}
            <Card className="glass p-6 border-card-border">
              <Quote className="w-8 h-8 text-primary mb-4" />
              <blockquote className="text-lg italic leading-relaxed mb-4">
                "Traveling to Saudi Arabia opened my heart and mind in ways I never imagined. Inspired by the strength and spirit of the women I met, I created Newomen as a community where women worldwide can connect, learn, and grow together through technology."
              </blockquote>
              <cite className="text-muted-foreground font-medium">— Katrina Zhuk</cite>
            </Card>

            {/* Story Points */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 glass rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Global Impact</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    At just 25 years old, Katrina embarked on a transformative journey from Belarus to Saudi Arabia, where she was deeply inspired by the culture, warmth, and resilience she encountered, leading her to create a global community for women's empowerment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 glass rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Vision Forward</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    "This is just the beginning of our shared community journey toward collective empowerment and self-discovery."
                  </p>
                </div>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="glass rounded-2xl p-6 bg-gradient-primary/5">
              <h4 className="font-semibold text-lg mb-3 text-primary">Our Mission</h4>
              <p className="text-muted-foreground leading-relaxed">
                Creating a safe, culturally sensitive space where women from all backgrounds can explore their authentic selves, connect with others, and access practical tools for personal growth and empowerment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
