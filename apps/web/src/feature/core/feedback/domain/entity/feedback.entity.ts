export type FeedbackParams = Omit<Feedback, "toPlainObject">;

export default class Feedback {
  readonly id: string;
  readonly userId: string | null;
  readonly name: string | null;
  readonly email: string | null;
  readonly category: string;
  readonly message: string;
  readonly pageUrl: string | null;
  readonly createdAt: Date;

  constructor(params: FeedbackParams) {
    this.id = params.id;
    this.userId = params.userId;
    this.name = params.name;
    this.email = params.email;
    this.category = params.category;
    this.message = params.message;
    this.pageUrl = params.pageUrl;
    this.createdAt = params.createdAt;
  }

  toPlainObject(): FeedbackParams {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      email: this.email,
      category: this.category,
      message: this.message,
      pageUrl: this.pageUrl,
      createdAt: this.createdAt,
    };
  }
}