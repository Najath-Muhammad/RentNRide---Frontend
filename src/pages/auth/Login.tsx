import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import { AuthApi } from '../../services/api/auth/login.api'
import { useAuthStore } from '../../stores/authStore';
import type { AxiosError } from 'axios';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validation helpers
  const validateEmail = (value: string): string | undefined => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email';
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
        general: undefined,
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await AuthApi.loginWithEmail({ email, password });

      if (response.success) {
        console.log('this is working')
        useAuthStore.getState().setUser(response.data.user);
        setErrors({ general: 'Login successful! Redirecting...' });
        setTimeout(() => navigate({ to: '/' }), 1200);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    setGoogleLoading(true);
    setErrors({});

    try {
      const response = await AuthApi.loginWithGoogle({
        credential: credentialResponse.credential,
      });

      if (response.success) {
        useAuthStore.getState().setUser(response.data.user);
        setErrors({ general: 'Google login successful! Redirecting...' });
        setTimeout(() => navigate({ to: '/' }), 1200);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const msg = error.response?.data?.message || 'Google login failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">rentNride</h1>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4 pt-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="h-32 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
              alt="Luxury car"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Welcome Back
            </h2>

            {/* General message (success/error) */}
            {errors.general && (
              <div
                className={`mb-6 p-4 rounded-lg text-center text-sm font-medium border ${errors.general.includes('successful')
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                  }`}
              >
                {errors.general}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
                  disabled={isLoading || googleLoading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.email
                      ? 'border-red-500 bg-red-50 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                    }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
                    disabled={isLoading || googleLoading}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.password
                        ? 'border-red-500 bg-red-50 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || googleLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || googleLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${isLoading || googleLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300" />
              <span className="text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrors({ general: 'Google login failed' })}
                useOneTap={false}
                size="large"
                theme="outline"
                text="continue_with"
                width="100%"
                logo_alignment="left"
              />
            </div>

            {googleLoading && (
              <p className="text-center text-sm text-gray-600 mt-4">
                Signing in with Google...
              </p>
            )}

            {/* Links */}
            <div className="mt-8 text-center text-sm text-gray-600 space-y-3">
              <div>
                Don't have an account?{' '}
                <Link
                  to="/auth/signup"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up
                </Link>
              </div>
              <div>
                <Link
                  to="/auth/forgot-password"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;