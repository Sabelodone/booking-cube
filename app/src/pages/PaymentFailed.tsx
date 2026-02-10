import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, RefreshCw, CreditCard, ArrowLeft } from 'lucide-react';

const PaymentFailed: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            We couldn't process your payment. Please try again or use a different payment method.
          </p>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-red-700">
              <span className="font-semibold">Possible reasons:</span>
            </p>
            <ul className="text-sm text-red-600 mt-2 space-y-1">
              <li>• Insufficient funds in your account</li>
              <li>• Card declined by your bank</li>
              <li>• Incorrect card details entered</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Payment Again</span>
            </button>

            <Link
              to="/my-bookings"
              className="block w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Bookings</span>
            </Link>

            <button
              onClick={() => {
                // Implement alternative payment method
                alert('Alternative payment methods coming soon!');
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-5 w-5" />
              <span>Try Different Payment Method</span>
            </button>
          </div>

          {/* Support Section */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-gray-600 mb-3">Need help with your payment?</p>
            <div className="flex justify-center space-x-4">
              <a
                href="mailto:support@tutorhub.com"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Contact Support
              </a>
              <a
                href="tel:0800123456"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Call: 0800 123 456
              </a>
            </div>
          </div>

          {/* Security Assurance */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Your security is important to us:</span> All payments are processed through PayFast's secure PCI-compliant platform. No card details are stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;