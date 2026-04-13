export const externalRequest = async <T>(): Promise<T> => {
  throw new Error("Use an SDK-backed API wrapper instead of externalRequest.");
};
