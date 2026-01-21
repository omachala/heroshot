/**
 * Build error message when no browser is found.
 */
export function noBrowserError(): Error {
  const message = [
    '',
    'Error: No browser found.',
    '',
    'Heroshot needs a browser to capture screenshots. Options:',
    '',
    '  1. Install Chrome (recommended):',
    '     https://www.google.com/chrome/',
    '',
    '  2. Or install Playwright browsers:',
    '     npx playwright install chromium',
    '',
  ].join('\n');
  return new Error(message);
}
