"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { importUrl } from "@/app/docs/view/client/doc-api";
import {
  importUrlSchema,
  type ImportUrlInput,
} from "@/feature/core/doc/domain/params/doc.param";
import { mapHttpErrorToMessage } from "@/feature/common/data/http/http-error-message.mapper";

export function UrlImportForm() {
  const router = useRouter();
  const urlInputId = "import-url-input";
  const urlHintId = "import-url-hint";
  const urlErrorId = "import-url-error";

  const importMutation = useMutation({
    mutationFn: importUrl,
    onSuccess: (data) => {
      router.push(`/docs/${data.docId}`);
    },
  });

  const form = useForm({
    defaultValues: {
      url: "",
    } satisfies ImportUrlInput,
    validators: {
      onSubmit: importUrlSchema,
    },
    onSubmit: async ({ value }) => {
      importMutation.mutate(value);
    },
  });

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        aria-busy={importMutation.isPending}
        className="flex flex-col gap-3 rounded-2xl border bg-white p-3 shadow-sm sm:flex-row"
      >
        <form.Field
          name="url"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <div className="flex-1">
              <label htmlFor={urlInputId} className="sr-only">
                Documentation or article URL
              </label>
              <input
                id={urlInputId}
                name="url"
                type="url"
                autoComplete="url"
                inputMode="url"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Paste documentation or blog URL..."
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  field.state.meta.errors.length > 0
                    ? `${urlHintId} ${urlErrorId}`
                    : urlHintId
                }
                className="h-11 w-full rounded-xl border px-4 text-sm outline-none focus:border-slate-400"
              />

              <p id={urlHintId} className="sr-only">
                Paste a public URL to import content.
              </p>

              {field.state.meta.errors.length > 0 && (
                <p
                  id={urlErrorId}
                  role="alert"
                  className="mt-2 text-left text-sm text-red-500"
                >
                  {field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          )}
        />

        <button
          type="submit"
          disabled={importMutation.isPending}
          className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {importMutation.isPending ? "Importing..." : "Import Doc"}
        </button>
      </form>

      {importMutation.isError && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
            {mapHttpErrorToMessage(importMutation.error)}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Works best with public articles, documentation, and blog posts.
      </p>
    </div>
  );
}