export const SHIFT_JIS_DECODER = new TextDecoder("shift_jis" as Bun.Encoding);
export const ARGUMENTS_PATTERN = /(?<paramName>\w+)=(?<value>"[^"]*"|[^\s]+)\s?/gm;

