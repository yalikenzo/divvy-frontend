import { useEffect, useRef, useState } from "react";
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { useParams, useNavigate } from "react-router-dom";
import GroupDetailPage from "./GroupDetailPage";
import { cn } from "./utils/cn";
import { Button, Input, Card, CardContent, Avatar, AvatarFallback, Label } from "./components/ui/FormComponents";
import { CreateGroupModal } from "./components/Groups/CreateGroupModal";
import { groupApi } from "./api/groupApi";
import { useAuth } from "./hooks/useAuth";

// Separator 
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


//  Shared Sidebar 
export const Sidebar = ({ activeNav, onNavChange, groupCount = 0, user }) => (
  <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 h-full">
    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
      <span className="font-bold text-[#101828] text-xl tracking-wide">Divvy</span>
    </div>
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {[
        { id: "dashboard", label: "Dashboard", icon: "⊞" },
        { id: "groups", label: "Groups", icon: "◎" },
        { id: "settings", label: "Settings", icon: "⚙" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => onNavChange(item.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full ${
            activeNav === item.id ? "bg-indigo-50 text-indigo-600" : "text-[#4a5565] hover:bg-gray-50 hover:text-[#101828]"
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

// Empty State
const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
    <div className="text-5xl">{icon}</div>
    <p className="font-semibold text-[#101828] text-lg">{title}</p>
    <p className="text-sm text-[#99a1af] max-w-xs">{subtitle}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// Settings helpers
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
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-emerald-500" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

// Settings Page
const SettingsPage = ({
  user,
  onProfileSave,
  isSavingProfile = false,
  onDeleteAccount,
  isDeletingAccount = false,
  accountDeleteError = null,
}) => {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email] = useState(user?.email || "");
  const [profileSaved, setProfileSaved] = useState(false);
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
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

  const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"];

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
  }, [user?.firstName, user?.lastName]);

  const hasProfileChanges =
    firstName.trim() !== (user?.firstName || "").trim() ||
    lastName.trim() !== (user?.lastName || "").trim();

  async function handleSaveProfile() {
    if (!hasProfileChanges || !firstName.trim() || !lastName.trim() || isSavingProfile) return;
    await onProfileSave(firstName.trim(), lastName.trim());
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function handleDeleteAccount() {
    if (isDeletingAccount) return;
    const isConfirmed = window.confirm("Are you sure you want to permanently delete your account?");
    if (!isConfirmed) return;

    await onDeleteAccount();
    setAccountDeleted(true);
  }

  function handleChangePassword() {
    setPwError(""); setPwSuccess(false);
    if (!currentPw) return setPwError("Please enter your current password.");
    if (newPw.length < 6) return setPwError("New password must be at least 6 characters.");
    if (newPw !== confirmPw) return setPwError("New passwords do not match.");
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 2500);
  }

  return (
    <main className="flex flex-col flex-1 h-full gap-6 pt-8 pb-8 px-8 overflow-auto">
      <header className="flex items-center justify-between w-full h-14 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Outfit',Helvetica] font-bold text-indigo-950 text-2xl leading-8">Settings</h1>
          <p className="[font-family:'Outfit',Helvetica] font-normal text-[#6a7282] text-sm leading-5">Manage your account and preferences</p>
        </div>
      </header>
      <div className="flex flex-col gap-5 w-full max-w-2xl">
        <Section title="Profile" description="Update your personal information">
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">{user?.initials || "NM"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-indigo-950 text-sm">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}</p>
              <p className="text-[#6a7282] text-xs mt-0.5">Free Plan</p>
              <button className="mt-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">Change photo</button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">First Name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Email Address</Label>
              <Input type="email" value={email} disabled className="h-11 rounded-[10px] border-gray-200 bg-gray-100 text-gray-400" />
            </div>
            <div className="flex justify-end mt-1">
              <Button
                onClick={handleSaveProfile}
                disabled={!hasProfileChanges || !firstName.trim() || !lastName.trim() || isSavingProfile}
                className={`h-10 px-5 rounded-[10px] border-0 font-semibold text-sm ${profileSaved ? "bg-emerald-400" : "bg-emerald-500 hover:bg-emerald-600"}`}
              >
                {isSavingProfile ? "Saving..." : profileSaved ? "✓ Saved!" : "Save Changes"}
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
                  <select value={value} onChange={e => onChange(e.target.value)} className="w-full h-11 pl-4 pr-10 rounded-[10px] border border-gray-200 bg-white text-indigo-950 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-400">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
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

        <Section title="Security" description="Manage your password and account security">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Current Password</Label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">New Password</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Confirm New Password</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" className="h-11 rounded-[10px] border-gray-200" />
            </div>
            {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
            {pwSuccess && <p className="text-emerald-500 text-xs">✓ Password updated successfully!</p>}
            <div className="flex justify-end mt-1">
              <Button onClick={handleChangePassword} className="h-10 px-5 rounded-[10px] border-0 bg-emerald-500 hover:bg-emerald-600 font-semibold text-sm">Update Password</Button>
            </div>
          </div>
        </Section>

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
                <button className="h-9 px-4 rounded-[10px] border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors font-medium text-sm">Clear Data</button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-indigo-950 text-sm">Delete Account</p>
                  <p className="text-[#6a7282] text-xs mt-0.5">Permanently remove your account and all associated data</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || accountDeleted}
                  className="h-9 px-4 rounded-[10px] bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors font-medium text-sm"
                >
                  {isDeletingAccount ? "Deleting..." : accountDeleted ? "Deleted" : "Delete Account"}
                </button>
              </div>
              {accountDeleteError && <p className="text-red-500 text-xs">{accountDeleteError}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};


// Main App
export const CreateGroup = () => {
  const { user: authUser, updateProfile, deleteAccount } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("dashboard");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [allExpenses, setAllExpenses] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [user, setUser] = useState({
    firstName: authUser?.first_name || "",
    lastName: authUser?.last_name || "",
    name: authUser?.getFullName() || "User",
    email: authUser?.email || "",
    initials: (authUser?.first_name?.[0] || "") + (authUser?.last_name?.[0] || "") || "U",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountDeleteError, setAccountDeleteError] = useState(null);

  useEffect(() => {
    setUser({
      firstName: authUser?.first_name || "",
      lastName: authUser?.last_name || "",
      name: authUser?.getFullName() || "User",
      email: authUser?.email || "",
      initials: (authUser?.first_name?.[0] || "") + (authUser?.last_name?.[0] || "") || "U",
    });
  }, [authUser]);

  // Загружаем группы при монтировании
  useEffect(() => {
    loadGroups();
  }, []);

  // Открываем группу по URL параметру
  useEffect(() => {
    if (groupId && groups.length > 0) {
      const group = groups.find(g => g.id === parseInt(groupId));
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
      // Преобразуем в формат, который использует компонент
      const mappedGroups = fetchedGroups.map(group => ({
        id: group.id,
        title: group.name,
        currency: group.currency,
        participants: [user.name], // TODO: добавить реальных участников когда API будет готов
        invitation_link: group.invitation_link,
      }));
      setGroups(mappedGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleCreateGroup = async (newGroup) => {
    // Преобразуем Group объект в формат компонента
    const mappedGroup = {
      id: newGroup.id,
      title: newGroup.name,
      currency: newGroup.currency,
      participants: [user.name],
      invitation_link: newGroup.invitation_link,
    };
    setGroups((g) => [mappedGroup, ...g]);
    setActivePage("groups");
  };

  // Обработчик обновления группы
  const handleGroupUpdated = (updatedGroup) => {
    const mappedGroup = {
      id: updatedGroup.id,
      title: updatedGroup.name,
      name: updatedGroup.name,
      currency: updatedGroup.currency,
      participants: selectedGroup?.participants || [user.name],
      invitation_link: updatedGroup.invitation_link,
    };

    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? mappedGroup : g));
    setSelectedGroup(mappedGroup);
  };

  const handleProfileSave = async (firstName, lastName) => {
    setIsSavingProfile(true);
    try {
      await updateProfile(firstName, lastName);
      setUser(prev => ({
        ...prev,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        initials: `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U",
      }));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setAccountDeleteError(null);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      setAccountDeleteError(error?.data?.detail || error?.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // If a group is selected, show GroupDetailPage
  if (selectedGroup) {
    return (
      <GroupDetailPage
        group={selectedGroup}
        groups={groups}
        user={user}
        expenses={allExpenses[selectedGroup?.id] ?? []}
        onExpensesChange={(updated) => setAllExpenses(prev => ({ ...prev, [selectedGroup.id]: updated }))}
        onBack={() => {
          setSelectedGroup(null);
          navigate('/groups');
        }}
        onNavChange={(page) => {
          setSelectedGroup(null);
          setActivePage(page);
          navigate(`/${page}`);
        }}
        onGroupUpdated={handleGroupUpdated}
      />
    );
  }
  // Compute dashboard stats across all groups
  const allExpensesList = Object.entries(allExpenses).flatMap(([groupId, exps]) => {
    const group = groups.find(g => g.id === Number(groupId));
    return exps.map(e => ({ ...e, group }));
  });

  const totalSplits = allExpensesList.reduce((s, e) => s + e.amount, 0);

  const youOwe = allExpensesList.reduce((s, e) => {
    if (!e.group) return s;
    const members = e.group.participants.length;
    const share = e.amount / members;
    if (e.paidBy !== user.name) return s + share;
    return s;
  }, 0);

  const owedToYou = allExpensesList.reduce((s, e) => {
    if (!e.group) return s;
    const members = e.group.participants.length;
    const share = e.amount / members;
    if (e.paidBy === user.name) return s + (e.amount - share);
    return s;
  }, 0);

  const currencySymbol = "$";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
      {/* Sidebar скрыт на мобильных, показывается на lg+ */}
      <div className="hidden lg:block">
        <Sidebar activeNav={activePage} onNavChange={setActivePage} groupCount={groups.length} user={user} />
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col">
        {activePage === "settings" && (
          <SettingsPage
            user={user}
            onProfileSave={handleProfileSave}
            isSavingProfile={isSavingProfile}
            onDeleteAccount={handleDeleteAccount}
            isDeletingAccount={isDeletingAccount}
            accountDeleteError={accountDeleteError}
          />
        )}

        {activePage !== "settings" && (
          <>
            <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#101828] capitalize">{activePage}</h1>
                <p className="text-xs sm:text-sm text-[#99a1af]">Welcome back, {user?.name}</p>
              </div>
              {groups.length > 0 && (
                <Button onClick={() => setCreateGroupOpen(true)} className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold">
                  + New Group
                </Button>
              )}
            </div>

            {activePage === "dashboard" && (
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { label: "Total Splits", value: `${currencySymbol}${totalSplits.toFixed(2)}`, sub: allExpensesList.length > 0 ? `${allExpensesList.length} expense${allExpensesList.length !== 1 ? "s" : ""}` : "No activity yet", color: "text-indigo-600" },
                    { label: "You Owe", value: `${currencySymbol}${youOwe.toFixed(2)}`, sub: youOwe === 0 ? "All clear" : "Across all groups", color: "text-rose-500" },
                    { label: "Owed to You", value: `${currencySymbol}${owedToYou.toFixed(2)}`, sub: owedToYou === 0 ? "No pending" : "Across all groups", color: "text-emerald-500" },
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
                      <span className="text-xs text-[#99a1af]">{allExpensesList.length} total</span>
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
                            <p className="text-sm font-bold text-[#101828]">{currencySymbol}{exp.amount.toFixed(2)}</p>
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
                    <h2 className="text-xl font-bold text-[#101828]">My Groups</h2>
                    <p className="text-sm text-[#99a1af] mt-0.5">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="text-5xl">📁</div>
                    <p className="font-semibold text-[#101828] text-lg">No groups yet</p>
                    <p className="text-sm text-[#99a1af] max-w-xs">Create your first group to start splitting bills with friends</p>
                    <Button onClick={() => setCreateGroupOpen(true)} className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold mt-2">
                      + Create group
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {groups.map((group) => (
                      // ← clicking a card opens GroupDetailPage
                      <div
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group);
                          navigate(`/groups/${group.id}`);
                        }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0"></div>
                          <span className="text-xs font-medium bg-gray-100 text-[#6a7282] rounded-full px-2.5 py-1 mt-0.5">{group.currency.split("–")[0].trim()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#101828] text-base">{group.title}</p>
                          <p className="text-xs text-[#99a1af] mt-1">{group.participants.length} member{group.participants.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {group.participants.slice(0, 4).map((name, i) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] flex items-center justify-center text-white text-xs font-bold border-2 border-white -ml-1 first:ml-0" title={name}>
                              {name[0]}
                            </div>
                          ))}
                          {group.participants.length > 4 && <span className="text-xs text-[#99a1af] ml-1">+{group.participants.length - 4}</span>}
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                          <span className="text-sm font-bold text-[#101828]">$0.00</span>
                          <span className="text-xs text-emerald-500 font-medium">All settled up</span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setCreateGroupOpen(true)} className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer min-h-[180px] group">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-400 text-2xl transition-colors">+</div>
                      <span className="font-medium text-[#99a1af] group-hover:text-indigo-500 text-sm transition-colors">Create group</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {createGroupOpen && (
          <CreateGroupModal 
            onClose={() => setCreateGroupOpen(false)} 
            onGroupCreated={handleCreateGroup}
          />
        )}
      </main>
    </div>
  );
};

export default CreateGroup;