import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "About NewMe", href: "#newme" },
    { name: "Journey", href: "#journey" },
    { name: "Community", href: "#community" },
  ];

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-hero bg-gradient-primary bg-clip-text text-transparent">
              Newomen
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome back!
                </span>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  size="sm" 
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  size="sm" 
                  className="glass"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="glass"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                  onClick={handleAuthAction}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg glass interactive"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                {user ? (
                  <>
                    <Button 
                      className="bg-gradient-primary hover:opacity-90 transition-opacity w-full"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      className="glass w-full"
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="glass w-full"
                      onClick={() => {
                        handleSignIn();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="bg-gradient-primary hover:opacity-90 transition-opacity w-full"
                      onClick={() => {
                        handleAuthAction();
                        setIsMenuOpen(false);
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};