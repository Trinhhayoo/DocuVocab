"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  MessageSquareText,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "../providers/auth-provider";
import signOutUsecase from "@/feature/core/user/domain/usecase/sign-out.usecase";
import {
  DEFAULT_SETTINGS,
  type Settings,
} from "@/feature/core/settings/domain/entity/settings.entity";
import { buildOpenRouterConnectUrl, OPEN_SETTINGS_PARAM } from "@/lib/openrouter-connect";

// The header is on every page; the modals (TanStack Form and zod) load only when opened.
const GeneralSettingsModal = dynamic(() =>
  import("../common/settings-modal").then((mod) => mod.GeneralSettingsModal),
);
const FeedbackModal = dynamic(() =>
  import("../common/feedback-modal").then((mod) => mod.FeedbackModal),
);

export function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isOpenRouterBusy, setIsOpenRouterBusy] = useState(false);
  const [openRouterError, setOpenRouterError] = useState<string | null>(null);

  // `?settings=open` (from the OpenRouter callback or the extension) opens the modal once.
  // Deferred so React strict mode's effect re-run cancels the first attempt instead of losing it.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);

      if (!url.searchParams.has(OPEN_SETTINGS_PARAM)) {
        return;
      }

      url.searchParams.delete(OPEN_SETTINGS_PARAM);
      window.history.replaceState(window.history.state, "", url);
      setIsSettingsOpen(true);
    });

    return () => window.clearTimeout(timer);
  }, []);

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
          aiModel: nextSettings.aiModel,
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

  const handleConnectOpenRouter = async () => {
    setIsOpenRouterBusy(true);
    setOpenRouterError(null);

    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(await buildOpenRouterConnectUrl(window.location.origin, returnTo));
  };

  const handleDisconnectOpenRouter = async () => {
    setIsOpenRouterBusy(true);
    setOpenRouterError(null);

    try {
      const response = await fetch("/api/settings/openrouter", { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Cannot disconnect OpenRouter.");
      }

      setCurrentSettings(payload.data.settings);
    } catch (error) {
      setOpenRouterError(error instanceof Error ? error.message : "Cannot disconnect OpenRouter.");
    } finally {
      setIsOpenRouterBusy(false);
    }
  };

  const handleClick = async () => {
    if (user) {
      await signOutUsecase();
      window.location.href = "/";
    } else {
      // Full navigation: the sign-in route redirects to Google, then back to this page.
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/auth/web/login?next=${encodeURIComponent(next)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" aria-label="DocuVocab home" className="flex items-center gap-2 font-bold">
          <div
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-orange-500 text-white"
          >
            <BookOpenText aria-hidden="true" className="size-4" />
          </div>
          <span className="hidden md:block">DocuVocab</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-3">
          <Button size="sm" variant="default" onClick={handleClick}>
            {user != null ? 'Logout' : 'Login'}
          </Button>

          <button
            type="button"
            aria-label="Feedback"
            title="Open feedback"
            aria-haspopup="dialog"
            aria-expanded={isFeedbackOpen}
            onClick={() => setIsFeedbackOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:gap-1.5 sm:px-2 sm:py-1 sm:text-sm"
          >
            <MessageSquareText aria-hidden="true" className="size-4" />
            <span>Feedback</span>
          </button>

          <button
            type="button"
            aria-label="Open settings"
            title="Open settings"
            aria-expanded={isSettingsOpen}
            aria-haspopup="dialog"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:gap-1.5 sm:px-2 sm:py-1 sm:text-sm"
          >
            <SettingsIcon aria-hidden="true" className="size-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
      {isSettingsOpen && (
        <GeneralSettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onGeneralSettingsChange={handleSettingsChange}
          currentSettings={currentSettings}
          onConnectOpenRouter={() => void handleConnectOpenRouter()}
          onDisconnectOpenRouter={() => void handleDisconnectOpenRouter()}
          isOpenRouterBusy={isOpenRouterBusy || !user}
          openRouterError={user ? openRouterError : "Log in to choose a model or connect OpenRouter."}
        />
      )}
      {isFeedbackOpen && (
        <FeedbackModal
          open={isFeedbackOpen}
          onOpenChange={setIsFeedbackOpen}
          initialEmail={user?.email ?? ""}
        />
      )}
    </header>
  );
}