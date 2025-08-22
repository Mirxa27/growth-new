import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FounderSection } from "@/components/FounderSection";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <FounderSection />
        <Features />
      </main>
    </div>
  );
};

export default Index;
