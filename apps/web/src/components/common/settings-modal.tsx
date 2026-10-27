"use client"

import type { FC } from "react"

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
}>

export const GeneralSettingsModal: FC<Props> = ({
  open,
  onOpenChange,
  currentSettings,
  onGeneralSettingsChange,
}) => {
  const handleCheckedChange = (
    settingKey: keyof Settings,
    checked: boolean,
  ) => {
    onGeneralSettingsChange({
      ...currentSettings,
      [settingKey]: checked,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-106.25 text-black z-100000">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>

          <DialogDescription>
            Configure general application settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="global-vocabulary">
              Enable Global Vocabulary
            </Label>

            <Switch
              id="global-vocabulary"
              checked={currentSettings.allowGlobalVocabulary}
              onCheckedChange={(checked) =>
                handleCheckedChange("allowGlobalVocabulary", checked)
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}