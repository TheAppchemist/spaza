export function getPresetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (preset) {
    case "this-week": {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = new Date(today);
      start.setDate(start.getDate() + mondayOffset);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: endOfToday };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "all-time":
    default: {
      const start = new Date(1970, 0, 1);
      const end = new Date(2100, 0, 1);
      return { start, end };
    }
  }
}

export function toDateString(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function defaultCompareRanges() {
  const thisMonth = getPresetRange("this-month");
  const lastMonth = getPresetRange("last-month");
  return {
    rangeAStart: toDateString(thisMonth.start),
    rangeAEnd: toDateString(thisMonth.end),
    rangeBStart: toDateString(lastMonth.start),
    rangeBEnd: toDateString(lastMonth.end),
  };
}
