"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";

import { updateVocabulary } from "@/features/vocab/api";
import type { VocabularyItem } from "@/features/vocab/types";

type VocabularyCardProps = {
  vocabulary: VocabularyItem;
};

export function VocabularyCard({ vocabulary }: VocabularyCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateVocabulary,
    onSuccess: () => {
      router.refresh();
      setIsEditing(false);
    },
  });

  const form = useForm({
    defaultValues: {
      word: vocabulary.word,
      meaning: vocabulary.meaning ?? "",
      note: vocabulary.note ?? "",
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate({
        vocabId: vocabulary.id,
        input: {
          word: value.word,
          meaning: value.meaning || null,
          note: value.note || null,
        },
      });
    },
  });

  if (isEditing) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"
      >
        <form.Field
          name="word"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm font-semibold"
            />
          )}
        />

        <form.Field
          name="meaning"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Meaning"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          )}
        />

        <form.Field
          name="note"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <textarea
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Note"
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            />
          )}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-md border px-3 py-2 text-xs font-medium"
          >
            Cancel
          </button>
        </div>

        {updateMutation.isError && (
          <p className="text-xs text-red-500">
            {updateMutation.error.message}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{vocabulary.word}</h3>

          {vocabulary.meaning && (
            <p className="mt-1 text-sm text-muted-foreground">
              {vocabulary.meaning}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          Edit
        </button>
      </div>

      {vocabulary.note && (
        <p className="mt-3 text-sm text-slate-600">{vocabulary.note}</p>
      )}

      <div className="mt-3">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {vocabulary.status}
        </span>
      </div>
    </div>
  );
}