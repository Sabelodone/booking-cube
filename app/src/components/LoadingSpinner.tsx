import React from 'react';
import { BookOpen, Book, Sparkles, GraduationCap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  variant?: 'classic' | 'modern' | 'minimal';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Open your book...',
  variant = 'classic'
}) => {
  const sizes = {
    sm: {
      container: 'h-20 w-20',
      icon: 'h-6 w-6',
      text: 'text-sm',
      pages: 'h-16 w-16'
    },
    md: {
      container: 'h-28 w-28',
      icon: 'h-8 w-8',
      text: 'text-base',
      pages: 'h-24 w-24'
    },
    lg: {
      container: 'h-36 w-36',
      icon: 'h-10 w-10',
      text: 'text-lg',
      pages: 'h-32 w-32'
    },
    xl: {
      container: 'h-44 w-44',
      icon: 'h-12 w-12',
      text: 'text-xl',
      pages: 'h-40 w-40'
    }
  };

  const variants = {
    classic: {
      icon: BookOpen,
      cover: 'from-amber-600 to-amber-700',
      pages: 'bg-gradient-to-br from-amber-50 to-white',
      spine: 'bg-amber-800',
      accent: 'from-amber-400 to-amber-500',
      text: 'text-amber-700',
      shadow: 'shadow-amber-200/50',
      bookmark: 'from-red-500 to-red-600',
      gradient: 'from-amber-500/20 to-transparent'
    },
    modern: {
      icon: GraduationCap,
      cover: 'from-indigo-600 to-indigo-700',
      pages: 'bg-gradient-to-br from-indigo-50 to-white',
      spine: 'bg-indigo-800',
      accent: 'from-indigo-400 to-indigo-500',
      text: 'text-indigo-700',
      shadow: 'shadow-indigo-200/50',
      bookmark: 'from-purple-500 to-purple-600',
      gradient: 'from-indigo-500/20 to-transparent'
    },
    minimal: {
      icon: Sparkles,
      cover: 'from-gray-700 to-gray-800',
      pages: 'bg-gradient-to-br from-gray-50 to-white',
      spine: 'bg-gray-900',
      accent: 'from-gray-400 to-gray-500',
      text: 'text-gray-700',
      shadow: 'shadow-gray-200/50',
      bookmark: 'from-gray-500 to-gray-600',
      gradient: 'from-gray-500/10 to-transparent'
    }
  };

  const currentVariant = variants[variant];
  const currentSizes = sizes[size];
  const Icon = currentVariant.icon;

  // Generate floating particles
  const particles = [...Array(6)].map((_, i) => ({
    delay: i * 0.2,
    duration: 2 + (i * 0.2),
    x: (i % 2 === 0 ? -30 : 30) * (i + 1),
    y: -20 * (i + 1)
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br ${currentVariant.gradient} blur-3xl animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr ${currentVariant.gradient} blur-3xl animate-pulse delay-1000`} />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className={`absolute left-1/2 top-1/2 w-1 h-1 rounded-full ${currentVariant.accent} opacity-20`}
            style={{
              animation: `floatParticle ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>

      {/* Main book container */}
      <div className="relative perspective">
        {/* Outer glow ring */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${currentVariant.accent} opacity-20 blur-xl animate-pulse`} />
        
        {/* Inner glow */}
        <div className={`absolute inset-2 rounded-xl ${currentVariant.pages} opacity-60 blur-md`} />

        {/* Book */}
        <div 
          className={`
            relative ${currentSizes.container}
            rounded-2xl shadow-2xl ${currentVariant.shadow}
            transform-gpu transition-all duration-700
            hover:scale-105 hover:rotate-1
          `}
          style={{
            animation: 'bookFloat 4s ease-in-out infinite'
          }}
        >
          {/* Book cover with gradient */}
          <div className={`
            absolute inset-0 rounded-2xl
            bg-gradient-to-br ${currentVariant.cover}
            shadow-inner
          `}>
            {/* Embossed pattern */}
            <div className="absolute inset-4 border-2 border-white/10 rounded-xl" />
            <div className="absolute inset-6 border border-white/5 rounded-lg" />
          </div>

          {/* Book spine */}
          <div className={`
            absolute left-0 top-2 bottom-2 w-2
            ${currentVariant.spine} rounded-r-lg
            shadow-lg
          `}>
            {/* Spine decorative lines */}
            <div className="absolute inset-x-0 top-2 h-0.5 bg-white/20" />
            <div className="absolute inset-x-0 bottom-2 h-0.5 bg-white/20" />
          </div>

          {/* Animated pages */}
          <div className="absolute inset-y-4 right-4 left-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute inset-0 ${currentVariant.pages}
                  rounded-r-lg shadow-md
                  border-r-2 border-white/50
                `}
                style={{
                  transform: `translateX(${i * 2}px) rotateY(${i * -2}deg)`,
                  animation: `pageGlide ${3 + i * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  zIndex: 10 - i,
                  opacity: 1 - (i * 0.12),
                  background: `linear-gradient(135deg, 
                    ${i === 0 ? '#ffffff' : '#fefefe'} 0%, 
                    #fafafa 100%
                  )`
                }}
              />
            ))}
          </div>

          {/* Decorative bookmark ribbon */}
          <div className="absolute -top-1 -right-1">
            <div className={`
              relative w-6 h-12
              bg-gradient-to-b ${currentVariant.bookmark}
              rounded-sm transform rotate-12
              shadow-lg
            `}>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/30 rounded-full blur-sm" />
            </div>
          </div>

          {/* Icon overlay with glass effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Icon glow */}
              <div className={`absolute inset-0 bg-gradient-to-r ${currentVariant.accent} opacity-30 blur-xl animate-pulse`} />
              
              {/* Icon background */}
              <div className={`
                relative rounded-full p-3
                backdrop-blur-sm bg-white/30
                shadow-xl border border-white/50
              `}>
                <Icon className={`
                  ${currentSizes.icon} ${currentVariant.text}
                  filter drop-shadow-lg
                  animate-iconFloat
                `} />
              </div>
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-xl" />
        </div>
      </div>

      {/* Message with elegant typography */}
      {message && (
        <div className="mt-10 text-center space-y-2">
          <p className={`
            ${currentSizes.text} ${currentVariant.text}
            font-light tracking-[0.3em] uppercase
            relative inline-block
          `}>
            <span className="relative">
              {message}
              <span className={`
                absolute -bottom-3 left-0 right-0 h-[1px]
                bg-gradient-to-r from-transparent via-current to-transparent
                opacity-30
                animate-expandWidth
              `} />
            </span>
          </p>
          
          {/* Subtle page count indicator */}
          <div className="flex justify-center space-x-1.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${currentVariant.accent} opacity-40`}
                style={{
                  animation: 'pulseDot 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bookFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(0.5deg);
          }
          75% {
            transform: translateY(-4px) rotate(-0.5deg);
          }
        }

        @keyframes pageGlide {
          0%, 100% {
            transform: translateX(0px) rotateY(0deg);
          }
          25% {
            transform: translateX(6px) rotateY(-6deg);
          }
          50% {
            transform: translateX(10px) rotateY(-10deg);
          }
          75% {
            transform: translateX(4px) rotateY(-4deg);
          }
        }

        @keyframes iconFloat {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.05) rotate(2deg);
          }
          75% {
            transform: scale(0.98) rotate(-1deg);
          }
        }

        @keyframes expandWidth {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          50% {
            transform: scaleX(0.5);
            opacity: 0.5;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.3;
          }
        }

        @keyframes pulseDot {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
        }

        @keyframes floatParticle {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(calc(-50% + ${particles[0]?.x}px), calc(-50% + ${particles[0]?.y}px)) scale(2);
            opacity: 0.3;
          }
          100% {
            transform: translate(calc(-50% + ${particles[0]?.x * 2}px), calc(-50% + ${particles[0]?.y * 2}px)) scale(1);
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .perspective {
          perspective: 1500px;
          perspective-origin: 50% 50%;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;