import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background - Matching Other Pages */}
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

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 max-w-md w-full text-center rounded-2xl">
          <CardContent className="p-8">
            <button
              onClick={() => navigate('/')}
              className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 hover:bg-white/20 transition-all border border-white/20"
            >
              <img src="/symbol.svg" alt="Newomen Logo" className="w-16 h-16" />
            </button>
            
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-4 text-white">Page Not Found</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 hover:border-white/40"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;