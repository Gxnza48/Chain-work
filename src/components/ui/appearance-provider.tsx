"use client";
import * as React from "react";
import { appearanceTokens, defaultAppearance, normalizeAppearance, type AppearanceSettings } from "@/lib/cojeev/appearance-tokens";

const storageKey = "cojeev-appearance";
const settingsEvent = "cojeev:appearance-settings";
let snapshot: AppearanceSettings | undefined;
function getSnapshot(): AppearanceSettings {
  if (!snapshot) {
    try {
      snapshot = normalizeAppearance(
        JSON.parse(localStorage.getItem(storageKey) ?? "null"),
      );
    } catch {
      snapshot = defaultAppearance;
    }
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      snapshot = undefined;
      listener();
    }
  };
  window.addEventListener(settingsEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(settingsEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}
export function setAppearance(value: AppearanceSettings) {
  snapshot = normalizeAppearance(value);
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    /* In-memory preferences still work. */
  }
  window.dispatchEvent(new Event(settingsEvent));
}
export function useAppearance() {
  const settings = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultAppearance,
  );
  return [settings, setAppearance] as const;
}

/** Mount once above the application. Shared tokens also reach portalled controls. */
export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const previous = new Map<string, string>();
    const apply = () => {
      const settings = getSnapshot();
      const mode = root.dataset.mode === "dark" ? "dark" : "light";
      const tokens = appearanceTokens(settings, mode);
      for (const [name, value] of Object.entries(tokens)) {
        if (!previous.has(name))
          previous.set(name, root.style.getPropertyValue(name));
        root.style.setProperty(name, value);
      }
      root.dataset.palette = settings.palette;
      root.dataset.contrast = String(settings.contrast);
      window.dispatchEvent(new Event("v-palette"));
      window.dispatchEvent(new Event("cojeev:appearancechange"));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    const stop = subscribe(schedule);
    // Theme changes must repaint in the same microtask, before a view-transition
    // takes its new-theme snapshot. Slider changes can be coalesced to one frame.
    const observer = new MutationObserver(apply);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });
    apply();
    return () => {
      stop();
      observer.disconnect();
      cancelAnimationFrame(frame);
      for (const [name, value] of previous) {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      }
      delete root.dataset.palette;
      delete root.dataset.contrast;
      window.dispatchEvent(new Event("v-palette"));
    };
  }, []);
  return children;
}

