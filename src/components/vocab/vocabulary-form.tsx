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
import { mapHttpErrorToMessage } from "@/feature/common/data/http/http-error-message.mapper";

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
  const [meaningLanguage, setMeaningLanguage] = useState<
    "English" | "Vietnamese"
  >("Vietnamese");

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
          meaningLanguage,
        });

        form.setFieldValue("meaning", data.meaning ?? "");
        form.setFieldValue("note", data.simpleExplanation ?? "");
        form.setFieldValue("exampleSentence", data.exampleSentence ?? "");

        if (selectedSentence) {
          form.setFieldValue("originalSentence", selectedSentence);
        }
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
        meaningLanguage,
      });

      form.setFieldValue("meaning", data.meaning ?? "");
      form.setFieldValue("note", data.simpleExplanation ?? "");
      form.setFieldValue("exampleSentence", data.exampleSentence ?? "");
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
      className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"
    >

      {isExplaining && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
          Generating explanation...
        </div>
      )}

      {explainMutation.isError && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {mapHttpErrorToMessage(explainMutation.error)}
        </div>
      )}

      <form.Field
        name="word"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label className="text-sm font-bold">Word</label>
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

      <div className="flex items-center justify-between gap-3 rounded-md border bg-slate-50 px-3 py-2">
        <label className="text-sm font-bold">Language</label>
        <select
          value={meaningLanguage}
          onChange={(event) => {
            setMeaningLanguage(event.target.value as "English" | "Vietnamese");
          }}
          className="rounded-md border bg-white px-2 py-1 text-sm"
        >
          <option value="English">English</option>
          <option value="Vietnamese">Vietnamese</option>
        </select>
      </div>

      <form.Field
        name="meaning"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label className="text-sm font-bold">Meaning</label>
            <textarea
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Meaning or translation"
              className="mt-1 min-h-12 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      />

      <form.Field
        name="note"
        // eslint-disable-next-line react/no-children-prop
        children={(field) => (
          <div>
            <label className="text-sm font-bold">Simple Explanation</label>
            <textarea
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="A simple explanation of the word in context..."
              className="mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      />

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
        <p className="text-xs text-red-500">{mapHttpErrorToMessage(saveMutation.error)}</p>
      )}
    </form>
  );
}
