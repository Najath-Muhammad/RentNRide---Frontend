import React, { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { type LoginFormData } from '../../types/auth.types';
import { type AxiosError } from 'axios';
import { LoginApi } from '../../services/api/admin/login.api';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}



const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearch({ from: '/auth/admin-login' }) as { redirect?: string };

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    if (touched[name as keyof typeof touched]) {
      const newErrors = { ...errors };
      if (name === 'email') {
        const error = validateEmail(value);
        if (error) {
          newErrors.email = error;
        } else {
          delete newErrors.email;
        }
      } else if (name === 'password') {
        const error = validatePassword(value);
        if (error) {
          newErrors.password = error;
        } else {
          delete newErrors.password;
        }
      }
      setErrors(newErrors);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const newErrors = { ...errors };
    if (name === 'email') {
      const error = validateEmail(formData.email);
      if (error) {
        newErrors.email = error;
      } else {
        delete newErrors.email;
      }
    } else if (name === 'password') {
      const error = validatePassword(formData.password);
      if (error) {
        newErrors.password = error;
      } else {
        delete newErrors.password;
      }
    }
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const newErrors: FormErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await LoginApi.adminLogin(formData.email, formData.password);
        const responseData = response.data;

        if (responseData.success) {
          useAuthStore.getState().setUser(responseData.user);

          const redirectUrl = searchParams.redirect || '/admin/dashboard';
          window.location.href = redirectUrl;
        } else {
          if (responseData.error === 'You are not admin') {
            setErrors({ general: 'Access denied: You are not authorized as admin.' });
          } else if (responseData.error === 'Password is incorrect') {
            setErrors({ password: 'Incorrect password. Please try again.' });
          } else if (responseData.error === 'User not found') {
            setErrors({ email: 'No account found with this email address.' });
          } else {
            setErrors({ general: responseData.error || responseData.message || 'Login failed. Please try again.' });
          }
        }
      } catch (err) {
        const error = err as AxiosError<{ error: string, message: string }>;
        console.error('Login error:', error);
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.error === 'You are not admin') {
            setErrors({ general: 'Access denied: You are not authorized as admin.' });
          } else if (errorData.error === 'Password is incorrect') {
            setErrors({ password: 'Incorrect password. Please try again.' });
          } else if (errorData.error === 'User not found') {
            setErrors({ email: 'No account found with this email address.' });
          } else {
            setErrors({ general: errorData.error || errorData.message || 'Login failed. Please try again.' });
          }
        } else {
          setErrors({ general: 'Network error. Please check your connection and try again.' });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        padding: '20px 40px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#333'
      }}>
        rentNride
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          width: '100%',
          maxWidth: '480px'
        }}>
          <div style={{
            backgroundColor: '#f5e6d3',
            borderRadius: '8px',
            padding: '40px',
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '400px', height: 'auto' }}>
              <ellipse cx="300" cy="160" rx="80" ry="15" fill="#d4d4d4" opacity="0.3" />
              <rect x="220" y="90" width="160" height="70" rx="8" fill="#e8e8e8" stroke="#333" strokeWidth="3" />
              <path d="M 220 110 Q 240 85 280 85 L 320 85 Q 360 85 380 110" fill="none" stroke="#333" strokeWidth="3" />
              <path d="M 220 110 L 220 140 Q 220 160 240 160 L 360 160 Q 380 160 380 140 L 380 110" fill="#c8c8c8" stroke="#333" strokeWidth="3" />
              <rect x="250" y="105" width="35" height="30" rx="3" fill="#b8d4e8" stroke="#333" strokeWidth="2" />
              <rect x="315" y="105" width="35" height="30" rx="3" fill="#b8d4e8" stroke="#333" strokeWidth="2" />
              <circle cx="210" cy="145" r="20" fill="#555" stroke="#333" strokeWidth="3" />
              <circle cx="210" cy="145" r="12" fill="#888" />
              <circle cx="390" cy="145" r="20" fill="#555" stroke="#333" strokeWidth="3" />
              <circle cx="390" cy="145" r="12" fill="#888" />
              <rect x="195" y="120" width="10" height="6" rx="2" fill="#ff6b35" />
            </svg>
          </div>

          <h2 style={{
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '24px',
            fontWeight: '600',
            color: '#333'
          }}>
            Admin Login
          </h2>

          {}
          {errors.general && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #f5c6cb'
            }}>
              {errors.general}
            </div>
          )}

          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: `1px solid ${errors.email && touched.email ? '#dc3545' : '#ddd'}`,
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = '#2196F3';
                  }
                }}
                onBlurCapture={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = '#ddd';
                  }
                }}
              />
              {errors.email && touched.email && (
                <div style={{
                  color: '#dc3545',
                  fontSize: '12px',
                  marginTop: '6px'
                }}>
                  {errors.email}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}

                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: `1px solid ${errors.password && touched.password ? '#dc3545' : '#ddd'}`,
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!errors.password) {
                    e.target.style.borderColor = '#2196F3';
                  }
                }}
                onBlurCapture={(e) => {
                  if (!errors.password) {
                    e.target.style.borderColor = '#ddd';
                  }
                }}
              />
              {errors.password && touched.password && (
                <div style={{
                  color: '#dc3545',
                  fontSize: '12px',
                  marginTop: '6px'
                }}>
                  {errors.password}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: isLoading ? '#6c757d' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#1976D2';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#2196F3';
                }
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;