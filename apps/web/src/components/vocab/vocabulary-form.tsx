"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";

import {
  createVocabulary,
  updateVocabulary,
  explainVocabulary,
} from "@/app/docs/view/client/vocab-api";
import type { CreateVocabularyInput } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import type { VocabularyItem } from "@/app/docs/view/client/vocab.types";
import type { ExplainVocabularyResponse } from "@/feature/support/llm/llm-provider.interface";
import { mapHttpErrorToMessage } from "@/feature/common/data/http/http-error-message.mapper";

const formSchema = z.object({
  docId: z.string(),
  word: z.string().min(1, "Word is required").max(100),
  meaning: z.string().max(500),
  meaningEn: z.string().max(500),
  note: z.string().max(1000),
  noteEn: z.string().max(1000),
  originalSentence: z.string().max(1000),
  exampleSentence: z.string().max(1000),
});

const EXPLANATION_FIELDS = [
  { name: "meaning", label: "Meaning (Tiếng Việt)", placeholder: "Nghĩa trong ngữ cảnh", minHeight: "min-h-12" },
  { name: "meaningEn", label: "Meaning (English)", placeholder: "Meaning in context", minHeight: "min-h-12" },
  { name: "note", label: "Explanation (Tiếng Việt)", placeholder: "Giải thích ngắn gọn...", minHeight: "min-h-20" },
  { name: "noteEn", label: "Explanation (English)", placeholder: "A simple explanation in context...", minHeight: "min-h-20" },
] as const;

type VocabularyFormProps = {
  docId: string;
  selectedWord: string;
  selectedSentence?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  existingVocabulary: VocabularyItem | null;
  onDone: () => void;
  onCancel: () => void;
};

export function VocabularyForm({
  docId,
  selectedWord,
  selectedSentence,
  sourceTitle,
  sourceUrl,
  existingVocabulary,
  onDone,
  onCancel,
}: VocabularyFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(existingVocabulary);
  const hasAutoExplained = useRef(false);
  const [isExplaining, setIsExplaining] = useState(false);

  const explainMutation = useMutation({
    mutationFn: explainVocabulary,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: CreateVocabularyInput) => {
      if (existingVocabulary) {
        return updateVocabulary({
          vocabId: existingVocabulary.id,
          input: {
            word: input.word,
            meaning: input.meaning || null,
            meaningEn: input.meaningEn || null,
            note: input.note || null,
            noteEn: input.noteEn || null,
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
      meaningEn: existingVocabulary?.meaningEn ?? "",
      note: existingVocabulary?.note ?? "",
      noteEn: existingVocabulary?.noteEn ?? "",
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

  const wordFieldId = "vocab-word";
  const wordErrorId = "vocab-word-error";

  function applyExplanation(data: ExplainVocabularyResponse) {
    form.setFieldValue("meaning", data.meaning);
    form.setFieldValue("meaningEn", data.meaningEn);
    form.setFieldValue("note", data.simpleExplanation);
    form.setFieldValue("noteEn", data.simpleExplanationEn);
    form.setFieldValue("exampleSentence", data.exampleSentence);
  }

  // Auto-explain for new vocabulary only (not edit mode)
  useEffect(() => {
    if (isEditMode || hasAutoExplained.current || !selectedWord) return;

    hasAutoExplained.current = true;

    async function runExplain() {
      setIsExplaining(true);

      try {
        const data = await explainMutation.mutateAsync({
          text: selectedWord,
          sentence: selectedSentence,
          sourceTitle,
          sourceUrl,
        });

        applyExplanation(data);

        if (selectedSentence) {
          form.setFieldValue("originalSentence", selectedSentence);
        }
      } catch {
        // explainMutation.isError renders the failure message.
      } finally {
        setIsExplaining(false);
      }
    }

    runExplain();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRegenerate() {
    setIsExplaining(true);

    try {
      const data = await explainMutation.mutateAsync({
        text: form.getFieldValue("word"),
        sentence: selectedSentence,
        sourceTitle,
        sourceUrl,
      });

      applyExplanation(data);
    } catch {
      // explainMutation.isError renders the failure message.
    } finally {
      setIsExplaining(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      aria-busy={isExplaining || saveMutation.isPending}
      className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"
    >

      {isExplaining && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700"
        >
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"
          />
          Generating explanation...
        </div>
      )}

      {explainMutation.isError && (
        <div
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {mapHttpErrorToMessage(explainMutation.error)}
        </div>
      )}

      <form.Field
        name="word"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label htmlFor={wordFieldId} className="text-sm font-bold">
              Word
            </label>
            <input
              id={wordFieldId}
              name="word"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby={
                field.state.meta.errors.length > 0 ? wordErrorId : undefined
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {field.state.meta.errors.length > 0 && (
              <p id={wordErrorId} role="alert" className="mt-1 text-xs text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {EXPLANATION_FIELDS.map(({ name, label, placeholder, minHeight }) => (
        <form.Field
          key={name}
          name={name}
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <div>
              <label htmlFor={`vocab-${name}`} className="text-sm font-bold">
                {label}
              </label>
              <textarea
                id={`vocab-${name}`}
                name={name}
                value={field.state.value ?? ""}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={placeholder}
                className={`mt-1 ${minHeight} w-full rounded-md border px-3 py-2 text-sm`}
              />
            </div>
          )}
        />
      ))}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {saveMutation.isPending
            ? "Saving..."
            : isEditMode
              ? "Update"
              : "Save"}
        </button>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isExplaining}
          className="rounded-md border px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-60"
        >
          {isExplaining ? "..." : "Regenerate"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      {saveMutation.isError && (
        <p role="alert" className="text-xs text-red-500">
          {mapHttpErrorToMessage(saveMutation.error)}
        </p>
      )}
    </form>
  );
}
