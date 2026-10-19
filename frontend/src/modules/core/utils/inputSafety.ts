/** Rejects markup delimiters and control characters for demo text fields; not a security boundary. @param value - Input. @returns Whether input is acceptable. */
export function isSafeInput(value: string): boolean {
  return !/[<>]/.test(value) && !Array.from(value).some((char) => char.charCodeAt(0) < 32)
}
