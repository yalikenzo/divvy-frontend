const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const currencySymbolFromGroup = (group) => (
  group?.currency?.includes("EUR") ? "€"
    : group?.currency?.includes("GBP") ? "£"
      : group?.currency?.includes("JPY") ? "¥"
        : "$"
);

export const normalizeGroupExpense = (expense, group, members = []) => {
  const payer = members.find((member) => Number(member.id) === Number(expense.payer_id));
  const totalAmount = toNumber(expense.total_amount, 0);
  const createdAt = expense.created_at ? new Date(expense.created_at) : new Date();
  const splitMembers = Array.isArray(expense.expenses_split)
    ? expense.expenses_split.map((split) => Number(split.user_id)).filter((id) => Number.isFinite(id))
    : [];

  return {
    id: Number(expense.id),
    payer_id: Number(expense.payer_id),
    group_id: Number(expense.group_id || group?.id),
    title: expense.name || "Expense",
    name: expense.name || "Expense",
    amount: totalAmount,
    total_amount: totalAmount,
    category: "Expense",
    categoryEmoji: "🧾",
    paidBy: payer?.fullName || payer?.email || "Unknown",
    date: createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    created_at: expense.created_at,
    share_type: expense.share_type || "EQUAL",
    expense_members: splitMembers,
    expenses_split: Array.isArray(expense.expenses_split) ? expense.expenses_split : [],
    expense_items: Array.isArray(expense.expense_items) ? expense.expense_items : [],
  };
};
