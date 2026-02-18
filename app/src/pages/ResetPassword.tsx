import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2, Sparkles, Shield, Eye, EyeOff } from 'lucide-react';
import api from '../utils/axiosConfig';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError('No reset token provided');
      setVerifying(false);
      return;
    }

    try {
      const response = await api.get(`/auth/verify-reset-token/${token}`);
      if (response.data.valid) {
        setTokenValid(true);
      } else {
        setError('This reset link has expired or is invalid. Please request a new one.');
      }
    } catch (err) {
      setError('Failed to verify reset token');
    } finally {
      setVerifying(false);
    }
  };

  const calculatePasswordStrength = (value: string) => {
    let strength = 0;
    if (value.length >= 6) strength += 25;
    if (value.match(/[a-z]/)) strength += 25;
    if (value.match(/[A-Z]/)) strength += 25;
    if (value.match(/[0-9]/)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    calculatePasswordStrength(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 50) {
      setError('Please choose a stronger password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: password
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-full p-8">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* 3D Floating Cards */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-24 h-24 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 animate-float"
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
        <div className="relative transform-style-3d animate-float-slow">
          <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl overflow-hidden border border-white/20 transform-gpu hover:scale-105 transition-transform duration-500 hover:rotate-y-3">
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>

            <div className="relative p-8 backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/0">
              
              {/* Back Button */}
              <Link
                to="/login"
                className="group absolute top-4 left-4 text-white/60 hover:text-white/90 transition-all duration-200 hover:-translate-x-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              {/* Logo */}
              <div className="text-center mb-6 transform-gpu hover:scale-105 transition-transform">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-full p-3 border border-white/30">
                    <Logo size="medium" link={false} />
                  </div>
                </div>
              </div>

              {!tokenValid ? (
                /* Invalid Token State */
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-2xl blur"></div>
                    <div className="relative bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
                      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Invalid Reset Link</h3>
                      <p className="text-sm text-white/70 mb-4">
                        {error || 'This password reset link has expired or is invalid.'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="relative inline-block w-full group perspective-1000"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                      <div className="relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl text-white font-semibold border border-white/20 shadow-xl">
                        Request New Link
                      </div>
                    </div>
                  </Link>
                </div>
              ) : success ? (
                /* Success State */
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl blur"></div>
                    <div className="relative bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
                      <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Password Reset!</h3>
                      <p className="text-sm text-white/70">
                        Your password has been successfully reset. Redirecting to login...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Reset Password Form */
                <>
                  <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Set New Password
                  </h2>
                  <p className="text-center text-white/70 text-sm mb-6">
                    Enter your new password below
                  </p>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className="px-2 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center space-x-1">
                      <Shield className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-white/80">Secure Reset</span>
                    </div>
                    <div className="px-2 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-white/80">New Password</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur"></div>
                      <div className="relative bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-white/80">New Password</label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={handlePasswordChange}
                            className="w-full pl-10 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 transition-colors"
                            placeholder="••••••••"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-white/40 hover:text-white/60 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Password Strength Meter */}
                      {password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex space-x-1 h-1">
                            <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 25 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                            <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 50 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                            <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 75 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                            <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 100 ? getPasswordStrengthColor() : 'bg-white/20'}`}></div>
                          </div>
                          <p className="text-xs text-white/50">
                            Password strength: <span className="text-white/80">{getPasswordStrengthText()}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-white/80">Confirm Password</label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 transition-colors"
                            placeholder="••••••••"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 text-white/40 hover:text-white/60 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full group perspective-1000 mt-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl text-white font-semibold border border-white/20 shadow-xl">
                          {loading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Resetting...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-5 w-5" />
                              <span>Reset Password</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </form>

                  {/* Password Requirements */}
                  <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <p className="text-xs text-white/70 mb-2">Password must contain:</p>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-green-400' : 'bg-white/30'}`}></div>
                        <span className={password.length >= 6 ? 'text-green-300' : 'text-white/50'}>At least 6 characters</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-400' : 'bg-white/30'}`}></div>
                        <span className={/[a-z]/.test(password) ? 'text-green-300' : 'text-white/50'}>One lowercase letter</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-400' : 'bg-white/30'}`}></div>
                        <span className={/[A-Z]/.test(password) ? 'text-green-300' : 'text-white/50'}>One uppercase letter</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-green-400' : 'bg-white/30'}`}></div>
                        <span className={/[0-9]/.test(password) ? 'text-green-300' : 'text-white/50'}>One number</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
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
      `}</style>
    </div>
  );
};

export default ResetPassword;