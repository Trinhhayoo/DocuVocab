"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FeedbackForm } from "./feedback-form";

type FeedbackModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialEmail?: string;
}>;

export function FeedbackModal({
  open,
  onOpenChange,
  initialName,
  initialEmail,
}: FeedbackModalProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto text-black z-100000 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>
            Share a bug, idea, or content issue so we can improve the app.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">Thanks for the feedback.</p>
            <p>We&apos;ve received your message and will review it.</p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <FeedbackForm
            initialName={initialName}
            initialEmail={initialEmail}
            onSubmitted={() => setSubmitted(true)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}