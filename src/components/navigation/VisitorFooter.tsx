import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github,
  Heart,
  Shield,
  FileText,
  HelpCircle,
  Users,
  Star
} from 'lucide-react';

export const VisitorFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Assessments',
      links: [
        { title: 'Free Assessments', href: '/assessments' },
        { title: 'Personality Insights', href: '/assessment/personality-insights' },
        { title: 'Wellness Check', href: '/assessment/wellness-check' },
        { title: 'Career Compass', href: '/assessment/career-compass' },
        { title: 'Relationship Patterns', href: '/assessment/relationship-patterns' },
        { title: 'Mindfulness Assessment', href: '/assessment/mindfulness-awareness' }
      ]
    },
    {
      title: 'Platform',
      links: [
        { title: 'How It Works', href: '/how-it-works' },
        { title: 'For Individuals', href: '/for-individuals' },
        { title: 'For Teams', href: '/for-teams' },
        { title: 'Success Stories', href: '/success-stories' },
        { title: 'Pricing', href: '/pricing' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { title: 'Blog', href: '/blog' },
        { title: 'Research', href: '/research' },
        { title: 'Help Center', href: '/help' },
        { title: 'API Documentation', href: '/docs' },
        { title: 'Community', href: '/community' }
      ]
    },
    {
      title: 'Company',
      links: [
        { title: 'About Us', href: '/about' },
        { title: 'Careers', href: '/careers' },
        { title: 'Contact', href: '/contact' },
        { title: 'Privacy Policy', href: '/privacy' },
        { title: 'Terms of Service', href: '/terms' }
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/newomen', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/newomen', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/newomen', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com/newomen', label: 'GitHub' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold">Newomen</span>
            </Link>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering personal growth through AI-powered assessments, insights, and personalized development plans. 
              Discover your potential and transform your story.
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Stay Updated</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter your email" 
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      to={link.href}
                      className="text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Features Highlight */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Star, text: '100% Free Assessments', color: 'text-yellow-400' },
              { icon: Shield, text: 'Privacy Protected', color: 'text-green-400' },
              { icon: Users, text: 'Trusted by Thousands', color: 'text-blue-400' },
              { icon: Heart, text: 'Science-Based', color: 'text-red-400' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                <span className="text-sm text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>© {currentYear} Newomen. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-4 h-4 text-red-400" /> for personal growth
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default VisitorFooter;