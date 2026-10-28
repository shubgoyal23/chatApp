import { useSyncExternalStore } from "react";

// "light" | "dark" | "system", persisted per browser and shared by all callers.
const listeners = new Set();
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

const read = () => {
   try {
      return localStorage.getItem("theme") || "system";
   } catch {
      return "system";
   }
};

let current = read();

const apply = () => {
   const dark = current === "dark" || (current === "system" && media().matches);
   document.documentElement.classList.toggle("dark", dark);
};

media().addEventListener("change", apply);
apply();

const setTheme = (theme) => {
   current = theme;
   try {
      localStorage.setItem("theme", theme);
   } catch {
      // private mode
   }
   apply();
   listeners.forEach((l) => l());
};

const subscribe = (l) => {
   listeners.add(l);
   return () => listeners.delete(l);
};

export function useTheme() {
   const theme = useSyncExternalStore(subscribe, () => current);
   return [theme, setTheme];
}
