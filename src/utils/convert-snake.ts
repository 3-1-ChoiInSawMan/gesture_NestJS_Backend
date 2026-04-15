export const toSnakeCase = (str: string): string => {
  return str.replace(/([A-Z])/g, (_match, letter, offset) =>
    offset > 0 ? `_${letter.toLowerCase()}` : letter.toLowerCase(),
  );
};
