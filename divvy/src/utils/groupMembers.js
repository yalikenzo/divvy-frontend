
export function normalizeGroupMembersForSplits(group) {
  const raw =
    group?.members?.length > 0
      ? group.members
      : (group?.participants ?? []).map((name, idx) => ({
          id: idx + 1,
          fullName: name,
        }));

  const rows = [];
  const seen = new Set();

  raw.forEach((member, idx) => {
    const name =
      member.fullName ||
      [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
      member.email ||
      "Member";

    const rawId = member.id;

    let id;
    if (rawId !== undefined && rawId !== null && rawId !== "") {
      if (typeof rawId === "number" && Number.isFinite(rawId)) id = rawId;
      else {
        const trimmed = String(rawId).trim();
        if (/^-?\d+$/.test(trimmed)) {
          id = Number(trimmed);
        } else {
          id = trimmed;
        }
      }
    } else {
      id = idx + 1;
    }

    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ id, name });
  });

  return rows;
}

export function participantIdLooksValid(id) {
  if (id === undefined || id === null || id === "") return false;
  if (typeof id === "number" && !Number.isFinite(id)) return false;
  return true;
}

export function coerceSplitUserId(raw, fallbackMemberId) {
  if (raw === undefined || raw === null || raw === "") return fallbackMemberId;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (/^-?\d+$/.test(s)) return Number(s);
  return s === "" ? fallbackMemberId : s;
}

export function expenseSplitHasMember(splitMemberIds, memberId) {
  return splitMemberIds.some((id) => String(id) === String(memberId));
}
