/**
 * Inlined as a TS string so the standalone binary (Bun compile) doesn't have
 * to read it from disk. Reading from the `/$bunfs/` virtual filesystem fails
 * if a templates/ directory isn't bundled into the compiled binary, which
 * was the root cause of #104's "Something went wrong" on `heroshot config`.
 *
 * Keep this content in sync with src/templates/heroshotReadme.txt (the .txt
 * file is what scripts/generate-action-docs.ts and other tooling reference).
 */
export const HEROSHOT_README = `# Heroshot

This folder contains heroshot configuration and encrypted session data.

## Files

- \`config.json\` - Screenshot definitions (URLs, selectors, output settings)
- \`session.enc\` - Encrypted browser session (cookies, localStorage)

## Safe to commit

This folder is safe to commit to source control:

- \`config.json\` contains no secrets
- \`session.enc\` is encrypted with AES-256-GCM

## CI/CD Usage

To use heroshot in CI, add your session key as a secret:

\`\`\`yaml
- run: npx heroshot --session-key=\${{ secrets.HEROSHOT_SESSION_KEY }}
\`\`\`

To get your session key, run: \`npx heroshot session-key\`

Learn more: https://heroshot.dev/docs
`;
