import type LLMProvider from "./llm-provider.interface";
import type {
    ExplainVocabularyRequest,
    ExplainVocabularyResponse,
} from "./llm-provider.interface";
import { Ollama } from 'ollama'

const OLLAMA_MODEL = "gpt-oss:120b";

function buildPrompt(request: ExplainVocabularyRequest): string {
    const meaningLanguage = request.meaningLanguage ?? "English";

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
        - The meaning must match this context - Just the meaning of the word like dictionary entries.
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
    public ollama: Ollama;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.ollama = new Ollama({
        host: 'https://ollama.com',
        headers: { Authorization: 'Bearer ' + this.apiKey },
        })
    }

    async explainVocabulary(
        request: ExplainVocabularyRequest,
    ): Promise<ExplainVocabularyResponse> {
        const prompt = buildPrompt(request);

        const generateResponse = await this.ollama.generate({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: 0.3,
                }});

        if (!generateResponse.done) {
            const errorBody = await generateResponse.response;

            throw new Error(`Ollama API error: ${errorBody}`);
        }

        const data = await JSON.parse(
            cleanJsonText(generateResponse.response)
        ) as ExplainVocabularyResponse;

        const validDomains = ["tech", "finance", "legal", "general"] as const;

        if (!validDomains.includes(data.domain)) {
            data.domain = "general";
        }

        return data;
    }
}