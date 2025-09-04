import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, User } from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg md:hidden">
      <div className="flex justify-around py-2">
        <NavLink to="/dashboard" className="flex flex-col items-center text-gray-600 hover:text-primary">
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </NavLink>
        <NavLink to="/library" className="flex flex-col items-center text-gray-600 hover:text-primary">
          <BookOpen className="w-6 h-6" />
          <span className="text-xs">Library</span>
        </NavLink>
        <NavLink to="/community" className="flex flex-col items-center text-gray-600 hover:text-primary">
          <Users className="w-6 h-6" />
          <span className="text-xs">Community</span>
        </NavLink>
        <NavLink to="/profile" className="flex flex-col items-center text-gray-600 hover:text-primary">
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </NavLink>
      </div>
    </div>
  );
};