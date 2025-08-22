
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center px-4">
      <Card className="glass-card border-glass max-w-md w-full text-center">
        <CardContent className="p-8">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Compass className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold mb-4">
            Page Not Found
          </h2>
          
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on your journey of self-discovery.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-primary"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="glass"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
