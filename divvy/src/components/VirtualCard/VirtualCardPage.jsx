import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { virtualCardApi } from "../../api/virtualCardApi";
import { Sidebar } from "../Groups/CreatingNewGroup";
import { MobileBrandAndLogout } from "../MobileBrandAndLogout";

const SUPPORTED_CURRENCIES = ["USD", "EUR", "KZT", "JPY", "CNY", "RUB"];

const getCurrencySymbol = (currency) => {
    const map = { USD: "$", EUR: "€", JPY: "¥", KZT: "₸", RUB: "₽", INR: "₹" };
    return map[currency?.toUpperCase()] || "$";
};

const formatCardNumber = (num) => {
    if (!num || num.length < 16) return "•••• •••• •••• ••••";
    return `${num.slice(0, 4)} ${num.slice(4, 8)} ${num.slice(8, 12)} ${num.slice(12, 16)}`;
};

const SkeletonCard = () => (
    <div className="relative w-full max-w-md mx-auto aspect-[1.586] rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse shadow-lg" />
);

export const VirtualCardPage = ({ user, groups = [], onNavChange }) => {
    const navigate = useNavigate();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);

    const [depositOpen, setDepositOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositCurrency, setDepositCurrency] = useState("USD");
    const [depositing, setDepositing] = useState(false);

    const [convertOpen, setConvertOpen] = useState(false);
    const [convertAmount, setConvertAmount] = useState("");
    const [convertFrom, setConvertFrom] = useState("USD");
    const [convertTo, setConvertTo] = useState("EUR");
    const [converting, setConverting] = useState(false);

    const fetchCard = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await virtualCardApi.getVirtualCard();
            setCard(data);
        } catch (err) {
            if (err?.status === 404) {
                setCard(null);
            } else {
                setError("Failed to load card");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCard();
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        setError("");
        try {
            const data = await virtualCardApi.createVirtualCard();
            setCard(data);
        } catch (err) {
            setError(err?.message || "Failed to create card");
        } finally {
            setCreating(false);
        }
    };

    const handleDeposit = async () => {
        const amount = Number(depositAmount);
        if (!amount || amount <= 0) {
            setError("Enter a valid amount");
            return;
        }
        setDepositing(true);
        setError("");
        try {
            const updated = await virtualCardApi.deposit(card.id, {
                amount,
                currency: depositCurrency,
            });
            setCard(updated);
            setDepositOpen(false);
            setDepositAmount("");
        } catch (err) {
            setError(err?.message || "Deposit failed");
        } finally {
            setDepositing(false);
        }
    };

    const handleConvert = async () => {
        const amount = Number(convertAmount);
        if (!amount || amount <= 0) {
            setError("Enter a valid amount");
            return;
        }
        if (convertFrom === convertTo) {
            setError("Select different currencies");
            return;
        }
        setConverting(true);
        setError("");
        try {
            const updated = await virtualCardApi.convert(card.id, {
                amount,
                currency_from: convertFrom,
                currency_to: convertTo,
            });
            setCard(updated);
            setConvertOpen(false);
            setConvertAmount("");
            window.location.reload();
        } catch (err) {
            setError(err?.message || "Conversion failed");
        } finally {
            setConverting(false);
        }
    };

    const availableBalanceCurrencies = (card?.balances || []).map((b) => b.currency);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
            <div className="hidden lg:block">
                <Sidebar
                    activeNav="virtual-card"
                    onNavChange={(page) => {
                        if (page === "virtual-card") return;
                        onNavChange?.(page);
                    }}
                    groupCount={groups.length}
                    user={user}
                />
            </div>

            <main className="flex-1 overflow-y-auto">
                <MobileBrandAndLogout />
                <div className="mx-auto w-full max-w-2xl px-4 sm:px-8 py-6 sm:py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1 text-gray-500 hover:text-[#101828] transition-colors text-sm"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-[#101828]">Virtual Card</h1>
                        <div className="w-16" />
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            <SkeletonCard />
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
                        </div>
                    ) : !card ? (
                        /* No card state */
                        <div className="flex flex-col items-center gap-6 py-12">
                            <div className="w-full max-w-md aspect-[1.586] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3">
                                <span className="text-4xl">💳</span>
                                <p className="text-sm text-gray-400 font-medium">No virtual card yet</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating}
                                className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                            >
                                {creating ? "Creating…" : "Create Virtual Card"}
                            </button>
                        </div>
                    ) : (
                        /* Card exists */
                        <div className="flex flex-col gap-5">
                            {/* Card visual */}
                            <div className="relative w-full max-w-md mx-auto aspect-[1.586] rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 p-6 shadow-xl flex flex-col justify-between text-white overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
                                <div className="relative z-10 flex items-start justify-between">
                                    <span className="text-xs font-medium tracking-widest opacity-80">VIRTUAL CARD</span>
                                    <span className="text-lg font-bold">💳</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xl sm:text-2xl font-mono tracking-wider mb-4">
                                        {formatCardNumber(card.card_number)}
                                    </p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] opacity-60 uppercase tracking-wider mb-0.5">Card Holder</p>
                                            <p className="text-sm font-medium truncate max-w-[180px]">{user?.name || "User"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] opacity-60 uppercase tracking-wider mb-0.5">Expires</p>
                                            <p className="text-sm font-medium">12/28</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balances */}
                            <div className="rounded-[14px] bg-white p-5 shadow-[0px_1px_3px_#0000000a]">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-[#101828]">Balances</h2>
                                    <span className="text-xs text-gray-400">{card.balances?.length || 0} currencies</span>
                                </div>
                                <div className="space-y-2">
                                    {(card.balances || []).map((bal) => (
                                        <div
                                            key={bal.currency}
                                            className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                    {bal.currency?.[0]}
                                                </div>
                                                <span className="text-sm font-medium text-[#101828]">{bal.currency}</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#101828]">
                        {getCurrencySymbol(bal.currency)}
                                                {Number(bal.balance || 0).toFixed(2)}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDepositOpen(true)}
                                    className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                                >
                                    Deposit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConvertOpen(true)}
                                    disabled={availableBalanceCurrencies.length < 2}
                                    className="h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                                >
                                    Convert
                                </button>
                            </div>

                            {/* Deposit Modal */}
                            {depositOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                                        <h3 className="text-lg font-bold text-[#101828] mb-4">Deposit Funds</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6a7282] mb-1">
                                                    Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={depositAmount}
                                                    onChange={(e) => setDepositAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-[#101828] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6a7282] mb-1">
                                                    Currency
                                                </label>
                                                <select
                                                    value={depositCurrency}
                                                    onChange={(e) => setDepositCurrency(e.target.value)}
                                                    className="h-11 w-full rounded-lg border border-gray-200 px-3 bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                >
                                                    {SUPPORTED_CURRENCIES.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-5">
                                            <button
                                                type="button"
                                                onClick={() => setDepositOpen(false)}
                                                className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-[#101828] transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeposit}
                                                disabled={depositing}
                                                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                                            >
                                                {depositing ? "Processing…" : "Deposit"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Convert Modal */}
                            {convertOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                                        <h3 className="text-lg font-bold text-[#101828] mb-4">Convert Currency</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6a7282] mb-1">
                                                    Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={convertAmount}
                                                    onChange={(e) => setConvertAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-[#101828] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#6a7282] mb-1">
                                                        From
                                                    </label>
                                                    <select
                                                        value={convertFrom}
                                                        onChange={(e) => setConvertFrom(e.target.value)}
                                                        className="h-11 w-full rounded-lg border border-gray-200 px-3 bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    >
                                                        {availableBalanceCurrencies.map((c) => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#6a7282] mb-1">
                                                        To
                                                    </label>
                                                    <select
                                                        value={convertTo}
                                                        onChange={(e) => setConvertTo(e.target.value)}
                                                        className="h-11 w-full rounded-lg border border-gray-200 px-3 bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    >
                                                        {SUPPORTED_CURRENCIES.filter((c) => c !== convertFrom).map((c) => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-5">
                                            <button
                                                type="button"
                                                onClick={() => setConvertOpen(false)}
                                                className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-[#101828] transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleConvert}
                                                disabled={converting}
                                                className="flex-1 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                                            >
                                                {converting ? "Processing…" : "Convert"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
