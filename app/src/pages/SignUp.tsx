import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Mail, Lock, User, Phone, GraduationCap, ArrowRight, Sparkles, Shield, CheckCircle } from 'lucide-react';

interface SignUpForm {
  email: string;
  password: string;
  full_name: string;
  grade: string;
  phone: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState<SignUpForm>({
    email: '',
    password: '',
    full_name: '',
    grade: '10',
    phone: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      // Calculate password strength
      let strength = 0;
      if (value.length >= 6) strength += 25;
      if (value.match(/[a-z]/)) strength += 25;
      if (value.match(/[A-Z]/)) strength += 25;
      if (value.match(/[0-9]/)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const signupData = {
      ...formData
    };

    const result = await signup(signupData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Sign up failed');
    }

    setLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
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
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-24 h-24 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
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
            <div className="relative p-8 backdrop-blur-sm bg-gradient-to-br from-white/5 to-white-0 max-h-[600px] overflow-y-auto custom-scrollbar">
              
              {/* Logo Section with 3D Effect */}
              <div className="text-center mb-6 transform-gpu hover:scale-105 transition-transform">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-full p-3 border border-white/30">
                    <Logo size="medium" link={false} />
                  </div>
                </div>
              </div>

              {/* Title with 3D Text Effect */}
              <h2 className="text-2xl font-bold text-center mb-1 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Join Our Community
              </h2>
              <p className="text-center text-white/70 text-sm mb-6">Start your learning journey today</p>

              {/* Security Badge */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="px-2 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-white/80">Secure Signup</span>
                </div>
                <div className="px-2 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-white/80">Free Account</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur"></div>
                  <div className="relative bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/80">Full Name</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/80">Email</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/80">Phone</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="0812345678"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/80">Grade</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <GraduationCap className="absolute left-3 h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                      <select
                        name="grade"
                        required
                        value={formData.grade}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
                      >
                        <option value="10" className="bg-purple-900">Grade 10</option>
                        <option value="11" className="bg-purple-900">Grade 11</option>
                        <option value="12" className="bg-purple-900">Grade 12</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/80">Password</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        minLength={6}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/50 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex space-x-1 h-1">
                        <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 25 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                        <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 50 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                        <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 75 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                        <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 100 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                      </div>
                      <p className="text-xs text-white/50">
                        {passwordStrength <= 25 && 'Weak password'}
                        {passwordStrength > 25 && passwordStrength <= 50 && 'Fair password'}
                        {passwordStrength > 50 && passwordStrength <= 75 && 'Good password'}
                        {passwordStrength > 75 && 'Strong password'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3D Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group perspective-1000 mt-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl text-white font-semibold border border-white/20 shadow-xl">
                      <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-white/70 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-white font-semibold hover:text-blue-200 transition-colors relative group">
                    <span className="relative">
                      Sign In
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                </p>
              </div>

              {/* Terms and Features */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center space-x-4 text-xs text-white/50">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>Free access</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
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
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
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
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SignUp;