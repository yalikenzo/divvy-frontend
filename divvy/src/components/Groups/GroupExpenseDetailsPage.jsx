import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./CreatingNewGroup";
import { MobileBrandAndLogout } from "../MobileBrandAndLogout";
import { groupApi } from "../../api/groupApi";
import { currencySymbolFromGroup } from "../../utils/groupExpenseMapper";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildInitialItems = (expense, memberIds) => {
  const sourceItems = Array.isArray(expense?.items)
      ? expense.items
      : Array.isArray(expense?.expense_items)
          ? expense.expense_items
          : [];

  const splitEntries = Object.entries(expense?.item_splits || {});

  return sourceItems.map((item, idx) => {
    const splitKey = String(
        item?.id ??
        item?.expense_item_id ??
        item?.group_expense_item_id ??
        splitEntries[idx]?.[0] ??
        idx
    );
    const splitUsers = Array.isArray(expense?.item_splits?.[splitKey])
        ? expense.item_splits[splitKey].map(Number).filter((id) => Number.isFinite(id))
        : Array.isArray(splitEntries[idx]?.[1])
            ? splitEntries[idx][1].map(Number).filter((id) => Number.isFinite(id))
            : memberIds;

    const assignedShares = {};
    memberIds.forEach((memberId) => {
      assignedShares[memberId] = splitUsers.includes(memberId) ? 1 : 0;
    });

    return {
      id: item?.id ?? Date.now() + idx,
      backendItemId: Number.isFinite(Number(item?.id)) ? Number(item.id) : null,
      splitKey,
      name: item?.name || `Item ${idx + 1}`,
      price: toNumber(item?.price, 0),
      quantity: toNumber(item?.quantity, 1),
      assignedShares,
    };
  });
};

