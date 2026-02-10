import React from 'react';
import { Link } from 'react-router-dom';
import cubeLogo from '../assets/cube.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'navigation' | 'hero' | 'cta' | 'footer';
  link?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  link = true, 
  className = '' 
}) => {
  const sizes = {
    // Navigation sizes
    small: 'h-12 w-12', // For Navigation component
    navigation: 'h-36 w-36', // For main navigation (matches LandingPage)
    
    // Content sizes
    medium: 'h-36 w-36', // Default medium
    large: 'h-48 w-48', // For hero/dashboard sections
    hero: 'h-48 w-48', // For hero section in LandingPage
    
    // Special sizes
    xlarge: 'h-64 w-64',
    cta: 'h-24 w-24', // For CTA buttons in LandingPage
    footer: 'h-32 w-32' // For footer in LandingPage
  };

  // Map size prop to actual size class
  const getSizeClass = () => {
    switch (size) {
      case 'navigation':
        return 'h-36 w-36'; // Matches LandingPage navigation
      case 'hero':
        return 'h-48 w-48'; // Matches LandingPage hero section
      case 'cta':
        return 'h-24 w-24'; // Matches LandingPage CTA button
      case 'footer':
        return 'h-32 w-32'; // Matches LandingPage footer
      default:
        return sizes[size] || sizes.medium;
    }
  };

  const logo = (
    <div className={`group relative ${className}`}>
      <img 
        src={cubeLogo} 
        alt="Logo" 
        className={`${getSizeClass()} object-contain transform group-hover:rotate-12 transition-transform duration-300`}
      />
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );

  if (link) {
    return (
      <Link to="/" className="inline-block">
        {logo}
      </Link>
    );
  }

  return logo;
};

export default Logo;