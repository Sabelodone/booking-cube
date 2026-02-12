import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig'; // ✅ Use centralized axios, not direct axios
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Lock,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface BookingData {
  id: string;
  amount: number;
  status: string;
  payment_status: string;
  session?: {
    subject: string;
    session_type: string;
    date: string;
    start_time: string;
  };
}

interface PaymentInitiationResponse {
  payment_id: string;
  payment_url: string;
  payment_data: Record<string, string>;
}

const PaymentPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('Booking ID is required');
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      console.log('📋 Fetching booking details for ID:', bookingId);
      
      // Check if we have a token
      if (!token) {
        setError('You need to be logged in to view this page');
        setLoading(false);
        return;
      }

      // ✅ API returns BookingData object DIRECTLY, not wrapped
      const response = await api.get<BookingData>(`/bookings/${bookingId}`);
      
      console.log('✅ Booking data received:', response.data);
      setBooking(response.data);
      
    } catch (error: any) {
      console.error('❌ Error fetching booking:', error);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else if (error.response?.status === 404) {
        setError('Booking not found. It may have been cancelled or does not exist.');
      } else {
        setError(error.response?.data?.detail || 'Failed to load booking details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      console.log('💰 Initiating payment for booking:', bookingId);
      
      // ✅ API returns PaymentInitiationResponse directly
      const response = await api.post<PaymentInitiationResponse>(
        `/payments/initiate/${bookingId}`,
        {},
        { timeout: 10000 }
      );
      
      console.log('✅ Payment initiation response:', response.data);
      
      if (!response.data.payment_url || !response.data.payment_data) {
        throw new Error('Invalid payment response from server');
      }
      
      // Create and submit form to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = response.data.payment_url;
      form.style.display = 'none';
      
      Object.entries(response.data.payment_data).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error('❌ Payment initiation error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Payment request timed out. Please try again.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else if (error.response?.status === 404) {
        setError('Booking not found. It may have been cancelled.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.detail || 'Payment already completed for this booking');
      } else {
        setError(error.response?.data?.detail || 'Failed to initiate payment. Please try again.');
      }
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    navigate('/my-bookings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Unable to Process Payment</h1>
            <p className="text-gray-600 mb-6">{error || 'Booking not found'}</p>
            <div className="space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Return to Bookings
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Bookings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
                <p className="text-blue-100">Secure payment via PayFast</p>
              </div>

              <div className="p-8">
                {/* Payment Security */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Secure Payment Gateway</h3>
                      <p className="text-blue-700">
                        Your payment is processed securely via PayFast with 256-bit SSL encryption. 
                        We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="flex items-center justify-between p-6 border-2 border-blue-300 rounded-xl bg-blue-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-lg">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Visa, MasterCard, American Express</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Secure</span>
                    </div>
                  </div>
                </div>

                {/* PayFast Branding */}
                <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg mb-8">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600">Powered by</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">PF</span>
                      </div>
                      <span className="font-bold text-orange-600 text-xl">PayFast</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || booking.payment_status === 'completed'}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : booking.payment_status === 'completed' ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      <span>Payment Already Completed</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-6 w-6" />
                      <span>Proceed to Secure Payment</span>
                    </>
                  )}
                </button>

                {/* Security Features */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-600">PCI DSS Compliant</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-600">256-bit SSL</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-gray-600">3D Secure</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-gray-600">Fraud Protection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h2>
              
              {/* Class Details */}
              <div className="space-y-4 mb-6">
                {booking.session && (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Subject</p>
                        <p className="font-semibold text-gray-900">{booking.session.subject}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">{booking.session.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-semibold text-gray-900">{booking.session.start_time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600">Session Type</p>
                        <p className="font-semibold text-gray-900">
                          {booking.session.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Class Fee</span>
                    <span className="font-semibold">R{booking.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Fee</span>
                    <span className="text-green-600">R0.00</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-3xl font-bold text-green-600">R{booking.amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className={`p-4 rounded-lg mb-4 ${
                booking.payment_status === 'completed' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {booking.payment_status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      booking.payment_status === 'completed' 
                        ? 'text-green-800' 
                        : 'text-yellow-800'
                    }`}>
                      {booking.payment_status === 'completed' 
                        ? 'Payment Complete ✓' 
                        : 'Payment Required'}
                    </p>
                    <p className={`text-xs ${
                      booking.payment_status === 'completed' 
                        ? 'text-green-700' 
                        : 'text-yellow-700'
                    }`}>
                      {booking.payment_status === 'completed' 
                        ? 'Class access will be granted 24 hours before the session.'
                        : 'Complete payment to confirm your booking. Class access granted immediately after payment.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Mode Info */}
              <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                <p className="text-sm font-medium text-gray-800 mb-2">💡 Test Mode Active</p>
                <p className="text-xs text-gray-600">
                  Use these test cards for sandbox testing:
                  <br />
                  • Visa: <code className="bg-gray-200 px-1 rounded">4000000000000002</code>
                  <br />
                  • MasterCard: <code className="bg-gray-200 px-1 rounded">5200000000000007</code>
                  <br />
                  Expiry: Any future date | CVV: 123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;