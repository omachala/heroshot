#!/bin/sh

# Create temp directory for outputs (gitignored via .* pattern)
mkdir -p .pre-commit-logs

# First: auto-fix formatting and re-stage any changed files
echo "Running Prettier auto-fix..."
pnpm format > .pre-commit-logs/format.log 2>&1
if [ $? -ne 0 ]; then
  echo "FAIL: Prettier failed:"
  cat .pre-commit-logs/format.log
  exit 1
fi
# Re-stage any files that were formatted
git add -u

# Run remaining quality checks in parallel, save outputs to files
echo "Running pre-commit checks in parallel..."

pnpm lint > .pre-commit-logs/lint.log 2>&1 &
P1=$!
pnpm typecheck > .pre-commit-logs/typecheck.log 2>&1 &
P2=$!
pnpm knip > .pre-commit-logs/knip.log 2>&1 &
P3=$!
pnpm test:run > .pre-commit-logs/tests.log 2>&1 &
P4=$!

# Wait for all jobs
wait $P1; R1=$?
wait $P2; R2=$?
wait $P3; R3=$?
wait $P4; R4=$?

# Check results and show output only on failure
FAILED=0

if [ $R1 -ne 0 ]; then
  echo "FAIL: ESLint check failed:"
  cat .pre-commit-logs/lint.log
  FAILED=1
fi

if [ $R2 -ne 0 ]; then
  echo "FAIL: TypeScript check failed:"
  cat .pre-commit-logs/typecheck.log
  FAILED=1
fi

if [ $R3 -ne 0 ]; then
  echo "FAIL: Knip check failed:"
  cat .pre-commit-logs/knip.log
  FAILED=1
fi

if [ $R4 -ne 0 ]; then
  echo "FAIL: Tests failed:"
  cat .pre-commit-logs/tests.log
  FAILED=1
fi

if [ $FAILED -eq 0 ]; then
  echo "OK: All pre-commit checks passed!"
  # Clean up logs on success
  rm -rf .pre-commit-logs
  exit 0
else
  echo ""
  echo "Tip: Check .pre-commit-logs/ for detailed output"
  exit 1
fi
