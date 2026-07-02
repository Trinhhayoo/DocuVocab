"use client";

import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";

import { createVocabulary, updateVocabulary } from "@/app/docs/view/client/vocab-api";
import type { CreateVocabularyInput } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import type { VocabularyItem } from "@/app/docs/view/client/vocab.types";

const formSchema = z.object({
  docId: z.string(),
  word: z.string().min(1, "Word is required").max(100),
  meaning: z.string().max(500),
  note: z.string().max(1000),
  originalSentence: z.string().max(1000),
  exampleSentence: z.string().max(1000),
});

type VocabularyFormProps = {
  docId: string;
  selectedWord: string;
  existingVocabulary: VocabularyItem | null;
  onDone: () => void;
  onCancel: () => void;
};

export function VocabularyForm({
  docId,
  selectedWord,
  existingVocabulary,
  onDone,
  onCancel,
}: VocabularyFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(existingVocabulary);

  const saveMutation = useMutation({
    mutationFn: async (input: CreateVocabularyInput) => {
      if (existingVocabulary) {
        return updateVocabulary({
          vocabId: existingVocabulary.id,
          input: {
            word: input.word,
            meaning: input.meaning || null,
            note: input.note || null,
            originalSentence: input.originalSentence || null,
            exampleSentence: input.exampleSentence || null,
          },
        });
      }

      return createVocabulary(input);
    },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });

  const form = useForm({
    defaultValues: {
      docId,
      word: existingVocabulary?.word ?? selectedWord,
      meaning: existingVocabulary?.meaning ?? "",
      note: existingVocabulary?.note ?? "",
      originalSentence: existingVocabulary?.originalSentence ?? "",
      exampleSentence: existingVocabulary?.exampleSentence ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {isEditMode ? "Edit noted word" : "Add noted word"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isEditMode
              ? "This word already has a note."
              : "Save this word to your vocabulary."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <form.Field
        name="word"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label className="text-sm font-medium">Word</label>
            <input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      <form.Field
        name="meaning"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label className="text-sm font-medium">Meaning</label>
            <input
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Meaning or translation"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      />

      <form.Field
        name="note"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label className="text-sm font-medium">Note</label>
            <textarea
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Your personal note..."
              className="mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saveMutation.isPending
            ? "Saving..."
            : isEditMode
              ? "Update note"
              : "Save word"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-500">{saveMutation.error.message}</p>
      )}
    </form>
  );
}