import type {
  CreateVocabularyInput,
  UpdateVocabularyInput,
} from "@/features/vocab/validators";

export type VocabularyResponse = {
  vocabulary: {
    id: string;
    word: string;
    meaning: string | null;
    note: string | null;
    originalSentence: string | null;
    exampleSentence: string | null;
    status: string;
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

export async function updateVocabulary({
  vocabId,
  input,
}: {
  vocabId: string;
  input: UpdateVocabularyInput;
}): Promise<VocabularyResponse> {
  const response = await fetch(`/api/vocabularies/${vocabId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not update vocabulary.");
  }

  return data;
}