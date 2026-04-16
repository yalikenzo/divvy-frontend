import { useState } from "react";

// ── Utility ───────────────────────────────────────────────────────────────────
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const PlusIcon = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const UploadIcon = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const SettingsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);
const GroupsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  Food: "🍽️", Hotel: "🏨", Transport: "🚕",
  Activities: "🎭", Shopping: "🛍️", Other: "💊",
};

const STAT_CARDS = [
  { label: "Total Expenses", key: "total", iconBg: "bg-violet-100", icon: (
    <svg width="18" height="18" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  )},
  { label: "Your Share", key: "share", iconBg: "bg-emerald-100", icon: (
    <svg width="18" height="18" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { label: "You are owed", key: "owed", iconBg: "bg-blue-100", icon: (
    <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )},
];

// ── Add Expense Modal ─────────────────────────────────────────────────────────
const AddExpenseModal = ({ onClose, onAdd }) => {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    onAdd({ desc: desc.trim(), amount: amt, category });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-lg">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <XIcon />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
          <input
            type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Dinner, Hotel, Taxi…"
            className="text-sm px-3 py-2.5 border border-gray-200 rounded-[10px] outline-none focus:border-emerald-400 transition-colors text-slate-900 placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount ($)</label>
          <input
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" min="0" step="0.01"
            className="text-sm px-3 py-2.5 border border-gray-200 rounded-[10px] outline-none focus:border-emerald-400 transition-colors text-slate-900 placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="text-sm px-3 py-2.5 border border-gray-200 rounded-[10px] outline-none focus:border-emerald-400 transition-colors text-slate-900 bg-white"
          >
            {Object.keys(CATEGORY_EMOJI).map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {cat}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="font-medium text-sm px-4 py-2 rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleAdd} className="font-medium text-sm px-4 py-2 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Upload Receipt Modal ──────────────────────────────────────────────────────
const UploadReceiptModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 text-lg">Upload Receipt</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <XIcon />
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          <UploadIcon size={22} />
        </div>
        <p className="text-sm text-gray-500">
          Drag & drop a receipt image or{" "}
          <span className="text-emerald-500 cursor-pointer">browse to upload</span>
        </p>
        <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="font-medium text-sm px-4 py-2 rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onClose} className="font-medium text-sm px-4 py-2 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
          Upload
        </button>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const MainPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeNav, setActiveNav] = useState("My Groups");

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const share = expenses.length > 0 ? total / expenses.length : 0;
  const owed = Math.max(0, total - share * 2);
  const stats = { total, share, owed };

  const handleAddExpense = (expense) => setExpenses((prev) => [...prev, expense]);

  const navItems = [
    { label: "My Groups", icon: <GroupsIcon /> },
    { label: "Settings", icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex flex-col w-64 min-w-[256px] h-full bg-white border-r border-gray-100">
        {/* Logo */}
        <div className="flex items-center h-16 px-6">
          <span className="font-bold text-slate-900 text-xl tracking-tight">
            split<span className="text-emerald-500">wise</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-4 mt-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={cn(
                "flex items-center gap-3 w-full h-11 px-3 rounded-[10px] transition-colors text-sm font-medium",
                activeNav === item.label
                  ? "bg-gray-100 text-slate-900"
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="mt-auto mb-6 mx-4">
          <div className="flex items-center gap-3 px-3 h-[60px] bg-gray-50 rounded-[14px]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              AD
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-medium text-slate-900 text-sm">Alex Doe</span>
              <span className="text-gray-500 text-xs">Free Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-bold text-slate-900 text-xl md:text-2xl">City Trip</h1>
              <p className="text-gray-500 text-sm mt-0.5">Created just now • 1 member</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-[10px] border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors">
                <SettingsIcon size={15} />
                Settings
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-[10px] text-white text-sm font-medium transition-colors"
              >
                <UploadIcon size={15} />
                Upload Receipt
              </button>
            </div>
          </header>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 md:gap-5">
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-[14px] border border-gray-100 shadow-sm p-4 md:p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs md:text-sm font-medium text-gray-500 leading-tight pr-2">
                    {card.label}
                  </span>
                  <div className={cn("w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0", card.iconBg)}>
                    {card.icon}
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-xl md:text-2xl">
                  ${stats[card.key].toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Expense list / Empty state */}
          {expenses.length === 0 ? (
            <div className="bg-white rounded-[14px] border border-gray-100 flex flex-col items-center justify-center py-16 px-6 gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-[14px] flex items-center justify-center">
                <svg width="28" height="28" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="font-semibold text-slate-900 text-lg text-center">No expenses yet</p>
              <p className="text-gray-500 text-sm text-center max-w-xs">
                Start adding expenses to split costs with your friends. Invite them to the group first!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden">
              {expenses.map((expense, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between px-4 md:px-6 py-3 md:py-4",
                    i < expenses.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-[10px] flex items-center justify-center text-base md:text-lg flex-shrink-0">
                      {CATEGORY_EMOJI[expense.category] || "💸"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{expense.desc}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{expense.category} • Split equally</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-semibold text-slate-900 text-sm">${expense.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your share: ${(expense.amount / expenses.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Expense button */}
          <div className="flex justify-center pb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium text-base transition-colors"
            >
              <PlusIcon size={18} />
              Add Expense
            </button>
          </div>
        </div>

        {/* ── Bottom nav (mobile only) ── */}
        <nav className="md:hidden flex bg-white border-t border-gray-100">
          {/* Groups */}
          <button
            onClick={() => setActiveNav("My Groups")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors",
              activeNav === "My Groups" ? "text-emerald-500" : "text-gray-400"
            )}
          >
            <GroupsIcon size={20} />
            Groups
          </button>

          {/* Add (centre FAB-style) */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <PlusIcon size={18} />
            </div>
            <span className="text-[11px] font-medium text-gray-400">Add</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveNav("Settings")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors",
              activeNav === "Settings" ? "text-emerald-500" : "text-gray-400"
            )}
          >
            <SettingsIcon size={20} />
            Settings
          </button>
        </nav>
      </main>

      {/* ── Modals ── */}
      {showAddModal && (
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddExpense}
        />
      )}
      {showUploadModal && (
        <UploadReceiptModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
};

export default MainPage;