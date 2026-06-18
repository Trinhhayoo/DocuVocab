import type { ImportUrlInput } from "@/features/docs/validators";

export type ImportUrlResponse = {
  docId: string;
};

export async function importUrl(input: ImportUrlInput): Promise<ImportUrlResponse> {
  const response = await fetch("/api/import-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not import URL.");
  }

  return data;
}