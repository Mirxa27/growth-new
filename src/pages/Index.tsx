import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FounderSection } from "@/components/FounderSection";
import { Features } from "@/components/Features";
import AssessmentShowcase from "@/components/landing/AssessmentShowcase";

const Index = () => {
  return (
    <div className="min-h-screen">
      <main>
        <Hero />
        <AssessmentShowcase />
        <FounderSection />
        <Features />
      </main>
    </div>
  );
};

export default Index;
