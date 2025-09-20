import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  X,
  ChevronRight,
  Settings,
  Users,
  Target,
  MessageSquare,
  FileText,
  Mic,
  Sparkles,
  CreditCard,
  Database,
  Shield,
  BarChart3,
  Activity,
  BookOpen
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';

interface MobileAdminWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

const navigationItems = [
  { 
    id: 'overview', 
    label: 'Overview', 
    icon: Activity,
    description: 'Dashboard overview',
    color: 'text-blue-500'
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    description: 'User engagement stats',
    color: 'text-green-500'
  },
  { 
    id: 'users', 
    label: 'Users', 
    icon: Users,
    description: 'User management',
    color: 'text-purple-500'
  },
  { 
    id: 'assessments', 
    label: 'Assessments', 
    icon: Target,
    description: 'Assessment management',
    color: 'text-orange-500'
  },
  { 
    id: 'library', 
    label: 'Library', 
    icon: BookOpen,
    description: 'Content library',
    color: 'text-indigo-500'
  },
  { 
    id: 'community', 
    label: 'Community', 
    icon: MessageSquare,
    description: 'Community management',
    color: 'text-cyan-500'
  },
  { 
    id: 'content', 
    label: 'Content', 
    icon: FileText,
    description: 'Content challenges',
    color: 'text-yellow-500'
  },
  { 
    id: 'voice', 
    label: 'Voice Agent', 
    icon: Mic,
    description: 'Voice configuration',
    color: 'text-pink-500'
  },
  { 
    id: 'ai-content', 
    label: 'AI Builder', 
    icon: Sparkles,
    description: 'Content generation',
    color: 'text-violet-500'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings,
    description: 'Platform settings',
    color: 'text-gray-500'
  },
  { 
    id: 'payments', 
    label: 'Payments', 
    icon: CreditCard,
    description: 'Payment configuration',
    color: 'text-emerald-500'
  },
  { 
    id: 'ai-providers', 
    label: 'AI Providers', 
    icon: Database,
    description: 'Model configurations',
    color: 'text-teal-500'
  },
  { 
    id: 'moderation', 
    label: 'Moderation', 
    icon: Shield,
    description: 'Content moderation',
    color: 'text-red-500'
  }
];

export const MobileAdminWrapper: React.FC<MobileAdminWrapperProps> = ({
  title,
  description,
  children,
  currentSection,
  onSectionChange,
  badge
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  const currentItem = navigationItems.find(item => item.id === currentSection);

  const NavigationMenu = () => (
    <div className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === currentSection;
        
        return (
          <Button
            key={item.id}
            variant={isActive ? "secondary" : "ghost"}
            className={`w-full justify-start h-auto p-3 ${
              isMobile ? 'text-base' : 'text-sm'
            } ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
            onClick={() => {
              onSectionChange(item.id);
              if (isMobile) setSidebarOpen(false);
            }}
          >
            <div className="flex items-center space-x-3 w-full">
              <Icon className={`h-5 w-5 ${item.color}`} />
              <div className="flex-1 text-left">
                <div className="font-medium">{item.label}</div>
                {!isMobile && (
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                )}
              </div>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </div>
          </Button>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center justify-between p-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="touch-target">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-left">Admin Panel</SheetTitle>
                  <SheetDescription className="text-left">
                    Manage your platform
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <div className="p-4">
                    <NavigationMenu />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <div className="flex-1 px-4">
              <div className="flex items-center">
                {currentItem && (
                  <currentItem.icon className={`h-5 w-5 mr-2 ${currentItem.color}`} />
                )}
                <h1 className="text-lg font-semibold truncate">{title}</h1>
              </div>
              {badge && (
                <Badge variant={badge.variant || 'default'} className="text-xs">
                  {badge.text}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 pb-20 space-y-4">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Tablet Sidebar */}
        <div className="w-72 border-r bg-card/50 backdrop-blur-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Platform Management</p>
          </div>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="p-4">
              <NavigationMenu />
            </div>
          </ScrollArea>
        </div>

        {/* Tablet Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {currentItem && (
                    <currentItem.icon className={`h-6 w-6 mr-3 ${currentItem.color}`} />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    {description && (
                      <p className="text-muted-foreground">{description}</p>
                    )}
                  </div>
                </div>
                {badge && (
                  <Badge variant={badge.variant || 'default'}>
                    {badge.text}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (unchanged for compatibility)
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {currentItem && (
            <currentItem.icon className={`h-6 w-6 mr-3 ${currentItem.color}`} />
          )}
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {badge && (
          <Badge variant={badge.variant || 'default'}>
            {badge.text}
          </Badge>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};