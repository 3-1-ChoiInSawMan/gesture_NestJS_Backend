/** Multipart forms send booleans as strings; Boolean('false') would be true. */
export function parseFormBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
