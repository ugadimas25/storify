import { useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "storify-theme";

let listeners: (() => void)[] = [];

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "system";
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

// Initialize on load
applyTheme(getStoredTheme());

// Listen for system preference changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (getStoredTheme() === "system") {
    applyTheme("system");
    listeners.forEach((l) => l());
  }
});

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): Theme {
  return getStoredTheme();
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyTheme(theme);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system" as Theme);
  const isDark = getResolvedTheme(theme) === "dark";
  return { theme, setTheme, isDark };
}
