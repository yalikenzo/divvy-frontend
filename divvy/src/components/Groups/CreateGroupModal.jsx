import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { groupApi } from '../../api/groupApi';
import { CreateGroupPayload, CURRENCIES } from '../../types/group';
import { Button, Input } from '../ui/FormComponents';

export const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = new CreateGroupPayload(groupName.trim(), currency);
      const newGroup = await groupApi.createGroup(payload);

      onGroupCreated?.(newGroup);
      onClose();
    } catch (err) {
      setError(err.data?.detail || err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#00000066] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-0 rounded-t-2xl overflow-hidden">
          <h2 className="font-[Outfit] font-semibold text-[#1e1b4b] text-2xl">
            Create New Group
          </h2>
          <button
            ref={firstFocusRef}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#99a1af] hover:bg-gray-100 transition-colors text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pt-6 pb-8 flex flex-col gap-5">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Group Name */}
          <div className="flex flex-col gap-2">
            <label className="font-[Outfit] font-medium text-[#1e1b4b] text-sm">
              Group Name
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="E.g. City Trip, Roommates, Dinner Party"
              disabled={isLoading}
              className="h-[50px] px-4 rounded-[10px] border border-[#d1d5dc] text-base bg-white disabled:bg-gray-100"
            />
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-2">
            <label className="font-[Outfit] font-medium text-[#1e1b4b] text-sm">
              Currency
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCurrencyDrop((v) => !v)}
                disabled={isLoading}
                className="w-full h-[50px] px-4 rounded-[10px] border border-[#d1d5dc] bg-white flex items-center justify-between text-base hover:border-indigo-300 transition-colors focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <span className="text-[#1e1b4b]">
                  {CURRENCIES.find((c) => c.code === currency)?.name || currency}
                </span>
                <svg
                  className={`w-4 h-4 text-[#99a1af] transition-transform ${
                    showCurrencyDrop ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showCurrencyDrop && !isLoading && (
                <div className="absolute top-[54px] left-0 right-0 bg-white border border-[#d1d5dc] rounded-[10px] shadow-lg z-[300] max-h-[240px] overflow-y-auto">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        setCurrency(curr.code);
                        setShowCurrencyDrop(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 transition-colors ${
                        currency === curr.code
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-[#364153]'
                      }`}
                    >
                      {curr.symbol} {curr.name} ({curr.code})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <p className="font-[Outfit] text-[#4a5565] text-xs">
              💡 You can add participants and invite friends after creating the group
            </p>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || isLoading}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px] font-bold text-white text-base transition-colors mt-1"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </div>
  );
};
