import React, { useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { AuthApi } from '../../services/api/auth/confirm.pass.api';

interface LocationState {
  email?: string;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state as LocationState) || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation rules
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Must contain at least one number';
    return null;
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    clearMessages();

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!email) {
      setError('Email information is missing. Please try the reset process again.');
      return;
    }

    setIsLoading(true);

    try {
      await AuthApi.resetPassword({
        email,
        new_password: newPassword,
      });

      setSuccess('Password reset successful! Redirecting to login...');

      setTimeout(() => {
        navigate({ to: '/auth/login' });
      }, 2200);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || ((err as Error).message === 'Network Error' ? 'Network error. Please check your connection.' : '')
        || 'Failed to reset password. Please try again.';

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">rentNride</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Visual Header */}
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
              alt="Luxury car background"
              className="w-full h-48 object-cover"
            />
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-center text-2xl font-semibold text-gray-800 mb-2">
              Reset Your Password
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">
              Please enter your new password below
            </p>

            {/* New Password */}
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearMessages();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearMessages();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Feedback Messages */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm text-center">
                {success}
              </div>
            )}

            {/* Password Requirements */}
            <div className="mb-6 text-xs text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>At least 1 uppercase letter</li>
                <li>At least 1 lowercase letter</li>
                <li>At least 1 number</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !newPassword || !confirmPassword}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-white
                transition-colors duration-200
                ${isLoading || !newPassword || !confirmPassword
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
              `}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => navigate({ to: '/auth/login' })}
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

export default ResetPassword;