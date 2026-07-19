"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenText, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "../providers/auth-provider";
import { signInWithGoogle } from "@/lib/supabase/signInWithGoogle";
import signOutUsecase from "@/feature/core/user/domain/usecase/sign-out.usecase";
import { GeneralSettingsModal } from "../common/settings-modal";
import { Settings } from "@/feature/core/settings/domain/entity/settings.entity";

export function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<Settings>({
    allowGlobalVocabulary: false,
  });

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let isActive = true;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");

        if (!response.ok) {
          throw new Error("Failed to load settings");
        }

        const payload = await response.json();

        if (isActive && payload.success) {
          setCurrentSettings(payload.data.settings);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    void loadSettings();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (nextSettings: Settings) => {
      if (!user?.id) {
        return nextSettings;
      }

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowGlobalVocabulary: nextSettings.allowGlobalVocabulary,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Failed to update settings");
      }

      return payload.data.settings as Settings;
    },
    onSuccess: (settings) => {
      setCurrentSettings(settings);
      router.refresh();
    },
  });

  const handleSettingsChange = (updatedSettings: Settings) => {
    setCurrentSettings(updatedSettings);

    if (!user?.id) {
      return;
    }

    void updateSettingsMutation.mutateAsync(updatedSettings);
  };

  const handleClick = async () => {
    if (user) {
      await signOutUsecase();
      window.location.href = "/";
    } else {
      await signInWithGoogle();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-orange-500 text-white"
          >
            <BookOpenText aria-hidden="true" className="size-4" />
          </div>
          <span>DocuVocab</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-3 text-sm">
          <Button size="sm" variant="default" onClick={handleClick}>
            {user != null ? 'Logout' : 'Login'}
          </Button>

          <Link href="#" className="hidden text-muted-foreground hover:text-foreground sm:block">
            Feedback
          </Link>

          <button
            type="button"
            aria-label="Open settings"
            aria-expanded={isSettingsOpen}
            aria-haspopup="dialog"
            onClick={() => setIsSettingsOpen(true)}
            className="hidden text-muted-foreground hover:text-foreground sm:block"
          >
            <SettingsIcon aria-hidden="true" className="size-4" />
          </button>
        </nav>
      </div>
      {
        isSettingsOpen && (
          <GeneralSettingsModal
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            onGeneralSettingsChange={handleSettingsChange}
            currentSettings={currentSettings}
          />
        )
      }
    </header>
  );
}