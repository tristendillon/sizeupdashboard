export function validateNonNullishProps<
  T extends Record<string, unknown>,
  K extends keyof T,
>(obj: T, keys: K[]): obj is T & { [P in K]-?: NonNullable<T[P]> } {
  return keys.every((key) => {
    const value = obj[key];
    return value !== null && value !== undefined;
  });
}
