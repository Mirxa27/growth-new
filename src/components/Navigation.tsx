
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import Glass from '@/components/ui/glass';

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Discover", href: "#newme" },
    { name: "Founder", href: "#founder" },
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
    if (href === '#community') {
      navigate('/community');
      setIsMenuOpen(false);
      return;
    }
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
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
        // Add a small offset to account for fixed header
        window.scrollBy(0, -80);
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-7xl mx-auto">
        <Glass className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
              <ResponsiveImage
                src="/symbol.svg"
                alt="Newomen Logo"
                className="w-6 h-6 sm:w-8 sm:h-8"
                loadingType="eager"
                sizes="(max-width: 640px) 24px, 32px"
              />
            </div>
            <span className="text-lg sm:text-xl font-bold text-hero bg-gradient-primary bg-clip-text text-transparent">
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
                <span className="text-sm text-muted-foreground hidden lg:block">
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
                  className="hidden lg:flex"
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
            className="md:hidden lg:hidden p-2 sm:p-3 rounded-xl glass-button interactive hover:scale-105 transition-transform min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </Glass>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden lg:hidden mt-3 sm:mt-4">
            <Glass className="p-4 sm:p-6 space-y-3 sm:space-y-4 animate-in slide-in-from-top-5 duration-300 ease-in-out mx-2 sm:mx-0">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="block text-muted-foreground hover:text-foreground transition-all duration-200 font-medium py-3 px-2 w-full text-left hover:scale-105 min-h-[44px] flex items-center rounded-xl hover:bg-white/10"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-3 sm:pt-4 border-t border-border/50 flex flex-col gap-3">
                {user ? (
                  <>
                    <Button
                      variant="hero"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full h-12 text-base"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="glass"
                      className="w-full h-12 text-base"
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
                      className="w-full h-12 text-base"
                      onClick={() => {
                        handleSignIn();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="hero"
                      className="w-full h-12 text-base"
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
            </Glass>
          </div>
        )}
      </div>
    </nav>
  );
};
