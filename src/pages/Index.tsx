import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FounderSection } from "@/components/FounderSection";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background - Matching Auth/Assessment Pages */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/hero-meditation.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Deep Purple Glassmorphism Overlay - Exact Match */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/20 animate-pulse opacity-40" />
        <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-purple-300/30 animate-pulse delay-1000 opacity-30" />
        <div className="absolute bottom-[35%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse delay-2000 opacity-25" />
        <div className="absolute top-[60%] right-[10%] w-1 h-1 rounded-full bg-purple-300/25 animate-pulse delay-500 opacity-20" />
        <div className="absolute bottom-[20%] left-[30%] w-2 h-2 rounded-full bg-white/10 animate-pulse delay-3000 opacity-15" />
      </div>

      <Navigation />
      <main className="relative z-10">
        <Hero />
        <FounderSection />
        <Features />
      </main>
    </div>
  );
};

export default Index;
