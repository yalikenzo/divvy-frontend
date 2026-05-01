import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('Google did not return an authorization code');
      return;
    }

    let isMounted = true;

    const finalizeGoogleLogin = async () => {
      try {
        await completeGoogleLogin(code);
        if (isMounted) {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.data?.detail || err.message || 'Google login failed');
        }
      }
    };

    finalizeGoogleLogin();

    return () => {
      isMounted = false;
    };
  }, [searchParams, completeGoogleLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[480px] mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
        <h2 className="font-[Outfit] font-bold text-[#101828] text-2xl leading-8">
          Finishing Google sign in
        </h2>
        {!error && (
          <p className="font-[Outfit] text-[#4a5565] text-sm mt-2">
            Please wait...
          </p>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
