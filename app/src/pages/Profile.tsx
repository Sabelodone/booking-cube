import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig'; // Import centralized axios
import { 
  User, Mail, Phone, GraduationCap, Shield, BookOpen, 
  Calendar, Award, Settings, MessageSquare, CheckCircle,
  TrendingUp, Clock, XCircle, ChevronRight, Loader2
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
      
      // Fetch dashboard stats
      const statsResponse = await api.get('/dashboard/stats');
      setStats(statsResponse.data);
      
      // Fetch user bookings to calculate subject stats
      const bookingsResponse = await api.get('/bookings/my-bookings');
      const bookings = bookingsResponse.data;
      
      // Calculate subject statistics
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
      
      // Get recent activity (last 5 bookings)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate completion rate (confirmed / total * 100)
  const completionRate = stats && stats.total_bookings > 0 
    ? Math.round((stats.confirmed_bookings / stats.total_bookings) * 100)
    : 0;

  // Calculate learning hours (assuming 1.5 hours per session)
  const totalLearningHours = stats ? Math.round(stats.confirmed_bookings * 1.5) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Account is verified • Member since {user?.created_at ? formatDate(user.created_at) : 'Recently'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl">
                      <User className="h-20 w-20" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                        Active Student
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                      <h2 className="text-3xl font-bold mb-2">{user?.full_name}</h2>
                      <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                        <GraduationCap className="h-4 w-4 mr-1.5" />
                        Grade {user?.grade}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {stats?.total_bookings || 0} Total Bookings
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
              <div className="p-6 md:p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-1 h-6 bg-indigo-500 rounded-full mr-3" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl p-6 border border-blue-100/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Email Address
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            {user?.email}
                          </p>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50/50 to-green-100/30 rounded-xl p-6 border border-green-100/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-green-100">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Phone Number
                        </p>
                        <p className="text-lg font-semibold text-gray-900 truncate">
                          {user?.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 rounded-xl p-6 border border-purple-100/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100">
                        <GraduationCap className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-900 mb-1">
                          Current Grade
                        </p>
                        <p className="text-lg font-semibold text-gray-900 truncate">
                          Grade {user?.grade}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-xl p-6 border border-orange-100/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                        <Shield className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orange-900 mb-1">
                          Account Status
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            Verified
                          </p>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Progress - REAL DATA */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Learning Dashboard</h3>
                  <p className="text-gray-600 mt-1">Track your progress and achievements</p>
                </div>
                <Link 
                  to="/my-bookings"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center group"
                >
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-blue-50 mb-4">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {stats?.total_bookings || 0}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Total Bookings</p>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-green-50 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {stats?.confirmed_bookings || 0}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Confirmed</p>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-purple-50 mb-4">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {stats?.upcoming_sessions || 0}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Upcoming</p>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-amber-50 mb-4">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {completionRate}
                    <span className="text-gray-600 text-lg">%</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Completion</p>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-red-50 mb-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {stats?.cancelled_bookings || 0}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Cancelled</p>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-indigo-50 mb-4">
                    <Clock className="h-6 w-6 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {totalLearningHours}
                    <span className="text-gray-600 text-lg">h</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Learning Hours</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
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
                          <p className="font-medium text-gray-900">{activity.session?.subject}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activity.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          activity.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {activity.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">R{activity.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
                Quick Actions
              </h3>
              <div className="space-y-4">
                <Link
                  to="/book"
                  className="group block p-4 bg-gradient-to-r from-blue-50/50 to-blue-100/20 rounded-xl border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">Book New Session</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
                
                <Link
                  to="/my-bookings"
                  className="group block p-4 bg-gradient-to-r from-purple-50/50 to-purple-100/20 rounded-xl border border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">My Bookings</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
                
                <button
                  onClick={() => alert('Settings feature coming soon!')}
                  className="group w-full text-left p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/20 rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">Account Settings</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </div>
            </div>

            {/* Subject Progress */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                Subject Progress
              </h3>
              <div className="space-y-6">
                <div className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
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
                    <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
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
                
                <div className="group p-4 bg-gradient-to-r from-purple-50 to-purple-100/30 rounded-xl border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
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
                    <span className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full">
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

            {/* Support Card */}
            <div className="bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-2xl border border-blue-200/50 p-8 backdrop-blur-sm">
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
                  className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Contact Support
                </a>
                <button
                  onClick={logout}
                  className="group w-full bg-white border-2 border-red-200 text-red-600 text-center py-3.5 rounded-xl font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-300 flex items-center justify-center"
                >
                  <svg 
                    className="h-5 w-5 mr-2 group-hover:animate-pulse" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;