import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import Navigation from '../components/Navigation';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Clock,
  CreditCard,
  AlertCircle,
  Loader2,
  XCircle,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Shield,
  Zap
} from 'lucide-react';

interface Stats {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  upcoming_sessions: number;
}

interface Session {
  id: string;
  subject: string;
  session_type: 'group' | 'one_on_one';
  date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
}

interface Booking {
  id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed';
  amount: number;
  session: Session;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      const [statsRes, bookingsRes] = await Promise.all([
        api.get<Stats>('/dashboard/stats'),
        api.get<Booking[]>('/bookings/my-bookings'),
      ]);

      console.log('✅ Dashboard data fetched successfully');
      
      setStats(statsRes.data);
      const confirmedBookings = bookingsRes.data.filter((b) => 
        b.status === 'confirmed'
      ).slice(0, 3);
      setUpcomingBookings(confirmedBookings);
      setError(null);
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPaymentBadge = (status: 'pending' | 'completed' | 'failed') => {
    const styles = {
      completed: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-200/50',
      pending: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-700 border-yellow-200/50',
      failed: 'bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-700 border-red-200/50'
    };

    const icons = {
      completed: <CheckCircle className="h-3.5 w-3.5" />,
      pending: <AlertCircle className="h-3.5 w-3.5" />,
      failed: <XCircle className="h-3.5 w-3.5" />
    };

    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${styles[status]}`}>
        {icons[status]}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

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

        {/* Error Message */}
        {error && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl blur-md opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-red-200/50">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  Welcome back, {user?.full_name}!
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  Grade {user?.grade} student • Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: 'Total Bookings', 
              value: stats?.total_bookings ?? 0, 
              icon: Calendar, 
              gradient: 'from-blue-500 to-indigo-500',
              bg: 'from-blue-50 to-indigo-50',
              text: 'text-blue-600'
            },
            { 
              label: 'Confirmed', 
              value: stats?.confirmed_bookings ?? 0, 
              icon: CheckCircle, 
              gradient: 'from-green-500 to-emerald-500',
              bg: 'from-green-50 to-emerald-50',
              text: 'text-green-600'
            },
            { 
              label: 'Cancelled', 
              value: stats?.cancelled_bookings ?? 0, 
              icon: XCircle, 
              gradient: 'from-red-500 to-pink-500',
              bg: 'from-red-50 to-pink-50',
              text: 'text-red-600'
            },
            { 
              label: 'Pending Payments', 
              value: upcomingBookings.filter(b => b.payment_status === 'pending').length, 
              icon: CreditCard, 
              gradient: 'from-yellow-500 to-amber-500',
              bg: 'from-yellow-50 to-amber-50',
              text: 'text-yellow-600'
            }
          ].map((stat, index) => (
            <div key={index} className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.bg} border border-white/50`}>
                      <stat.icon className={`h-6 w-6 ${stat.text}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/book"
            className="group relative perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-[2px] transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Book a Class</h3>
                    <p className="text-blue-100 text-sm">Choose from group or 1-on-1 sessions</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/70 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/my-bookings"
            className="group relative perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-[2px] transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">My Bookings</h3>
                    <p className="text-purple-100 text-sm">View and manage your sessions</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/70 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Sessions */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            
            <div className="relative p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Upcoming Sessions
                </h2>
                <Link 
                  to="/my-bookings"
                  className="group inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span className="text-sm font-medium">View All</span>
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="group relative perspective-1000"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 transform-gpu transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.session.subject}</h3>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                                booking.session.session_type === 'group'
                                  ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200/50'
                                  : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200/50'
                              }`}>
                                {booking.session.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                              </span>
                              {getPaymentBadge(booking.payment_status)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5" />
                                {booking.session.date}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1.5" />
                                {booking.session.start_time}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600 mb-1">Amount (Rands)</p>
                              <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                                {booking.amount}
                              </p>
                            </div>
                            {booking.payment_status === 'pending' && (
                              <Link
                                to={`/payment/${booking.id}`}
                                className="group/btn relative perspective-1000"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                                  Pay Now
                                </div>
                              </Link>
                            )}
                            {booking.payment_status === 'completed' && (
                              <div className="flex items-center space-x-2 text-green-600 bg-green-50/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-200/50">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Paid</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Sessions</h3>
                  <p className="text-gray-600 mb-6">Book your first class to get started!</p>
                  <Link
                    to="/book"
                    className="group relative inline-block perspective-1000"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                      Book a Class
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;