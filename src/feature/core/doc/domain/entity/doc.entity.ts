export type DocParams = Omit<Doc, "toPlainObject">;

export default class Doc {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly siteName: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: DocParams) {
    this.id = params.id;
    this.userId = params.userId;
    this.title = params.title;
    this.sourceUrl = params.sourceUrl;
    this.siteName = params.siteName;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  toPlainObject(): DocParams {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      sourceUrl: this.sourceUrl,
      siteName: this.siteName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
