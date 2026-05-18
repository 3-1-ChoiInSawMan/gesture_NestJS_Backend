export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * 입력된 데이터가 객체인지 판별하는 함수
 * @param data 이 값이 일반 JSON 객체인가
 * @returns 객체라면 true, 아니라면 false
 */
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
