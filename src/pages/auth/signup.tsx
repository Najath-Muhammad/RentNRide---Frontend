import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { type AxiosError } from "axios";
import { AuthApi } from '../../services/api/auth/signup.api';
import { useAuthStore } from '../../stores/authStore';
import type { SignupFormState } from '../../types/auth.types';


const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const strengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const strengthColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60", "#2c3e50"];
const nameRegex = /^[A-Za-z\s]*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPasswordScore(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const handleEmailSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      newErrors.push("All fields are required");
    } else if (formData.name.trim().length > 20) {
      newErrors.push("Name can have maximum 20 letters");
    } else if (!nameRegex.test(formData.name)) {
      newErrors.push("Name must only contain letters");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.push("Please enter a valid email");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.push("Passwords do not match");
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.push("Password must have at least one letter and one number");
    } else if (passwordScore < 3) {
      newErrors.push("Password is too weak");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await AuthApi.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (res.success) {
        navigate({ to: "/auth/verify-otp", state: { email: formData.email } });
      }
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      setErrors([err.response?.data?.message || "Signup failed. Please try again."]);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse?.credential) return;

    setGoogleLoading(true);
    setErrors([]);

    try {
      const res = await AuthApi.googleLogin({
        credential: credentialResponse.credential
      });

      if (res.success) {
        navigate({ to: "/" });
        useAuthStore.getState().setUser(res.data.user)
      }
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      setErrors([err.response?.data?.message || "Google signup failed. Try again."]);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-normal text-black">rentNride</h1>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg w-full max-w-2xl p-8 shadow-lg">
          <div className="mb-8">
            <img src="/assets/signUp.jpeg" alt="Vintage Car" className="w-full rounded-lg object-cover h-52" />
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              {errors.map((err, i) => (
                <p key={i} className="text-red-600 text-sm">{err}</p>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter your name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <>
                  <div className="mt-2 h-2 rounded bg-gray-200 overflow-hidden">
                    <div
                      style={{
                        width: `${(passwordScore / 5) * 100}%`,
                        backgroundColor: strengthColors[passwordScore],
                        height: "100%",
                        transition: "all 0.3s ease"
                      }}
                    />
                  </div>
                  <p className="text-sm mt-1" style={{ color: strengthColors[passwordScore] }}>
                    {strengthLabels[passwordScore]}
                  </p>
                </>
              )}
            </div>

            {/* Confirm Password Field with Eye Toggle */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
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
              </div>
            </div>

            <button
              onClick={handleEmailSignup}
              disabled={googleLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-70 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              Sign Up
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrors(["Google Sign-Up failed"])}
                useOneTap={false}
                size="large"
                theme="outline"
                text="signup_with"
                width="100%"
                logo_alignment="left"
              />
            </div>

            {googleLoading && (
              <p className="text-center text-sm text-gray-600">Signing you up with Google...</p>
            )}
          </div>

          <p className="text-center text-gray-600 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}