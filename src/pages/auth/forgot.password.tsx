import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AuthApiForgot } from '../../services/api/auth/forgot.pass.api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return 'Please enter your email address';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const clearError = () => setError('');

  const handleSubmit = async () => {
    clearError();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedEmail = email.trim();

    setIsLoading(true);

    try {
      await AuthApiForgot.requestPasswordResetOTP({ email: trimmedEmail });

      // Success - navigate to OTP verification page
      navigate({
        to: '/auth/verify-otp-forgot',
        state: { email: trimmedEmail },
      });
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        ((err as Error).message === 'Network Error'
          ? 'Network error. Please check your connection.'
          : 'Failed to send OTP. Please try again.');

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  const goToLogin = () => {
    navigate({ to: '/auth/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">rentNride</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Visual Banner */}
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
              alt="Luxury car"
              className="w-full h-48 object-cover"
            />
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-center text-2xl font-semibold text-gray-800 mb-3">
              Forgot Password?
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">
              Enter your email and we'll send you an OTP to reset your password
            </p>

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !email.trim()}
                  className={`
                    w-full py-3 px-4 rounded-lg font-medium text-white transition-colors
                    ${isLoading || !email.trim()
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }
                  `}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>

                <button
                  onClick={goToLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={goToLogin}
              className="text-blue-600 hover:text-blue-800 font-medium ml-1"
            >
              Sign in
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;