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
import { convertToUSD, getCurrencySymbol } from "../../utils/currencyUtils";

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
          className="font-bold text-[#101828] text-xl tracking-wide rounded-lg px-0 py-1 -mx-1 text-left hover:text-indigo-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500  focus-visible:ring-offset-2 transition-colors"
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full ${activeNav === item.id
                ? "bg-indigo-50 text-indigo-600"
                : "text-[#4a5565] hover:bg-gray-50 hover:text-[#101828]"
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-emerald-500" : "bg-gray-200"
        }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"
        }`} />
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
    return payload?.auth_provider || null;
  } catch {
    return null;
  }
}

const SettingsPage = ({ user, onUserChange, onOpenMobileNav, onAccountDeleted, onProfilePersist }) => {
  const isGoogleAuth = getAuthProvider() === "google";
  const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(
    user?.last_name || (user?.name || "").split(" ").slice(1).join(" ")
  );
  const [initialFirstName, setInitialFirstName] = useState(user?.first_name || user?.name?.split(" ")[0] || "");
  const [initialLastName, setInitialLastName] = useState(
    user?.last_name || (user?.name || "").split(" ").slice(1).join(" ")
  );
  const [email, setEmail] = useState(user?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [notifExpense, setNotifExpense] = useState(true);
  const [notifSettlement, setNotifSettlement] = useState(true);
  const [notifReminders, setNotifReminders] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"];

  useEffect(() => {
    const nextFirstName = user?.first_name || user?.name?.split(" ")[0] || "";
    const nextLastName = user?.last_name || (user?.name || "").split(" ").slice(1).join(" ");
    setFirstName(nextFirstName);
    setLastName(nextLastName);
    setInitialFirstName(nextFirstName);
    setInitialLastName(nextLastName);
    setEmail(user?.email || "");
  }, [user?.first_name, user?.last_name, user?.name, user?.email]);

  const hasProfileChanges =
    firstName.trim() !== initialFirstName.trim() || lastName.trim() !== initialLastName.trim();

  async function handleSaveProfile() {
    if (!hasProfileChanges || isSavingProfile) return;
    setIsSavingProfile(true);
    setProfileSaved(false);
    setProfileError("");

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    try {
      await userApi.updateUserProfile({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
      });

      const fullName = [normalizedFirstName, normalizedLastName].filter(Boolean).join(" ").trim();
      onUserChange({
        ...user,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        name: fullName || "User",
        email,
        initials: [normalizedFirstName, normalizedLastName]
          .map((part) => part?.[0] || "")
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U",
      });
      onProfilePersist?.({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
      });

      setInitialFirstName(normalizedFirstName);
      setInitialLastName(normalizedLastName);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (error) {
      setProfileError(error?.data?.detail || error?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    if (isDeletingAccount) return;
    const isConfirmed = window.confirm("Are you sure you want to permanently delete your account?");
    if (!isConfirmed) return;

    setIsDeletingAccount(true);
    setDeleteError("");

    try {
      await userApi.deleteAccount();
      onAccountDeleted?.();
    } catch (error) {
      setDeleteError(error?.data?.detail || error?.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function handleChangePassword() {
    setPwError("");
    setPwSuccess(false);
    if (!currentPw) return setPwError("Please enter your current password.");
    if (newPw.length < 6) return setPwError("New password must be at least 6 characters.");
    if (newPw !== confirmPw) return setPwError("New passwords do not match.");
    setIsChangingPassword(true);
    try {
      await userApi.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });

      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 2500);
    } catch (error) {
      setPwError(error?.data?.detail || error?.message || "Failed to update password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 h-full gap-6 pt-8 pb-8 px-8 overflow-auto">
      <header className="flex items-center justify-between w-full h-14 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-[#4a5565]"
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <div className="flex flex-col gap-1">
            <h1 className="[font-family:'Outfit',Helvetica] font-bold text-indigo-950 text-2xl leading-8">Settings</h1>
            <p className="[font-family:'Outfit',Helvetica] font-normal text-[#6a7282] text-sm leading-5">Manage your account and preferences</p>
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-5 w-full max-w-2xl">
        <Section title="Profile" description="Update your personal information">
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">{user?.initials || "NM"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-indigo-950 text-sm">{user?.name}</p>
              <p className="text-[#6a7282] text-xs mt-0.5">Free Plan</p>
              <button type="button" className="mt-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
                Change photo
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Email Address</Label>
              <Input type="email" value={email} readOnly disabled className="h-11 rounded-[10px] border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            {profileError && <p className="text-red-500 text-xs">{profileError}</p>}
            <div className="flex justify-end mt-1">
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={!hasProfileChanges || isSavingProfile}
                className={`h-10 px-5 rounded-[10px] border-0 font-semibold text-sm ${!hasProfileChanges || isSavingProfile
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : profileSaved
                      ? "bg-emerald-400"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
              >
                {isSavingProfile ? "Saving..." : profileSaved ? "✓ Saved!" : "Save the Changes"}
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Preferences" description="Customize your experience">
          <div className="flex flex-col gap-4">
            {[
              { label: "Default Currency", value: currency, onChange: setCurrency, options: CURRENCIES },
              { label: "Language", value: language, onChange: setLanguage, options: ["English", "Spanish", "French", "German", "Japanese", "Chinese"] },
              { label: "Date Format", value: dateFormat, onChange: setDateFormat, options: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] },
            ].map(({ label, value, onChange, options }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Label className="font-medium text-indigo-950 text-sm">{label}</Label>
                <div className="relative">
                  <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 rounded-[10px] border border-gray-200 bg-white text-indigo-950 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Notifications" description="Choose what you want to be notified about">
          <div className="divide-y divide-gray-100">
            <Toggle checked={notifExpense} onChange={setNotifExpense} label="New Expense Added" description="Get notified when someone adds an expense to your group" />
            <Toggle checked={notifSettlement} onChange={setNotifSettlement} label="Settlement Requests" description="Notifications when someone marks a debt as settled" />
            <Toggle checked={notifReminders} onChange={setNotifReminders} label="Payment Reminders" description="Weekly reminders about unsettled balances" />
            <Toggle checked={notifEmail} onChange={setNotifEmail} label="Email Notifications" description="Receive notifications via email" />
            <Toggle checked={notifPush} onChange={setNotifPush} label="Push Notifications" description="Browser push notifications (requires permission)" />
          </div>
        </Section>

        {!isGoogleAuth && (
          <Section title="Security" description="Manage your password and account security">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="font-medium text-indigo-950 text-sm">Current Password</Label>
                <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" className="h-11 rounded-[10px] border-gray-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="font-medium text-indigo-950 text-sm">New Password</Label>
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" className="h-11 rounded-[10px] border-gray-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="font-medium text-indigo-950 text-sm">Confirm New Password</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" className="h-11 rounded-[10px] border-gray-200" />
              </div>
              {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
              {pwSuccess && <p className="text-emerald-500 text-xs">✓ Password updated successfully!</p>}
              <div className="flex justify-end mt-1">
                <Button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className={`h-10 px-5 rounded-[10px] border-0 font-semibold text-sm ${isChangingPassword
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600"
                    }`}
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </Section>
        )}

        <Card className="bg-white rounded-[14px] border border-red-100 w-full">
          <CardContent className="p-0">
            <div className="px-6 pt-6 pb-4 border-b border-red-100">
              <h2 className="font-semibold text-red-600 text-base">Danger Zone</h2>
              <p className="text-[#6a7282] text-sm mt-0.5">Irreversible actions — proceed with caution</p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-indigo-950 text-sm">Clear All Data</p>
                  <p className="text-[#6a7282] text-xs mt-0.5">Delete all groups and expenses permanently</p>
                </div>
                <button type="button" className="h-9 px-4 rounded-[10px] border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors font-medium text-sm">
                  Clear Data
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-indigo-950 text-sm">Delete Account</p>
                  <p className="text-[#6a7282] text-xs mt-0.5">Permanently remove your account and all associated data</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className={`h-9 px-4 rounded-[10px] text-white transition-colors font-medium  text-sm ${isDeletingAccount ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                    }`}
                >
                  {isDeletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>
              {deleteError && <p className="text-red-500 text-xs">{deleteError}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export const CreateGroup = () => {
  const { user: authUser, logout, updateCurrentUserProfile } = useAuth();
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState("dashboard");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [allExpenses, setAllExpenses] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Currency conversion state for analytics
  const [usdConversionRates, setUsdConversionRates] = useState({});
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({ totalSplits: 0, youOwe: 0, owedToYou: 0 });

  const handleDrawerLogout = useCallback(() => {
    authApi.logout();
    logout();
    navigate("/", { replace: true });
    setMobileNavOpen(false);
  }, [logout, navigate]);

  const [user, setUser] = useState({
    id: authUser?.sub,
    first_name: authUser?.first_name || "",
    last_name: authUser?.last_name || "",
    name: authUser?.getFullName?.() || "User",
    email: authUser?.email || "",
    initials: (authUser?.first_name?.[0] || "") + (authUser?.last_name?.[0] || "") || "U",
  });

  useEffect(() => {
    setUser({
      id: authUser?.sub,
      first_name: authUser?.first_name || "",
      last_name: authUser?.last_name || "",
      name: authUser?.getFullName?.() || "User",
      email: authUser?.email || "",
      initials: (authUser?.first_name?.[0] || "") + (authUser?.last_name?.[0] || "") || "U",
    });
  }, [authUser]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const { pathname } = location;
    if (pathname === "/virtual-card") {
      setSelectedGroup(null);
      setActivePage("virtual-card");
      return;
    }
    if (pathname === "/settings") {
      setSelectedGroup(null);
      setActivePage("settings");
      return;
    }
    if (pathname === "/dashboard") {
      setSelectedGroup(null);
      setActivePage("dashboard");
      return;
    }
    if (pathname === "/groups" || pathname === "/create") {
      setSelectedGroup(null);
      setActivePage("groups");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (groupId && groups.length > 0) {
      const group = groups.find((g) => g.id === parseInt(groupId, 10));
      if (group) {
        setSelectedGroup(group);
        setActivePage("groups");
      }
    }
  }, [groupId, groups]);

  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const fetchedGroups = await groupApi.getGroups();
      const groupsWithMembers = await Promise.all(
        fetchedGroups.map(async (group) => {
          try {
            const members = await groupApi.getGroupMembers(group.id);
            const normalizedMembers = (Array.isArray(members) ? members : []).map((member) => {
              const fullName = [member?.first_name, member?.last_name].filter(Boolean).join(" ").trim();
              return {
                id: member?.id,
                first_name: member?.first_name || "",
                last_name: member?.last_name || "",
                email: member?.email || "",
                fullName: fullName || member?.email || "Member",
              };
            });
            return {
              id: group.id,
              title: group.name,
              currency: group.currency,
              participants: normalizedMembers.map((member) => member.fullName),
              members: normalizedMembers,
              invitation_link: group.invitation_link,
            };
          } catch (memberError) {
            console.error(`Failed to load members for group ${group.id}:`, memberError);
            return {
              id: group.id,
              title: group.name,
              currency: group.currency,
              participants: [user.name],
              members: [
                {
                  id: user.id ?? authUser?.sub,
                  first_name: user.name?.split?.(" ")?.[0] || user.first_name || "",
                  last_name: user.last_name || user.name?.split?.(" ")?.slice(1)?.join(" ") || "",
                  email: user.email || "",
                  fullName: user.name,
                },
              ],
              invitation_link: group.invitation_link,
            };
          }
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleCreateGroup = async (newGroup) => {
    const mappedGroup = {
      id: newGroup.id,
      title: newGroup.name,
      currency: newGroup.currency,
      participants: [user.name],
      members: [
        {
          id: user.id ?? authUser?.sub,
          first_name: user.name?.split?.(" ")?.[0] || user.first_name || "",
          last_name: user.last_name || user.name?.split?.(" ")?.slice(1)?.join(" ") || "",
          email: user.email || "",
          fullName: user.name,
        },
      ],
      invitation_link: newGroup.invitation_link,
    };
    setGroups((g) => [mappedGroup, ...g]);
    setActivePage("groups");
  };

  const handleGroupUpdated = (updatedGroup) => {
    const mappedGroup = {
      id: updatedGroup.id,
      title: updatedGroup.name,
      name: updatedGroup.name,
      currency: updatedGroup.currency,
      participants: selectedGroup?.participants || [user.name],
      members:
        selectedGroup?.members ||
        [
          {
            id: user.id ?? authUser?.sub,
            first_name: user.name?.split?.(" ")?.[0] || user.first_name || "",
            last_name: user.last_name || user.name?.split?.(" ")?.slice(1)?.join(" ") || "",
            email: user.email || "",
            fullName: user.name,
          },
        ],
      invitation_link: updatedGroup.invitation_link,
    };
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? mappedGroup : g)));
    setSelectedGroup(mappedGroup);
  };

  const loadGroupExpenses = useCallback(async (group) => {
    try {
      const fetched = await groupApi.getGroupExpenses(group.id);
      const normalized = (Array.isArray(fetched) ? fetched : []).map((expense) =>
        normalizeGroupExpense(expense, group, group.members || [])
      );
      setAllExpenses((prev) => ({ ...prev, [group.id]: normalized }));
    } catch (error) {
      console.error(`Failed to load expenses for group ${group.id}:`, error);
      setAllExpenses((prev) => ({ ...prev, [group.id]: prev[group.id] || [] }));
    }
  }, []);

  useEffect(() => {
    if (!selectedGroup?.id) return;
    if (allExpenses[selectedGroup.id]) return;
    loadGroupExpenses(selectedGroup);
  }, [allExpenses, loadGroupExpenses, selectedGroup]);

  useEffect(() => {
    if (activePage !== "dashboard") return;
    if (!groups.length) return;
    const groupsWithoutExpenses = groups.filter((group) => allExpenses[group.id] === undefined);
    if (!groupsWithoutExpenses.length) return;

    Promise.all(groupsWithoutExpenses.map((group) => loadGroupExpenses(group))).catch((error) => {
      console.error("Failed to load dashboard expenses:", error);
    });
  }, [activePage, groups, allExpenses, loadGroupExpenses]);

  // Fetch exchange rates for currency conversion
  useEffect(() => {
    const fetchConversionRates = async () => {
      if (activePage !== "dashboard") return;

      setIsConvertingCurrency(true);
      const rates = {};
      const currencies = [...new Set(
        Object.values(allExpenses).flat().map((e) => e.currency).filter(Boolean)
      )];

      for (const currency of currencies) {
        if (currency !== "USD") {
          try {
            const rate = await convertToUSD(1, currency);
            rates[currency] = rate;
          } catch (error) {
            console.error(`Failed to get rate for ${currency}:`, error);
            rates[currency] = 1;
          }
        } else {
          rates[currency] = 1;
        }
      }
      setUsdConversionRates(rates);
      setIsConvertingCurrency(false);
    };

    fetchConversionRates();
  }, [activePage, allExpenses]);

  const handleOpenExpense = (expense) => {
    navigate(`/groups/${selectedGroup.id}/expenses/${expense.id}`);
  };

  const handleExpenseUpdated = (updatedExpense) => {
    const normalized = normalizeGroupExpense(updatedExpense, selectedGroup, selectedGroup?.members || []);
    setAllExpenses((prev) => ({
      ...prev,
      [selectedGroup.id]: (prev[selectedGroup.id] || []).map((expense) =>
        expense.id === normalized.id ? { ...expense, ...normalized } : expense
      ),
    }));
  };

  if (selectedGroup) {
    const selectedGroupExpenses = allExpenses[selectedGroup?.id] ?? [];
    const selectedExpense = expenseId ? selectedGroupExpenses.find((expense) => expense.id === Number(expenseId)) : null;

    if (expenseId && selectedExpense) {
      return (
        <GroupExpenseDetailsPage
          group={selectedGroup}
          groups={groups}
          user={user}
          expense={selectedExpense}
          onBack={() => navigate(`/groups/${selectedGroup.id}`)}
          onGroupNav={(page) => {
            setSelectedGroup(null);
            setActivePage(page);
            navigate(pathForSidebarNav(page));
          }}
          onExpenseUpdated={handleExpenseUpdated}
        />
      );
    }

    return (
      <GroupDetailPage
        group={selectedGroup}
        groups={groups}
        user={user}
        expenses={selectedGroupExpenses}
        onExpensesChange={(updated) => setAllExpenses((prev) => ({ ...prev, [selectedGroup.id]: updated }))}
        onBack={() => {
          setSelectedGroup(null);
          navigate("/groups");
        }}
        onNavChange={(page) => {
          setSelectedGroup(null);
          setActivePage(page);
          navigate(pathForSidebarNav(page));
        }}
        onGroupUpdated={handleGroupUpdated}
        onOpenExpense={handleOpenExpense}
      />
    );
  }

  const allExpensesList = Object.entries(allExpenses)
    .flatMap(([gid, exps]) => {
      const group = groups.find((g) => g.id === Number(gid));
      return exps.map((e) => ({ ...e, group }));
    })
    .sort((a, b) => {
      const getTime = (e) => {
        const raw = e.rawDate || e.created_at || e.date;
        return raw ? new Date(raw).getTime() : 0;
      };
      return getTime(b) - getTime(a);
    });

  // Analytics calculations with USD conversion
  const calculateAnalyticsInUSD = async (expenses, filterFn) => {
    const filtered = expenses.filter(filterFn);
    let totalSplitsUSD = 0;
    let youOweUSD = 0;
    let owedToYouUSD = 0;

    for (const e of filtered) {
      const expenseCurrency = e.currency || "USD";
      const rate = usdConversionRates[expenseCurrency] || 1;
      const amountInUSD = e.amount * rate;

      totalSplitsUSD += amountInUSD;

      if (e.group) {
        const members = e.group.participants.length;
        const shareInUSD = amountInUSD / members;
        if (e.paidBy !== user.name) {
          youOweUSD += shareInUSD;
        } else {
          owedToYouUSD += amountInUSD - shareInUSD;
        }
      }
    }

    return { totalSplitsUSD, youOweUSD, owedToYouUSD };
  };

  // Filter expenses by date for analytics
  const parseLocalDate = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const filterExpenseByDate = (expense) => {
    if (analyticsFilter === "all") return true;
    const rawDate = expense.rawDate || expense.created_at || expense.date;
    if (!rawDate) return true;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return true;
    const dDay = dateOnly(d);
    const now = new Date();

    if (analyticsFilter === "week") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return dDay >= dateOnly(from);
    }
    if (analyticsFilter === "month") {
      const from = new Date(now);
      from.setMonth(now.getMonth() - 1);
      return dDay >= dateOnly(from);
    }
    if (analyticsFilter === "custom") {
      if (customFrom && dDay < parseLocalDate(customFrom)) return false;
      if (customTo && dDay > parseLocalDate(customTo)) return false;
      return true;
    }
    return true;
  };
  if (selectedGroup) {
    const selectedGroupExpenses = allExpenses[selectedGroup?.id] ?? [];
    const selectedExpense = expenseId
      ? selectedGroupExpenses.find((expense) => expense.id === Number(expenseId))
      : null;

    if (expenseId && selectedExpense) {
      return (
        <GroupExpenseDetailsPage
          group={selectedGroup}
          groups={groups}
          user={user}
          expense={selectedExpense}
          onBack={() => navigate(`/groups/${selectedGroup.id}`)}
          onGroupNav={(page) => {
            setSelectedGroup(null);
            setActivePage(page);
            navigate(pathForSidebarNav(page));
          }}
          onExpenseUpdated={handleExpenseUpdated}
        />
      );
    }

    return (
      <GroupDetailPage
        group={selectedGroup}
        groups={groups}
        user={user}
        expenses={selectedGroupExpenses}
        onExpensesChange={(updated) =>
          setAllExpenses((prev) => ({
            ...prev,
            [selectedGroup.id]: updated,
          }))
        }
        onBack={() => {
          setSelectedGroup(null);
          navigate("/groups");
        }}
        onNavChange={(page) => {
          setSelectedGroup(null);
          setActivePage(page);
          navigate(pathForSidebarNav(page));
        }}
        onGroupUpdated={handleGroupUpdated}
        onOpenExpense={handleOpenExpense}
      />
    );
  }

  const filteredForAnalytics = allExpensesList.filter(filterExpenseByDate);
  const currencySymbol = "$"; // USD symbol for analytics

  if (activePage === "virtual-card") {
    return (
      <VirtualCardPage
        user={user}
        groups={groups}
        onNavChange={(page) => {
          setActivePage(page);
          navigate(pathForSidebarNav(page));
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
      <div className="hidden lg:block">
        <Sidebar
          activeNav={activePage}
          onNavChange={(page) => {
            setActivePage(page);
            navigate(pathForSidebarNav(page));
          }}
          groupCount={groups.length}
          user={user}
        />
      </div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-gray-100 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <button
                type="button"
                onClick={() => {
                  navigate("/");
                  setMobileNavOpen(false);
                }}
                aria-label="Go to homepage"
                className="-mx-1 rounded-lg px-1 py-1 text-left text-lg font-bold tracking-wide text-[#101828] transition-colors hover:text-indigo-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Divvy
              </button>
              <button
                type="button"
                className="h-8 w-8 rounded-lg text-[#6a7282] hover:bg-gray-100"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 px-3 py-4">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "groups", label: "Groups" },
                { id: "virtual-card", label: "Virtual Card" },
                { id: "settings", label: "Settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActivePage(item.id);
                    navigate(pathForSidebarNav(item.id));
                    setMobileNavOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium ${activePage === item.id
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-[#4a5565] hover:bg-gray-50"
                    }`}
                >
                  <span>{item.label}</span>
                  {item.id === "groups" && groups.length > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold leading-none text-indigo-600">
                      {groups.length}
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDrawerLogout}
                className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4a5565] transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Log out"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-red-600" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12h-9m0 0 3-3m-3 3 3 3"
                    />
                  </svg>
                </span>
                <span>Log out</span>
              </button>
            </nav>
            <div className="border-t border-gray-100 px-4 py-4">
              <p className="truncate text-sm font-semibold text-[#101828]">{user?.name}</p>
              <p className="truncate text-xs text-[#99a1af]">{user?.email}</p>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto flex flex-col">
        {activePage === "settings" && (
          <SettingsPage
            user={user}
            onUserChange={setUser}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onProfilePersist={updateCurrentUserProfile}
            onAccountDeleted={() => {
              logout();
              navigate("/login");
            }}
          />
        )}

        {activePage !== "settings" && (
          <>
            <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-[#4a5565]"
                    aria-label="Open navigation menu"
                  >
                    ☰
                  </button>
                  <h1 className="text-lg sm:text-xl font-bold text-[#101828] capitalize">{activePage}</h1>
                </div>
                <p className="text-xs sm:text-sm text-[#99a1af]">Welcome back, {user?.name}</p>
              </div>
              {groups.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setCreateGroupOpen(true)}
                  className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold"
                >
                  + New Group
                </Button>
              )}
            </div>

            {activePage === "dashboard" && (
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
                {/* ── Analytics filter bar ── */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All Time" },
                      { key: "week", label: "Past Week" },
                      { key: "month", label: "Past Month" },
                      { key: "custom", label: "Custom Range" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAnalyticsFilter(key)}
                        className={`h-8 px-4 rounded-full text-xs font-semibold transition-colors border ${analyticsFilter === key
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-[#4a5565] border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {analyticsFilter === "custom" && (
                    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#99a1af]">From</label>
                        <input
                          type="date"
                          value={customFrom}
                          max={customTo || undefined}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-[#101828] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 cursor-pointer"
                        />
                      </div>
                      <span className="text-[#99a1af] text-sm mt-4">→</span>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#99a1af]">To</label>
                        <input
                          type="date"
                          value={customTo}
                          min={customFrom || undefined}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-[#101828] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 cursor-pointer"
                        />
                      </div>
                      {(customFrom || customTo) && (
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
                  )}
                </div>

                {/* ── Stats cards (USD) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    {
                      label: "Total Splits",
                      value: `${currencySymbol}${analyticsData.totalSplits.toFixed(2)}`,
                      sub: filteredForAnalytics.length > 0
                        ? `${filteredForAnalytics.length} expense${filteredForAnalytics.length !== 1 ? "s" : ""}`
                        : "No activity yet",
                      color: "text-indigo-600",
                    },
                    {
                      label: "You Owe",
                      value: `${currencySymbol}${analyticsData.youOwe.toFixed(2)}`,
                      sub: analyticsData.youOwe === 0 ? "All clear" : "Across all groups (USD)",
                      color: "text-rose-500",
                    },
                    {
                      label: "Owed to You",
                      value: `${currencySymbol}${analyticsData.owedToYou.toFixed(2)}`,
                      sub: analyticsData.owedToYou === 0 ? "No pending" : "Across all groups (USD)",
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

                {/* ── Recent Bills (last 10) - shows original currency ── */}
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
                      {allExpensesList.slice(0, 10).map((exp) => {
                        const expCurrency = exp.currency || "USD";
                        const expSymbol = getCurrencySymbol(expCurrency);
                        return (
                          <div key={exp.id} className="flex items-center gap-3.5 px-6 py-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
                              {exp.categoryEmoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#101828]">{exp.title}</p>
                              <p className="text-xs text-[#99a1af]">
                                {exp.group?.title ?? "Unknown group"} · {exp.paidBy} · {exp.date}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-[#101828]">
                                {expSymbol}{exp.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-[#99a1af]">{expCurrency}</p>
                            </div>
                          </div>
                        );
                      })}
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
                          <span className="text-xs font-medium bg-gray-100 text-[#6a7282] rounded-full px-2.5 py-1 mt-0.5">
                            {group.currency?.split("–")[0].trim()}
                          </span>
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