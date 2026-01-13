# Changesets

This folder contains changeset files that track changes to the package.

## Adding a changeset

When making changes that should be released, run:

```bash
pnpm changeset
```

This will prompt you to:

1. Select the type of change (patch/minor/major)
2. Write a summary of the changes

The changeset file will be committed with your PR.

## Release process

1. Changesets accumulate in this folder
2. When ready to release, manually trigger the "Release" workflow
3. This creates a "chore: release" PR with version bump and changelog
4. Merging that PR triggers npm publish and GitHub release
