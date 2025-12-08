import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { api } from '../../utils/axios';
import { APIAuthRoutes } from '../../constants/route.constant';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(APIAuthRoutes.FORGOT_PASSWORD, {
        email: email
      });

      if (response.data.success) {
        navigate({
          to: "/auth/verify-otp-forgot",
          state: { email: email}
        });
      }
      
    } catch (error: any) {
      console.error('Request failed:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message === 'Network Error') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && email && !isLoading) {
      handleSubmit();
    }
  };

  const handleBackToLogin = () => {
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">rentNride</h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="bg-gradient-to-b from-gray-200 to-gray-100 rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
                alt="Luxury Car"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-center text-gray-700 text-2xl font-semibold mb-2">
              Forgot Password?
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Enter your email address and we'll send you an OTP to reset your password
            </p>

            <div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !email}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>

              <button
                onClick={handleBackToLogin}
                disabled={isLoading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Login
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Remember your password? 
              <button 
                onClick={handleBackToLogin}
                className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}