"use client";

import { Moon, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function ThemeSwitcher() {
  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((state) => ({
      themeMode: state.values.theme_mode,
      setPreference: state.setPreference,
    })),
  );
  const gelap = themeMode === "dark";

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setPreference("theme_mode", gelap ? "light" : "dark")}
      aria-label={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      aria-pressed={gelap}
    >
      {gelap ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
