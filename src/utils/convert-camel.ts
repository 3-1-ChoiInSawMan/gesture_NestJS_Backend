export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const isPlainObject = (data: unknown): data is Record<string, unknown> => {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

export const convertKeysToCamelCase = <T>(data: unknown): T => {
  if (Array.isArray(data)) {
    return data.map(convertKeysToCamelCase) as T;
  }

  if (isPlainObject(data)) {
    return Object.fromEntries(
      Object.entries(data).map(([key, val]) => [
        toCamelCase(key),
        convertKeysToCamelCase(val)
      ]),
    ) as T;
  }

  return data as T;
}
