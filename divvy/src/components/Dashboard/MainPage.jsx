import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const MainPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-[Outfit] font-bold text-[#101828] text-4xl mb-3">
            Welcome to Divvy, {user?.first_name || 'Friend'}! 👋
          </h1>
          <p className="font-[Outfit] text-[#4a5565] text-lg">
            Let's get started by creating your first group
          </p>
        </div>

        {/* Empty State Illustration */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="w-64 h-64 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-full flex items-center justify-center">
              <svg
                className="w-32 h-32 text-indigo-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/groups')}
            className="w-full max-w-md mx-auto h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-full font-[Outfit] font-semibold text-white text-base transition-colors shadow-lg shadow-emerald-500/30"
          >
            Create Your First Group
          </button>

          <p className="font-[Outfit] text-[#99a1af] text-sm">
            Split bills, track expenses, and settle up with friends
          </p>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🤖',
              title: 'AI-Powered Splits',
              description: 'Smart expense splitting based on fairness',
            },
            {
              icon: '💰',
              title: 'Track Expenses',
              description: 'Keep track of who paid and who owes',
            },
            {
              icon: '✅',
              title: 'Easy Settlement',
              description: 'Settle up with friends in a few taps',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 p-6 text-center"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-[Outfit] font-semibold text-[#101828] text-base mb-2">
                {feature.title}
              </h3>
              <p className="font-[Outfit] text-[#99a1af] text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
