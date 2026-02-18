import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
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
  Loader2,
  Sparkles,
  Fingerprint,
  Globe,
  Zap,
  ShieldCheck,
  Wallet
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
      
      if (!token) {
        setError('You need to be logged in to view this page');
        setLoading(false);
        return;
      }

      // FIXED: Remove /api prefix (it's already in baseURL)
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
      
      // FIXED: Remove /api prefix (it's already in baseURL)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-8">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl mb-6">
                  <AlertCircle className="h-16 w-16 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  Unable to Process Payment
                </h1>
                <p className="text-gray-600 mb-8">{error || 'Booking not found'}</p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoBack}
                    className="w-full group relative inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></span>
                    <span className="relative">Return to Bookings</span>
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full px-6 py-3 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="group inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-all duration-200 hover:-translate-x-1"
        >
          <div className="relative">
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-sm font-medium">Back to Bookings</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                  <div className="relative flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Wallet className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
                      <p className="text-blue-100">Secure payment via PayFast</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Payment Security Banner */}
                  <div className="group relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-white/20">
                      <div className="flex items-start space-x-4">
                        <div className="shrink-0">
                          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg">
                            <Shield className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                            Bank-Grade Security
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            Your payment is protected with 256-bit SSL encryption and PCI DSS compliance. 
                            We never store your card details on our servers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                      Select Payment Method
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl group-hover:border-blue-300 transition-all duration-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Popular</span>
                          </div>
                          <p className="font-semibold text-gray-900">Credit / Debit Card</p>
                          <p className="text-sm text-gray-500 mt-1">Visa, Mastercard, Amex</p>
                        </div>
                      </div>

                      <div className="relative group cursor-not-allowed opacity-50">
                        <div className="relative p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-gray-200 rounded-lg">
                              <Zap className="h-6 w-6 text-gray-500" />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-1 rounded-full">Soon</span>
                          </div>
                          <p className="font-semibold text-gray-900">PayFast Wallet</p>
                          <p className="text-sm text-gray-500 mt-1">One-click payments</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PayFast Integration */}
                  <div className="mb-8">
                    <div className="relative flex items-center justify-center py-4">
                      <div className="border-t border-gray-300 flex-grow"></div>
                      <span className="shrink-0 mx-4 text-sm text-gray-500 font-medium">Powered by</span>
                      <div className="border-t border-gray-300 flex-grow"></div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
                        <span className="text-white font-bold text-xl">PF</span>
                      </div>
                      <span className="font-bold text-transparent bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-2xl">
                        PayFast
                      </span>
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Secure</span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={processing || booking.payment_status === 'completed'}
                    className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-[2px] hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative flex items-center justify-center px-8 py-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-bold text-lg group-hover:from-green-600 group-hover:to-emerald-700 transition-all duration-300">
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-3" />
                          <span>Processing Payment...</span>
                        </>
                      ) : booking.payment_status === 'completed' ? (
                        <>
                          <CheckCircle className="h-6 w-6 mr-3" />
                          <span>Payment Already Completed</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                          <span>Pay R{booking.amount} Securely</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Security Features Grid */}
                  <div className="mt-8 pt-8 border-t border-gray-200/60">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: ShieldCheck, text: 'PCI DSS', color: 'text-green-600' },
                        { icon: Lock, text: '256-bit SSL', color: 'text-blue-600' },
                        { icon: Fingerprint, text: '3D Secure', color: 'text-purple-600' },
                        { icon: Globe, text: 'Fraud Protection', color: 'text-red-600' },
                      ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className={`p-2 bg-gradient-to-br from-${item.color.split('-')[1]}-50 to-transparent rounded-lg`}>
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                  {/* Summary Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Sparkles className="h-5 w-5 text-yellow-400 mr-2" />
                      Order Summary
                    </h2>
                  </div>

                  <div className="p-6">
                    {/* Session Details */}
                    <div className="space-y-4 mb-6">
                      {booking.session && (
                        <>
                          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">Subject</p>
                              <p className="font-semibold text-gray-900">{booking.session.subject}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-purple-50 rounded-xl">
                              <Calendar className="h-4 w-4 text-purple-600 mb-2" />
                              <p className="text-xs text-gray-500 mb-1">Date</p>
                              <p className="font-semibold text-gray-900 text-sm">{booking.session.date}</p>
                            </div>
                            
                            <div className="p-3 bg-green-50 rounded-xl">
                              <Clock className="h-4 w-4 text-green-600 mb-2" />
                              <p className="text-xs text-gray-500 mb-1">Time</p>
                              <p className="font-semibold text-gray-900 text-sm">{booking.session.start_time}</p>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-yellow-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-yellow-600" />
                                <span className="text-xs text-gray-500">Session Type</span>
                              </div>
                              <span className="text-sm font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                {booking.session.session_type === 'group' ? 'Group Class' : '1-on-1 Session'}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t border-gray-200 pt-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold text-gray-900">R{booking.amount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Transaction Fee</span>
                          <span className="text-green-600 font-medium">Free</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Total</span>
                            <div className="text-right">
                              <span className="text-xs text-gray-500 line-through mr-2">R{booking.amount}</span>
                              <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                                R{booking.amount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className={`p-5 rounded-xl mb-4 ${
                      booking.payment_status === 'completed' 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                        : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          booking.payment_status === 'completed' 
                            ? 'bg-green-100' 
                            : 'bg-yellow-100'
                        }`}>
                          {booking.payment_status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold mb-1 ${
                            booking.payment_status === 'completed' 
                              ? 'text-green-800' 
                              : 'text-yellow-800'
                          }`}>
                            {booking.payment_status === 'completed' 
                              ? 'Payment Complete' 
                              : 'Payment Required'}
                          </p>
                          <p className={`text-xs ${
                            booking.payment_status === 'completed' 
                              ? 'text-green-700' 
                              : 'text-yellow-700'
                          }`}>
                            {booking.payment_status === 'completed' 
                              ? 'Class access will be granted 24 hours before the session.'
                              : 'Complete payment to confirm your booking.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;