import type { CreateVocabularyInput } from "@/features/vocab/validators";

export type VocabularyResponse = {
  vocabulary: {
    id: string;
    word: string;
    meaning: string | null;
    note: string | null;
    status: string;
    createdAt: string;
  };
};

export async function createVocabulary(
  input: CreateVocabularyInput
): Promise<VocabularyResponse> {
  const response = await fetch("/api/vocabularies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not save vocabulary.");
  }

  return data;
}