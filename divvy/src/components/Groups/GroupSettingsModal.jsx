import React, { useState, useEffect, useRef } from 'react';
import { groupApi } from '../../api/groupApi';
import { UpdateGroupPayload, InviteUserPayload, CURRENCIES } from '../../types/group';
import { Button, Input, Label } from '../Ui/FormComponents';

export const GroupSettingsModal = ({ group, onClose, onGroupUpdated }) => {
    const [groupName, setGroupName] = useState(group?.name || group?.title || '');
    const [currency, setCurrency] = useState(group?.currency || 'USD');
    const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);

    const [inviteEmail, setInviteEmail] = useState('');

    const [isUpdating, setIsUpdating] = useState(false);
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    const [updateError, setUpdateError] = useState(null);
    const [inviteError, setInviteError] = useState(null);

    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);

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

    const handleUpdateGroup = async () => {
        if (!groupName.trim()) {
            setUpdateError('Group name cannot be empty');
            return;
        }

        setIsUpdating(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            const payload = new UpdateGroupPayload(groupName.trim(), currency);
            const updatedGroup = await groupApi.updateGroup(group.id, payload);

            setUpdateSuccess(true);
            onGroupUpdated?.(updatedGroup);

            setTimeout(() => setUpdateSuccess(false), 2000);
        } catch (err) {
            setUpdateError(err?.data?.detail || err.message || 'Failed to update group');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) {
            setInviteError('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            setInviteError('Invalid email format');
            return;
        }

        setIsSendingInvite(true);
        setInviteError(null);
        setInviteSuccess(false);

        try {
            const payload = new InviteUserPayload(inviteEmail.trim(), group.id);
            await groupApi.inviteByEmail(payload);

            setInviteSuccess(true);
            setInviteEmail('');

            setTimeout(() => setInviteSuccess(false), 3000);
        } catch (err) {
            setInviteError(err?.data?.detail || err.message || 'Failed to send invite');
        } finally {
            setIsSendingInvite(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-[520px] bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Group Settings
                    </h2>
                    <button
                        ref={firstFocusRef}
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-6 flex flex-col gap-6">
                    {/* Update section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-medium text-gray-900">Group Info</h3>

                        {updateError && (
                            <div className="text-sm text-red-600">{updateError}</div>
                        )}

                        {updateSuccess && (
                            <div className="text-sm text-green-600">
                                Group updated successfully
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Label>Group Name</Label>
                            <Input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                disabled={isUpdating}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Currency</Label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCurrencyDrop((v) => !v)}
                                    className="w-full border rounded px-4 py-3 flex justify-between"
                                >
                                    {CURRENCIES.find((c) => c.code === currency)?.name || currency}
                                </button>

                                {showCurrencyDrop && (
                                    <div className="absolute w-full bg-white border mt-1 rounded shadow max-h-60 overflow-auto z-50">
                                        {CURRENCIES.map((c) => (
                                            <button
                                                key={c.code}
                                                onClick={() => {
                                                    setCurrency(c.code);
                                                    setShowCurrencyDrop(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                            >
                                                {c.symbol} {c.name} ({c.code})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleUpdateGroup}
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'Updating...' : 'Save Changes'}
                        </Button>
                    </div>

                    <div className="border-t" />

                    {/* Invite section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-medium text-gray-900">Invite Members</h3>

                        {inviteError && (
                            <div className="text-sm text-red-600">{inviteError}</div>
                        )}

                        {inviteSuccess && (
                            <div className="text-sm text-green-600">
                                Invitation sent
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => {
                                    setInviteEmail(e.target.value);
                                    setInviteError(null);
                                }}
                                placeholder="email@example.com"
                                disabled={isSendingInvite}
                            />
                            <Button
                                onClick={handleSendInvite}
                                disabled={isSendingInvite}
                            >
                                {isSendingInvite ? 'Sending...' : 'Invite'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
