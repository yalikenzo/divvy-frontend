import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../divvylogo.svg';

export const RegisterForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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
    setSuccessMessage(null);

    // Валидация
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setFormError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      setSuccessMessage('Account created! Please check your email to verify your account.');

      // Перенаправляем на страницу верификации через 2 секунды
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
        navigate('/verify-email');
      }, 2000);
    } catch (err) {
      setFormError(err.data?.detail || err.message || 'Registration failed');
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
        Create your account
      </h2>
      <p className="font-[Outfit] font-normal text-[#4a5565] text-sm leading-5 text-center mt-1 mb-6">
        Start splitting bills fairly with AI
      </p>

      {/* Error/Success Messages */}
      {(error || formError) && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error || formError}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-[Outfit] font-medium text-[#364153] text-sm leading-5">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            placeholder="e.g. John"
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full h-11 px-4 rounded-xl border border-gray-200 font-[Outfit] text-[#364153] text-sm placeholder:text-[#99a1af] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-[Outfit] font-medium text-[#364153] text-sm leading-5">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            placeholder="e.g. Doe"
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full h-11 px-4 rounded-xl border border-gray-200 font-[Outfit] text-[#364153] text-sm placeholder:text-[#99a1af] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-100"
          />
        </div>

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
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
              minLength="6"
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
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      {/* Login link */}
      <p className="font-[Outfit] text-[#4a5565] text-sm text-center mt-4">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-[Outfit] font-bold text-[#101828] hover:text-indigo-600 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
};
