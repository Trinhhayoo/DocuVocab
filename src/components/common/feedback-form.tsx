"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapHttpErrorToMessage } from "@/feature/common/data/http/http-error-message.mapper";
import {
  createFeedbackSchema,
  feedbackCategories,
  type CreateFeedbackInput,
} from "@/feature/core/feedback/domain/params/feedback.param";

import { submitFeedback } from "@/app/feedback/view/client/feedback-api";

type FeedbackFormProps = Readonly<{
  initialName?: string;
  initialEmail?: string;
  onSubmitted: () => void;
  onCancel: () => void;
}>;

export function FeedbackForm({
  initialName = "",
  initialEmail = "",
  onSubmitted,
  onCancel,
}: FeedbackFormProps) {
  const feedbackMutation = useMutation({
    mutationFn: submitFeedback,
  });

  type FeedbackFormValues = {
    name: string;
    email: string;
    category: CreateFeedbackInput["category"];
    message: string;
    pageUrl: string;
  };

  const defaultValues: FeedbackFormValues = {
    name: initialName,
    email: initialEmail,
    category: "idea",
    message: "",
    pageUrl: "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = createFeedbackSchema.safeParse(value);

        if (!result.success) {
          return result.error;
        }

        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const parsed = createFeedbackSchema.safeParse(value);

      if (!parsed.success) {
        return;
      }

      await feedbackMutation.mutateAsync(parsed.data);
      onSubmitted();
    },
  });

  useEffect(() => {
    if (form.getFieldValue("pageUrl")) {
      return;
    }

    form.setFieldValue("pageUrl", window.location.href);
  }, [form]);

  const isBusy = feedbackMutation.isPending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      aria-busy={isBusy}
      className="space-y-4"
    >
      {feedbackMutation.isError && (
        <div
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {mapHttpErrorToMessage(feedbackMutation.error)}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <form.Field
          name="name"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <div>
              <Label htmlFor="feedback-name">Name</Label>
              <Input
                id="feedback-name"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
          )}
        />

        <form.Field
          name="email"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <div>
              <Label htmlFor="feedback-email">Email</Label>
              <Input
                id="feedback-email"
                type="email"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
          )}
        />
      </div>

      <form.Field
        name="category"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <Label htmlFor="feedback-category">Category</Label>
            <select
              id="feedback-category"
              value={field.state.value}
              onChange={(event) =>
                field.handleChange(
                  event.target.value as CreateFeedbackInput["category"],
                )
              }
              onBlur={field.handleBlur}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {feedbackCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "bug"
                    ? "Bug report"
                    : category === "idea"
                      ? "Idea or improvement"
                      : category === "content"
                        ? "Content issue"
                        : "Other"}
                </option>
              ))}
            </select>
          </div>
        )}
      />

      <form.Field
        name="message"
         validators={{
          onBlur: ({ value }) => {
            const result =
              createFeedbackSchema.shape.message.safeParse(value);

            return result.success
              ? undefined
              : result.error.issues[0]?.message;
          },
        }}
        // eslint-disable-next-line react/no-children-prop
        children={(field) => {
          const errorMessage = field.state.meta.errors[0];

          return (
            <div>
              <Label htmlFor="feedback-message">Message</Label>
              <textarea
                id="feedback-message"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                rows={6}
                placeholder="Tell us what is missing, confusing, or worth improving."
                className="mt-1 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  errorMessage ? "feedback-message-error" : undefined
                }
              />
              {errorMessage && (
                <p
                  id="feedback-message-error"
                  role="alert"
                  className="mt-1 text-xs text-red-500"
                >
                  {errorMessage}
                </p>
              )}
            </div>
          );
        }}
      />

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isBusy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isBusy ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
