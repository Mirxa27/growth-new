import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  User, 
  LogIn, 
  UserPlus,
  ChevronDown,
  Star,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

export const VisitorNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Home',
      href: '/',
      icon: Home,
      description: 'Welcome to Newomen'
    },
    {
      title: 'Free Assessments',
      href: '/assessments',
      icon: FileText,
      description: 'Discover yourself with our free assessments'
    }
  ];

  const features = [
    {
      icon: Star,
      title: '100% Free',
      description: 'All visitor assessments are completely free'
    },
    {
      icon: Clock,
      title: '5-15 Minutes',
      description: 'Quick and insightful assessments'
    },
    {
      icon: TrendingUp,
      title: 'Instant Results',
      description: 'Get your results immediately'
    },
    {
      icon: Users,
      title: 'No Signup Required',
      description: 'Start exploring right away'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navigationItems[0], mobile?: boolean }) => (
    <Link
      to={item.href}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
        ${isActive(item.href) 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
        }
        ${mobile ? 'w-full text-left' : ''}
      `}
      onClick={() => mobile && setIsOpen(false)}
    >
      <item.icon className="w-4 h-4" />
      <span className="font-medium">{item.title}</span>
    </Link>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Newomen</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/auth/login">
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Newomen</span>
            </Link>

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">N</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">Newomen</span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex-1 py-6">
                    <div className="space-y-2">
                      {navigationItems.map((item) => (
                        <NavLink key={item.href} item={item} mobile />
                      ))}
                    </div>

                    {/* Features */}
                    <div className="mt-8">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Why Choose Newomen?</h3>
                      <div className="space-y-4">
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <feature.icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{feature.title}</h4>
                              <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Auth Buttons */}
                  <div className="border-t pt-6 space-y-3">
                    <Link to="/auth/login" className="block" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth/register" className="block" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Get Started Free
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
};

export default VisitorNavigation;