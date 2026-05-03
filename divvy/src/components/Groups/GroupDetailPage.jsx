import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sidebar } from "./CreatingNewGroup";
import { MobileBrandAndLogout } from "../MobileBrandAndLogout";
import { GroupSettingsModal } from "./GroupSettingsModal";
import { groupApi } from "../../api/groupApi";
import { virtualCardApi } from "../../api/virtualCardApi";
import { useNavigate, useLocation } from "react-router-dom";
import { normalizeGroupExpense } from "../../utils/groupExpenseMapper";
import { MediaGallery } from "../Media/MediaGallery";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}


class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("SectionErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center w-full">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl mb-4">⚠️</div>
          <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950 mb-1">Something went wrong</p>
          <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400 mb-5 max-w-xs">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null }, () => this.props.onRetry?.())}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


const parseDecimal = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  const str = String(value).trim();
  const sign = str.startsWith("-") ? -1 : 1;
  const cleaned = str.replace(/^[+-]/, "").replace(/^0+/, "") || "0";
  const num = Number(cleaned) * sign;
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : 0;
};

const getCurrencySymbol = (currency) => {
  if (!currency) return "$";
  const c = String(currency).toUpperCase();
  if (c.includes("EUR")) return "€";
  if (c.includes("GBP")) return "£";
  if (c.includes("JPY") || c.includes("CNY")) return "¥";
  if (c.includes("KZT")) return "₸";
  if (c.includes("RUB")) return "₽";
  if (c.includes("INR")) return "₹";
  if (c.includes("USD")) return "$";
  return "$";
};

const formatDateLong = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
};

const deepClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return null;
  }
};


const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const expensePayerId = (exp) =>
  Number(exp?.payer_id ?? exp?.payer?.id ?? exp?.paid_by_user_id ?? exp?.paid_by ?? 0);

const STATUS_PAID = "PAID";
const STATUS_PENDING = "PENDING";

const normalizeStatus = (status) =>
  String(status || "").toUpperCase().trim() === STATUS_PAID ? STATUS_PAID : STATUS_PENDING;

const normalizedSplitStatus = (split) => normalizeStatus(split?.status);
const normalizedDetailStatus = (detail) =>
  normalizeStatus(detail?.status ?? detail?.split_status ?? detail?.expense_split_status ?? detail?.payment_status);
const isPendingStatus = (status) => normalizeStatus(status) === STATUS_PENDING;

