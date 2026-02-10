import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CheckCircle, Mail, MessageSquare, Calendar, Clock, Users, BookOpen } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAuthHeader } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [classAccess, setClassAccess] = useState<any>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const bookingId = queryParams.get('booking_id');
    
    if (bookingId) {
      fetchBookingDetails(bookingId);
    } else {
      navigate('/dashboard');
    }
  }, [location]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}/access`, {
        headers: getAuthHeader()
      });
      
      setBookingDetails(response.data);
      setClassAccess(response.data.class_access);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Payment Successful! 🎉</h1>
          <p className="text-xl text-gray-600">
            Your booking has been confirmed. Class details have been sent to your email and WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Class Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Class Access Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Class Access</h2>
              
              {bookingDetails && (
                <div className="space-y-6">
                  {/* Class Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {bookingDetails.session.subject}
                        </h3>
                        <p className="text-gray-600">
                          {bookingDetails.session.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                        Confirmed
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-semibold">{bookingDetails.session.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-semibold">{bookingDetails.session.start_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-semibold">{bookingDetails.session.duration_minutes} mins</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-semibold">
                            {bookingDetails.session.session_type === 'group' ? 'Group' : 'Private'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Details */}
                  {classAccess?.has_access ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Join Your Class</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Meeting Link</p>
                          <a 
                            href={classAccess.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-semibold hover:text-blue-700 break-all"
                          >
                            {classAccess.meeting_link}
                          </a>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Meeting ID</p>
                            <p className="font-mono font-semibold">{classAccess.meeting_id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Passcode</p>
                            <p className="font-mono font-semibold">{classAccess.passcode}</p>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <span className="font-semibold">Important:</span> {classAccess.instructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Class Details Coming Soon</h3>
                      <p className="text-gray-600">{classAccess?.message}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Available from: {new Date(classAccess?.available_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Check Your Email</p>
                          <p className="text-sm text-gray-600">
                            Class details and receipt have been sent to your registered email.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">WhatsApp Notification</p>
                          <p className="text-sm text-gray-600">
                            You'll receive a WhatsApp message with class access details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/my-bookings"
                  className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-blue-700 transition"
                >
                  View All Bookings
                </Link>
                <Link
                  to="/book"
                  className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold text-center hover:from-purple-600 hover:to-purple-700 transition"
                >
                  Book Another Class
                </Link>
                <button
                  onClick={() => window.print()}
                  className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold text-center hover:bg-gray-200 transition"
                >
                  Print Receipt
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you didn't receive class details or have any questions:
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:support@tutorhub.com"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email Support</span>
                </a>
                <a
                  href="https://wa.me/27820000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </div>

            {/* Reminder */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📅 Set a Reminder</h3>
              <p className="text-sm text-gray-600 mb-4">
                Don't forget your class! Add it to your calendar:
              </p>
              <button
                onClick={() => {
                  if (bookingDetails) {
                    const eventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=TutorHub: ${bookingDetails.session.subject}&dates=20241215T090000/20241215T103000&details=Join link: ${classAccess?.meeting_link || 'Will be sent later'}&location=Online`;
                    window.open(eventUrl, '_blank');
                  }
                }}
                className="w-full bg-white border border-green-300 text-green-700 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                Add to Google Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;