export default interface IBaseHttpResponse<DATA = unknown> {
  status: string;
  message?: string;
  data?: DATA;
  success: boolean;
}
