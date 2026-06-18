import { createManualDoc } from "@/features/docs/actions";

export function ManualDocForm() {
  return (
    <form action={createManualDoc} className="mx-auto mt-8 grid max-w-xl gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div>
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          placeholder="Next.js App Router"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="sourceUrl" className="text-sm font-medium">
          Source URL
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          placeholder="https://nextjs.org/docs"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Create test doc
      </button>
    </form>
  );
}