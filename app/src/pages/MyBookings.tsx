import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import Navigation from '../components/Navigation';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  CreditCard,
  Trash2,
  X,
  BookOpen,
  Clock,
  Sparkles,
  Shield,
  ChevronRight,
  Zap
} from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
type PaymentStatus = 'pending' | 'completed' | 'failed';
type SessionType = 'group' | 'one_on_one';
type Subject = 'Maths' | 'Physical Sciences';

interface Session {
  id: string;
  session_type: SessionType;
  subject: Subject;
  date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
  max_students: number;
  current_bookings: number;
  available: boolean;
}

interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  amount: number;
  student_notes?: string;
  session?: Session;
  payment?: {
    id: string;
    status: PaymentStatus;
  };
}

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('📋 Fetching user bookings...');
      
      const response = await api.get<Booking[]>('/bookings/my-bookings');
      
      console.log(`✅ Found ${response.data.length} bookings`);
      setBookings(response.data);
    } catch (error: any) {
      console.error('❌ Error fetching bookings:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else {
        setError('Failed to load bookings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?\n\nYou can delete it permanently after cancellation.')) return;

    try {
      setCancelling(bookingId);
      console.log(`❌ Cancelling booking: ${bookingId}`);
      
      await api.put(`/bookings/${bookingId}/cancel`);
      
      setSuccess('Booking cancelled successfully!');
      console.log('✅ Booking cancelled');
      
      setTimeout(() => {
        fetchBookings();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error cancelling booking:', error);
      setError(error.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('⚠️ PERMANENT DELETE ⚠️\n\nAre you sure you want to permanently delete this booking?\n\nThis action cannot be undone and will free up the session spot for others.')) return;

    try {
      setDeleting(bookingId);
      console.log(`🗑️ Deleting booking: ${bookingId}`);
      
      const response = await api.delete(`/bookings/${bookingId}`);
      
      setSuccess('Booking deleted permanently!');
      console.log('✅ Booking deleted:', response.data);
      
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      
      setTimeout(() => {
        fetchBookings();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error deleting booking:', error);
      setError(error.response?.data?.detail || 'Failed to delete booking');
    } finally {
      setDeleting(null);
    }
  };

  const handlePaymentClick = (bookingId: string) => {
    console.log(`💰 Navigating to payment page for booking: ${bookingId}`);
    navigate(`/payment/${bookingId}`);
  };

  const handleBookMoreClick = () => {
    navigate('/book');
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      confirmed: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-200/50',
      pending: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-700 border-yellow-200/50',
      cancelled: 'bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-700 border-red-200/50'
    };

    const icons = {
      confirmed: <CheckCircle className="h-3.5 w-3.5" />,
      pending: <AlertCircle className="h-3.5 w-3.5" />,
      cancelled: <XCircle className="h-3.5 w-3.5" />
    };

    return (
      <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${styles[status]}`}>
        {icons[status]}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getPaymentBadge = (status: PaymentStatus) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pendingPayment: bookings.filter(b => b.payment_status === 'pending').length
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
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  My Bookings
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  {user?.full_name} • Grade {user?.grade}
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

        {/* Success Message */}
        {success && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-md opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-green-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-green-700">{success}</p>
                </div>
                <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl blur-md opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-red-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, icon: Calendar, gradient: 'from-blue-500 to-indigo-500', bg: 'from-blue-50 to-indigo-50', text: 'text-blue-600' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, gradient: 'from-green-500 to-emerald-500', bg: 'from-green-50 to-emerald-50', text: 'text-green-600' },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, gradient: 'from-red-500 to-pink-500', bg: 'from-red-50 to-pink-50', text: 'text-red-600' },
            { label: 'Pending Payment', value: stats.pendingPayment, icon: CreditCard, gradient: 'from-yellow-500 to-amber-500', bg: 'from-yellow-50 to-amber-50', text: 'text-yellow-600' }
          ].map((stat, index) => (
            <div key={index} className="group relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-105">
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

        {bookings.length === 0 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-12 text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                <Calendar className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-6">Start your learning journey by booking your first class!</p>
              <button
                onClick={handleBookMoreClick}
                className="group relative inline-block perspective-1000"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                  Book Your First Class
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="group relative perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20 transform-gpu transition-all duration-500 group-hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine"></div>
                  
                  <div className="relative p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {booking.session?.subject}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                          booking.session?.session_type === 'group'
                            ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200/50'
                            : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200/50'
                        }`}>
                          {booking.session?.session_type === 'group' ? 'Group Class' : '1-on-1'}
                        </span>
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDate(booking.session?.date || '')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        {booking.session?.start_time} ({booking.session?.duration_minutes} mins)
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-sm text-gray-600 mr-2">Amount (Rands):</span>
                        <span className="text-xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                          {booking.amount}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.student_notes && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                        <p className="text-xs text-gray-500 mb-1">Your notes:</p>
                        <p className="text-sm text-gray-700 italic">"{booking.student_notes}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      {booking.status !== 'cancelled' && booking.payment_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handlePaymentClick(booking.id)}
                            className="group/btn relative w-full perspective-1000"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                            <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                              Complete Payment
                            </div>
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelling === booking.id}
                            className="group/btn relative w-full perspective-1000"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                            <div className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px] disabled:opacity-50">
                              {cancelling === booking.id ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Cancelling...</span>
                                </div>
                              ) : (
                                'Cancel Booking'
                              )}
                            </div>
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'cancelled' && (
                        <>
                          <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50/50 backdrop-blur-sm rounded-xl border border-red-200/50 text-center">
                            <p className="text-red-600 font-medium flex items-center justify-center">
                              <XCircle className="h-4 w-4 mr-2" />
                              Booking Cancelled
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            disabled={deleting === booking.id}
                            className="group/btn relative w-full perspective-1000"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                            <div className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px] disabled:opacity-50">
                              {deleting === booking.id ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Deleting...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Permanently
                                </div>
                              )}
                            </div>
                          </button>
                        </>
                      )}
                      
                      {booking.payment_status === 'completed' && booking.status === 'confirmed' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-2 text-green-600 bg-gradient-to-r from-green-50 to-emerald-50/50 backdrop-blur-sm p-3 rounded-xl border border-green-200/50">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Booking Confirmed!</span>
                          </div>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelling === booking.id}
                            className="group/btn relative w-full perspective-1000"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-xl blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity"></div>
                            <div className="relative bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-2 rounded-xl text-sm transform-gpu transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:translate-y-[-2px]">
                              {cancelling === booking.id ? 'Cancelling...' : 'Need to cancel?'}
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {bookings.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleBookMoreClick}
              className="group relative inline-block perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transform-gpu transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">
                + Book More Classes
              </div>
            </button>
          </div>
        )}
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
      `}</style>
    </div>
  );
};

export default MyBookings;