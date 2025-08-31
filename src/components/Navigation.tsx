
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleNavClick = (href: string) => {
    // If we're not on the landing page, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // We're already on the landing page, just scroll
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-hero bg-gradient-primary bg-clip-text text-transparent">
              Newomen
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium hover:scale-105 relative group px-3 py-2"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300"></span>
              </button>
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
                  variant="hero"
                >
                  Dashboard
                </Button>
                <Button
                  variant="glass"
                  onClick={signOut}
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  variant="hero"
                  onClick={handleAuthAction}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-3 rounded-lg glass interactive hover:scale-105 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4">
            <div className="glass rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-5 duration-200">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="block text-muted-foreground hover:text-foreground transition-colors font-medium py-3 w-full text-left hover:scale-105 transition-transform min-h-[44px] flex items-center"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                {user ? (
                  <>
                    <Button
                      variant="hero"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="glass"
                      className="w-full"
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
                      variant="glass"
                      className="w-full"
                      onClick={() => {
                        handleSignIn();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="hero"
                      className="w-full"
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