export const GroupExpenseDetailsPage = ({
                                          group,
                                          groups,
                                          user,
                                          expense: propExpense,
                                          onBack,
                                          onGroupNav,
                                          onExpenseUpdated,
                                        }) => {
  const currencySymbol = currencySymbolFromGroup(group);

  const members = useMemo(
      () =>
          (group?.members || [])
              .map((member) => ({
                id: Number(member.id),
                name:
                    member.fullName ||
                    [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
                    member.email ||
                    "Member",
              }))
              .filter((member) => Number.isFinite(member.id)),
      [group]
  );

  /* ── Data / Form state ── */
  const [expense, setExpense] = useState(propExpense);
  const [loading, setLoading] = useState(true);

  const [expenseName, setExpenseName] = useState("");
  const [paidById, setPaidById] = useState(0);
  const [shareType, setShareType] = useState("EQUAL");
  const [items, setItems] = useState([]);
  const [activeMemberIds, setActiveMemberIds] = useState([]);

  const [draftItemName, setDraftItemName] = useState("");
  const [draftItemPrice, setDraftItemPrice] = useState("");
  const [draftItemQty, setDraftItemQty] = useState("1");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [originalSnapshot, setOriginalSnapshot] = useState(null);
  const [updatedResponse, setUpdatedResponse] = useState(null);

  /* ── Fetch latest expense on mount ── */
  useEffect(() => {
    let cancelled = false;
    const fetchExpense = async () => {
      try {
        const response = await groupApi.getGroupExpenses(group.id);
        const data = response.data ?? response;
        const list = Array.isArray(data) ? data : [data];
        const found = list.find((e) => e.id === propExpense.id);
        if (!cancelled) setExpense(found || propExpense);
      } catch {
        if (!cancelled) setExpense(propExpense);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchExpense();
    return () => {
      cancelled = true;
    };
  }, [group.id, propExpense.id, propExpense]);

  /* ── Hydrate form from fetched expense ── */
  useEffect(() => {
    if (!expense || !members.length) return;

    const memberIds = members.map((m) => m.id);
    const splitIds = Array.isArray(expense.expenses_split)
        ? expense.expenses_split
            .map((s) => Number(s.user_id))
            .filter((id) => Number.isFinite(id))
        : [];
    const activeIds = splitIds.length > 0 ? splitIds : memberIds;
    const builtItems = buildInitialItems(expense, activeIds);

    setExpenseName(expense.name || expense.title || "");
    setPaidById(Number(expense.payer_id || members[0]?.id || 0));
    setShareType(expense.share_type || "EQUAL");
    setActiveMemberIds(activeIds);
    setItems(builtItems);

    setOriginalSnapshot({
      name: expense.name || expense.title || "",
      payer_id: Number(expense.payer_id || 0),
      share_type: expense.share_type || "EQUAL",
      activeMemberIds: [...activeIds].sort((a, b) => a - b),
      items: JSON.stringify(builtItems),
    });
    setUpdatedResponse(null);
  }, [expense, members]);

  /* ── Derived values ── */
  const expenseMembers = activeMemberIds.filter((id) => Number.isFinite(id));

  const normalizedItems = useMemo(
      () =>
          items.map((item) => ({
            ...item,
            total_price: Number((toNumber(item.price) * toNumber(item.quantity, 1)).toFixed(2)),
          })),
      [items]
  );

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.total_price, 0);

  const equalMap = useMemo(() => {
    const map = {};
    if (expenseMembers.length > 0) {
      const per = totalAmount / expenseMembers.length;
      expenseMembers.forEach((id) => {
        map[id] = Number(per.toFixed(2));
      });
    }
    return map;
  }, [expenseMembers, totalAmount]);

  const itemizedMap = useMemo(() => {
    const map = {};
    expenseMembers.forEach((id) => {
      map[id] = 0;
    });
    normalizedItems.forEach((item) => {
      const shares = item.assignedShares || {};
      const totalShares = Object.values(shares).reduce((s, x) => s + toNumber(x), 0);
      if (totalShares <= 0) return;
      expenseMembers.forEach((id) => {
        const memberShares = toNumber(shares[id]);
        if (memberShares > 0) {
          map[id] = Number((map[id] + (item.total_price * memberShares) / totalShares).toFixed(2));
        }
      });
    });
    return map;
  }, [normalizedItems, expenseMembers]);

  const activeShares = shareType === "ITEMIZED" ? itemizedMap : equalMap;

  /* ── Dirty check ── */
  const isDirty = useMemo(() => {
    if (!originalSnapshot) return false;
    return (
        expenseName !== originalSnapshot.name ||
        paidById !== originalSnapshot.payer_id ||
        shareType !== originalSnapshot.share_type ||
        JSON.stringify([...activeMemberIds].sort((a, b) => a - b)) !==
        JSON.stringify(originalSnapshot.activeMemberIds) ||
        JSON.stringify(items) !== originalSnapshot.items
    );
  }, [expenseName, paidById, shareType, activeMemberIds, items, originalSnapshot]);

  /* ── Handlers ── */
  const toggleMemberParticipation = (memberId) => {
    const isActive = expenseMembers.includes(memberId);
    if (isActive) {
      if (expenseMembers.length <= 1) return;
      const nextMembers = expenseMembers.filter((id) => id !== memberId);
      setActiveMemberIds(nextMembers);
      setItems((prev) =>
          prev.map((item) => {
            const nextShares = { ...(item.assignedShares || {}) };
            delete nextShares[memberId];
            return { ...item, assignedShares: nextShares };
          })
      );
      if (paidById === memberId) setPaidById(nextMembers[0] || 0);
      return;
    }
    const nextMembers = [...expenseMembers, memberId];
    setActiveMemberIds(nextMembers);
    setItems((prev) =>
        prev.map((item) => {
          const nextShares = { ...(item.assignedShares || {}) };
          if (!Object.prototype.hasOwnProperty.call(nextShares, memberId)) {
            nextShares[memberId] = 1;
          }
          return { ...item, assignedShares: nextShares };
        })
    );
  };

  const updateShares = (itemId, memberId, diff) => {
    setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const next = { ...item, assignedShares: { ...(item.assignedShares || {}) } };
          const current = toNumber(next.assignedShares[memberId]);
          next.assignedShares[memberId] = Math.max(0, current + diff);
          return next;
        })
    );
  };

  const addItem = () => {
    const name = draftItemName.trim();
    const price = toNumber(draftItemPrice, NaN);
    const quantity = toNumber(draftItemQty || 1, NaN);
    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter valid item data");
      return;
    }
    const assignedShares = {};
    expenseMembers.forEach((id) => {
      assignedShares[id] = 1;
    });
    setItems((prev) => [
      ...prev,
      { id: Date.now(), backendItemId: null, name, price, quantity, assignedShares },
    ]);
    setDraftItemName("");
    setDraftItemPrice("");
    setDraftItemQty("1");
    setError("");
  };

  const handleSave = async () => {
    if (!isDirty) return;
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
        id: Number(expense.id),
        payer_id: paidById,
        group_id: Number(expense.group_id || group?.id),
        name: expenseName.trim(),
        currency: (group?.currency?.split("–")[0] || "USD").trim(),
        total_amount: Number(totalAmount.toFixed(2)),
        share_type: shareType,
        expense_members: expenseMembers,
        exact_share_amount: {},
        percentage_share_amount: {},
        expense_items: normalizedItems.map((item) => ({
          id: item.backendItemId || 0,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          total_price: Number(item.total_price),
          assigned_user_ids:
              shareType === "ITEMIZED"
                  ? Object.entries(item.assignedShares || {})
                      .filter(([, shares]) => shares > 0)
                      .map(([id]) => Number(id))
                  : expenseMembers,
        })),
      };

      const updated = await groupApi.updateGroupExpense(payload);
      setUpdatedResponse(updated);
      onExpenseUpdated?.(updated);

      /* Reset snapshot so dirty becomes false */
      const newActiveIds = Array.isArray(updated.expenses_split)
          ? updated.expenses_split
              .map((s) => Number(s.user_id))
              .filter((id) => Number.isFinite(id))
          : expenseMembers;
      const newItems = buildInitialItems(updated, newActiveIds);
      setOriginalSnapshot({
        name: updated.name || "",
        payer_id: Number(updated.payer_id || 0),
        share_type: updated.share_type || "EQUAL",
        activeMemberIds: [...newActiveIds].sort((a, b) => a - b),
        items: JSON.stringify(newItems),
      });
      setExpense(updated);
    } catch (saveError) {
      setError(saveError?.message || "Failed to update expense");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
          <div className="hidden lg:block">
            <Sidebar activeNav="groups" onNavChange={onGroupNav} groupCount={groups.length} user={user} />
          </div>
          <main className="flex flex-1 flex-col overflow-y-auto">
            <MobileBrandAndLogout />
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gray-400">Loading expense…</p>
            </div>
          </main>
        </div>
    );
  }

  return (
      <div className="flex h-screen bg-gray-50 overflow-hidden [font-family:'Outfit',Helvetica]">
        <div className="hidden lg:block">
          <Sidebar activeNav="groups" onNavChange={onGroupNav} groupCount={groups.length} user={user} />
        </div>

        <main className="flex-1 overflow-y-auto">
          <MobileBrandAndLogout />
          <section className="mx-auto w-full max-w-3xl px-4 sm:px-8 py-6 sm:py-8 text-[#101828]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                  type="button"
                  onClick={onBack}
                  className="text-sm text-[#6a7282] hover:text-[#101828] transition-colors"
              >
                Back to Group
              </button>
              <h2 className="text-base sm:text-lg font-semibold">Update Expense</h2>
              <div className="w-20" />
            </div>

            {/* Title + Payer + Split Type */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="md:col-span-2 h-11 rounded-lg px-3 text-[#101828] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Expense title"
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6a7282]">
                  Paid By
                </label>
                <select
                    value={paidById}
                    onChange={(e) => setPaidById(Number(e.target.value))}
                    className="h-11 w-full rounded-lg px-3 text-[#101828] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {members
                      .filter((m) => expenseMembers.includes(m.id))
                      .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                      ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6a7282]">
                  Split Type
                </label>
                <select
                    value={shareType}
                    onChange={(e) => setShareType(e.target.value)}
                    className="h-11 w-full rounded-lg px-3 text-[#101828] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="EQUAL">Equal</option>
                  <option value="ITEMIZED">Itemized</option>
                </select>
              </div>
            </div>

            {/* Items */}
            <div className="mt-5 space-y-3">
              {normalizedItems.map((item) => (
                  <div
                      key={item.id}
                      className="rounded-xl bg-white border border-gray-100 p-4 shadow-[0px_1px_3px_#0000000a]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-full">
                        <input
                            value={item.name}
                            onChange={(e) =>
                                setItems((prev) =>
                                    prev.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x))
                                )
                            }
                            className="h-11 rounded-lg px-3 text-[#101828] border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-[#6a7282] font-semibold">
                              Price
                            </label>
                            <input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                    setItems((prev) =>
                                        prev.map((x) =>
                                            x.id === item.id ? { ...x, price: toNumber(e.target.value) } : x
                                        )
                                    )
                                }
                                className="mt-0.5 h-10 rounded-lg px-3 text-[#101828] border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-[#6a7282] font-semibold">
                              Quantity
                            </label>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                    setItems((prev) =>
                                        prev.map((x) =>
                                            x.id === item.id
                                                ? { ...x, quantity: toNumber(e.target.value, 1) }
                                                : x
                                        )
                                    )
                                }
                                className="mt-0.5 h-10 rounded-lg px-3 text-[#101828] border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-[#6a7282]">
                          Total: {currencySymbol}
                          {item.total_price.toFixed(2)}
                        </p>
                      </div>
                      <button
                          type="button"
                          onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                          className="text-red-500 hover:text-red-600 transition-colors mt-2"
                      >
                        ✕
                      </button>
                    </div>

                    {shareType === "ITEMIZED" && (
                        <div className="mt-3 space-y-2">
                          {members
                              .filter((member) => expenseMembers.includes(member.id))
                              .map((member) => {
                                const shares = item.assignedShares?.[member.id] || 0;
                                const isPayingForItem = shares > 0;
                                return (
                                    <div
                                        key={`${item.id}-${member.id}`}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                                            isPayingForItem
                                                ? "bg-emerald-50 border-emerald-200"
                                                : "bg-gray-50 border-gray-200"
                                        }`}
                                    >
                                      <span className="text-sm">{member.name}</span>
                                      <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="w-7 h-7 rounded border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-[#101828]"
                                            onClick={() => updateShares(item.id, member.id, -1)}
                                        >
                                          -
                                        </button>
                                        <span
                                            className={`min-w-6 text-center ${
                                                isPayingForItem ? "text-emerald-600 font-semibold" : "text-gray-500"
                                            }`}
                                        >
                                {shares}
                              </span>
                                        <button
                                            type="button"
                                            className="w-7 h-7 rounded border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-[#101828]"
                                            onClick={() => updateShares(item.id, member.id, 1)}
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

            {/* Add New Item */}
            <div className="mt-5 rounded-xl bg-white border border-gray-100 p-4 shadow-[0px_1px_3px_#0000000a]">
              <p className="text-sm font-semibold mb-3">Add New Item</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                    value={draftItemName}
                    onChange={(e) => setDraftItemName(e.target.value)}
                    placeholder="Description"
                    className="h-10 rounded-md border border-gray-200 px-3 text-[#101828] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <input
                    value={draftItemPrice}
                    onChange={(e) => setDraftItemPrice(e.target.value)}
                    placeholder="Price"
                    type="number"
                    className="h-10 rounded-md border border-gray-200 px-3 text-[#101828] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <input
                    value={draftItemQty}
                    onChange={(e) => setDraftItemQty(e.target.value)}
                    placeholder="Qty"
                    type="number"
                    className="h-10 rounded-md border border-gray-200 px-3 text-[#101828] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 w-full h-10 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium text-[#101828] transition-colors"
              >
                + Add Item
              </button>
            </div>

            {/* Split Summary */}
            <div className="mt-5 rounded-xl bg-white border border-gray-100 p-4 shadow-[0px_1px_3px_#0000000a]">
              <p className="text-sm font-semibold mb-3">Split Summary</p>
              <div className="space-y-2">
                {members.map((member) => (
                    <div
                        key={`summary-${member.id}`}
                        className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleMemberParticipation(member.id)}
                            className={`h-5 w-5 rounded-full border flex items-center justify-center text-[11px] transition-colors ${
                                expenseMembers.includes(member.id)
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "bg-white border-gray-300 text-transparent"
                            }`}
                            aria-label={`${
                                expenseMembers.includes(member.id) ? "Disable" : "Enable"
                            } ${member.name} in expense`}
                            disabled={expenseMembers.length <= 1 && expenseMembers.includes(member.id)}
                        >
                          ✓
                        </button>
                        <span
                            className={`text-sm ${
                                expenseMembers.includes(member.id) ? "text-[#101828]" : "text-gray-400"
                            }`}
                        >
                      {member.name}
                    </span>
                      </div>
                      <span
                          className={`text-sm font-semibold ${
                              expenseMembers.includes(member.id) ? "text-emerald-600" : "text-gray-400"
                          }`}
                      >
                    {currencySymbol}
                        {(expenseMembers.includes(member.id) ? activeShares[member.id] || 0 : 0).toFixed(
                            2
                        )}
                  </span>
                    </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            {/* Save */}
            <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="mt-5 mb-3 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
            >
              {isSaving
                  ? "Saving…"
                  : `Save Changes — ${currencySymbol}${totalAmount.toFixed(2)}`}
            </button>

            {/* Returned backend data */}
            {updatedResponse && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <p className="text-sm font-semibold text-emerald-800 mb-3">Updated Expense Data</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100">
                      <span className="text-xs text-[#6a7282] uppercase tracking-wide">ID</span>
                      <span className="text-sm font-medium text-[#101828]">{updatedResponse.id}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100">
                      <span className="text-xs text-[#6a7282] uppercase tracking-wide">Name</span>
                      <span className="text-sm font-medium text-[#101828]">{updatedResponse.name}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100">
                      <span className="text-xs text-[#6a7282] uppercase tracking-wide">Total</span>
                      <span className="text-sm font-semibold text-emerald-600">
                    {currencySymbol}
                        {Number(updatedResponse.total_amount || 0).toFixed(2)}
                  </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100">
                      <span className="text-xs text-[#6a7282] uppercase tracking-wide">Payer ID</span>
                      <span className="text-sm font-medium text-[#101828]">
                    {updatedResponse.payer_id}
                  </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100">
                      <span className="text-xs text-[#6a7282] uppercase tracking-wide">Share Type</span>
                      <span className="text-sm font-medium text-[#101828]">
                    {updatedResponse.share_type}
                  </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100">
                      <span className="text-xs text-[#6a7282] uppercase tracking-wide">Items Count</span>
                      <span className="text-sm font-medium text-[#101828]">
                    {updatedResponse.items?.length || updatedResponse.expense_items?.length || 0}
                  </span>
                    </div>

                    {Array.isArray(updatedResponse.expenses_split) &&
                        updatedResponse.expenses_split.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-[#6a7282] uppercase tracking-wide mb-2">
                                Split Rows
                              </p>
                              <div className="space-y-1.5">
                                {updatedResponse.expenses_split.map((split, idx) => {
                                  const member = members.find((m) => m.id === Number(split.user_id));
                                  return (
                                      <div
                                          key={idx}
                                          className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100"
                                      >
                              <span className="text-sm text-[#101828]">
                                {member?.name || `User #${split.user_id}`}
                              </span>
                                        <span className="text-sm font-semibold text-[#101828]">
                                {currencySymbol}
                                          {Number(split.owed_amount || 0).toFixed(2)}
                              </span>
                                      </div>
                                  );
                                })}
                              </div>
                            </div>
                        )}
                  </div>
                </div>
            )}
          </section>
        </main>
      </div>
  );
};
