import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { 
  User, Mail, Phone, GraduationCap, Shield, BookOpen, 
  Calendar, Award, Settings, MessageSquare, CheckCircle,
  TrendingUp, Clock, XCircle, ChevronRight, Loader2,
  Sparkles, Zap, Star, Target, Globe, Fingerprint
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  upcoming_sessions: number;
}

interface SubjectStats {
  maths: number;
  physicalSciences: number;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/dashboard/stats');
      setStats(statsResponse.data);
      
      const bookingsResponse = await api.get('/bookings/my-bookings');
      const bookings = bookingsResponse.data;
      
      const mathsCount = bookings.filter((b: any) => 
        b.session?.subject === 'Maths' && b.status !== 'cancelled'
      ).length;
      
      const physicalSciencesCount = bookings.filter((b: any) => 
        b.session?.subject === 'Physical Sciences' && b.status !== 'cancelled'
      ).length;
      
      setSubjectStats({
        maths: mathsCount,
        physicalSciences: physicalSciencesCount
      });
      
      const recent = bookings
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setRecentActivity(recent);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats && stats.total_bookings > 0 
    ? Math.round((stats.confirmed_bookings / stats.total_bookings) * 100)
    : 0;

  const totalLearningHours = stats ? Math.round(stats.confirmed_bookings * 1.5) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-8">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navigation />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Page Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  My Profile
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  Account is verified • Member since {user?.created_at ? formatDate(user.created_at) : 'Recently'}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>

