import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginForm>({ email: '', password: '' });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* 3D Floating Cards Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-32 h-32 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md perspective-1000">
        {/* 3D Flip Card Effect */}
        <div className="relative transform-style-3d animate-float-slow">
          {/* Main Card */}
          <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl overflow-hidden border border-white/20 transform-gpu hover:scale-105 transition-transform duration-500 hover:rotate-y-3">
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>

            {/* Content Container with 3D Depth */}
            <div className="relative p-8 backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/0">
              
              {/* Logo Section with 3D Effect */}
              <div className="text-center mb-8 transform-gpu hover:scale-105 transition-transform">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-full p-4 border border-white/30">
                    <Logo size="large" link={false} />
                  </div>
                </div>
              </div>

              {/* Title with 3D Text Effect */}
              <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-center text-white/70 mb-8">Access your learning journey</p>

              {/* Security Badge */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                <div className="px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-white/80">Secure Login</span>
                </div>
                <div className="px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-white/80">SSL Encrypted</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur"></div>
                  <div className="relative bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-200 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Email</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Password</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 text-white/40 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3D Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group perspective-1000"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl text-white font-semibold border border-white/20 shadow-xl">
                      <span>{loading ? 'Accessing...' : 'Access Dashboard'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </form>
              
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-white/70">
                  New to our platform?{' '}
                  <Link to="/signup" className="text-white font-semibold hover:text-blue-200 transition-colors relative group">
                    <span className="relative">
                      Create Account
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                </p>
              </div>

              {/* Demo Credentials with 3D Effect */}
            
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          50% { transform: translateY(-10px) rotateY(2deg); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-shine {
          animation: shine 6s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .hover\:rotate-y-3:hover {
          transform: rotateY(3deg);
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;