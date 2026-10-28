const timeFmt = new Intl.DateTimeFormat(undefined, {
   hour: "numeric",
   minute: "2-digit",
});
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const shortDateFmt = new Intl.DateTimeFormat(undefined, {
   day: "numeric",
   month: "short",
});
const longDateFmt = new Intl.DateTimeFormat(undefined, {
   day: "numeric",
   month: "long",
   year: "numeric",
});

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = (date) =>
   Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

// epochs from the server are unix seconds
export const fromEpoch = (epoch) => new Date((epoch || 0) * 1000);

export const formatTime = (epoch) => timeFmt.format(fromEpoch(epoch));

// Label for the day separators inside a conversation.
export const formatDay = (epoch) => {
   const date = fromEpoch(epoch);
   const diff = daysAgo(date);
   if (diff === 0) return "Today";
   if (diff === 1) return "Yesterday";
   if (diff < 7) return weekdayFmt.format(date);
   return longDateFmt.format(date);
};

// Compact timestamp for the conversation list.
export const formatListTime = (epoch) => {
   if (!epoch) return "";
   const date = fromEpoch(epoch);
   const diff = daysAgo(date);
   if (diff === 0) return timeFmt.format(date);
   if (diff === 1) return "Yesterday";
   if (diff < 7) return weekdayFmt.format(date).slice(0, 3);
   return shortDateFmt.format(date);
};

export const dayKey = (epoch) => startOfDay(fromEpoch(epoch)).getTime();

export const initials = (name = "") =>
   name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";

// Stable per-user accent colour, used for avatars and group sender names.
const PALETTE = [
   ["#6366f1", "#8b5cf6"],
   ["#ec4899", "#f43f5e"],
   ["#14b8a6", "#06b6d4"],
   ["#f59e0b", "#f97316"],
   ["#22c55e", "#10b981"],
   ["#3b82f6", "#6366f1"],
   ["#a855f7", "#d946ef"],
   ["#ef4444", "#f97316"],
];
export const colorFor = (id = "") => {
   // FNV-1a: ObjectIds share long prefixes, so a weak hash collides
   let h = 0x811c9dc5;
   for (const c of String(id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
   h ^= h >>> 15;
   return PALETTE[(h >>> 0) % PALETTE.length];
};

export const debounce = (fn, ms) => {
   let t;
   const wrapped = (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
   };
   wrapped.cancel = () => clearTimeout(t);
   return wrapped;
};