const PayDebtModal = ({
  open,
  onClose,
  toUserName,
  amount,
  currencySymbol,
  splitId: initialSplitId,
  groupId,
  toUserId,
  currentUserId,
  onPaid,
  group,
}) => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const resolvedSplitIdRef = useRef(null);

  const groupCurrency = ((group?.currency || "KZT").split("–")[0]).trim().toUpperCase();

  const loadCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const result = await virtualCardApi.getVirtualCard();
      const arr = Array.isArray(result) ? result : [result].filter(Boolean);
      setCards(arr);
      if (arr.length > 0) setSelectedCardId((prev) => prev ?? Number(arr[0].id));
    } catch {
      setCards([]);
      setError("Failed to load virtual cards");
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resolvedSplitIdRef.current = null;
      setError("");
      setCards([]);
      setSelectedCardId(null);
      return;
    }
    resolvedSplitIdRef.current = initialSplitId || null;
    loadCards();
  }, [open]); 

  const resolveSplitId = async () => {
    if (resolvedSplitIdRef.current) return resolvedSplitIdRef.current;

    if (!groupId || !toUserId || !currentUserId) {
      throw new Error("Missing info to resolve expense split");
    }

    const expenses = await groupApi.getGroupExpenses(groupId);
    const targetAmt = Math.abs(parseDecimal(amount));
    const payToId = Number(toUserId);
    const meId = Number(currentUserId);

    const candidates = [];
    for (const exp of expenses) {
      if (expensePayerId(exp) !== payToId) continue;
      const splits = exp.expenses_split || exp.splits || [];
      for (const s of splits) {
        if (Number(s.user_id) !== meId) continue;
        const owe = parseDecimal(s.owed_amount);
        if (owe >= 0 || !s.id) continue;
        candidates.push({
          id: s.id,
          absOwed: Math.abs(owe),
          unsettled: isPendingStatus(s?.status),
        });
      }
    }

    let pool = candidates.filter((c) => c.unsettled);
    if (pool.length === 0) pool = candidates;

    if (pool.length === 0) {
      console.error("Could not find expense split for payment", { groupId, toUserId: payToId, currentUserId: meId });
      throw new Error("Could not find the expense split to pay");
    }

    pool.sort((a, b) => {
      if (targetAmt <= 0) return 0;
      return Math.abs(a.absOwed - targetAmt) - Math.abs(b.absOwed - targetAmt);
    });

    const bestId = pool[0].id;
    resolvedSplitIdRef.current = bestId;
    return bestId;
  };

  const handlePay = async () => {
    if (!selectedCardId) { setError("No virtual card selected"); return; }
    setPaying(true);
    setError("");
    try {
      const sid = await resolveSplitId();
      await virtualCardApi.payDebt(selectedCardId, { expense_split_id: sid });

      onPaid?.({ splitId: sid, toUserId: Number(toUserId) });
      onClose();
    } catch (err) {
      console.error("Payment failed:", err);
      const detail = err?.data?.detail || err?.data?.message || err?.message || "Payment failed";
      const detailLower = String(detail).toLowerCase();
      if (err?.status === 400 && detailLower.includes("already paid")) {
        try {
          const sid = await resolveSplitId();
          onPaid?.({ splitId: sid, toUserId: Number(toUserId) });
        } finally {
          onClose();
        }
        return;
      }
      const isBalanceError =
        detailLower.includes("insufficient") ||
        detailLower.includes("balance");
      setError(isBalanceError ? `${detail}. Please deposit to your card first.` : detail);
    } finally {
      setPaying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-auto p-6 pb-8 max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10" aria-label="Close">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center pt-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl mb-3">💳</div>
          <h3 className="[font-family:'Outfit',Helvetica] text-lg font-bold text-indigo-950 text-center">Pay debt to {toUserName}</h3>
          <p className="[font-family:'Outfit',Helvetica] text-3xl font-bold text-indigo-950 mt-3">{currencySymbol}{amount.toFixed(2)}</p>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Pay with card</p>
          {loadingCards ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600 text-center">No virtual card found. Please create a card first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => {
                const cid = Number(card.id);
                const isSelected = cid === selectedCardId;
                const last4 = card.card_last_4 ?? card.last_four ?? card.masked_number?.slice(-4) ?? card.card_number?.slice(-4) ?? "****";
                const balEntry = (card.balances || []).find((b) => b.currency.toUpperCase() === groupCurrency) ?? card.balances?.[0];
                const bal = parseDecimal(balEntry?.balance ?? card.balance ?? 0);
                const balCur = balEntry?.currency ?? groupCurrency;
                return (
                  <button key={cid} type="button" onClick={() => setSelectedCardId(cid)}
                    className={`w-full flex items-center justify-between rounded-lg px-4 py-3 border transition-colors text-left ${isSelected ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">💳</div>
                      <div>
                        <p className="text-sm font-medium text-[#101828]">•••• {last4}</p>
                        <p className="text-xs text-gray-400">Balance: {currencySymbol}{bal.toFixed(2)} {balCur}</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`}>
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-gray-200 [font-family:'Outfit',Helvetica] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handlePay} disabled={paying || !selectedCardId || cards.length === 0}
            className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 [font-family:'Outfit',Helvetica] text-sm font-semibold text-white transition-colors">
            {paying ? "Paying…" : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
};


const ExpenseDetailView = ({ expense, group, user, onBack, onEdit, onDeleted }) => {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currencySymbol = getCurrencySymbol(group?.currency);
  const currentUserId = Number(user?.id);

  const membersMap = useMemo(() => {
    const map = {};
    (group?.members || []).forEach((m) => {
      map[Number(m.id)] = m.fullName || [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.email || "Member";
    });
    return map;
  }, [group]);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const allExpenses = await groupApi.getGroupExpenses(group.id);
      const found = allExpenses.find((e) => Number(e.id) === Number(expense.id));
      setRawData(found ? deepClone(found) : deepClone(expense));
    } catch (err) {
      if (err?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
        return;
      }
      setRawData(deepClone(expense));
    } finally {
      setLoading(false);
    }
  }, [expense.id, group.id]);

  useEffect(() => {
    let cancelled = false;
    fetchDetail().catch(() => {
      if (!cancelled) setRawData(deepClone(expense));
    });
    return () => { cancelled = true; };
  }, [expense.id, group.id]);

  const data = rawData || expense;
  const totalAmount = parseDecimal(data.total_amount ?? data.amount ?? 0);
  const payerId = Number(data.payer_id ?? 0);
  const payerName = membersMap[payerId] || `User #${payerId}`;
  const expenseName = data.name || data.title || "Expense";
  const expenseDate = formatDateLong(data.created_at) || data.date || "";

  const splits = useMemo(() => {
    try {
      return (data.expenses_split || data.splits || []).map((s) => ({
        userId: Number(s.user_id),
        owedAmount: parseDecimal(s.owed_amount ?? s.amount ?? 0),
        splitType: s.split_type || "ORIGINAL",
        status: s.status || "PENDING",
        refundToUserId: Number(s.refund_to_user_id ?? 0),
        splitId: s.id ?? null, 
      }));
    } catch { return []; }
  }, [data]);

  const items = useMemo(() => {
    try {
      return (data.items || []).map((item) => ({
        id: Number(item.id),
        name: item.name || "Item",
        price: parseDecimal(item.price),
        quantity: Number(item.quantity || 1),
        totalPrice: parseDecimal(item.total_price),
      }));
    } catch { return []; }
  }, [data]);

  const itemSplits = data.item_splits || {};
  const participantCount = splits.length;

  const handleDeleted = async () => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      if (typeof groupApi.deleteGroupExpense === "function") await groupApi.deleteGroupExpense(expense.id);
      onDeleted?.(expense.id);
      onBack();
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert(err?.message || "Failed to delete expense. Please try again.");
    }
  };

  const handleEdit = useCallback(() => {
    onEdit(rawData || deepClone(expense));
  }, [rawData, expense, onEdit]);

  const handlePaid = useCallback(async (paid) => {
    const paidSplitId = typeof paid === "object" && paid ? paid.splitId : paid;
    if (paidSplitId) {
      setRawData((prev) => {
        if (!prev) return prev;
        const patchSplits = (arr) =>
          (arr || []).map((s) => (s.id === paidSplitId ? { ...s, status: 'PAID' } : s));
        return {
          ...prev,
          expenses_split: patchSplits(prev.expenses_split),
          splits: patchSplits(prev.splits),
        };
      });
    }
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="flex w-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span className="[font-family:'Outfit',Helvetica] text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDeleted} className="h-9 px-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">Delete</button>
          <button type="button" onClick={handleEdit} className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">Edit</button>
        </div>
      </div>

      <div className="flex flex-col items-center px-4 pt-4 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl mb-3">{expense.categoryEmoji || currencySymbol}</div>
        <h2 className="[font-family:'Outfit',Helvetica] text-xl font-bold text-indigo-950 text-center">{expenseName}</h2>
        <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400 mt-1">{expenseDate}</p>
        <p className="[font-family:'Outfit',Helvetica] text-3xl font-bold text-indigo-950 mt-3">{currencySymbol}{totalAmount.toFixed(2)}</p>
      </div>

      <div className="px-4">
        <p className="[font-family:'Outfit',Helvetica] text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2 px-1">Paid</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0px_1px_3px_#0000000a] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-600">{(payerName || "M").charAt(0).toUpperCase()}</div>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium text-[#101828]">{payerName}</span>
            </div>
            <span className="[font-family:'Outfit',Helvetica] text-sm font-bold text-indigo-950">{currencySymbol}{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="[font-family:'Outfit',Helvetica] text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2 px-1">
          For {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0px_1px_3px_#0000000a] divide-y divide-gray-50">
          {splits.map((split) => {
            const userName = membersMap[split.userId] || `User #${split.userId}`;
            const isPaid = split.status === "PAID";
            const isCurrentUser = split.userId === currentUserId;
            const initial = (userName || "M").charAt(0).toUpperCase();

            return (
              <div key={`split-${split.userId}-${split.splitId || "x"}`} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isPaid ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"}`}>{initial}</div>
                  <div className="min-w-0">
                    <span className="[font-family:'Outfit',Helvetica] text-sm font-medium text-[#101828] block truncate">
                      {userName}{isCurrentUser && <span className="text-gray-400 font-normal ml-1">(You)</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="[font-family:'Outfit',Helvetica] text-sm font-bold text-indigo-950">
                    {currencySymbol}{Math.abs(split.owedAmount).toFixed(2)}
                  </span>
                  {isPaid ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 font-semibold whitespace-nowrap">Paid</span>
                  ) : isCurrentUser ? (
                    <button type="button"
                      onClick={() => {
                        setPayModal({
                          toUserId: payerId,
                          toUserName: payerName,
                          amount: Math.abs(split.owedAmount),
                          splitId: split.splitId 
                        });
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold whitespace-nowrap hover:bg-amber-200 transition-colors">
                      Pay
                    </button>
                  ) : (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold whitespace-nowrap">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 0 && (
        <div className="px-4 mt-4 pb-8">
          <p className="[font-family:'Outfit',Helvetica] text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2 px-1">Items</p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0px_1px_3px_#0000000a] divide-y divide-gray-50">
            {items.map((item) => {
              const assignedUserIds = itemSplits[String(item.id)] || [];
              return (
                <div key={`item-${item.id}`} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="[font-family:'Outfit',Helvetica] text-sm font-medium text-[#101828] block truncate">{item.name}</span>
                      <span className="[font-family:'Outfit',Helvetica] text-xs text-gray-400">{currencySymbol}{item.price.toFixed(2)} × {item.quantity}</span>
                    </div>
                    <span className="[font-family:'Outfit',Helvetica] text-sm font-bold text-indigo-950 shrink-0 ml-3">{currencySymbol}{item.totalPrice.toFixed(2)}</span>
                  </div>
                  {assignedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {assignedUserIds.map((uid) => (
                        <span key={uid} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                          {membersMap[Number(uid)] || `User #${uid}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PayDebtModal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        toUserName={payModal?.toUserName || ""}
        amount={payModal?.amount || 0}
        currencySymbol={currencySymbol}
        splitId={payModal?.splitId || null}
        groupId={group.id}
        toUserId={payModal?.toUserId || null}
        currentUserId={currentUserId}
        onPaid={handlePaid}
        group={group}
      />
    </section>
  );
};


const FullScreenExpenseEditor = ({ open, onClose, group, onExpenseCreated, existingExpense, onExpenseUpdated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!existingExpense;

  const members = useMemo(() => {
    try {
      return (group?.members?.length ? group.members : (group?.participants ?? []).map((name, idx) => ({ id: idx + 1, fullName: name }))).map((member) => ({
        id: Number(member.id),
        name: member.fullName || [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || member.email || "Member",
      }));
    } catch { return []; }
  }, [group]);

  const [expenseName, setExpenseName] = useState("Expense");
  const [paidById, setPaidById] = useState(0);
  const [shareType, setShareType] = useState("EQUAL");
  const [items, setItems] = useState([]);
  const [scanFiles, setScanFiles] = useState([]);
  const [scannedFileSignatures, setScannedFileSignatures] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeMemberIds, setActiveMemberIds] = useState([]);
  const fileInputRef = useRef(null);
  const [draftItemName, setDraftItemName] = useState("");
  const [draftItemPrice, setDraftItemPrice] = useState("");
  const [draftItemQty, setDraftItemQty] = useState("1");
  const draftKey = isEditing ? `divvy_edit_expense_draft_${existingExpense?.id}` : `divvy_add_expense_draft_group_${group?.id}`;
  const populatedRef = useRef(false);

  useEffect(() => {
    if (!open) { populatedRef.current = false; return; }
    if (populatedRef.current) return;
    if (!isEditing || !existingExpense) { populatedRef.current = true; return; }
    populatedRef.current = true;
    try {
      const d = existingExpense;
      setExpenseName(d.name || d.title || "Expense");
      setPaidById(Number(d.payer_id) || members[0]?.id || 0);
      const rawItems = Array.isArray(d.items) ? d.items : [];
      const rawItemSplits = (d.item_splits && typeof d.item_splits === "object") ? d.item_splits : {};
      if (rawItems.length > 0) {
        setShareType("ITEMIZED");
        const mapped = rawItems.map((item, idx) => {
          const ids = rawItemSplits[String(item.id)] || [];
          const shares = {};
          ids.forEach((uid) => { shares[Number(uid)] = 1; });
          return { id: Number(item.id) || Date.now() + idx, name: item.name || "Item", price: parseDecimal(item.price), quantity: Number(item.quantity || 1), assignedShares: shares };
        });
        setItems(mapped);
        const userIds = Array.isArray(d.expenses_split) ? d.expenses_split.map((s) => Number(s.user_id)) : [];
        setActiveMemberIds(userIds.length > 0 ? userIds.filter(Number.isFinite) : members.map((m) => m.id).filter(Number.isFinite));
      } else {
        setShareType("EQUAL");
        setItems([]);
        setActiveMemberIds(members.map((m) => m.id).filter(Number.isFinite));
      }
    } catch (err) {
      console.error("Failed to populate edit form:", err);
      setError("Failed to load expense data for editing");
      setShareType("EQUAL");
      setItems([]);
      setActiveMemberIds(members.map((m) => m.id).filter(Number.isFinite));
    }
  }, [open]);

  useEffect(() => {
    if (!open || isEditing) return;
    setPaidById(members[0]?.id || 0);
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setExpenseName(draft.expenseName || "Expense");
        setPaidById(Number(draft.paidById || members[0]?.id || 0));
        setShareType(draft.shareType === "ITEMIZED" ? "ITEMIZED" : "EQUAL");
        setItems(Array.isArray(draft.items) ? draft.items : []);
        if (Array.isArray(draft.activeMemberIds) && draft.activeMemberIds.length > 0)
          setActiveMemberIds(draft.activeMemberIds.map(Number).filter(Number.isFinite));
      } else {
        setActiveMemberIds(members.map((m) => m.id).filter(Number.isFinite));
      }
    } catch {
      setActiveMemberIds(members.map((m) => m.id).filter(Number.isFinite));
    }
  }, [open, draftKey, isEditing]);

  useEffect(() => {
    if (!open || isEditing) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ expenseName, paidById, shareType, items, activeMemberIds }));
    } catch {
    }
  }, [open, expenseName, paidById, shareType, items, activeMemberIds, draftKey, isEditing]);

  const normalizedItems = useMemo(() =>
    items.map((item) => ({ ...item, total_price: Number((Number(item.price) * Number(item.quantity || 1)).toFixed(2)) || 0 })),
    [items]);
  const totalAmount = useMemo(() => normalizedItems.reduce((s, i) => s + (i.total_price || 0), 0), [normalizedItems]);
  const expenseMembers = useMemo(() => activeMemberIds.filter(Number.isFinite), [activeMemberIds]);

  const equalMap = useMemo(() => {
    const map = {};
    if (expenseMembers.length > 0) {
      const per = totalAmount / expenseMembers.length;
      expenseMembers.forEach((id) => { map[id] = Number(per.toFixed(2)); });
    }
    return map;
  }, [expenseMembers, totalAmount]);

  const itemizedMap = useMemo(() => {
    const map = {};
    expenseMembers.forEach((id) => { map[id] = 0; });
    normalizedItems.forEach((item) => {
      const shares = item.assignedShares || {};
      const totalShares = Object.values(shares).reduce((s, x) => s + x, 0);
      if (totalShares <= 0) return;
      expenseMembers.forEach((id) => {
        const ms = Number(shares[id]) || 0;
        if (ms > 0) map[id] = Number((map[id] + (item.total_price * ms) / totalShares).toFixed(2));
      });
    });
    return map;
  }, [expenseMembers, normalizedItems]);

  const getFileSignature = useCallback((file) => `${file.name}:${file.size}:${file.lastModified}`, []);
  const pendingScanFiles = useMemo(
    () => scanFiles.filter((file) => !scannedFileSignatures.includes(getFileSignature(file))),
    [scanFiles, scannedFileSignatures, getFileSignature]
  );

  if (!open) return null;

  const activeShares = shareType === "ITEMIZED" ? itemizedMap : equalMap;
  const canRunScan = pendingScanFiles.length > 0 && !isScanning;
  const handleUnauthorized = () => { navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`); };

  const toggleMemberParticipation = (memberId) => {
    const isActive = expenseMembers.includes(memberId);
    if (isActive) {
      if (expenseMembers.length <= 1) return;
      const next = expenseMembers.filter((id) => id !== memberId);
      setActiveMemberIds(next);
      setItems((prev) => prev.map((item) => { const ns = { ...(item.assignedShares || {}) }; delete ns[memberId]; return { ...item, assignedShares: ns }; }));
      if (paidById === memberId) setPaidById(next[0] || 0);
      return;
    }
    const next = [...expenseMembers, memberId];
    setActiveMemberIds(next);
    setItems((prev) => prev.map((item) => { const ns = { ...(item.assignedShares || {}) }; if (!Object.prototype.hasOwnProperty.call(ns, memberId)) ns[memberId] = 0; return { ...item, assignedShares: ns }; }));
  };

  const handleScan = async () => {
    if (!pendingScanFiles.length) return;
    setIsScanning(true); setError("");
    try {
      const response = await groupApi.scanReceipt(group.id, pendingScanFiles);
      const raw = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : Array.isArray(response?.data) ? response.data : [];
      const scanned = raw.map((item, idx) => { const shares = {}; expenseMembers.forEach((id) => { shares[id] = 0; }); return { id: Date.now() + idx, name: item.item_name || item.name || `Item ${idx + 1}`, price: Number(item.price || 0), quantity: Number(item.quantity || 1), assignedShares: shares }; });
      setItems((prev) => [...prev, ...scanned]);
      setShareType("ITEMIZED");
      setScannedFileSignatures((prev) => {
        const next = new Set(prev);
        pendingScanFiles.forEach((file) => next.add(getFileSignature(file)));
        return Array.from(next);
      });
    } catch (e) {
      if (e?.status === 401) { handleUnauthorized(); return; }
      setError(e.message || "Failed to scan receipt");
    } finally { setIsScanning(false); }
  };

  const addItem = () => {
    const name = draftItemName.trim();
    const price = Number(draftItemPrice);
    const qty = Number(draftItemQty || 1);
    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(qty) || qty <= 0) { setError("Please enter valid item data"); return; }
    const shares = {}; expenseMembers.forEach((id) => { shares[id] = 0; });
    setItems((prev) => [...prev, { id: Date.now(), name, price, quantity: qty, assignedShares: shares }]);
    setDraftItemName(""); setDraftItemPrice(""); setDraftItemQty("1"); setError("");
  };

  const updateShares = (itemId, memberId, diff) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const ns = { ...(item.assignedShares || {}) };
      const current = Number(ns[memberId]) || 0;
      const maxPerMember = Number(item.quantity || 0);
      ns[memberId] = Math.max(0, Math.min(maxPerMember, current + diff));
      return { ...item, assignedShares: ns };
    }));
  };

  const splitItemLine = (itemId) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (!target) return prev;
      const qty = Number(target.quantity || 0);
      if (qty <= 1) return prev;

      const nextItems = [];
      prev.forEach((item) => {
        if (item.id !== itemId) {
          nextItems.push(item);
          return;
        }

        const adjustedShares = { ...(item.assignedShares || {}) };
        Object.keys(adjustedShares).forEach((k) => {
          const memberId = Number(k);
          const current = Number(adjustedShares[memberId]) || 0;
          adjustedShares[memberId] = Math.max(0, Math.min(qty - 1, current));
        });

        nextItems.push({
          ...item,
          quantity: qty - 1,
          assignedShares: adjustedShares,
        });
        nextItems.push({
          ...item,
          id: Date.now() + Math.floor(Math.random() * 10000),
          quantity: 1,
          assignedShares: { ...(item.assignedShares || {}) },
        });
      });

      return nextItems;
    });
  };

  const submitExpense = async () => {
    if (!expenseName.trim()) { setError("Expense title is required"); return; }
    if (!expenseMembers.length) { setError("No group members found"); return; }
    if (totalAmount <= 0) { setError("Add at least one item"); return; }
    if (
      shareType === "ITEMIZED" &&
      normalizedItems.some((item) =>
        Object.entries(item.assignedShares || {}).filter(([, v]) => Number(v) > 0).length === 0
      )
    ) {
      setError("Each item must be assigned to at least one member.");
      return;
    }
    setIsSaving(true); setError("");
    try {
      const payload = {
        payer_id: paidById, group_id: group.id, name: expenseName.trim(),
        currency: (group?.currency?.split("–")[0] || "USD").trim(), share_type: shareType,
        total_amount: Number(totalAmount.toFixed(2)), expense_members: expenseMembers,
        expense_items: normalizedItems.map((item) => ({
          name: item.name, price: Number(item.price), quantity: Number(item.quantity), total_price: Number(item.total_price),
          assigned_user_ids: shareType === "ITEMIZED" ? Object.entries(item.assignedShares || {}).filter(([, v]) => v > 0).map(([k]) => Number(k)) : expenseMembers,
        })),
        exact_share_amount: {}, percentage_share_amount: {},
      };
      if (isEditing) {
        await groupApi.updateGroupExpense(existingExpense.id, payload);
        sessionStorage.removeItem(draftKey);
        onExpenseUpdated?.(existingExpense.id);
      } else {
        await groupApi.createGroupExpense(payload);
        sessionStorage.removeItem(draftKey);
        const allExpenses = await groupApi.getGroupExpenses(group.id);
        const normalized = allExpenses.map((e) => normalizeGroupExpense(e, group, group?.members || []));
        onExpenseCreated?.(normalized);
      }
      onClose();
    } catch (e) {
      if (e?.status === 401) { handleUnauthorized(); return; }
      setError(e.message || `Failed to ${isEditing ? "update" : "create"} expense`);
    } finally { setIsSaving(false); }
  };

  return (
    <section className="fixed inset-0 z-[60] bg-white text-[#101828] overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          if (!selectedFiles.length) return;
          setScanFiles((prev) => {
            const unique = new Map(prev.map((file) => [getFileSignature(file), file]));
            selectedFiles.forEach((file) => unique.set(getFileSignature(file), file));
            return Array.from(unique.values());
          });
          e.target.value = "";
        }}
      />
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm text-[#6a7282] hover:text-[#101828]">Cancel</button>
          <h2 className="text-base sm:text-lg font-semibold">{isEditing ? "Update Expense" : "Add Expense"}</h2>
          {!isEditing ? (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-medium text-white">Scan AI</button>
          ) : <div className="w-16" />}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={expenseName} onChange={(e) => setExpenseName(e.target.value)} className="md:col-span-2 h-11 rounded-lg px-3 text-[#101828] border border-gray-200" placeholder="Expense title" />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6a7282]">Payer</label>
            <select value={paidById} onChange={(e) => setPaidById(Number(e.target.value))} className="h-11 w-full rounded-lg px-3 text-[#101828] border border-gray-200">
              {members.filter((m) => expenseMembers.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6a7282]">Split Type</label>
            <select value={shareType} onChange={(e) => setShareType(e.target.value)} className="h-11 w-full rounded-lg px-3 text-[#101828] border border-gray-200">
              <option value="EQUAL">Equal</option>
              <option value="ITEMIZED">Itemized</option>
            </select>
          </div>
        </div>

        {!isEditing && scanFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#6a7282]">
              {scanFiles.length} file(s) selected, {pendingScanFiles.length} new
            </span>
            <button type="button" onClick={handleScan} disabled={!canRunScan} className="rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white">{isScanning ? "Scanning…" : "Run scan"}</button>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {normalizedItems.map((item) => (
            <div key={item.id} className="rounded-xl bg-white text-[#101828] p-4 border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <input value={item.name} onChange={(e) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))} className="h-11 w-full rounded-lg px-3 text-[#101828] border border-gray-200" />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-[#6a7282]">Qty</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        const nextQty = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
                        setItems((prev) =>
                          prev.map((x) => {
                            if (x.id !== item.id) return x;
                            const clampedShares = {};
                            Object.entries(x.assignedShares || {}).forEach(([memberId, share]) => {
                              clampedShares[memberId] = Math.min(Number(share) || 0, nextQty);
                            });
                            return { ...x, quantity: nextQty, assignedShares: clampedShares };
                          })
                        );
                      }}
                      className="h-8 w-20 rounded-md border border-gray-200 px-2 text-sm"
                    />
                    <p className="text-sm text-[#6a7282]">{item.quantity} × {(Number(item.price) || 0).toFixed(2)} = {(item.total_price || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {shareType === "ITEMIZED" && Number(item.quantity || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => splitItemLine(item.id)}
                      className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Split
                    </button>
                  )}
                  <button type="button" onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))} className="text-red-500 hover:text-red-700 text-lg leading-none">✕</button>
                </div>
              </div>
              {shareType === "ITEMIZED" && (
                <div className="mt-3 space-y-2">
                  {members.filter((m) => expenseMembers.includes(m.id)).map((m) => {
                    const s = Number(item.assignedShares?.[m.id]) || 0;
                    const active = s > 0;
                    const maxQty = Number(item.quantity || 0);
                    const canDecrease = s > 0;
                    const canIncrease = s < maxQty;
                    return (
                      <div key={`${item.id}-${m.id}`} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${active ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                        <span className="text-sm">{m.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!canDecrease}
                            className={`w-7 h-7 rounded border flex items-center justify-center text-sm ${canDecrease ? "" : "opacity-40 cursor-not-allowed"}`}
                            onClick={() => updateShares(item.id, m.id, -1)}
                          >
                            −
                          </button>
                          <span className={`min-w-6 text-center text-sm ${active ? "text-emerald-600 font-semibold" : "text-gray-500"}`}>{s}</span>
                          <button
                            type="button"
                            disabled={!canIncrease}
                            className={`w-7 h-7 rounded border flex items-center justify-center text-sm ${canIncrease ? "" : "opacity-40 cursor-not-allowed"}`}
                            onClick={() => updateShares(item.id, m.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-white p-4 text-[#101828] border border-gray-100">
          <p className="text-sm font-semibold mb-3">Add New Item</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={draftItemName} onChange={(e) => setDraftItemName(e.target.value)} placeholder="Description" className="h-10 rounded-md border border-gray-200 px-3" />
            <input value={draftItemPrice} onChange={(e) => setDraftItemPrice(e.target.value)} placeholder="Price" type="number" className="h-10 rounded-md border border-gray-200 px-3" />
            <input value={draftItemQty} onChange={(e) => setDraftItemQty(e.target.value)} placeholder="Qty" type="number" className="h-10 rounded-md border border-gray-200 px-3" />
          </div>
          <button type="button" onClick={addItem} className="mt-3 w-full h-10 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors">+ Add Item</button>
        </div>

        <div className="mt-5 rounded-xl bg-white p-4 text-[#101828] border border-gray-100">
          <p className="text-sm font-semibold mb-3">Split Summary</p>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={`summary-${m.id}`} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleMemberParticipation(m.id)}
                    className={`h-5 w-5 rounded-full border flex items-center justify-center text-[11px] ${expenseMembers.includes(m.id) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-transparent"}`}
                    disabled={expenseMembers.length <= 1 && expenseMembers.includes(m.id)}>✓</button>
                  <span className={`text-sm ${expenseMembers.includes(m.id) ? "text-[#101828]" : "text-gray-400"}`}>{m.name}</span>
                </div>
                <span className={`text-sm font-semibold ${expenseMembers.includes(m.id) ? "text-emerald-600" : "text-gray-400"}`}>
                  {(expenseMembers.includes(m.id) ? activeShares[m.id] || 0 : 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button type="button" onClick={submitExpense} disabled={isSaving}
          className="mt-5 mb-6 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-sm font-semibold text-white transition-colors">
          {isSaving ? "Saving…" : `${isEditing ? "Save Changes" : "Add Expense"} — ${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </section>
  );
};


const ExpensesContent = ({ user, group, expenses, onAddExpense, onDeleteExpense, onOpenExpense }) => {
  const currencySymbol = getCurrencySymbol(group?.currency);
  const currentUserId = Number(user?.id);

  const myExpenses = expenses
    .filter((e) => Number(e.paidById || e.payer_id || e.payerId) === currentUserId)
    .reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : parseDecimal(e.amount)), 0);

  const total = expenses.reduce((s, e) => s + (typeof e.amount === "number" ? e.amount : parseDecimal(e.amount)), 0);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { label: "My Expenses", amount: `${currencySymbol}${myExpenses.toFixed(2)}` },
          { label: "Total Expenses", amount: `${currencySymbol}${total.toFixed(2)}` },
        ].map((card) => (
          <Card key={card.label} className="rounded-[14px] border-0 bg-white shadow-[0px_1px_3px_#0000000a]">
            <CardContent className="flex min-h-[88.5px] flex-col justify-center px-4 py-4">
              <p className="[font-family:'Outfit',Helvetica] text-[13px] font-normal text-gray-400">{card.label}</p>
              <p className="[font-family:'Outfit',Helvetica] text-[22px] font-bold text-indigo-950">{card.amount}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No expenses yet</p>
          <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Add your first expense to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {expenses.map((exp) => (
            <div key={exp.id} className="group flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a] cursor-pointer" onClick={() => onOpenExpense?.(exp)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">{exp.categoryEmoji}</div>
              <div className="min-w-0 flex-1">
                <p className="[font-family:'Outfit',Helvetica] truncate text-sm font-semibold text-indigo-950">{exp.title}</p>
                <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400">{exp.paidBy} · {exp.date}</p>
              </div>
              <p className="[font-family:'Outfit',Helvetica] shrink-0 text-sm font-bold text-indigo-950">
                {currencySymbol}{(typeof exp.amount === "number" ? exp.amount : parseDecimal(exp.amount)).toFixed(2)}
              </p>
              <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteExpense(exp.id); }}
                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-400">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex min-h-[120px] flex-1 items-end justify-center">
        <div className="flex flex-col items-center gap-1.5">
          <button type="button" className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors" aria-label="Add Expense" onClick={onAddExpense}>+</button>
          <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">Add Expense</span>
        </div>
      </div>
    </div>
  );
};


const BalancesContent = ({ group, user }) => {
  const [splitData, setSplitData] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [error, setError] = useState("");
  const [showOwedDetails, setShowOwedDetails] = useState(false);
  const [showReceivableDetails, setShowReceivableDetails] = useState(false);
  const [payModal, setPayModal] = useState(null);

  const currencySymbol = getCurrencySymbol(group?.currency);
  const currentUserId = Number(user?.id);

  const membersMap = useMemo(() => {
    const map = {};
    (group?.members || []).forEach((m) => {
      map[Number(m.id)] = m.fullName || [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.email || "Member";
    });
    return map;
  }, [group]);

  const splitStatusById = useMemo(() => {
    const map = {};
    const expenseContainers = [
      ...(Array.isArray(splitData?.expenses) ? splitData.expenses : []),
      ...(Array.isArray(splitData?.group_expenses) ? splitData.group_expenses : []),
      ...(Array.isArray(splitData?.all_expenses) ? splitData.all_expenses : []),
    ];

    expenseContainers.forEach((expense) => {
      const splits = expense?.expenses_split || expense?.splits || [];
      splits.forEach((split) => {
        const splitId = Number(split?.id ?? split?.expense_split_id ?? split?.split_id ?? 0);
        if (!splitId) return;
        map[splitId] = normalizedSplitStatus(split);
      });
    });

    return map;
  }, [splitData]);

  const resolvedDetailStatus = useCallback((detail) => {
    const fromDetail = normalizedDetailStatus(detail);
    if (fromDetail) return fromDetail;

    const splitId = Number(detail?.expense_split_id ?? detail?.split_id ?? detail?.id ?? 0);
    if (splitId && splitStatusById[splitId]) return splitStatusById[splitId];
    return "";
  }, [splitStatusById]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!group?.id) return;
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const data = await groupApi.getExpenseSplitDetails(group.id);
      setSplitData(data);

      try {
        if (typeof groupApi.getExpenseSplitBalances === "function") {
          const balRes = await groupApi.getExpenseSplitBalances(group.id);
          setBalances(balRes?.balances || (Array.isArray(balRes) ? balRes : []));
        }
      } catch {
        setBalances([]);
      }
    } catch (err) {
      console.error("BalancesContent fetch error:", err);
      setError("Failed to load balances. Please try again.");
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  }, [group?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePaid = useCallback(async (paid) => {
    setSplitData((prev) => {
      if (!prev) return prev;
      const paidSplitId = typeof paid === "object" && paid ? paid.splitId : paid;
      const paidToUserId =
        (typeof paid === "object" && paid ? paid.toUserId : null) ?? payModal?.toUserId;

      const markAsPaid = (details = []) =>
        details.map((detail) => {
          const detailSplitId = Number(detail?.expense_split_id ?? detail?.split_id ?? detail?.id ?? 0);
          const sameSplit = paidSplitId ? detailSplitId === Number(paidSplitId) : false;
          const sameUser = Number(detail?.to_user_id ?? detail?.from_user_id) === Number(paidToUserId);

          // Prefer exact split match; fall back to user match only when split id is unavailable.
          if (paidSplitId ? !sameSplit : !sameUser) return detail;

          return {
            ...detail,
            status: "PAID",
            split_status: "PAID",
            expense_split_status: "PAID",
          };
        });

      const nextOwed = markAsPaid(prev.owed_amount_details || []);
      const nextReceivable = markAsPaid(prev.receivable_amount_details || []);
      const unsettledOwed = nextOwed.filter((detail) => isPendingStatus(resolvedDetailStatus(detail)));
      const unsettledReceivable = nextReceivable.filter((detail) => isPendingStatus(resolvedDetailStatus(detail)));

      return {
        ...prev,
        owed_amount_details: nextOwed,
        receivable_amount_details: nextReceivable,
        total_owed_amount: String(unsettledOwed.reduce((sum, d) => sum + Math.abs(parseDecimal(d.amount)), 0) * -1),
        total_receivable_amount: String(unsettledReceivable.reduce((sum, d) => sum + Math.abs(parseDecimal(d.amount)), 0)),
      };
    });
    setPayModal(null);
    await fetchAll(true);
  }, [fetchAll, payModal?.toUserId, resolvedDetailStatus]);

  const owedDetails = useMemo(
    () => (splitData?.owed_amount_details || []).filter((detail) => isPendingStatus(resolvedDetailStatus(detail))),
    [splitData, resolvedDetailStatus]
  );
  const paidOwedDetails = useMemo(
    () => (splitData?.owed_amount_details || []).filter((detail) => !isPendingStatus(resolvedDetailStatus(detail))),
    [splitData, resolvedDetailStatus]
  );
  const receivableDetails = useMemo(
    () => (splitData?.receivable_amount_details || []).filter((detail) => isPendingStatus(resolvedDetailStatus(detail))),
    [splitData, resolvedDetailStatus]
  );
  const paidReceivableDetails = useMemo(
    () => (splitData?.receivable_amount_details || []).filter((detail) => !isPendingStatus(resolvedDetailStatus(detail))),
    [splitData, resolvedDetailStatus]
  );
  const totalReceivable = receivableDetails.reduce((sum, detail) => sum + Math.abs(parseDecimal(detail.amount)), 0);
  const totalOwed = owedDetails.reduce((sum, detail) => sum + Math.abs(parseDecimal(detail.amount)), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-gray-400 mt-3">Loading balances…</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">

      {/* Subtle refresh indicator */}
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <span className="text-xs text-gray-400">Updating…</span>
        </div>
      )}

      {/* ── You are owed ── */}
      {totalReceivable > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowReceivableDetails((s) => !s)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowReceivableDetails((s) => !s); } }}
          aria-expanded={showReceivableDetails}
          className="flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-4 shadow-[0px_1px_3px_#0000000a] cursor-pointer">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg">💰</div>
          <div className="min-w-0 flex-1">
            <p className="[font-family:'Outfit',Helvetica] text-sm font-semibold text-indigo-950">
              You are owed {currencySymbol}{totalReceivable.toFixed(2)}
            </p>
            <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400 truncate">
              {showReceivableDetails ? "Tap to hide" : "See who needs to pay you back"}
            </p>
          </div>
          <svg className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${showReceivableDetails ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}

      {showReceivableDetails && totalReceivable > 0 && (
        <div className="rounded-[14px] bg-white p-4 shadow-[0px_1px_3px_#0000000a] space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">You are owed</p>
          {receivableDetails.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No details available</p>}
          {receivableDetails.map((d, idx) => (
                  <div
                    key={`receivable-${d?.expense_split_id ?? d?.split_id ?? d?.id ?? d?.from_user_id ?? "x"}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5"
                  >
              <span className="text-sm text-[#101828]">{membersMap[Number(d.from_user_id)] || `User #${d.from_user_id}`}</span>
              <span className="text-sm font-semibold text-emerald-600">+{currencySymbol}{Math.abs(parseDecimal(d.amount)).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {paidReceivableDetails.length > 0 && (
        <div className="rounded-[14px] bg-white p-4 shadow-[0px_1px_3px_#0000000a] space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Already paid to you</p>
          {paidReceivableDetails.map((d, idx) => (
            <div
              key={`paid-receivable-${d?.expense_split_id ?? d?.split_id ?? d?.id ?? d?.from_user_id ?? "x"}-${idx}`}
              className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2.5 border border-emerald-100"
            >
              <span className="text-sm text-[#101828]">{membersMap[Number(d.from_user_id)] || `User #${d.from_user_id}`}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600">+{currencySymbol}{Math.abs(parseDecimal(d.amount)).toFixed(2)}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold whitespace-nowrap">Paid</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── You owe ── */}
      {totalOwed > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowOwedDetails((s) => !s)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowOwedDetails((s) => !s); } }}
          aria-expanded={showOwedDetails}
          className="flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-4 shadow-[0px_1px_3px_#0000000a] cursor-pointer">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg">😬</div>
          <div className="min-w-0 flex-1">
            <p className="[font-family:'Outfit',Helvetica] text-sm font-semibold text-indigo-950">
              You owe {currencySymbol}{totalOwed.toFixed(2)}
            </p>
            <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400 truncate">
              {showOwedDetails ? "Tap to hide" : "See details"}
            </p>
          </div>
          <svg className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${showOwedDetails ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}

      {showOwedDetails && totalOwed > 0 && (
        <div className="rounded-[14px] bg-white p-4 shadow-[0px_1px_3px_#0000000a] space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">You owe</p>
          {owedDetails.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No details available</p>}
          {owedDetails.map((d, idx) => {
            const toUserId = Number(d.to_user_id);
            const toUserName = membersMap[toUserId] || `User #${toUserId}`;
            const amt = Math.abs(parseDecimal(d.amount));
            const splitId = Number(d?.expense_split_id ?? d?.split_id ?? d?.id ?? 0) || null;
            return (
              <div
                key={`owed-${d?.expense_split_id ?? d?.split_id ?? d?.id ?? toUserId ?? "x"}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5"
              >
                <span className="text-sm text-[#101828]">{toUserName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-500">-{currencySymbol}{amt.toFixed(2)}</span>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); setPayModal({ toUserId, toUserName, amount: amt, splitId }); }}
                    disabled={!splitId}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-950 text-white font-semibold hover:bg-indigo-900 transition-colors whitespace-nowrap">
                    Pay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paidOwedDetails.length > 0 && (
        <div className="rounded-[14px] bg-white p-4 shadow-[0px_1px_3px_#0000000a] space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Already paid by you</p>
          {paidOwedDetails.map((d, idx) => {
            const toUserId = Number(d.to_user_id);
            const toUserName = membersMap[toUserId] || `User #${toUserId}`;
            const amt = Math.abs(parseDecimal(d.amount));
            return (
              <div
                key={`paid-owed-${d?.expense_split_id ?? d?.split_id ?? d?.id ?? toUserId ?? "x"}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 border border-gray-200"
              >
                <span className="text-sm text-[#101828]">{toUserName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500">-{currencySymbol}{amt.toFixed(2)}</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold whitespace-nowrap">Paid</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── All settled ── */}
      {totalReceivable === 0 && totalOwed === 0 && (
        <div className="flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-4 shadow-[0px_1px_3px_#0000000a]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">✅</div>
          <div className="min-w-0 flex-1">
            <p className="[font-family:'Outfit',Helvetica] text-sm font-semibold text-indigo-950">All settled up</p>
            <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400 truncate">No outstanding balances</p>
          </div>
        </div>
      )}

      <button type="button" onClick={() => { setShowReceivableDetails(true); setShowOwedDetails(true); }}
        className="w-full rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a] text-emerald-500 text-sm font-semibold [font-family:'Outfit',Helvetica] hover:bg-gray-50 transition-colors">
        View All Suggested Reimbursements
      </button>

      <div className="flex items-center justify-between pt-2">
        <p className="[font-family:'Outfit',Helvetica] text-sm font-semibold text-indigo-950">Balances</p>
      </div>
      <div className="flex flex-col gap-2">
        {(group?.members || []).map((member) => {
          const mid = Number(member.id);
          const entry = balances.find((b) => Number(b.user_id) === mid);
          const bal = parseDecimal(entry?.balance);
          const isMe = mid === currentUserId;
          const dn = member.fullName || [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || member.email || "Member";
          return (
            <div key={mid} className="flex items-center justify-between bg-white rounded-[14px] px-4 py-3.5 shadow-[0px_1px_3px_#0000000a]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">{dn.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="text-sm font-medium text-[#101828]">{dn}</span>
                  {isMe && <span className="block text-xs text-gray-400">Me</span>}
                </div>
              </div>
              <span className={`text-sm font-bold ${bal > 0 ? "text-emerald-500" : bal < 0 ? "text-red-500" : "text-gray-400"}`}>
                {bal > 0 ? "+" : ""}{currencySymbol}{Math.abs(bal).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      <PayDebtModal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        toUserName={payModal?.toUserName || ""}
        amount={payModal?.amount || 0}
        currencySymbol={currencySymbol}
        splitId={payModal?.splitId || null}
        groupId={group?.id}
        toUserId={payModal?.toUserId || null}
        currentUserId={currentUserId}
        onPaid={handlePaid}
        group={group}
      />
    </div>
  );
};

const PhotosContent = ({ group, user }) => <MediaGallery group={group} user={user} category="PHOTO" />;
const ReceiptsContent = ({ group, user }) => <MediaGallery group={group} user={user} category="RECEIPT" />;

const overviewTabs = [
  { value: "expenses", label: "Expenses" },
  { value: "balances", label: "Balances" },
  { value: "photos", label: "Photos" },
  { value: "receipts", label: "Receipts" },
];

const GROUP_GRADIENTS = [
  "linear-gradient(135deg,rgba(245,158,11,1) 0%,rgba(239,68,68,1) 50%,rgba(124,58,237,1) 100%)",
  "linear-gradient(135deg,rgba(79,70,229,1) 0%,rgba(16,185,129,1) 100%)",
  "linear-gradient(135deg,rgba(236,72,153,1) 0%,rgba(239,68,68,1) 100%)",
  "linear-gradient(135deg,rgba(16,185,129,1) 0%,rgba(59,130,246,1) 100%)",
  "linear-gradient(135deg,rgba(245,158,11,1) 0%,rgba(16,185,129,1) 100%)",
];
const getGroupGradient = (g) => GROUP_GRADIENTS[(g?.id ?? 0) % GROUP_GRADIENTS.length];

/* ──────────────────────── Expense Overview Section ──────────────────────── */

const ExpenseOverviewSection = ({ group, expenses, onExpensesChange, onBack, onNavChange, onGroupUpdated, user }) => {
  const [activeTab, setActiveTab] = useState("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const resetView = useCallback(() => { setEditingExpense(null); setSelectedExpense(null); setShowAddExpense(false); }, []);

  const deleteExpense = useCallback((id) => { onExpensesChange((prev) => prev.filter((e) => e.id !== id)); }, [onExpensesChange]);

  const handleExpenseUpdated = useCallback((updatedId) => {
    groupApi.getGroupExpenses(group?.id).then((allExpenses) => {
      try {
        const normalized = allExpenses.map((e) => normalizeGroupExpense(e, group, group?.members || []));
        onExpensesChange(normalized);
        const found = allExpenses.find((e) => Number(e.id) === Number(updatedId));
        if (found) setSelectedExpense(deepClone(found));
      } catch { /* ignore */ }
    }).catch(() => { });
    setEditingExpense(null);
  }, [group, onExpensesChange]);

  const handleExpenseDeleted = useCallback((deletedId) => {
    onExpensesChange((prev) => prev.filter((e) => e.id !== deletedId));
    setSelectedExpense(null);
  }, [onExpensesChange]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case "expenses": return <ExpensesContent user={user} group={group} expenses={expenses} onAddExpense={() => setShowAddExpense(true)} onDeleteExpense={deleteExpense} onOpenExpense={(exp) => setSelectedExpense(exp)} />;
      case "balances": return <BalancesContent group={group} user={user} />;
      case "photos": return <PhotosContent group={group} user={user} />;
      case "receipts": return <ReceiptsContent group={group} user={user} />;
      default: return <ExpensesContent user={user} group={group} expenses={expenses} onAddExpense={() => setShowAddExpense(true)} onDeleteExpense={deleteExpense} onOpenExpense={(exp) => setSelectedExpense(exp)} />;
    }
  }, [activeTab, user, group, expenses, deleteExpense]);

  if (editingExpense) {
    return (
      <section className="relative flex w-full flex-col">
        <SectionErrorBoundary onRetry={resetView}>
          <FullScreenExpenseEditor
            key={`edit-${editingExpense?.id ?? "new"}`}
            open={true} onClose={resetView} group={group}
            existingExpense={editingExpense} onExpenseUpdated={handleExpenseUpdated}
          />
        </SectionErrorBoundary>
      </section>
    );
  }

  if (selectedExpense) {
    return (
      <section className="relative flex w-full flex-col min-h-0">
        <SectionErrorBoundary onRetry={resetView}>
          <ExpenseDetailView
            expense={selectedExpense} group={group} user={user}
            onBack={() => setSelectedExpense(null)}
            onEdit={(rawData) => setEditingExpense(rawData)}
            onDeleted={handleExpenseDeleted}
          />
        </SectionErrorBoundary>
      </section>
    );
  }

  return (
    <section className="relative flex w-full flex-col min-h-0">
      <SectionErrorBoundary onRetry={resetView}>
        <header className="flex w-full flex-col px-4 sm:px-8 pt-5">
          <div className="flex w-full items-center justify-between">
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-gray-500 transition-opacity hover:opacity-80" aria-label="Back">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium hidden sm:inline">Back to Groups</span>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium sm:hidden">Back</span>
            </button>
            <button type="button" onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full px-3 sm:px-4 py-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium">Settings</span>
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 pt-7">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shadow-[0px_2px_4px_-2px_#0000001a,0px_4px_6px_-1px_#0000001a]" style={{ background: getGroupGradient(group) }} />
            <h1 className="[font-family:'Outfit',Helvetica] text-xl sm:text-2xl font-bold text-indigo-950 text-center px-4">{group?.title ?? group?.name ?? "Unnamed Group"}</h1>
            <p className="text-sm text-gray-400">{(group?.participants?.length ?? 0)} member{(group?.participants?.length ?? 0) !== 1 ? "s" : ""}</p>
            <div className="mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
              {(group?.members?.length ? group.members : (group?.participants ?? []).map((name, idx) => ({ id: idx, fullName: name }))).map((member, idx, arr) => {
                const dn = member.fullName || [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || member.email || "Member";
                return (
                  <div key={member.id ?? `${dn}-${idx}`} className={`flex items-center gap-3 px-4 py-3 ${idx !== arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">{dn.charAt(0).toUpperCase() || "M"}</div>
                    <p className="truncate text-sm font-medium text-[#101828]">{dn}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5 w-full">
            <TabsList className="grid h-[49px] w-full grid-cols-4 rounded-xl bg-gray-100 p-1">
              {overviewTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="[font-family:'Outfit',Helvetica] h-[41px] rounded-[10px] text-sm font-medium text-gray-400 shadow-none data-[state=active]:bg-white data-[state=active]:text-indigo-950 data-[state=active]:shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a]">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </header>
        <div className="flex w-full flex-col px-4 sm:px-8 pb-6 pt-6">{renderContent()}</div>
        <FullScreenExpenseEditor
          open={showAddExpense} onClose={() => setShowAddExpense(false)} group={group}
          onExpenseCreated={(normalizedExpenses) => { onExpensesChange(normalizedExpenses); }}
        />
        {showSettings && (
          <GroupSettingsModal group={group} onClose={() => setShowSettings(false)}
            onGroupUpdated={(updatedGroup) => { onGroupUpdated?.(updatedGroup); setShowSettings(false); }} />
        )}
      </SectionErrorBoundary>
    </section>
  );
};


const GroupDetailPage = ({ group, groups = [], user, expenses, onExpensesChange, onBack, onNavChange, onGroupUpdated }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
      <div className="hidden lg:block">
        <Sidebar
          activeNav="groups"
          onNavChange={(page) => {
            try { if (page === "groups") onBack?.(); else onNavChange?.(page); } catch (e) { console.error("Sidebar nav error:", e); onBack?.(); }
          }}
          groupCount={groups.length}
          user={user}
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        <MobileBrandAndLogout />
        <SectionErrorBoundary onRetry={() => onBack?.()}>
          <ExpenseOverviewSection group={group} expenses={expenses} onExpensesChange={onExpensesChange} onBack={onBack} onNavChange={onNavChange} onGroupUpdated={onGroupUpdated} user={user} />
        </SectionErrorBoundary>
      </main>
    </div>
  );
};

export default GroupDetailPage;
