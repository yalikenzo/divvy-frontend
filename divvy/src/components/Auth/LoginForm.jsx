import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../imgs/divvylogo.svg';

export const LoginForm = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, startGoogleLogin, isLoading, error } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState(null);
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const redirectTo = redirectParam || sessionStorage.getItem('post_login_redirect') || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.email || !formData.password) {
      setFormError('Email and password are required');
      return;
    }

    try {
      await login(formData.email, formData.password);
      sessionStorage.removeItem('post_login_redirect');

      if (onClose) {
        onClose();
      }
      navigate(redirectTo);
    } catch (err) {
      setFormError(err.data?.detail || err.message || 'Login failed');
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white rounded-2xl shadow-lg p-8">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src={logo} alt="Divvy Logo" className="w-[30px] h-[30px]" />
        </div>
      </div>

      {/* Title */}
      <h2 className="font-[Outfit] font-bold text-[#101828] text-2xl leading-8 text-center">
        Welcome back
      </h2>
      <p className="font-[Outfit] font-normal text-[#4a5565] text-sm leading-5 text-center mt-1 mb-6">
        Log in to continue splitting bills
      </p>

      {/* Error Message */}
      {(error || formError) && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error || formError}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full mb-5">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('post_login_redirect', redirectTo);
            startGoogleLogin();
          }}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-[Outfit] font-medium text-[#364153] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="flex items-center gap-3 w-full mb-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="font-[Outfit] text-[#99a1af] text-sm">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-[Outfit] font-medium text-[#364153] text-sm leading-5">
            Email address
          </label>
          <input
            type="email"
            name="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full h-11 px-4 rounded-xl border border-gray-200 font-[Outfit] text-[#364153] text-sm placeholder:text-[#99a1af] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-[Outfit] font-medium text-[#364153] text-sm leading-5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 font-[Outfit] text-[#364153] text-sm placeholder:text-[#99a1af] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] hover:text-[#364153] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-full font-[Outfit] font-semibold text-white text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {/* Register link */}
      <p className="font-[Outfit] text-[#4a5565] text-sm text-center mt-4">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-[Outfit] font-bold text-[#101828] hover:text-indigo-600 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};
