/**
 * Entry point for the `heroshot-mcp` bin.
 * Also reachable via the `heroshot mcp` subcommand (see src/cli/cli.ts).
 */

import { startMcpServer } from './server';

await startMcpServer();
