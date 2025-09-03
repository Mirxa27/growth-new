import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FounderSection } from "@/components/FounderSection";
import { Features } from "@/components/Features";
import RealtimeAgentQuickstart from '@/components/voice/RealtimeAgentQuickstart';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <FounderSection />
        <Features />
        <div className="container mx-auto px-4 py-8">
          <RealtimeAgentQuickstart />
        </div>
      </main>
    </div>
  );
};

export default Index;
