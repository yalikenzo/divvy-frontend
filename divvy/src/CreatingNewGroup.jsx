import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import GroupDetailPage from "./GroupDetailPage";

// Utils
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

//  Separator 
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

//  Button 
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

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

//  Card
export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

//  Input 
export const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

// Label 
const Label = ({ className, ...props }) => (
  <label className={cn("text-sm font-medium leading-none", className)} {...props} />
);

// Avatar 
const Avatar = ({ className, children }) => (
  <div className={cn("relative flex shrink-0 overflow-hidden rounded-full", className)}>{children}</div>
);
const AvatarFallback = ({ className, children }) => (
  <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-gray-100", className)}>
    {children}
  </div>
);

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
const SettingsPage = ({ user, onUserChange }) => {
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
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

  const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"];

   function handleSaveProfile() {
    onUserChange({
      name: displayName,
      email: email,
      initials: displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
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
              <p className="font-semibold text-indigo-950 text-sm">{user?.name}</p>
              <p className="text-[#6a7282] text-xs mt-0.5">Free Plan</p>
              <button className="mt-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">Change photo</button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-indigo-950 text-sm">Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 rounded-[10px] border-gray-200" />
            </div>
            <div className="flex justify-end mt-1">
              <Button onClick={handleSaveProfile} className={`h-10 px-5 rounded-[10px] border-0 font-semibold text-sm ${profileSaved ? "bg-emerald-400" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                {profileSaved ? "✓ Saved!" : "Save Changes"}
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
                <button className="h-9 px-4 rounded-[10px] bg-red-500 hover:bg-red-600 text-white transition-colors font-medium text-sm">Delete Account</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

// Create Group Modal
const CURRENCIES_LIST = ["USD – US Dollar", "EUR – Euro", "GBP – British Pound", "JPY – Japanese Yen", "CAD – Canadian Dollar"];

export const CreateGroupModal = ({ onClose, onCreate, user}) => {
  const [groupTitle, setGroupTitle] = useState("");
  const [currency, setCurrency] = useState("");
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const [participants, setParticipants] = useState([""]);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const addParticipant = () => setParticipants((p) => [...p, ""]);
  const updateParticipant = (i, val) => setParticipants((p) => p.map((v, idx) => idx === i ? val : v));
  const removeParticipant = (i) => setParticipants((p) => p.filter((_, idx) => idx !== i));

  const handleCreate = () => {
    if (!groupTitle.trim()) return;
    const newGroup = {
      id: Date.now(),
      title: groupTitle.trim(),
      currency: currency || "USD – US Dollar",
      participants: [user?.name ?? "Me", ...participants.filter((p) => p.trim())],
    };
    onCreate?.(newGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#00000066] backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-2xl shadow-[0px_25px_50px_-12px_#00000040] overflow-hidden">
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <h2 className="[font-family:'Outfit',Helvetica] font-semibold text-[#1e1b4b] text-2xl">Add new group</h2>
          <button ref={firstFocusRef} onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-[#99a1af] hover:bg-gray-100 transition-colors text-xl">×</button>
        </div>
        <div className="px-8 pt-6 pb-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Outfit',Helvetica] font-medium text-[#1e1b4b] text-sm">Group Title</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xl select-none pointer-events-none top-1/2 -translate-y-1/2"></span>
              <Input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="E.g. City Trip" className="h-[50px] pl-11 pr-4 rounded-[10px] border border-[#d1d5dc] text-base bg-white" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="[font-family:'Outfit',Helvetica] font-medium text-[#1e1b4b] text-sm">Currency</label>
            <div className="relative">
              <button type="button" onClick={() => setShowCurrencyDrop((v) => !v)} className="w-full h-[50px] px-4 rounded-[10px] border border-[#d1d5dc] bg-white flex items-center justify-between text-base hover:border-indigo-300 transition-colors focus:outline-none">
                <span className={currency ? "text-[#1e1b4b]" : "text-[#0a0a0a50]"}>{currency || "Select currency"}</span>
                <svg className={`w-4 h-4 text-[#99a1af] transition-transform ${showCurrencyDrop ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCurrencyDrop && (
                <div className="absolute top-[54px] left-0 right-0 bg-white border border-[#d1d5dc] rounded-[10px] shadow-lg z-20 overflow-hidden">
                  {CURRENCIES_LIST.map((c) => (
                    <button key={c} type="button" onClick={() => { setCurrency(c); setShowCurrencyDrop(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 transition-colors ${currency === c ? "bg-indigo-50 text-indigo-700 font-medium" : "text-[#364153]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="[font-family:'Outfit',Helvetica] font-medium text-[#1e1b4b] text-sm">Participants</label>
            <div className="flex items-center justify-between h-12 px-4 bg-gray-50 rounded-[10px]">
              <span className="[font-family:'Outfit',Helvetica] text-[#1e1b4b] text-base">{user?.name}</span>
              <span className="bg-green-400 text-white text-xs font-semibold rounded-full px-3 py-0.5">Me</span>
            </div>
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={p} onChange={(e) => updateParticipant(i, e.target.value)} placeholder="Participant Name" className="h-[50px] px-4 rounded-[10px] border border-[#d1d5dc] text-base bg-white" />
                {participants.length > 1 && (
                  <button type="button" onClick={() => removeParticipant(i)} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-[#99a1af] hover:bg-rose-50 hover:text-rose-400 transition-colors text-lg">×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addParticipant} className="flex items-center gap-2 w-fit group">
              <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-white text-sm group-hover:bg-green-500 transition-colors">+</div>
              <span className="[font-family:'Outfit',Helvetica] font-medium text-green-400 text-base group-hover:text-green-500 transition-colors">Add Another Participant</span>
            </button>
          </div>
          <Button onClick={handleCreate} disabled={!groupTitle.trim()} className="w-full h-14 bg-green-400 hover:bg-green-500 disabled:opacity-50 rounded-[10px] font-bold text-white text-base transition-colors mt-1">
            Create group
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main App
export const CreateGroup = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null); // ← tracks which group is open
  const [user, setUser] = useState({
  name: "Nursanat Mussa",
  email: "hello@divvyapp.com",
  initials: "NM",
  });

  const handleCreateGroup = (newGroup) => {
    setGroups((g) => [newGroup, ...g]);
    setActivePage("groups");
  };

  // If a group is selected, show GroupDetailPage
  if (selectedGroup) {
    return (
      <GroupDetailPage
        group={selectedGroup}
        groups={groups}
        user={user}
        onBack={() => setSelectedGroup(null)}
        onNavChange={(page) => { setSelectedGroup(null); setActivePage(page); }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
      <Sidebar activeNav={activePage} onNavChange={setActivePage} groupCount={groups.length} user={user} />

      <main className="flex-1 overflow-y-auto flex flex-col">
        {activePage === "settings" && <SettingsPage user={user} onUserChange={setUser} />}

        {activePage !== "settings" && (
          <>
            <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h1 className="text-xl font-bold text-[#101828] capitalize">{activePage}</h1>
                <p className="text-sm text-[#99a1af]">Welcome back, {user?.name}</p>
              </div>
              <Button onClick={() => setCreateGroupOpen(true)} className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold">
                + New Group
              </Button>
            </div>

            {activePage === "dashboard" && (
              <div className="px-8 py-8 flex flex-col gap-8">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: "Total Splits", value: "$0.00", sub: "No activity yet", color: "text-indigo-600" },
                    { label: "You Owe", value: "$0.00", sub: "All clear", color: "text-rose-500" },
                    { label: "Owed to You", value: "$0.00", sub: "No pending", color: "text-emerald-500" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm flex flex-col gap-1">
                      <span className="text-sm text-[#99a1af]">{s.label}</span>
                      <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                      <span className="text-xs text-[#4a5565]">{s.sub}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1fr_340px] gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <h2 className="font-semibold text-[#101828] text-base">Recent Bills</h2>
                    </div>
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <span className="text-4xl"></span>
                      <p className="font-semibold text-[#101828]">No bills yet</p>
                      <p className="text-sm text-[#99a1af]">Scan a receipt or create a group to get started</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] rounded-2xl p-6 flex flex-col gap-4 text-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl"></div>
                        <div>
                          <p className="font-semibold text-base">Scan a Receipt</p>
                          <p className="text-white/70 text-xs mt-0.5">AI-powered recognition</p>
                        </div>
                      </div>
                      <p className="text-white/80 text-sm">Snap a photo and Divvy splits the bill instantly.</p>
                      <Button className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-semibold text-sm h-10">Open Scanner</Button>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-[#101828] text-base">Friend Balances</h2>
                      </div>
                      <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                        <p className="text-sm text-[#99a1af]">No balances yet. Add friends to a group to get started.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === "groups" && (
              <div className="px-8 py-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#101828]">My Groups</h2>
                    <p className="text-sm text-[#99a1af] mt-0.5">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
                  </div>
                  <Button onClick={() => setCreateGroupOpen(true)} className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold">
                    + New Group
                  </Button>
                </div>

                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="text-5xl"></div>
                    <p className="font-semibold text-[#101828] text-lg">No groups yet</p>
                    <p className="text-sm text-[#99a1af] max-w-xs">Create your first group to start splitting bills with friends</p>
                    <Button onClick={() => setCreateGroupOpen(true)} className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white text-sm font-semibold mt-2">
                      + Create Group
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {groups.map((group) => (
                      // ← clicking a card opens GroupDetailPage
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
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
                      <span className="font-medium text-[#99a1af] group-hover:text-indigo-500 text-sm transition-colors">Create new group</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {createGroupOpen && (
          <CreateGroupModal onClose={() => setCreateGroupOpen(false)} onCreate={handleCreateGroup} user={user} />
        )}
      </main>
    </div>
  );
};

export default CreateGroup;