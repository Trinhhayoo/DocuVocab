import VocabularyStatus from "./enum/vocabulary-status.enum";

export type VocabularyParams = Omit<Vocabulary, "toPlainObject">;

export default class Vocabulary {
  readonly id: string;
  readonly userId: string;
  readonly docId: string | null;

  readonly sourceUrl: string | null;
  readonly sourceHostname: string | null;
  readonly pageTitle: string | null;

  readonly word: string;
  readonly meaning: string | null;
  readonly meaningEn: string | null;
  readonly note: string | null;
  readonly noteEn: string | null;
  readonly originalSentence: string | null;
  readonly exampleSentence: string | null;
  readonly status: VocabularyStatus;

  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: VocabularyParams) {
    this.id = params.id;
    this.userId = params.userId;
    this.docId = params.docId;
    this.sourceUrl = params.sourceUrl;
    this.sourceHostname = params.sourceHostname;
    this.pageTitle = params.pageTitle;
    this.word = params.word;
    this.meaning = params.meaning;
    this.meaningEn = params.meaningEn;
    this.note = params.note;
    this.noteEn = params.noteEn;
    this.originalSentence = params.originalSentence;
    this.exampleSentence = params.exampleSentence;
    this.status = params.status;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  toPlainObject(): VocabularyParams {
    return {
      id: this.id,
      userId: this.userId,
      docId: this.docId,
      sourceUrl: this.sourceUrl,
      sourceHostname: this.sourceHostname,
      pageTitle: this.pageTitle,
      word: this.word,
      meaning: this.meaning,
      meaningEn: this.meaningEn,
      note: this.note,
      noteEn: this.noteEn,
      originalSentence: this.originalSentence,
      exampleSentence: this.exampleSentence,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}