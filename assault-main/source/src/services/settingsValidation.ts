/** Read persisted settings as untrusted input. Clone defaults so consumers cannot mutate them. */
export function normalizeSettings<T>(defaults: T, value: unknown): T {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(value)) return structuredClone(defaults);
    if (!defaults.length) return [] as T;
    return value.filter(item => item !== null && typeof item === typeof defaults[0])
      .map(item => normalizeSettings(defaults[0], item)) as T;
  }
  if (defaults !== null && typeof defaults === 'object') {
    const source = value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, normalizeSettings(fallback, source[key])])) as T;
  }
  if (typeof defaults === 'number') return (typeof value === 'number' && Number.isFinite(value) ? value : defaults) as T;
  return (typeof value === typeof defaults && value !== null ? value : defaults) as T;
}
export function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => /^\d{1,22}$/.test(key) && typeof item === 'string'));
}
