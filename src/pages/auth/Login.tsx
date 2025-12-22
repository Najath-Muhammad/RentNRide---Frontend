import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { GoogleLogin } from '@react-oauth/google'; 
import { api } from '../../utils/axios';
import { APIAuthRoutes } from '../../constants/route.constant';
import { useAuthStore } from '../../stores/authStore';

interface FormErrors {
  email: string;
  password: string;
  general: string;
}

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false); // New state
  const [errors, setErrors] = useState<FormErrors>({ email: '', password: '', general: '' });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailBlur = (): void => {
    if (!email) setErrors(prev => ({ ...prev, email: 'Email is required' }));
    else if (!validateEmail(email)) setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
    else setErrors(prev => ({ ...prev, email: '' }));
  };

  const handlePasswordBlur = (): void => {
    if (!password) setErrors(prev => ({ ...prev, password: 'Password is required' }));
    else if (password.length < 6) setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
    else setErrors(prev => ({ ...prev, password: '' }));
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });

    let valid = true;
    if (!email || !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      valid = false;
    }
    if (!password || password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    try {
      const res = await api.post(APIAuthRoutes.LOGIN, { email, password }, { withCredentials: true });
      if (res.data.success) {
        setErrors(prev => ({ ...prev, general: 'Login successful! Redirecting...' }));
        setTimeout(() => navigate({ to: '/' }), 1000);
        useAuthStore.getState().setUser(res.data.user);
      } else {
        const errorMessage = res.data.message || 'Invalid email or password.';
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setErrors(prev => ({ ...prev, general: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;

    setGoogleLoading(true);
    setErrors({ email: '', password: '', general: '' });

    try {
      const res = await api.post(APIAuthRoutes.GOOGLE, {
        credential: credentialResponse.credential
      }, { withCredentials: true });

      if (res.data.success) {
        setErrors(prev => ({ ...prev, general: 'Google login successful! Redirecting...' }));
        setTimeout(() => navigate({ to: '/' }), 1000);
        useAuthStore.getState().setUser(res.data.user)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Google login failed. Try again.';
      setErrors(prev => ({ ...prev, general: msg }));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-normal text-black">rentNride</h1>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 pt-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
          <div className="w-full h-32 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
              alt="Luxury car"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Welcome Back</h2>
            
            {errors.general && (
              <div className={`mb-4 p-3 rounded-md text-center text-sm ${
                errors.general.includes('successful') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                  onBlur={handleEmailBlur}
                  disabled={isLoading || googleLoading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">Warning: {errors.email}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: '' })); }}
                  onBlur={handlePasswordBlur}
                  disabled={isLoading || googleLoading}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || googleLoading}
                  className="absolute inset-y-0 right-0 top-8 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.974 9.974 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
                {errors.password && <p className="mt-1 text-xs text-red-500">Warning: {errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || googleLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrors(prev => ({ ...prev, general: 'Google login failed' }))}
                useOneTap={false}
                size="large"
                theme="outline"
                text="continue_with"
                width="100%"
                logo_alignment="left"
              />
            </div>

            {googleLoading && (
              <p className="text-center text-sm text-gray-600 mt-3">Signing in with Google...</p>
            )}

            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              <div>
                Don't have an account?{' '}
                <Link to='/auth/signup' className="text-blue-500 hover:underline font-medium">
                  Sign up
                </Link>
              </div>
              <div>
                <Link to="/auth/forgot-password" className="text-blue-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}