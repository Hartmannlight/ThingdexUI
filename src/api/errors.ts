export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const parseErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (isRecord(error.detail) && Array.isArray(error.detail.detail)) {
      const items = error.detail.detail
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const record = entry as Record<string, unknown>;
          const msg = typeof record.msg === "string" ? record.msg : "Validation error";
          const loc = Array.isArray(record.loc) ? record.loc.join(".") : "";
          return loc ? `${loc}: ${msg}` : msg;
        })
        .filter(Boolean);
      if (items.length > 0) return items.join(" | ");
    }
    if (typeof error.detail === "string" && error.detail.trim()) {
      return error.detail;
    }
    if (isRecord(error.detail)) {
      if (typeof error.detail.message === "string") return error.detail.message;
      if (typeof error.detail.detail === "string") return error.detail.detail;
      if (typeof error.detail.error === "string") return error.detail.error;
      try {
        return JSON.stringify(error.detail);
      } catch {
        return error.message;
      }
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error";
};
