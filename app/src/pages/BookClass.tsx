import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import Navigation from '../components/Navigation';
import { Calendar, Clock, Users, CreditCard, X, AlertCircle, Loader2 } from 'lucide-react';

// Type for a Session
interface Session {
  id: string;
  session_type: 'group' | 'one_on_one';
  subject: 'Maths' | 'Physical Sciences';
  date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
  max_students: number;
  current_bookings: number;
  available: boolean;
}

// EXACT MATCH for your server response
interface BookingResponse {
  success: boolean;
  message: string;
  booking_id: string;
  booking: {
    id: string;
    user_id: string;
    session_id: string;
    status: string;
    payment_status: string;
    amount: number;
    student_notes?: string;
    session?: Session;
  };
  payment: {
    payment_id: string;
    status: string;
  };
  redirect_to_payment: boolean;
  redirect_url: string;
}

const BookClass: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'group' | 'one_on_one'>('all');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'Maths' | 'Physical Sciences'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [booking, setBooking] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, selectedType, selectedSubject]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get<Session[]>('/sessions', {
        params: { available_only: true }
      });
      setSessions(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        setError('Failed to load sessions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;
    if (selectedType !== 'all') {
      filtered = filtered.filter(s => s.session_type === selectedType);
    }
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(s => s.subject === selectedSubject);
    }
    setFilteredSessions(filtered);
  };

  const handleBookClick = (session: Session) => {
    setSelectedSession(session);
    setShowModal(true);
    setStudentNotes('');
    setError(null);
    setBookingSuccess(false);
    setRetryCount(0);
  };

  const handleBookConfirm = async () => {
    if (!selectedSession) return;

    setBooking(true);
    setError(null);
    setBookingSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in to book a session.');
        setBooking(false);
        navigate('/login');
        return;
      }

      console.log('📝 Creating booking for session:', selectedSession.id);
      
      // ✅ EXACT MATCH for your server response
      const response = await api.post<BookingResponse>('/bookings', {
        session_id: selectedSession.id,
        student_notes: studentNotes || null,
      });

      const bookingData = response.data;
      const bookingId = bookingData.booking_id;
      
      console.log('✅ Booking created successfully:', bookingData);
      console.log('✅ Booking ID:', bookingId);
      console.log('🔄 Redirect to payment:', bookingData.redirect_to_payment);
      
      // Close the modal
      setShowModal(false);
      
      // Show success message
      setBookingSuccess(true);
      
      // Refresh sessions to update availability
      fetchSessions();
      
      // 🔥 CRITICAL: Redirect to payment page
      if (bookingData.redirect_to_payment) {
        console.log('💰 Redirecting to payment page...');
        setTimeout(() => {
          navigate(`/payment/${bookingId}`);
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('❌ Booking error:', error);
      
      // 🔥 Handle 400 - Already booked
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.detail || '';
        
        if (errorMessage.includes('already booked')) {
          setError('You have already booked this session. Redirecting to your bookings...');
          setTimeout(() => {
            setShowModal(false);
            navigate('/my-bookings');
          }, 2000);
        } else if (errorMessage.includes('fully booked')) {
          setError('This session is fully booked. Please select another time.');
          setTimeout(() => {
            setShowModal(false);
            fetchSessions(); // Refresh to update counts
          }, 3000);
        } else {
          setError(errorMessage || 'Booking failed. Please try again.');
        }
      }
      // 🔥 Handle 404 - Session not found
      else if (error.response?.status === 404) {
        setError('Session not found. It may have been removed.');
        setTimeout(() => {
          setShowModal(false);
          fetchSessions();
        }, 2000);
      }
      // 🔥 Handle 401 - Unauthorized
      else if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        navigate('/login');
      }
      // 🔥 Handle 500 - Server error
      else if (error.response?.status === 500) {
        setError('Server error. Please try again in a moment.');
        if (retryCount < 1) {
          setRetryCount(retryCount + 1);
          setTimeout(() => handleBookConfirm(), 2000);
        }
      }
      // 🔥 Handle network errors
      else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setError('Connection error. Please check your internet and try again.');
      }
      else {
        setError('Booking failed. Please try again.');
      }
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Class</h1>
        <p className="text-gray-600 mb-6">Choose from available sessions and book your spot</p>

        {/* Booking Success Message */}
        {bookingSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Booking created successfully! Redirecting to payment...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            {error.includes('Server error') && retryCount < 1 && (
              <button 
                onClick={() => {
                  setError(null);
                  handleBookConfirm();
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try Again →
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'group' | 'one_on_one')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="group">Group Classes (Sundays)</option>
                <option value="one_on_one">1-on-1 Sessions (Weekdays)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as 'all' | 'Maths' | 'Physical Sciences')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Subjects</option>
                <option value="Maths">Mathematics</option>
                <option value="Physical Sciences">Physical Sciences</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Sessions Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredSessions.length}</span> available session{filteredSessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Available Sessions</h3>
              <p className="text-gray-600 mb-4">
                {sessions.length === 0 
                  ? "No sessions have been created yet. Please check back later."
                  : "No sessions match your current filters. Try adjusting your search."}
              </p>
              {sessions.length === 0 && (
                <button
                  onClick={() => fetchSessions()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh Sessions
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        session.session_type === 'group'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {session.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="font-semibold text-gray-900 text-lg">{session.subject}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{session.duration_minutes} minutes</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="h-5 w-5" />
                        <div>
                          <p className="text-sm">Date</p>
                          <p className="font-medium">{formatDate(session.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-5 w-5" />
                        <div>
                          <p className="text-sm">Time</p>
                          <p className="font-medium">{session.start_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="h-5 w-5" />
                        <div>
                          <p className="text-sm">Availability</p>
                          <p className="font-medium">{session.current_bookings}/{session.max_students} spots filled</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-green-600">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <p className="text-sm">Price</p>
                          <p className="text-xl font-bold">R{session.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <button
                      onClick={() => handleBookClick(session)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                      disabled={session.current_bookings >= session.max_students || !session.available}
                    >
                      {session.current_bookings >= session.max_students 
                        ? 'Fully Booked'
                        : !session.available
                        ? 'Not Available'
                        : 'Book Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Booking</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold text-gray-900 text-lg">{selectedSession.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class Type</p>
                <p className="font-semibold text-gray-900">
                  {selectedSession.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(selectedSession.date)} at {selectedSession.start_time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">{selectedSession.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-green-600">R{selectedSession.price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Any specific topics you'd like to focus on?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                disabled={booking}
              >
                Cancel
              </button>
              <button
                onClick={handleBookConfirm}
                disabled={booking}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {booking ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Booking...
                  </>
                ) : (
                  'Confirm & Pay Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookClass;