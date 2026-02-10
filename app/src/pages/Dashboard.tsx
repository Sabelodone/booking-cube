// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig'; // Import centralized axios
import Navigation from '../components/Navigation';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Clock,
  CreditCard,
  DollarSign,
  AlertCircle,
  Loader2,
  XCircle
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
  const { user, logout } = useAuth();
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
      
      // Use the centralized axios instance (it automatically adds token)
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
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700'
    };

    const icons = {
      completed: <CheckCircle className="h-4 w-4" />,
      pending: <AlertCircle className="h-4 w-4" />,
      failed: <AlertCircle className="h-4 w-4" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.full_name}!</h1>
          <p className="text-gray-600">Grade {user?.grade} student</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.total_bookings ?? 0}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.confirmed_bookings ?? 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.cancelled_bookings ?? 0}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {upcomingBookings.filter(b => b.payment_status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/book"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Book a Class</h3>
                <p className="text-blue-100 text-sm">Choose from group or 1-on-1 sessions</p>
              </div>
            </div>
          </Link>

          <Link
            to="/my-bookings"
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">My Bookings</h3>
                <p className="text-purple-100 text-sm">View and manage your sessions</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
            <Link 
              to="/my-bookings"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.session.subject}</h3>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          booking.session.session_type === 'group'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {booking.session.session_type === 'group' ? 'Group Class' : '1-on-1'}
                        </span>
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {booking.session.date} at {booking.session.start_time}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">R{booking.amount}</span>
                      </div>
                    </div>
                    <div>
                      {booking.payment_status === 'pending' && (
                        <Link
                          to={`/payment/${booking.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Pay Now
                        </Link>
                      )}
                      {booking.payment_status === 'completed' && (
                        <span className="text-sm text-green-600 font-medium">Paid ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Sessions</h3>
              <p className="text-gray-600 mb-4">Book your first class to get started!</p>
              <Link
                to="/book"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Book a Class
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;