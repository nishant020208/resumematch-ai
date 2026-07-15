import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

const STORAGE_KEY = "theme";
const OVERRIDE_KEY = "theme:override";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [override, setOverride] = useState(false);

  useEffect(() => {
    const hasOverride = localStorage.getItem(OVERRIDE_KEY) === "1";
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    setOverride(hasOverride);
    setTheme(hasOverride && saved ? saved : systemTheme());
  }, []);

  // Follow system when the user hasn't manually overridden.
  useEffect(() => {
    if (override) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => setTheme(mq.matches ? "light" : "dark");
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [override]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{
      theme,
      toggle: () => {
        setOverride(true);
        localStorage.setItem(OVERRIDE_KEY, "1");
        setTheme(t => (t === "dark" ? "light" : "dark"));
      },
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);