/** CLI global options */
export type GlobalOptions = {
  verbose?: boolean;
  config?: string;
  sessionKey?: string;
};

/** Config command options */
export type ConfigActionOptions = {
  reset?: boolean;
  only?: boolean;
  light?: boolean;
  dark?: boolean;
};
