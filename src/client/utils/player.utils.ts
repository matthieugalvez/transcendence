export function validatePlayerNames(...names: string[]): { valid: boolean, error?: string } {
  const trimmed = names.map(n => n.trim().toLowerCase());
  if (trimmed.some(name => !name)) return { valid: false, error: 'No empty names!' };
  if (new Set(trimmed).size !== trimmed.length) return { valid: false, error: 'Names must be unique!' };
  return { valid: true };
}