                {/* Profile Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                  <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                        <User className="h-20 w-20" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                          Active
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <h2 className="text-3xl font-bold mb-2">{user?.full_name}</h2>
                        <span className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/30">
                          <GraduationCap className="h-4 w-4 mr-1.5" />
                          Grade {user?.grade}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium flex items-center border border-white/30">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {stats?.total_bookings || 0} Bookings
                        </span>
                        <span className="text-blue-100/90 flex items-center">
                          <Clock className="h-4 w-4 mr-1.5" />
                          {totalLearningHours}h learned
                        </span>
                        <span className="text-blue-100/90 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1.5" />
                          {completionRate}% completion
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="relative p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></div>
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: Mail, label: 'Email Address', value: user?.email, color: 'blue', gradient: 'from-blue-50 to-indigo-50' },
                      { icon: Phone, label: 'Phone Number', value: user?.phone, color: 'green', gradient: 'from-green-50 to-emerald-50' },
                      { icon: GraduationCap, label: 'Current Grade', value: `Grade ${user?.grade}`, color: 'purple', gradient: 'from-purple-50 to-pink-50' },
                      { icon: Shield, label: 'Account Status', value: 'Verified', color: 'orange', gradient: 'from-orange-50 to-amber-50' }
                    ].map((item, index) => (
                      <div key={index} className={`p-6 bg-gradient-to-br ${item.gradient} backdrop-blur-sm rounded-2xl border border-${item.color}-200/50 transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                        <div className="flex items-center space-x-4">
                          <div className={`bg-white p-3 rounded-xl shadow-sm border border-${item.color}-200`}>
                            <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-${item.color}-900 mb-1`}>
                              {item.label}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-semibold text-gray-900 truncate">
                                {item.value}
                              </p>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Dashboard */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Learning Dashboard
                      </h3>
                      <p className="text-gray-600 mt-1">Track your progress and achievements</p>
                    </div>
                    <Link 
                      to="/my-bookings"
                      className="group/link inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span className="text-sm font-medium">View Details</span>
                      <ChevronRight className="h-4 w-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { icon: BookOpen, label: 'Total Bookings', value: stats?.total_bookings || 0, color: 'blue' },
                      { icon: CheckCircle, label: 'Confirmed', value: stats?.confirmed_bookings || 0, color: 'green' },
                      { icon: Calendar, label: 'Upcoming', value: stats?.upcoming_sessions || 0, color: 'purple' },
                      { icon: Award, label: 'Completion', value: `${completionRate}%`, color: 'amber' },
                      { icon: XCircle, label: 'Cancelled', value: stats?.cancelled_bookings || 0, color: 'red' },
                      { icon: Clock, label: 'Hours', value: `${totalLearningHours}h`, color: 'indigo' }
                    ].map((stat, index) => (
                      <div key={index} className="p-5 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 text-center transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-${stat.color}-50 mb-4 border border-${stat.color}-200`}>
                          <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="group relative perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                  
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50 transform-gpu transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg ${
                                activity.status === 'confirmed' ? 'bg-green-100' :
                                activity.status === 'cancelled' ? 'bg-red-100' :
                                'bg-yellow-100'
                              }`}>
                                {activity.status === 'confirmed' ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : activity.status === 'cancelled' ? (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{activity.session?.subject}</p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                                activity.status === 'confirmed' ? 'bg-green-100/50 text-green-700 border-green-200' :
                                activity.status === 'cancelled' ? 'bg-red-100/50 text-red-700 border-red-200' :
                                'bg-yellow-100/50 text-yellow-700 border-yellow-200'
                              }`}>
                                {activity.status}
                              </span>
                              <p className="text-sm font-semibold text-gray-900 mt-1">R{activity.amount}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                    Quick Actions
                  </h3>
                  <div className="space-y-4">
                    <Link
                      to="/book"
                      className="group/action block p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50 hover:border-blue-300 transition-all duration-300 transform-gpu hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-lg group-hover/action:bg-blue-200 transition-colors">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">Book New Session</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-blue-400 group-hover/action:text-blue-600 transition-transform group-hover/action:translate-x-1" />
                      </div>
                    </Link>
                    
                    <Link
                      to="/my-bookings"
                      className="group/action block p-4 bg-gradient-to-r from-purple-50 to-pink-50/50 backdrop-blur-sm rounded-xl border border-purple-200/50 hover:border-purple-300 transition-all duration-300 transform-gpu hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 p-3 rounded-lg group-hover/action:bg-purple-200 transition-colors">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-gray-900">My Bookings</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-purple-400 group-hover/action:text-purple-600 transition-transform group-hover/action:translate-x-1" />
                      </div>
                    </Link>
                    
                    <button
                      onClick={() => alert('Settings feature coming soon!')}
                      className="group/action w-full text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-gray-300 transition-all duration-300 transform-gpu hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gray-100 p-3 rounded-lg group-hover/action:bg-gray-200 transition-colors">
                            <Settings className="h-5 w-5 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-900">Account Settings</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover/action:text-gray-600 transition-transform group-hover/action:translate-x-1" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Progress */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
                    Subject Progress
                  </h3>
                  <div className="space-y-6">
                    <div className="group/subject p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50 hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Mathematics</p>
                            <p className="text-sm text-gray-600">Grades 10-12</p>
                          </div>
                        </div>
                        <span className="bg-blue-100/80 backdrop-blur-sm text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-200">
                          {subjectStats?.maths || 0} sessions
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {subjectStats?.maths ? Math.round((subjectStats.maths / (stats?.total_bookings || 1)) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${subjectStats?.maths ? Math.round((subjectStats.maths / (stats?.total_bookings || 1)) * 100) : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="group/subject p-4 bg-gradient-to-r from-purple-50 to-pink-50/50 backdrop-blur-sm rounded-xl border border-purple-200/50 hover:border-purple-300 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Physical Sciences</p>
                            <p className="text-sm text-gray-600">Grades 10-12</p>
                          </div>
                        </div>
                        <span className="bg-purple-100/80 backdrop-blur-sm text-purple-700 text-sm font-medium px-3 py-1.5 rounded-full border border-purple-200">
                          {subjectStats?.physicalSciences || 0} sessions
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {subjectStats?.physicalSciences ? Math.round((subjectStats.physicalSciences / (stats?.total_bookings || 1)) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${subjectStats?.physicalSciences ? Math.round((subjectStats.physicalSciences / (stats?.total_bookings || 1)) * 100) : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-blue-200/50 p-8 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg">
                      <MessageSquare className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-900">Need Help?</h3>
                      <p className="text-blue-800/70 text-sm">24/7 Support Available</p>
                    </div>
                  </div>
                  
                  <p className="text-blue-900/80 mb-8 leading-relaxed">
                    Our dedicated support team is always ready to assist you with any questions about your learning journey.
                  </p>
                  
                  <div className="space-y-4">
                    <a
                      href="mailto:support@tutorhub.com"
                      className="group/btn block w-full relative perspective-1000"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3.5 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                        Contact Support
                      </div>
                    </a>
                    <button
                      onClick={logout}
                      className="group/btn w-full relative perspective-1000"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white text-center py-3.5 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px] flex items-center justify-center">
                        <svg 
                          className="h-5 w-5 mr-2" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout Account
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        .animate-shine {
          animation: shine 6s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default Profile;