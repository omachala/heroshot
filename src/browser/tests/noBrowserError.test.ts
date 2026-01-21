import { describe, expect, it } from 'vitest';
import { noBrowserError } from '../noBrowserError';

describe('noBrowserError', () => {
  it('returns an Error instance', () => {
    const error = noBrowserError();
    expect(error).toBeInstanceOf(Error);
  });

  it('includes instructions to install Chrome', () => {
    const error = noBrowserError();
    expect(error.message).toContain('Install Chrome');
    expect(error.message).toContain('https://www.google.com/chrome/');
  });

  it('includes instructions to install Playwright browsers', () => {
    const error = noBrowserError();
    expect(error.message).toContain('npx playwright install chromium');
  });

  it('includes clear error title', () => {
    const error = noBrowserError();
    expect(error.message).toContain('No browser found');
  });
});
