export type DocContentParams = Omit<DocContent, "toPlainObject">;

export default class DocContent {
  readonly docId: string;
  readonly htmlContent: string | null;
  readonly textContent: string;
  readonly wordCount: number;

  constructor(params: DocContentParams) {
    this.docId = params.docId;
    this.htmlContent = params.htmlContent;
    this.textContent = params.textContent;
    this.wordCount = params.wordCount;
  }

  toPlainObject(): DocContentParams {
    return {
      docId: this.docId,
      htmlContent: this.htmlContent ?? "",
      textContent: this.textContent,
      wordCount: this.wordCount,
    };
  }
}
