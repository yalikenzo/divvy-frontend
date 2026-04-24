import { useState } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sidebar } from "./CreatingNewGroup"; // shared Sidebar from main app

// ── Utils ─────────────────────────────────────────────────────────────────────
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── Button ────────────────────────────────────────────────────────────────────
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

// ── Card ──────────────────────────────────────────────────────────────────────
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ── Tabs ──────────────────────────────────────────────────────────────────────
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

// ── Tab content ───────────────────────────────────────────────────────────────
const ExpensesContent = ({ group }) => {
  const currencySymbol = group?.currency?.includes("EUR") ? "€"
    : group?.currency?.includes("GBP") ? "£"
    : group?.currency?.includes("JPY") ? "¥"
    : "$";

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { label: "My Expenses", amount: `${currencySymbol}0.00` },
          { label: "Total Expenses", amount: `${currencySymbol}0.00` },
        ].map((card) => (
          <Card key={card.label} className="rounded-[14px] border-0 bg-white shadow-[0px_1px_3px_#0000000a]">
            <CardContent className="flex min-h-[88.5px] flex-col justify-center px-4 py-4">
              <p className="[font-family:'Outfit',Helvetica] text-[13px] font-normal text-gray-400">{card.label}</p>
              <p className="[font-family:'Outfit',Helvetica] text-[22px] font-bold text-indigo-950">{card.amount}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="text-5xl"></span>
        <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No expenses yet</p>
        <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Add your first expense to get started</p>
      </div>
      <div className="flex min-h-[120px] flex-1 items-end justify-center">
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
            aria-label="Add Expense"
          >
            +
          </button>
          <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">Add Expense</span>
        </div>
      </div>
    </div>
  );
};

const BalancesContent = ({ group }) => {
  const currencySymbol = group?.currency?.includes("EUR") ? "€"
    : group?.currency?.includes("GBP") ? "£"
    : group?.currency?.includes("JPY") ? "¥"
    : "$";

  return (
    <div className="flex w-full flex-col gap-5">
      <Card className="rounded-[14px] border-0 bg-white shadow-[0px_1px_3px_#0000000a]">
        <CardContent className="flex min-h-[88.5px] flex-col justify-center px-4 py-4">
          <p className="[font-family:'Outfit',Helvetica] text-[13px] font-normal text-gray-400">Net Balance</p>
          <p className="[font-family:'Outfit',Helvetica] text-[22px] font-bold text-indigo-950">{currencySymbol}0.00</p>
        </CardContent>
      </Card>

      {/* Member balances list */}
      <div className="flex flex-col gap-2">
        {group?.participants?.map((name, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,rgba(79,70,229,1)_0%,rgba(16,185,129,1)_100%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {name[0]}
              </div>
              <span className="text-sm font-medium text-indigo-950">{name}</span>
              {name === "Nursanat Mussa" && (
                <span className="text-xs bg-green-100 text-green-600 font-semibold rounded-full px-2 py-0.5">Me</span>
              )}
            </div>
            <span className="text-sm font-semibold text-emerald-500">{currencySymbol}0.00</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <span className="text-4xl"></span>
        <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">All settled up</p>
        <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">No outstanding balances in this group</p>
      </div>
    </div>
  );
};

const PhotosContent = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
    <span className="text-5xl"></span>
    <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No photos yet</p>
    <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Photos attached to expenses will appear here</p>
  </div>
);

const ReceiptsContent = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
    <span className="text-5xl"></span>
    <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">No receipts yet</p>
    <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">Receipts attached to expenses will appear here</p>
  </div>
);

// ── Expense Overview ──────────────────────────────────────────────────────────
const overviewTabs = [
  { value: "expenses", label: "Expenses" },
  { value: "balances", label: "Balances" },
  { value: "photos", label: "Photos" },
  { value: "receipts", label: "Receipts" },
];

// Derive a consistent gradient color from group id or title
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

  const currencyCode = group?.currency?.split("–")[0]?.trim() ?? "USD";

  const renderContent = () => {
    switch (activeTab) {
      case "expenses": return <ExpensesContent group={group} />;
      case "balances": return <BalancesContent group={group} />;
      case "photos":   return <PhotosContent />;
      case "receipts": return <ReceiptsContent />;
      default:         return <ExpensesContent group={group} />;
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
          {/* Currency badge */}
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
          {/* Member avatars */}
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
    </section>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
// Props from CreateGroup.jsx:
//   group      – the group object that was clicked
//   groups     – all groups (for sidebar count)
//   onBack     – called when user clicks "Back to Groups"
//   onNavChange – called when user navigates via sidebar
const GroupDetailPage = ({ group, groups = [], onBack, onNavChange }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
      {/* Reuse the shared Sidebar from CreateGroup.jsx */}
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