import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Calendar, 
  BookOpen, 
  User, 
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield
} from 'lucide-react';
import Logo from './Logo';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  protected: boolean;
}

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', protected: true },
    { path: '/book', icon: Calendar, label: 'Book Class', protected: true },
    { path: '/my-bookings', icon: BookOpen, label: 'My Bookings', protected: true },
    { path: '/profile', icon: User, label: 'Profile', protected: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Logo size="navigation" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center space-x-2 text-sm font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'} transition-colors`} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="group relative flex items-center space-x-2 text-sm font-medium text-red-600 hover:text-red-700 transition-all duration-300"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>

                {/* User badge */}
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative text-gray-600 hover:text-blue-600 text-sm font-medium transition-all duration-300"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="group relative inline-block perspective-1000"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                    <span className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Sign Up</span>
                    </span>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="group relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 relative" />
              ) : (
                <Menu className="h-6 w-6 relative" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  {/* User info for mobile */}
                  <div className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 mb-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
                  </div>
                  
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group relative flex items-center space-x-3 text-sm font-medium py-2 px-4 ${
                        isActive(item.path)
                          ? 'text-blue-600'
                          : 'text-gray-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="group relative flex items-center space-x-3 text-sm font-medium text-red-600 py-2 px-4"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="group relative text-gray-700 text-sm font-medium py-2 px-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="group relative inline-block mt-2 mx-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px] text-center">
                      <span className="flex items-center justify-center space-x-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Sign Up</span>
                      </span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;