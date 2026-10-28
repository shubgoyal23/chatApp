// Minimal toast bus: any module can call toast(...), <Toaster /> renders them.
const listeners = new Set();
let id = 0;

export const toast = (message, type = "info", duration = 3500) => {
   const t = { id: ++id, message, type, duration };
   listeners.forEach((l) => l(t));
   return t.id;
};
toast.success = (m, d) => toast(m, "success", d);
toast.error = (m, d) => toast(m, "error", d ?? 5000);
toast.info = (m, d) => toast(m, "info", d);

export const subscribeToasts = (listener) => {
   listeners.add(listener);
   return () => listeners.delete(listener);
};
