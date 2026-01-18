import path from 'node:path';

/**
 * Add suffix to filename before extension
 * e.g., addSuffix("output.png", "-dark") -> "output-dark.png"
 */
export function addSuffix(filename: string, suffix: string): string {
  const extension = path.extname(filename);
  const base = path.basename(filename, extension);
  const directory = path.dirname(filename);
  return path.join(directory, `${base}${suffix}${extension}`);
}
