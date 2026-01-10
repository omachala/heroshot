export interface BeautifyOptions {
  shadow?: boolean;
  radius?: number;
  background?: string;
  padding?: number;
}

export interface ScreenshotDefinition {
  id: string;
  url?: string;
  file?: string;
  lines?: [number, number];
  selector?: string;
  output: string;
  viewport?: { width: number; height: number };
  waitFor?: string;
  delay?: number;
  beautify?: BeautifyOptions;
  theme?: string;
}

export interface HeroshotConfig {
  screenshots: ScreenshotDefinition[];
}
