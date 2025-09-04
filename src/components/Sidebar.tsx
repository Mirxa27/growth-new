import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, User, Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-50 border-r">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-2xl font-bold text-primary">NewoMen</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/dashboard" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
          <Home className="w-5 h-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/library" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
          <BookOpen className="w-5 h-5 mr-3" />
          Library
        </NavLink>
        <NavLink to="/community" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
          <Users className="w-5 h-5 mr-3" />
          Community
        </NavLink>
        <NavLink to="/profile" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
          <User className="w-5 h-5 mr-3" />
          Profile
        </NavLink>
        <NavLink to="/settings" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </NavLink>
      </nav>
    </div>
  );
};