import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-20" 
           style={{ backgroundImage: 'url(/lovable-uploads/3ca516cd-6dbf-4a00-831a-85462d71db33.png)' }} />
      
      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <Card className="glass-card border-glass">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome to Your Journey
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Hello {user?.email}, ready to explore your potential?
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="glass-button"
              >
                Sign Out
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="glass-card border-glass">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary text-xl">🎯</span>
                  </div>
                  <h3 className="font-semibold mb-2">Explorations</h3>
                  <p className="text-sm text-muted-foreground">Guided journeys of self-discovery</p>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-glass">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-secondary text-xl">💬</span>
                  </div>
                  <h3 className="font-semibold mb-2">AI Companion</h3>
                  <p className="text-sm text-muted-foreground">Chat with your personal guide</p>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-glass">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent text-xl">📈</span>
                  </div>
                  <h3 className="font-semibold mb-2">Progress</h3>
                  <p className="text-sm text-muted-foreground">Track your growth journey</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                This is your secure dashboard. All features require authentication to protect your privacy.
              </p>
              <Button className="glass-button">
                Start Your First Exploration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;