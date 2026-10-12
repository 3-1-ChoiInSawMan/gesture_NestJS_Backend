export const toSnakeCase = (str: string): string => {
  return str.replace(/([A-Z])/g, (_match, letter, offset) =>
    offset > 0 ? `_${letter.toLowerCase()}` : letter.toLowerCase(),
  );
};

const isPlainObject = (data: unknown): data is Record<string, unknown> => {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
};

export const convertKeysToSnakeCase = <T>(data: unknown): T => {
  if (Array.isArray(data)) {
    return data.map(convertKeysToSnakeCase) as T;
  }

  if (isPlainObject(data)) {
    return Object.fromEntries(
      Object.entries(data).map(([key, val]) => [
        toSnakeCase(key),
        convertKeysToSnakeCase(val),
      ]),
    ) as T;
  }

  return data as T;
};
