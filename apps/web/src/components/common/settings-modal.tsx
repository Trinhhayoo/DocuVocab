"use client"

import { AI_MODELS, resolveAiModelId } from "@docuvocab/shared"
import type { FC } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import type { Settings } from "@/feature/core/settings/domain/entity/settings.entity"

type Props = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSettings: Settings
  onGeneralSettingsChange: (updatedSettings: Settings) => void
  onConnectOpenRouter: () => void
  onDisconnectOpenRouter: () => void
  isOpenRouterBusy: boolean
  openRouterError: string | null
}>

export const GeneralSettingsModal: FC<Props> = ({
  open,
  onOpenChange,
  currentSettings,
  onGeneralSettingsChange,
  onConnectOpenRouter,
  onDisconnectOpenRouter,
  isOpenRouterBusy,
  openRouterError,
}) => {
  const isConnected = currentSettings.openRouterConnected
  const selectedModel = resolveAiModelId(currentSettings.aiModel, isConnected)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-106.25 text-foreground z-100000">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>

          <DialogDescription>
            Configure general application settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="global-vocabulary">
              Enable Global Vocabulary
            </Label>

            <Switch
              id="global-vocabulary"
              checked={currentSettings.allowGlobalVocabulary}
              onCheckedChange={(checked) =>
                onGeneralSettingsChange({
                  ...currentSettings,
                  allowGlobalVocabulary: checked,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model">AI model</Label>
            <select
              id="ai-model"
              value={selectedModel}
              onChange={(event) =>
                onGeneralSettingsChange({
                  ...currentSettings,
                  aiModel: event.target.value,
                })
              }
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {AI_MODELS.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  disabled={model.requiresOwnKey && !isConnected}
                >
                  {model.label}
                  {model.requiresOwnKey && !isConnected ? " (connect OpenRouter)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Used for AI explanations on the web and in the extension.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">OpenRouter account</p>
                <p className="text-xs text-muted-foreground">
                  {isConnected
                    ? "Connected. Explanations are billed to your OpenRouter account."
                    : "Connect your own account to choose any model above."}
                </p>
              </div>

              <Button
                size="sm"
                variant={isConnected ? "outline" : "default"}
                disabled={isOpenRouterBusy}
                onClick={isConnected ? onDisconnectOpenRouter : onConnectOpenRouter}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>

            <p className="text-xs text-destructive" aria-live="polite">
              {openRouterError}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
