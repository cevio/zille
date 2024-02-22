export interface HttpProps {
  port: number,
  keys?: string[],
  ignoreDuplicateSlashes?: boolean,
  ignoreTrailingSlash?: boolean,
  maxParamLength?: number,
  allowUnsafeRegex?: boolean,
  caseSensitive?: boolean,
}