"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createVocabulary } from "@/features/vocab/api";
import {
  createVocabularySchema,
  type CreateVocabularyInput,
} from "@/features/vocab/validators";

type VocabularyFormProps = {
  docId: string;
  selectedWord?: string;
  originalSentence?: string;
};

export function VocabularyForm({
  docId,
  selectedWord = "",
  originalSentence = "",
}: VocabularyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vocabularies", docId],
      });

      router.refresh();
      form.reset();
    },
  });

  const form = useForm({
    defaultValues: {
      docId,
      word: selectedWord,
      meaning: "",
      note: "",
      originalSentence,
      exampleSentence: "",
    } satisfies CreateVocabularyInput,
    validators: {
      onSubmit: createVocabularySchema,
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value);
    },
  });

  useEffect(() => {
  if (!selectedWord) return;

  form.setFieldValue("word", selectedWord);
}, [selectedWord, form]);

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
          <div>
            <label className="text-sm font-medium">Word</label>
            <input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="middleware"
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
              placeholder="Vietnamese or simple English meaning"
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
              placeholder="Why this word is useful..."
              className="mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      />

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {createMutation.isPending ? "Saving..." : "Save vocabulary"}
      </button>

      {createMutation.isError && (
        <p className="text-sm text-red-500">
          {createMutation.error.message}
        </p>
      )}
    </form>
  );
}