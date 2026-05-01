import { useState, useEffect, useMemo } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sidebar } from "./CreatingNewGroup";
import { GroupSettingsModal } from "./components/Groups/GroupSettingsModal";
import { groupApi } from "./api/groupApi";
import { useNavigate, useLocation } from "react-router-dom";
import { normalizeGroupExpense } from "./utils/groupExpenseMapper";
import { MediaGallery } from "./components/media/MediaGallery";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
          outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
          default: "h-9 px-4 py-2",
          sm: "h-8 rounded-md px-3 text-xs",
          lg: "h-10 rounded-md px-8",
          icon: "h-9 w-9",
        },
      },
      defaultVariants: { variant: "default", size: "default" },
    }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

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
    <TabsPrimitive.List
        ref={ref}
        className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}
        {...props}
    />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
            className
        )}
        {...props}
    />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const FullScreenExpenseEditor = ({ open, onClose, group, onExpenseCreated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const members = (group?.members?.length ? group.members : (group?.participants ?? []).map((name, idx) => ({ id: idx + 1, fullName: name })))
      .map((member) => ({
        id: Number(member.id),
        name: member.fullName || [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || member.email || "Member",
      }));

  const [expenseName, setExpenseName] = useState("Expense");
  const [paidById, setPaidById] = useState(members[0]?.id || 0);
  const [shareType, setShareType] = useState("EQUAL");
  const [items, setItems] = useState([]);
  const [scanFiles, setScanFiles] = useState([]);
  const [lastScannedSignature, setLastScannedSignature] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeMemberIds, setActiveMemberIds] = useState(members.map((m) => m.id).filter((id) => Number.isFinite(id)));
  const fileInputRef = React.useRef(null);

  const [draftItemName, setDraftItemName] = useState("");
  const [draftItemPrice, setDraftItemPrice] = useState("");
  const [draftItemQty, setDraftItemQty] = useState("1");
  const draftKey = `divvy_add_expense_draft_group_${group?.id}`;

  useEffect(() => {
    if (open) {
      setPaidById(members[0]?.id || 0);
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw);
          setExpenseName(draft.expenseName || "Expense");
          setPaidById(Number(draft.paidById || members[0]?.id || 0));
          setShareType(draft.shareType === "ITEMIZED" ? "ITEMIZED" : "EQUAL");
          setItems(Array.isArray(draft.items) ? draft.items : []);
          if (Array.isArray(draft.activeMemberIds) && draft.activeMemberIds.length > 0) {
            setActiveMemberIds(draft.activeMemberIds.map(Number).filter((id) => Number.isFinite(id)));
          } else {
            setActiveMemberIds(members.map((m) => m.id).filter((id) => Number.isFinite(id)));
          }
        }
      } catch {
      }
    }
  }, [open, draftKey]);

  useEffect(() => {
    if (!open) return;
    const draft = { expenseName, paidById, shareType, items, activeMemberIds };
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
  }, [open, expenseName, paidById, shareType, items, activeMemberIds, draftKey]);

  if (!open) return null;

  const normalizedItems = items.map((item) => ({
    ...item,
    total_price: Number((item.price * item.quantity).toFixed(2)),
  }));
  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.total_price, 0);
  const expenseMembers = activeMemberIds.filter((id) => Number.isFinite(id));

  const equalMap = {};
  if (expenseMembers.length > 0) {
    const per = totalAmount / expenseMembers.length;
    expenseMembers.forEach((id) => { equalMap[id] = Number(per.toFixed(2)); });
  }

  const itemizedMap = {};
  expenseMembers.forEach((id) => { itemizedMap[id] = 0; });
  normalizedItems.forEach((item) => {
    const shares = item.assignedShares || {};
    const totalShares = Object.values(shares).reduce((s, x) => s + x, 0);
    if (totalShares <= 0) return;
    expenseMembers.forEach((id) => {
      const memberShares = shares[id] || 0;
      if (memberShares > 0) {
        itemizedMap[id] = Number((itemizedMap[id] + (item.total_price * memberShares / totalShares)).toFixed(2));
      }
    });
  });

  const activeShares = shareType === "ITEMIZED" ? itemizedMap : equalMap;
  const currentFilesSignature = scanFiles.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");
  const canRunScan = scanFiles.length > 0 && currentFilesSignature !== lastScannedSignature && !isScanning;

  const handleUnauthorized = () => {
    const redirectTo = `${location.pathname}${location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  };

  const toggleMemberParticipation = (memberId) => {
    const isActive = expenseMembers.includes(memberId);

    if (isActive) {
      if (expenseMembers.length <= 1) return;
      const nextMembers = expenseMembers.filter((id) => id !== memberId);
      setActiveMemberIds(nextMembers);
      setItems((prev) => prev.map((item) => {
        const nextShares = { ...(item.assignedShares || {}) };
        delete nextShares[memberId];
        return { ...item, assignedShares: nextShares };
      }));
      if (paidById === memberId) {
        setPaidById(nextMembers[0] || 0);
      }
      return;
    }

    const nextMembers = [...expenseMembers, memberId];
    setActiveMemberIds(nextMembers);
    setItems((prev) => prev.map((item) => {
      const nextShares = { ...(item.assignedShares || {}) };
      if (!Object.prototype.hasOwnProperty.call(nextShares, memberId)) {
        nextShares[memberId] = 1;
      }
      return { ...item, assignedShares: nextShares };
    }));
  };

  const handleScanClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleScan = async () => {
    if (!scanFiles.length) return;
    setIsScanning(true);
    setError("");
    try {
      const response = await groupApi.scanReceipt(group.id, scanFiles);
      const scannedItemsRaw = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
              ? response.items
              : Array.isArray(response?.data)
                  ? response.data
                  : [];

      const scannedItems = scannedItemsRaw.map((item, idx) => {
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 1);
        const assignedShares = {};
        expenseMembers.forEach((id) => { assignedShares[id] = 1; });
        return {
          id: Date.now() + idx,
          name: item.item_name || item.name || `Item ${idx + 1}`,
          price,
          quantity,
          assignedShares,
        };
      });

      setItems((prev) => [...prev, ...scannedItems]);
      setShareType("ITEMIZED");
      setLastScannedSignature(currentFilesSignature);
    } catch (scanError) {
      if (scanError?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(scanError.message || "Failed to scan receipt");
    } finally {
      setIsScanning(false);
    }
  };

  const addItem = () => {
    const name = draftItemName.trim();
    const price = Number(draftItemPrice);
    const quantity = Number(draftItemQty || 1);
    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter valid item data");
      return;
    }
    const assignedShares = {};
    if (shareType === "EQUAL") {
      expenseMembers.forEach((id) => { assignedShares[id] = 1; });
    } else {
      expenseMembers.forEach((id) => { assignedShares[id] = 1; });
    }
    setItems((prev) => [...prev, { id: Date.now(), name, price, quantity, assignedShares }]);
    setDraftItemName("");
    setDraftItemPrice("");
    setDraftItemQty("1");
    setError("");
  };

  const updateShares = (itemId, memberId, diff) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const next = { ...item, assignedShares: { ...(item.assignedShares || {}) } };
      const current = Number(next.assignedShares[memberId] || 0);
      next.assignedShares[memberId] = Math.max(0, current + diff);
      return next;
    }));
  };

  const submitExpense = async () => {
    if (!expenseName.trim()) {
      setError("Expense title is required");
      return;
    }
    if (!expenseMembers.length) {
      setError("No group members found");
      return;
    }
    if (totalAmount <= 0) {
      setError("Add at least one item");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        payer_id: paidById,
        group_id: group.id,
        name: expenseName.trim(),
        currency: (group?.currency?.split("–")[0] || "USD").trim(),
        share_type: shareType,
        total_amount: Number(totalAmount.toFixed(2)),
        expense_members: expenseMembers,
        expense_items: normalizedItems.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          total_price: Number(item.total_price),
          assigned_user_ids: shareType === "ITEMIZED"
              ? Object.entries(item.assignedShares || {}).filter(([, shares]) => shares > 0).map(([id]) => Number(id))
              : expenseMembers,
        })),
        exact_share_amount: {},
        percentage_share_amount: {},
      };

      const createdExpense = await groupApi.createGroupExpense(payload);
      sessionStorage.removeItem(draftKey);
      onExpenseCreated(
          normalizeGroupExpense(
              createdExpense,
              group,
              group?.members || []
          )
      );
      onClose();
    } catch (saveError) {
      if (saveError?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(saveError.message || "Failed to create expense");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <section className="absolute inset-0 z-[60] bg-white text-[#101828] overflow-y-auto">
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => setScanFiles(Array.from(e.target.files || []))}
        />
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onClose} className="text-sm text-[#6a7282] hover:text-[#101828]">Cancel</button>
            <h2 className="text-base sm:text-lg font-semibold">Add Expense</h2>
            <button type="button" onClick={handleScanClick} className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-medium">
              Scan Receipt AI
            </button>
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

          {scanFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#6a7282]">{scanFiles.length} file(s) selected</span>
                <button type="button" onClick={handleScan} disabled={!canRunScan} className="rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white">
                  {isScanning ? "Scanning..." : "Run scan"}
                </button>
              </div>
          )}

          <div className="mt-5 space-y-3">
            {normalizedItems.map((item) => (
                <div key={item.id} className="rounded-xl bg-white text-[#101828] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <input
                          value={item.name}
                          onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))}
                          className="h-11 rounded-lg px-3 text-[#101828] border border-gray-200 w-full"
                      />
                      <p className="text-sm text-[#6a7282]">{item.quantity} x {item.price.toFixed(2)} = {item.total_price.toFixed(2)}</p>
                    </div>
                    <button type="button" onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))} className="text-red-500">✕</button>
                  </div>
                  {shareType === "ITEMIZED" && (
                      <div className="mt-3 space-y-2">
                        {members.filter((member) => expenseMembers.includes(member.id)).map((member) => {
                          const shares = item.assignedShares?.[member.id] || 0;
                          const isPayingForItem = shares > 0;
                          return (
                              <div
                                  key={`${item.id}-${member.id}`}
                                  className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                                      isPayingForItem ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
                                  }`}
                              >
                                <span className="text-sm">{member.name}</span>
                                <div className="flex items-center gap-2">
                                  <button type="button" className="w-7 h-7 rounded border" onClick={() => updateShares(item.id, member.id, -1)}>-</button>
                                  <span className={`min-w-6 text-center ${isPayingForItem ? "text-emerald-600 font-semibold" : "text-gray-500"}`}>{shares}</span>
                                  <button type="button" className="w-7 h-7 rounded border" onClick={() => updateShares(item.id, member.id, 1)}>+</button>
                                </div>
                              </div>
                          )})}
                      </div>
                  )}
                </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-white p-4 text-[#101828]">
            <p className="text-sm font-semibold mb-3">Add New Item</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input value={draftItemName} onChange={(e) => setDraftItemName(e.target.value)} placeholder="Description" className="h-10 rounded-md border px-3" />
              <input value={draftItemPrice} onChange={(e) => setDraftItemPrice(e.target.value)} placeholder="Price" type="number" className="h-10 rounded-md border px-3" />
              <input value={draftItemQty} onChange={(e) => setDraftItemQty(e.target.value)} placeholder="Qty" type="number" className="h-10 rounded-md border px-3" />
            </div>
            <button type="button" onClick={addItem} className="mt-3 w-full h-10 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium">+ Add Item</button>
          </div>

          <div className="mt-5 rounded-xl bg-white p-4 text-[#101828]">
            <p className="text-sm font-semibold mb-3">Split Summary</p>
            <div className="space-y-2">
              {members.map((member) => (
                  <div key={`summary-${member.id}`} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                          type="button"
                          onClick={() => toggleMemberParticipation(member.id)}
                          className={`h-5 w-5 rounded-full border flex items-center justify-center text-[11px] ${
                              expenseMembers.includes(member.id)
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-white border-gray-300 text-transparent"
                          }`}
                          aria-label={`${expenseMembers.includes(member.id) ? "Disable" : "Enable"} ${member.name} in expense`}
                          disabled={expenseMembers.length <= 1 && expenseMembers.includes(member.id)}
                      >
                        ✓
                      </button>
                      <span className={`text-sm ${expenseMembers.includes(member.id) ? "text-[#101828]" : "text-gray-400"}`}>{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${expenseMembers.includes(member.id) ? "text-emerald-600" : "text-gray-400"}`}>
                    {(expenseMembers.includes(member.id) ? (activeShares[member.id] || 0) : 0).toFixed(2)}
                  </span>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button type="button" onClick={submitExpense} disabled={isSaving} className="mt-5 mb-3 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-sm font-semibold">
            {isSaving ? "Saving..." : `Add Expense - ${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </section>
  );
};

const ExpensesContent = ({ group, expenses, onAddExpense, onDeleteExpense, onOpenExpense }) => {
  const currencySymbol = getCurrencySymbol(group?.currency);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
      <div className="flex w-full flex-col gap-5">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { label: "My Expenses", amount: `${currencySymbol}${total.toFixed(2)}` },
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
              <span className="text-5xl"></span>
              <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No expenses yet</p>
              <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Add your first expense to get started</p>
            </div>
        ) : (
            <div className="flex flex-col gap-3">
              {expenses.map((exp) => (
                  <div
                      key={exp.id}
                      className="group flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a] cursor-pointer"
                      onClick={() => onOpenExpense?.(exp)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
                      {exp.categoryEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="[font-family:'Outfit',Helvetica] truncate text-sm font-semibold text-indigo-950">{exp.title}</p>
                      <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400">
                        {exp.paidBy} · {exp.date}
                      </p>
                    </div>
                    <p className="[font-family:'Outfit',Helvetica] shrink-0 text-sm font-bold text-indigo-950">
                      {currencySymbol}{exp.amount.toFixed(2)}
                    </p>
                    <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteExpense(exp.id);
                        }}
                        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
              ))}
            </div>
        )}

        <div className="flex min-h-[120px] flex-1 items-end justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <button
                type="button"
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
                aria-label="Add Expense"
                onClick={onAddExpense}
            >
              +
            </button>
            <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">Add Expense</span>
          </div>
        </div>
      </div>
  );
};

const BalancesContent = ({ group, user }) => {
  const [balances, setBalances] = useState([]);
  const [splitDetails, setSplitDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const currencySymbol = getCurrencySymbol(group?.currency);

  const membersMap = useMemo(() => {
    const map = {};
    (group?.members || []).forEach((m) => {
      map[Number(m.id)] =
          m.fullName ||
          [m.first_name, m.last_name].filter(Boolean).join(" ").trim() ||
          m.email ||
          "Member";
    });
    return map;
  }, [group]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!group?.id) return;
      setLoading(true);
      setError("");
      try {
        const [balRes, detRes] = await Promise.all([
          groupApi.getExpenseSplitBalances(group.id),
          groupApi.getExpenseSplitDetails(group.id),
        ]);
        if (!cancelled) {
          setBalances(balRes?.balances || balRes || []);
          setSplitDetails(detRes);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load balances");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [group?.id]);

  const totalReceivable = Number(splitDetails?.total_receivable_amount || 0);
  const totalOwed = Number(splitDetails?.total_owed_amount || 0);
  const netBalance = totalReceivable - totalOwed;

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-gray-400">Loading balances…</p>
        </div>
    );
  }

  return (
      <div className="flex w-full flex-col gap-4">
        {/* Summary card */}
        <div
            onClick={() => setShowDetails((s) => !s)}
            className="group flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-4 shadow-[0px_1px_3px_#0000000a] cursor-pointer"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">
            🤑
          </div>
          <div className="min-w-0 flex-1">
            <p className="[font-family:'Outfit',Helvetica] text-sm font-semibold text-indigo-950">
              {netBalance > 0
                  ? `You are owed ${currencySymbol}${Math.abs(netBalance).toFixed(2)}`
                  : netBalance < 0
                      ? `You owe ${currencySymbol}${Math.abs(netBalance).toFixed(2)}`
                      : "All settled up"}
            </p>
            <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400 truncate">
              {netBalance > 0
                  ? "See who needs to pay you back"
                  : netBalance < 0
                      ? "See who you need to pay back"
                      : "No outstanding balances in this group"}
            </p>
          </div>
          <svg
              className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${showDetails ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Reimbursements toggle */}
        <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="w-full rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a] text-emerald-500 text-sm font-semibold [font-family:'Outfit',Helvetica] hover:bg-gray-50 transition-colors"
        >
          View All Suggested Reimbursements
        </button>

        {/* Detailed breakdown */}
        {showDetails && splitDetails && (
            <div className="rounded-[14px] bg-white p-4 shadow-[0px_1px_3px_#0000000a] space-y-4">
              {totalReceivable > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                      You are owed
                    </p>
                    <div className="space-y-2">
                      {(splitDetails.receivable_amount_details || []).map((d, i) => (
                          <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2"
                          >
                    <span className="text-sm text-[#101828]">
                      {membersMap[Number(d.from_user_id)] || `User #${d.from_user_id}`}
                    </span>
                            <span className="text-sm font-semibold text-emerald-600">
                      +{currencySymbol}
                              {Number(d.amount).toFixed(2)}
                    </span>
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              {totalOwed > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                      You owe
                    </p>
                    <div className="space-y-2">
                      {(splitDetails.owed_amount_details || []).map((d, i) => (
                          <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2"
                          >
                    <span className="text-sm text-[#101828]">
                      {membersMap[Number(d.to_user_id)] || `User #${d.to_user_id}`}
                    </span>
                            <span className="text-sm font-semibold text-red-500">
                      -{currencySymbol}
                              {Number(d.amount).toFixed(2)}
                    </span>
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* Balances header */}
        <div className="flex items-center justify-between pt-2">
          <p className="[font-family:'Outfit',Helvetica] text-sm font-semibold text-indigo-950">
            Balances
          </p>
          <button type="button" className="text-indigo-500 hover:text-indigo-600" title="Sort">
            <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Member balances */}
        <div className="flex flex-col gap-2">
          {(group?.members || []).map((member) => {
            const memberId = Number(member.id);
            const balEntry = balances.find((b) => Number(b.user_id) === memberId);
            const balance = Number(balEntry?.balance || 0);
            const isCurrentUser = memberId === Number(user?.id);
            const displayName =
                member.fullName ||
                [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
                member.email ||
                "Member";
            const initial = displayName.charAt(0).toUpperCase();

            return (
                <div
                    key={memberId}
                    className="flex items-center justify-between bg-white rounded-[14px] px-4 py-3.5 shadow-[0px_1px_3px_#0000000a]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                      {initial}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#101828]">{displayName}</span>
                      {isCurrentUser && (
                          <span className="block text-xs text-gray-400">Me</span>
                      )}
                    </div>
                  </div>
                  <span
                      className={`text-sm font-bold ${
                          balance > 0
                              ? "text-emerald-500"
                              : balance < 0
                                  ? "text-red-500"
                                  : "text-gray-400"
                      }`}
                  >
                {balance > 0 ? "+" : ""}
                    {currencySymbol}
                    {Math.abs(balance).toFixed(2)}
              </span>
                </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </div>
  );
};
const PhotosContent = ({ group, user }) => (
    <MediaGallery group={group} user={user} category="PHOTO" />
);

const ReceiptsContent = ({ group, user }) => (
    <MediaGallery group={group} user={user} category="RECEIPT" />
);

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

const getGroupGradient = (group) => {
  const idx = (group?.id ?? 0) % GROUP_GRADIENTS.length;
  return GROUP_GRADIENTS[idx];
};

const ExpenseOverviewSection = ({ group, expenses, onExpensesChange, onBack, onNavChange, onGroupUpdated, onOpenExpense, user }) => {
  const [activeTab, setActiveTab] = useState("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const addExpense = (newExpense) => {
    onExpensesChange([...expenses, { ...newExpense, id: Date.now() }]);
  };

  const deleteExpense = (id) => {
    onExpensesChange(expenses.filter((e) => e.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "expenses": return (
          <ExpensesContent
              group={group}
              expenses={expenses}
              onAddExpense={() => setShowAddExpense(true)}
              onDeleteExpense={deleteExpense}
              onOpenExpense={onOpenExpense}
          />
      );
      case "balances": return (
          <BalancesContent
              group={group}
              user={user}
          />
      );
      case "photos":   return <PhotosContent group={group} user={user} />;
      case "receipts": return <ReceiptsContent group={group} user={user} />;
      default:         return (
          <ExpensesContent
              group={group}
              expenses={expenses}
              onAddExpense={() => setShowAddExpense(true)}
              onDeleteExpense={deleteExpense}
              onOpenExpense={onOpenExpense}
          />
      );
    }
  };

  return (
      <section className="relative flex w-full flex-col">
        <header className="flex w-full flex-col px-4 sm:px-8 pt-5">
          <div className="flex w-full items-center justify-between">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 text-gray-500 transition-opacity hover:opacity-80"
                aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium hidden sm:inline">Back to Groups</span>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium sm:hidden">Back</span>
            </button>
            <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full px-3 sm:px-4 py-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="[font-family:'Outfit',Helvetica] text-sm font-medium">Settings</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 pt-7">
            <div
                className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shadow-[0px_2px_4px_-2px_#0000001a,0px_4px_6px_-1px_#0000001a]"
                style={{ background: getGroupGradient(group) }}
            >
              <span className="text-[28px] sm:text-[32px]"></span>
            </div>
            <h1 className="[font-family:'Outfit',Helvetica] text-xl sm:text-2xl font-bold text-indigo-950 text-center px-4">
              {group?.title ?? group?.name ?? "Unnamed Group"}
            </h1>
            <p className="text-sm text-gray-400">
              {group?.participants?.length ?? 0} member{(group?.participants?.length ?? 0) !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
              {(group?.members?.length ? group.members : (group?.participants ?? []).map((name, idx) => ({ id: idx, fullName: name }))).map((member, idx, arr) => {
                const displayName =
                    member.fullName ||
                    [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
                    member.email ||
                    "Member";
                const initial = displayName.charAt(0).toUpperCase() || "M";

                return (
                    <div
                        key={member.id ?? `${displayName}-${idx}`}
                        className={`flex items-center gap-3 px-4 py-3 ${idx !== arr.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                        {initial}
                      </div>
                      <p className="truncate text-sm font-medium text-[#101828]">{displayName}</p>
                    </div>
                );
              })}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5 w-full">
            <TabsList className="grid h-[49px] w-full grid-cols-4 rounded-xl bg-gray-100 p-1">
              {overviewTabs.map((tab) => (
                  <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="[font-family:'Outfit',Helvetica] h-[41px] rounded-[10px] text-sm font-medium text-gray-400 shadow-none data-[state=active]:bg-white data-[state=active]:text-indigo-950 data-[state=active]:shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a]"
                  >
                    {tab.label}
                  </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </header>

        <div className="flex w-full flex-col px-4 sm:px-8 pb-6 pt-6">
          {renderContent()}
        </div>

        <FullScreenExpenseEditor
            open={showAddExpense}
            onClose={() => setShowAddExpense(false)}
            group={group}
            onExpenseCreated={addExpense}
        />

        {showSettings && (
            <GroupSettingsModal
                group={group}
                onClose={() => setShowSettings(false)}
                onGroupUpdated={(updatedGroup) => {
                  onGroupUpdated?.(updatedGroup);
                  setShowSettings(false);
                }}
            />
        )}
      </section>
  );
};

const GroupDetailPage = ({ group, groups = [], user, expenses, onExpensesChange, onBack, onNavChange, onGroupUpdated, onOpenExpense }) => {
  return (
      <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
        {/* Sidebar скрыт на мобильных */}
        <div className="hidden lg:block">
          <Sidebar
              activeNav="groups"
              onNavChange={(page) => {
                if (page === "groups") {
                  onBack?.();
                } else {
                  onNavChange?.(page);
                }
              }}
              groupCount={groups.length}
              user={user}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <ExpenseOverviewSection
              group={group}
              expenses={expenses}
              onExpensesChange={onExpensesChange}
              onBack={onBack}
              onNavChange={onNavChange}
              onGroupUpdated={onGroupUpdated}
              onOpenExpense={onOpenExpense}
              user={user}
          />
        </main>
      </div>
  );
};

export default GroupDetailPage;
