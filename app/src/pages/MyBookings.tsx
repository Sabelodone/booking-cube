import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate
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
  X
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
  const navigate = useNavigate(); // ✅ Initialize navigate

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
      
      // ✅ API returns Booking[] array directly
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
      
      // Refresh after 1 second to show updated status
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
      
      // Remove from local state immediately
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      
      // Refresh after 2 seconds to get updated counts
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

  // ✅ NEW: Handle payment navigation with React Router
  const handlePaymentClick = (bookingId: string) => {
    console.log(`💰 Navigating to payment page for booking: ${bookingId}`);
    navigate(`/payment/${bookingId}`);
  };

  // ✅ NEW: Handle book more classes navigation
  const handleBookMoreClick = () => {
    navigate('/book');
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700'
    };

    const icons = {
      confirmed: <CheckCircle className="h-4 w-4" />,
      pending: <AlertCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700'
    };

    const icons = {
      completed: <CheckCircle className="h-4 w-4" />,
      pending: <AlertCircle className="h-4 w-4" />,
      failed: <XCircle className="h-4 w-4" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
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

  // Calculate statistics
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pendingPayment: bookings.filter(b => b.payment_status === 'pending').length
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">
            {user?.full_name} • Grade {user?.grade}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-700">{success}</p>
              </div>
              <button onClick={() => setSuccess(null)}>
                <X className="h-4 w-4 text-green-500" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)}>
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.confirmed}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.cancelled}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Payment</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pendingPayment}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 mb-6">Start your learning journey by booking your first class!</p>
            <button
              onClick={handleBookMoreClick}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Book Your First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition duration-300 border border-gray-100">
                <div className="space-y-5">
                  {/* Subject and Type */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{booking.session?.subject}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        booking.session?.session_type === 'group'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {booking.session?.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                      </span>
                      {getStatusBadge(booking.status)}
                      {getPaymentBadge(booking.payment_status)}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Calendar className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">
                          {formatDate(booking.session?.date || '')} at {booking.session?.start_time}
                        </p>
                        {booking.session?.duration_minutes && (
                          <p className="text-sm text-gray-500 mt-1">
                            {booking.session.duration_minutes} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center space-x-3 text-green-600">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-xl font-bold">R{booking.amount}</p>
                    </div>
                  </div>

                  {/* Student Notes (if any) */}
                  {booking.student_notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Your Notes:</p>
                      <p className="text-sm text-gray-800 italic">"{booking.student_notes}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-5 border-t border-gray-200">
                    {booking.status !== 'cancelled' && booking.payment_status === 'pending' && (
                      <div className="space-y-3">
                        {/* ✅ FIXED: Use button with onClick instead of a tag */}
                        <button
                          onClick={() => handlePaymentClick(booking.id)}
                          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                          Complete Payment Now
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelling === booking.id}
                          className="w-full border-2 border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 transition disabled:opacity-50 font-medium"
                        >
                          {cancelling === booking.id ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Cancelling...</span>
                            </div>
                          ) : (
                            'Cancel Booking'
                          )}
                        </button>
                      </div>
                    )}
                    
                    {booking.status === 'cancelled' && (
                      <div className="space-y-3">
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-red-600 font-medium flex items-center justify-center">
                            <XCircle className="h-5 w-5 mr-2" />
                            Booking Cancelled
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            This booking has been cancelled
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          disabled={deleting === booking.id}
                          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium flex items-center justify-center"
                        >
                          {deleting === booking.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Permanently
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {booking.payment_status === 'completed' && booking.status === 'confirmed' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Booking Confirmed!</span>
                        </div>
                        <div className="text-sm text-gray-600 text-center">
                          <p>✅ Payment completed</p>
                          <p>✅ Session confirmed</p>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelling === booking.id}
                            className="mt-2 text-red-600 text-sm hover:text-red-700 disabled:opacity-50"
                          >
                            {cancelling === booking.id ? 'Cancelling...' : 'Need to cancel?'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {booking.payment_status === 'failed' && (
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-red-600 font-medium">Payment Failed</p>
                        <div className="space-y-2 mt-2">
                          {/* ✅ FIXED: Use button with onClick instead of a tag */}
                          <button
                            onClick={() => handlePaymentClick(booking.id)}
                            className="inline-block w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            Retry Payment
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelling === booking.id}
                            className="w-full border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition text-sm disabled:opacity-50"
                          >
                            {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* ✅ ADDED: Book More Classes Button */}
        {bookings.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleBookMoreClick}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Book More Classes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;