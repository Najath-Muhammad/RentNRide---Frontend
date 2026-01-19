import React, { useState, useEffect } from 'react';
import { type AxiosError } from 'axios';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { AuthApi } from '../../services/api/auth/verify.otp.api';
import { useAuthStore } from '../../stores/authStore';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email;
  useEffect(() => {
    const storedExpiry = localStorage.getItem("otp_expiry");

    if (storedExpiry) {
      const remaining = Math.floor((+storedExpiry - Date.now()) / 1000);

      if (remaining > 0) {
        setResendTimer(remaining);
        return;
      }
    }
    const newExpiry = Date.now() + 30 * 1000;
    localStorage.setItem("otp_expiry", newExpiry.toString());
    setResendTimer(30);
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [resendTimer])

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    if (!email) {
      setError('Email not found. Please try signing up again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthApi.verifyOtp({
        otp: otp,
        email: email as string
      });

      if (response.success) {
        setSuccess(response.message);
        useAuthStore.getState().setUser(response.user);

        // if (response.data.user) {
        //   localStorage.setItem('user', JSON.stringify(response.data.user));
        //   localStorage.setItem('token', response.data.token); 
        // }

        setTimeout(() => {
          navigate({ to: "/" });
        }, 1000);
      }

    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('Verification failed:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message === 'Network Error') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setOtp('');
    setError('');
    setSuccess('');

    try {
      const response = await AuthApi.resendOtp({
        email: email as string
      });

      if (response.success) {
        setSuccess('New OTP sent to your email!');
        setResendTimer(30);
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('Resend OTP failed:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    }
  };

  const formatTime = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, '0')}`;
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
            <h2 className="text-center text-gray-700 text-lg mb-2">
              Enter OTP Sent To Your E-mail
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              {email || 'Your email'}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest font-semibold"
                  maxLength={6}
                  inputMode="numeric"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                )}
                {success && (
                  <p className="text-green-500 text-sm mt-2 text-center">{success}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isLoading}
                className="text-blue-600 text-sm hover:text-blue-800 transition disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendTimer > 0
                  ? `Resend OTP in ${formatTime(resendTimer)}`
                  : 'Resend OTP'
                }
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Check your email for the OTP code</p>
          </div>
        </div>
      </div>
    </div>
  );
}