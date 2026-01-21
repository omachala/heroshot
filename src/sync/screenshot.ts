/**
 * Low-level screenshot taking functionality.
 */

import type { TakeScreenshotOptions } from './types';

/**
 * Take a screenshot with the given options.
 */
export async function takeScreenshot(options: TakeScreenshotOptions): Promise<void> {
  const { target, outputPath, format, quality, clip, omitBackground, fullPage = true } = options;
  const isPage = 'goto' in target;

  if (format === 'jpeg') {
    if (isPage && clip) {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, clip });
    } else if (isPage) {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, fullPage });
    } else {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality });
    }
  } else if (isPage && clip) {
    await target.screenshot({ path: outputPath, type: 'png', clip, omitBackground });
  } else if (isPage) {
    await target.screenshot({ path: outputPath, type: 'png', fullPage, omitBackground });
  } else {
    await target.screenshot({ path: outputPath, type: 'png', omitBackground });
  }
}
