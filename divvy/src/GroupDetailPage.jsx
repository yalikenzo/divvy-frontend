import { useState, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sidebar } from "./CreatingNewGroup";

// Utils
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Button
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

// Button
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Button
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

// Modal
const Modal = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

// Add Expense Modal 
const CATEGORIES = [
  { label: "Food & Drink", emoji: "" },
  { label: "Transport", emoji: "" },
  { label: "Accommodation", emoji: "" },
  { label: "Entertainment", emoji: "" },
  { label: "Shopping", emoji: "" },
  { label: "Other", emoji: "" },
];

const AddExpenseModal = ({ open, onClose, onAdd, members = [], currencySymbol = "$" }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paidBy, setPaidBy] = useState(members[0] || "");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!title.trim()) { setError("Please enter a description."); return; }
    const num = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(num) || num <= 0) { setError("Please enter a valid amount."); return; }

    onAdd({
      title: title.trim(),
      amount: num,
      category: category.label,
      categoryEmoji: category.emoji,
      paidBy,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    });

    setTitle(""); setAmount(""); setCategory(CATEGORIES[0]); setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="[font-family:'Outfit',Helvetica] mb-5 text-xl font-bold text-indigo-950">
        Add Expense
      </h2>

      <div className="mb-4">
        <label className="[font-family:'Outfit',Helvetica] mb-1 block text-sm font-medium text-gray-600">Description</label>
        <input
          className="[font-family:'Outfit',Helvetica] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-indigo-950 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="e.g. Dinner at restaurant"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
        />
      </div>

      <div className="mb-4">
        <label className="[font-family:'Outfit',Helvetica] mb-1 block text-sm font-medium text-gray-600">
          Amount ({currencySymbol})
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="[font-family:'Outfit',Helvetica] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-indigo-950 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="0.00"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
      </div>

      <div className="mb-4">
        <label className="[font-family:'Outfit',Helvetica] mb-2 block text-sm font-medium text-gray-600">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setCategory(c)}
              className={`[font-family:'Outfit',Helvetica] flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                category.label === c.label
                  ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="[font-family:'Outfit',Helvetica] mb-1 block text-sm font-medium text-gray-600">Paid by</label>
        {members.length > 0 ? (
          <select
            className="[font-family:'Outfit',Helvetica] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-indigo-950 outline-none focus:border-indigo-400"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {members.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        ) : (
          <input
            className="[font-family:'Outfit',Helvetica] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-indigo-950 outline-none focus:border-indigo-400"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            placeholder="Who paid?"
          />
        )}
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          className="[font-family:'Outfit',Helvetica] flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="[font-family:'Outfit',Helvetica] flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm text-white hover:bg-emerald-600 transition-colors"
          onClick={handleAdd}
        >
          Add Expense
        </button>
      </div>
    </Modal>
  );
};

// Tab content
const ExpensesContent = ({ group, expenses, onAddExpense, onDeleteExpense }) => {
  const currencySymbol = group?.currency?.includes("EUR") ? "€"
    : group?.currency?.includes("GBP") ? "£"
    : group?.currency?.includes("JPY") ? "¥"
    : "$";

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
              className="group flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a]"
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
                onClick={() => onDeleteExpense(exp.id)}
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
            className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
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

const BalancesContent = ({ group, expenses }) => {
  const currencySymbol = group?.currency?.includes("EUR") ? "€"
    : group?.currency?.includes("GBP") ? "£"
    : group?.currency?.includes("JPY") ? "¥"
    : "$";

  const members = group?.participants ?? [];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = members.length > 0 ? total / members.length : 0;

  const balances = members.map((name) => {
    const paid = expenses.filter((e) => e.paidBy === name).reduce((s, e) => s + e.amount, 0);
    return { name, paid, balance: paid - perPerson };
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <Card className="rounded-[14px] border-0 bg-white shadow-[0px_1px_3px_#0000000a]">
        <CardContent className="flex min-h-[88.5px] flex-col justify-center px-4 py-4">
          <p className="[font-family:'Outfit',Helvetica] text-[13px] font-normal text-gray-400">Total to settle</p>
          <p className="[font-family:'Outfit',Helvetica] text-[22px] font-bold text-indigo-950">
            {currencySymbol}{total.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <span className="text-4xl"></span>
          <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">All settled up</p>
          <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">No outstanding balances in this group</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {balances.map((b, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {b.name[0]}
                </div>
                <div>
                  <span className="text-sm font-medium text-indigo-950">{b.name}</span>
                  <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400">
                    Paid {currencySymbol}{b.paid.toFixed(2)} · Share {currencySymbol}{perPerson.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-bold ${b.balance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {b.balance >= 0 ? "+" : ""}{currencySymbol}{Math.abs(b.balance).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PhotosContent = () => {
  const [photos, setPhotos] = useState([]);
  const inputRef = React.useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, { id: Date.now() + Math.random(), src: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-5xl"></span>
          <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No photos yet</p>
          <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Add photos from your camera or library</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img src={photo.src} alt={photo.name} className="h-full w-full object-cover" />
              <button
                onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex min-h-[120px] flex-1 items-end justify-center">
        <div className="flex gap-6">
          {/* Take photo */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
              onClick={() => {
                inputRef.current.setAttribute("capture", "environment");
                inputRef.current.removeAttribute("multiple");
                inputRef.current.click();
              }}
            >
              
            </button>
            <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">Take Photo</span>
          </div>
          {/* From library */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
              onClick={() => {
                inputRef.current.removeAttribute("capture");
                inputRef.current.setAttribute("multiple", "true");
                inputRef.current.click();
              }}
            >
              
            </button>
            <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-indigo-500">From Library</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceiptsContent = () => {
  const [receipts, setReceipts] = useState([]);
  const inputRef = React.useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReceipts((prev) => [...prev, {
          id: Date.now() + Math.random(),
          src: ev.target.result,
          name: file.name,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-5xl"></span>
          <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No receipts yet</p>
          <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Scan a receipt to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {receipts.map((r) => (
            <div key={r.id} className="group flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a]">
              <img src={r.src} alt={r.name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="[font-family:'Outfit',Helvetica] truncate text-sm font-semibold text-indigo-950">{r.name}</p>
                <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400">{r.date}</p>
              </div>
              <span className="text-xs font-medium bg-amber-100 text-amber-600 rounded-full px-2.5 py-1">Pending scan</span>
              <button
                onClick={() => setReceipts((prev) => prev.filter((x) => x.id !== r.id))}
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
            onClick={() => inputRef.current.click()}
          >
            
          </button>
          <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">Scan Receipt</span>
        </div>
      </div>
    </div>
  );
};

// Expense Overview 
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

const ExpenseOverviewSection = ({ group, onBack, onNavChange }) => {
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const currencyCode = group?.currency?.split("–")[0]?.trim() ?? "USD";
  const currencySymbol = group?.currency?.includes("EUR") ? "€"
    : group?.currency?.includes("GBP") ? "£"
    : group?.currency?.includes("JPY") ? "¥"
    : "$";

  const addExpense = (newExpense) => {
    setExpenses((prev) => [...prev, { ...newExpense, id: Date.now() }]);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "expenses": return (
        <ExpensesContent
          group={group}
          expenses={expenses}
          onAddExpense={() => setShowAddExpense(true)}
          onDeleteExpense={deleteExpense}
        />
      );
      case "balances": return (
        <BalancesContent
          group={group}
          expenses={expenses}
        />
      );
      case "photos":   return <PhotosContent />;
      case "receipts": return <ReceiptsContent />;
      default:         return (
        <ExpensesContent
          group={group}
          expenses={expenses}
          onAddExpense={() => setShowAddExpense(true)}
          onDeleteExpense={deleteExpense}
        />
      );
    }
  };

  return (
    <section className="relative flex w-full flex-col">
      <header className="flex w-full flex-col px-8 pt-5">
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
            <span className="[font-family:'Outfit',Helvetica] text-sm font-medium">Back to Groups</span>
          </button>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 rounded-full px-3 py-1">
            {currencyCode}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 pt-7">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0px_2px_4px_-2px_#0000001a,0px_4px_6px_-1px_#0000001a]"
            style={{ background: getGroupGradient(group) }}
          >
            <span className="text-[32px]"></span>
          </div>
          <h1 className="[font-family:'Outfit',Helvetica] text-2xl font-bold text-indigo-950">
            {group?.title ?? "Unnamed Group"}
          </h1>
          <p className="text-sm text-gray-400">
            {group?.participants?.length ?? 0} member{(group?.participants?.length ?? 0) !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {group?.participants?.slice(0, 6).map((name, i) => (
              <div
                key={i}
                title={name}
                className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] flex items-center justify-center text-white text-xs font-bold border-2 border-white -ml-1 first:ml-0"
              >
                {name[0]}
              </div>
            ))}
            {(group?.participants?.length ?? 0) > 6 && (
              <span className="text-xs text-gray-400 ml-1">+{group.participants.length - 6}</span>
            )}
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

      <div className="flex w-full flex-col px-8 pb-6 pt-6">
        {renderContent()}
      </div>

      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdd={addExpense}
        members={group?.participants ?? []}
        currencySymbol={currencySymbol}
      />
    </section>
  );
};

// Main Page
const GroupDetailPage = ({ group, groups = [], user, onBack, onNavChange }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
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

      <main className="flex-1 overflow-y-auto">
        <ExpenseOverviewSection
          group={group}
          onBack={onBack}
          onNavChange={onNavChange}
        />
      </main>
    </div>
  );
};

export default GroupDetailPage;