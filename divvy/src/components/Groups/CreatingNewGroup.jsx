import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import GroupDetailPage from "./GroupDetailPage";
import { GroupExpenseDetailsPage } from "./GroupExpenseDetailsPage";
import { cn } from "../../utils/cn";
import { Button, Input, Card, CardContent, Avatar, AvatarFallback, Label } from "../Ui/FormComponents";
import { CreateGroupModal } from "./CreateGroupModal";
import { authApi } from "../../api/authApi";
import { groupApi } from "../../api/groupApi";
import { userApi } from "../../api/userApi";
import { useAuth } from "../../hooks/useAuth";
import { normalizeGroupExpense } from "../../utils/groupExpenseMapper";
import { VirtualCardPage } from "../VirtualCard/VirtualCardPage";

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

const PATH_BY_NAV_ID = {
  dashboard: "/dashboard",
  groups: "/groups",
  "virtual-card": "/virtual-card",
  settings: "/settings",
};

function pathForSidebarNav(pageId) {
  return PATH_BY_NAV_ID[pageId] ?? "/dashboard";
}

export const Sidebar = ({ activeNav, onNavChange, groupCount = 0, user }) => {
  const navigate = useNavigate();
  const { logout: clearAuthSession } = useAuth();

  const handleLogout = () => {
    authApi.logout();
    clearAuthSession();
    navigate("/", { replace: true });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go to homepage"
          className="font-bold text-[#101828] text-xl tracking-wide rounded-lg px-0 py-1 -mx-1 text-left hover:text-indigo-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
        >
          Divvy
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {[
          { id: "dashboard", label: "Dashboard", icon: "⊞" },
          { id: "groups", label: "Groups", icon: "◎" },
          { id: "virtual-card", label: "Virtual Card", icon: "💳" },
          { id: "settings", label: "Settings", icon: "⚙" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full ${activeNav === item.id ? "bg-indigo-50 text-indigo-600" : "text-[#4a5565] hover:bg-gray-50 hover:text-[#101828]"
              }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.id === "groups" && groupCount > 0 && (
              <span className="ml-auto text-xs font-semibold bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 leading-none">
                {groupCount}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full text-[#4a5565] hover:bg-red-50 hover:text-red-600 mt-auto"
          aria-label="Log out"
        >
          <span className="w-5 h-5 shrink-0 flex items-center justify-center text-red-600" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12h-9m0 0 3-3m-3 3 3 3" />
            </svg>
          </span>
          <span>Log out</span>
        </button>
      </nav>
      <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.initials || "N"}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[#101828] truncate">{user?.name}</span>
          <span className="text-xs text-[#99a1af] truncate">{user?.email}</span>
        </div>
      </div>
    </aside>
  );
};

const Section = ({ title, description, children }) => (
  <Card className="bg-white rounded-[14px] border border-gray-100 shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] w-full">
    <CardContent className="p-0">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="[font-family:'Outfit',Helvetica] font-semibold text-indigo-950 text-base leading-6">{title}</h2>
        {description && <p className="[font-family:'Outfit',Helvetica] font-normal text-[#6a7282] text-sm leading-5 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </CardContent>
  </Card>
);

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="[font-family:'Outfit',Helvetica] font-medium text-indigo-950 text-sm leading-5">{label}</p>
      {description && <p className="[font-family:'Outfit',Helvetica] font-normal text-[#6a7282] text-xs leading-4 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-emerald-500" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const GROUP_GRADIENTS = [
  "linear-gradient(135deg,rgba(245,158,11,1) 0%,rgba(239,68,68,1) 50%,rgba(124,58,237,1) 100%)",
  "linear-gradient(135deg,rgba(79,70,229,1) 0%,rgba(16,185,129,1) 100%)",
  "linear-gradient(135deg,rgba(236,72,153,1) 0%,rgba(239,68,68,1) 100%)",
  "linear-gradient(135deg,rgba(16,185,129,1) 0%,rgba(59,130,246,1) 100%)",
  "linear-gradient(135deg,rgba(245,158,11,1) 0%,rgba(16,185,129,1) 100%)",
];
const getGroupGradient = (g) => GROUP_GRADIENTS[(g?.id ?? 0) % GROUP_GRADIENTS.length];

function getAuthProvider() {
  try {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.provider || null;
  } catch {
    return null;
  }
}

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  RUB: "₽",
  KRW: "₩",
  BRL: "R$",
  ZAR: "R",
  MXN: "MX$",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  PHP: "₱",
  VND: "₫",
  TRY: "₺",
  AED: "AED",
  SAR: "SAR",
  EGP: "E£",
  ILS: "₪",
  ARS: "ARS",
  CLP: "CLP",
  COP: "COP",
  PEN: "S/",
  PKR: "₨",
  BDT: "৳",
  LKR: "Rs",
  NPR: "Rs",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  BGN: "лв",
  HRK: "kn",
  UAH: "₴",
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
  TZS: "TSh",
  UGX: "USh",
  MAD: "MAD",
  DZD: "DZD",
  TND: "TND",
  JOD: "JOD",
  KWD: "KWD",
  BHD: "BHD",
  OMR: "OMR",
  QAR: "QAR",
  LBP: "L£",
  IQD: "IQD",
  KZT: "₸",
  UZS: "so'm",
  AZN: "₼",
  GEL: "₾",
  AMD: "֏",
  BYN: "Br",
  MDL: "MDL",
  ISK: "kr",
  ALL: "L",
  MKD: "ден",
  RSD: "дин",
  BAM: "KM",
  ETB: "Br",
  ZMW: "ZK",
  MWK: "MK",
  RWF: "RF",
  MUR: "₨",
  SCR: "₨",
  MZN: "MT",
  AOA: "Kz",
  BWP: "P",
  NAD: "N$",
  SZL: "E",
  LSL: "L",
  GMD: "D",
  GNF: "FG",
  SLL: "Le",
  LRD: "L$",
  CVE: "Esc",
  STN: "Db",
  XOF: "CFA",
  XAF: "FCFA",
  KMF: "CF",
  DJF: "Fdj",
  SOS: "Sh",
  ERN: "Nfk",
  SDG: "SDG",
  SSP: "SS£",
  MGA: "Ar",
  BIF: "FBu",
  CDF: "FC",
  SYP: "£S",
  YER: "﷼",
  AFN: "؋",
  IRR: "﷼",
  MMK: "K",
  LAK: "₭",
  KHR: "៛",
  BND: "B$",
  FJD: "FJ$",
  PGK: "K",
  SBD: "SI$",
  VUV: "VT",
  WST: "WS$",
  TOP: "T$",
  MNT: "₮",
  KGS: "som",
  TJS: "SM",
  TMT: "m",
  BTN: "Nu",
  MVR: "Rf",
};

function getCurrencySymbol(currency) {
  const code = currency?.split("–")?.[0]?.trim() || "USD";
  return CURRENCY_SYMBOLS[code] || "$";
}

function getCurrencyCode(currency) {
  return currency?.split("–")?.[0]?.trim() || "USD";
}

const CreateGroup = () => {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [groupsWithExpenses, setGroupsWithExpenses] = useState([]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [exchangeRates, setExchangeRates] = useState({});

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await userApi.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, [authUser]);

  const currencySymbol = user?.preferredCurrency ? getCurrencySymbol(user.preferredCurrency) : "$";

  const fetchGroupExpenses = useCallback(async () => {
    if (groups.length === 0) return;
    try {
      const expensesPromises = groups.map((g) => groupApi.getGroupExpenses(g.id));
      const expensesResults = await Promise.all(expensesPromises);
      const withExp = groups.map((g, i) => ({
        ...g,
        expenses: expensesResults[i] || [],
      }));
      setGroupsWithExpenses(withExp);
    } catch (err) {
      console.error("Error fetching group expenses:", err);
      setGroupsWithExpenses(groups.map((g) => ({ ...g, expenses: [] })));
    }
  }, [groups]);

  useEffect(() => {
    fetchGroupExpenses();
  }, [fetchGroupExpenses]);

  const fetchExchangeRates = useCallback(async () => {
    const uniqueCurrencies = new Set();
    groupsWithExpenses.forEach((group) => {
      group.expenses.forEach((expense) => {
        if (expense.currency) {
          uniqueCurrencies.add(getCurrencyCode(expense.currency));
        }
      });
    });

    const rates = {};
    for (const currency of uniqueCurrencies) {
      if (currency === "USD") {
        rates[currency] = 1;
        continue;
      }
      try {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${process.env.REACT_APP_EXCHANGE_RATE_API_KEY}/latest/${currency}`
        );
        const data = await response.json();
        if (data.result === "success" && data.conversion_rates?.USD) {
          rates[currency] = data.conversion_rates.USD;
        } else {
          rates[currency] = 1;
        }
      } catch (error) {
        console.error(`Error fetching exchange rate for ${currency}:`, error);
        rates[currency] = 1;
      }
    }
    setExchangeRates(rates);
  }, [groupsWithExpenses]);

  useEffect(() => {
    if (groupsWithExpenses.length > 0) {
      fetchExchangeRates();
    }
  }, [groupsWithExpenses, fetchExchangeRates]);

  const allExpensesList = groupsWithExpenses.flatMap((g) =>
    g.expenses.map((e) => {
      const normalized = normalizeGroupExpense(e, g);
      return {
        ...normalized,
        group: g,
        currency: e.currency || g.currency,
        currencySymbol: getCurrencySymbol(e.currency || g.currency),
      };
    })
  );

  allExpensesList.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const filteredForAnalytics = (() => {
    if (!customFrom || !customTo) return allExpensesList;
    const from = new Date(customFrom);
    const to = new Date(customTo);
    return allExpensesList.filter((exp) => {
      const expDate = new Date(exp.createdAt || exp.date);
      return expDate >= from && expDate <= to;
    });
  })();

  const convertToUSD = (amount, currency) => {
    const currencyCode = getCurrencyCode(currency);
    const rate = exchangeRates[currencyCode] || 1;
    return amount * rate;
  };

  const filteredTotalSplits = filteredForAnalytics.reduce((sum, exp) => {
    return sum + convertToUSD(exp.amount, exp.currency);
  }, 0);

  const filteredYouOwe = filteredForAnalytics.reduce((sum, exp) => {
    if (exp.yourShare && exp.yourShare > 0 && exp.paidById !== user?.id) {
      return sum + convertToUSD(exp.yourShare, exp.currency);
    }
    return sum;
  }, 0);

  const filteredOwedToYou = filteredForAnalytics.reduce((sum, exp) => {
    if (exp.paidById === user?.id) {
      const othersShare = exp.amount - (exp.yourShare || 0);
      return sum + convertToUSD(othersShare, exp.currency);
    }
    return sum;
  }, 0);

  const fetchGroups = useCallback(async () => {
    try {
      const fetchedGroups = await groupApi.getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      setActivePage("dashboard");
    } else if (location.pathname.startsWith("/groups")) {
      if (groupId) {
        const group = groups.find((g) => g.id === parseInt(groupId));
        if (group) setSelectedGroup(group);
      } else {
        setActivePage("groups");
      }
    } else if (location.pathname === "/virtual-card") {
      setActivePage("virtual-card");
    } else if (location.pathname === "/settings") {
      setActivePage("settings");
    }
  }, [location.pathname, groupId, groups]);

  const handleNavChange = (navId) => {
    const path = pathForSidebarNav(navId);
    navigate(path);
    setActivePage(navId);
    setSelectedGroup(null);
  };

  const handleCreateGroup = (newGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    setCreateGroupOpen(false);
  };

  if (expenseId && selectedGroup) {
    return <GroupExpenseDetailsPage groupId={selectedGroup.id} expenseId={expenseId} onBack={() => navigate(`/groups/${selectedGroup.id}`)} />;
  }

  if (selectedGroup) {
    return (
      <GroupDetailPage
        group={selectedGroup}
        onBack={() => {
          setSelectedGroup(null);
          navigate("/groups");
        }}
        onUpdate={(updated) => {
          setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          setSelectedGroup(updated);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeNav={activePage} onNavChange={handleNavChange} groupCount={groups.length} user={user} />
      <main className="flex-1 overflow-y-auto">
        {activePage === "virtual-card" && <VirtualCardPage />}

        {activePage === "settings" && (
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold text-[#101828]">Settings</h2>
              <p className="text-sm text-[#99a1af] mt-0.5">Manage your preferences</p>
            </div>
            <Section title="Account" description="Manage your account settings">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {user?.initials || "N"}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="font-semibold text-[#101828]">{user?.name}</p>
                    <p className="text-sm text-[#6a7282]">{user?.email}</p>
                    {getAuthProvider() && <p className="text-xs text-[#99a1af] capitalize">Signed in with {getAuthProvider()}</p>}
                  </div>
                </div>
              </div>
            </Section>
            <Section title="Preferences" description="Customize your experience">
              <div className="flex flex-col divide-y divide-gray-100">
                <Toggle checked={false} onChange={() => { }} label="Email notifications" description="Receive updates about activity" />
                <Toggle checked={true} onChange={() => { }} label="Dark mode" description="Use dark theme" />
              </div>
            </Section>
          </div>
        )}

        {activePage !== "virtual-card" && activePage !== "settings" && (
          <>
            {activePage === "dashboard" && (
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#101828]">Dashboard</h2>
                    <p className="text-sm text-[#99a1af] mt-0.5">Overview of your splits & bills</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFrom("");
                      setCustomTo("");
                    }}
                    className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors ${!customFrom && !customTo ? "bg-indigo-50 text-indigo-600" : "text-[#99a1af] hover:bg-gray-50"}`}
                  >
                    All time
                  </button>
                  {!customFrom && !customTo && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="from" className="text-xs text-[#99a1af] whitespace-nowrap">
                        Custom range:
                      </Label>
                      <Input
                        id="from"
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="h-9 text-sm"
                        placeholder="From"
                      />
                      <span className="text-[#99a1af]">-</span>
                      <Input
                        id="to"
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="h-9 text-sm"
                        placeholder="To"
                      />
                    </div>
                  )}
                  {customFrom && customTo && (
                    <button
                      type="button"
                      onClick={() => { setCustomFrom(""); setCustomTo(""); }}
                      className="mt-4 h-9 px-3 rounded-xl text-xs font-medium text-[#99a1af] hover:text-rose-500 hover:bg-rose-50 transition-colors border border-gray-200"
                    >
                      Clear
                    </button>
                  )}
                  {customFrom && customTo && (
                    <span className="mt-4 text-xs text-[#99a1af]">
                      {filteredForAnalytics.length} expense{filteredForAnalytics.length !== 1 ? "s" : ""} in range
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    {
                      label: "Total Splits",
                      value: `$${filteredTotalSplits.toFixed(2)}`,
                      sub: filteredForAnalytics.length > 0 ? `${filteredForAnalytics.length} expense${filteredForAnalytics.length !== 1 ? "s" : ""}` : "No activity yet",
                      color: "text-indigo-600",
                    },
                    {
                      label: "You Owe",
                      value: `$${filteredYouOwe.toFixed(2)}`,
                      sub: filteredYouOwe === 0 ? "All clear" : "Across all groups",
                      color: "text-rose-500",
                    },
                    {
                      label: "Owed to You",
                      value: `$${filteredOwedToYou.toFixed(2)}`,
                      sub: filteredOwedToYou === 0 ? "No pending" : "Across all groups",
                      color: "text-emerald-500",
                    },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm flex flex-col gap-1">
                      <span className="text-sm text-[#99a1af]">{s.label}</span>
                      <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                      <span className="text-xs text-[#4a5565]">{s.sub}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-[#101828] text-base">Recent Bills</h2>
                    {allExpensesList.length > 0 && (
                      <span className="text-xs text-[#99a1af]">
                        {Math.min(allExpensesList.length, 10)} of {allExpensesList.length} total
                      </span>
                    )}
                  </div>
                  {allExpensesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <span className="text-4xl">🧾</span>
                      <p className="font-semibold text-[#101828]">No bills yet</p>
                      <p className="text-sm text-[#99a1af]">Add expenses to a group to see them here</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-gray-50">
                      {allExpensesList.slice(0, 10).map((exp) => (
                        <div key={exp.id} className="flex items-center gap-3.5 px-6 py-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">{exp.categoryEmoji}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#101828]">{exp.title}</p>
                            <p className="text-xs text-[#99a1af]">
                              {exp.group?.title ?? "Unknown group"} · {exp.paidBy} · {exp.date}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#101828]">
                              {exp.currencySymbol}
                              {exp.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-[#99a1af]">{exp.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePage === "groups" && (
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#101828]">My groups</h2>
                    <p className="text-sm text-[#99a1af] mt-0.5">
                      {groups.length} group{groups.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="text-5xl">📁</div>
                    <p className="font-semibold text-[#101828] text-lg">No groups yet</p>
                    <p className="text-sm text-[#99a1af] max-w-xs">Create your first group to start splitting bills with friends</p>
                    <Button
                      type="button"
                      onClick={() => setCreateGroupOpen(true)}
                      className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold mt-2"
                    >
                      + Create group
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group);
                          navigate(`/groups/${group.id}`);
                        }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: getGroupGradient(group) }} />
                          <span className="text-xs font-medium bg-gray-100 text-[#6a7282] rounded-full px-2.5 py-1 mt-0.5">{group.currency.split("–")[0].trim()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#101828] text-base">{group.title}</p>
                          <p className="text-sm text-[#6a7282] mt-1">
                            {group.participants.length} member{group.participants.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3" />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCreateGroupOpen(true)}
                      className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer min-h-[180px] group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-400 text-2xl transition-colors">+</div>
                      <span className="font-medium text-[#99a1af] group-hover:text-indigo-500 text-sm transition-colors">Create group</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {createGroupOpen && <CreateGroupModal onClose={() => setCreateGroupOpen(false)} onGroupCreated={handleCreateGroup} />}
      </main>
    </div>
  );
};

export default CreateGroup;
