export type FieldErrors = Record<string, string>;

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: FieldErrors;
  readonly traceId?: string;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    fieldErrors?: FieldErrors;
    traceId?: string;
  }) {
    super(args.message);
    this.name = "HttpError";
    this.status = args.status;
    this.code = args.code;
    this.fieldErrors = args.fieldErrors;
    this.traceId = args.traceId;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof Error && error.name === "HttpError";
}
