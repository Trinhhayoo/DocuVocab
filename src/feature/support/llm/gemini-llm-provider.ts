import type LLMProvider from "./llm-provider.interface";
import type {
    ExplainVocabularyRequest,
    ExplainVocabularyResponse,
} from "./llm-provider.interface";

const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3.2:3b";

function buildPrompt(request: ExplainVocabularyRequest): string {
    const meaningLanguage = request.meaningLanguage ?? "English";
    console.log("Real Building prompt with meaningLanguage:", request);

    const languageRule =
        meaningLanguage === "Vietnamese"
            ? `IMPORTANT:
            - You MUST write "meaning" in Vietnamese.
            - You MUST write "simpleExplanation" in Vietnamese.
            - Do NOT write English in "meaning" or "simpleExplanation".
            - Keep "exampleSentence" in English.`
                        : `IMPORTANT:
            - Write "meaning" in English.
            - Write "simpleExplanation" in English.
            - Keep "exampleSentence" in English.`;
    const parts = [`Word/Phrase: "${request.text}"`];

    if (request.sentence) parts.push(`Context sentence: "${request.sentence}"`);
    if (request.paragraph) parts.push(`Surrounding paragraph: "${request.paragraph}"`);
    if (request.sourceTitle) parts.push(`Source article: "${request.sourceTitle}"`);
    if (request.sourceUrl) parts.push(`Source URL: ${request.sourceUrl}`);

    return `You are a vocabulary explanation assistant.

        ${parts.join("\n")}

        Language rule:
        ${languageRule}

        Respond ONLY with valid JSON. No markdown. No code fences.

        Format:
        {
        "meaning": "Meaning in the selected language",
        "simpleExplanation": "Simple explanation in the selected language",
        "exampleSentence": "A new English example sentence using the word/phrase",
        "domain": "tech"
        }

        Rules:
        - The meaning must match this context.
        - The example sentence must be different from the original sentence.
        - The domain must be one of: "tech", "finance", "legal", "general".`;
}

function cleanJsonText(text: string): string {
    return text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
}

export default class GeminiLLMProvider implements LLMProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async explainVocabulary(
        request: ExplainVocabularyRequest,
    ): Promise<ExplainVocabularyResponse> {
        console.log("Calling explainVocabulary with request:", request);
        const prompt = buildPrompt(request);

        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: 0.3,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();

            throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();

        const rawText = data?.response ?? "";

        if (!rawText) {
            throw new Error("Ollama returned an empty response.");
        }

        const parsed = JSON.parse(
            cleanJsonText(rawText),
        ) as ExplainVocabularyResponse;

        const validDomains = ["tech", "finance", "legal", "general"] as const;

        if (!validDomains.includes(parsed.domain)) {
            parsed.domain = "general";
        }

        return parsed;
    }
}