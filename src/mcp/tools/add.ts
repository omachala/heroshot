/**
 * Add tool handler.
 * Adds a new screenshot definition to config.
 */

import { getConfigPath, loadConfig, saveConfig } from '../../configFile';
import { screenshotSchema } from '../../schema';
import { generateUid } from '../../utils/generateUid';
import type { AddOptions } from '../schemas/add';

export type AddResult = {
  success: boolean;
  id?: string;
  screenshot?: {
    id: string;
    name: string;
    url: string;
  };
  error?: string;
};

export function addHandler(input: AddOptions): AddResult {
  try {
    const configPath = input.configPath ?? getConfigPath();
    const config = loadConfig(configPath);

    // Generate ID and parse through schema to apply defaults
    const screenshotInput = {
      ...input.screenshot,
      id: generateUid(),
    };

    // Validate and apply defaults through Zod schema
    const screenshot = screenshotSchema.parse(screenshotInput);

    // Check for duplicate name
    const existingByName = config.screenshots.find(
      s => s.name.toLowerCase() === screenshot.name.toLowerCase()
    );
    if (existingByName) {
      return {
        success: false,
        error: `Screenshot with name "${screenshot.name}" already exists (id: ${existingByName.id})`,
      };
    }

    // Add to config and save
    config.screenshots.push(screenshot);
    saveConfig(configPath, config);

    return {
      success: true,
      id: screenshot.id,
      screenshot: {
        id: screenshot.id,
        name: screenshot.name,
        url: screenshot.url,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
