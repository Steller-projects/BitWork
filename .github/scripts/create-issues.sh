#!/usr/bin/env bash
# create-issues.sh
#
# Uses the GitHub CLI (gh) to create all 53 BitWork project issues.
# Idempotent: issues whose title already exists are silently skipped.
#
# Prerequisites:
#   - gh CLI authenticated (GH_TOKEN env var or `gh auth login`)
#   - node (to read issues-data.js)
#   - jq
#
# Usage (local):
#   GH_TOKEN=<token> bash .github/scripts/create-issues.sh
#
# Usage (CI):
#   Called automatically by create-issues-cli.yml with GH_TOKEN set.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Resolve owner/repo ───────────────────────────────────────────────────────
if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
  REPO="${GITHUB_REPOSITORY}"          # e.g. "Stellar-projects/BitWork"
else
  # Fall back to git remote when running locally
  REPO=$(git -C "$SCRIPT_DIR" remote get-url origin \
    | sed -E 's|.*github\.com[:/]([^/]+/[^/.]+)(\.git)?$|\1|')
fi

echo "📦 Repository: ${REPO}"

# ── Load issue definitions from issues-data.js ──────────────────────────────
ISSUES_JSON=$(node -e "
const issues = require('${SCRIPT_DIR}/issues-data.js');
process.stdout.write(JSON.stringify(issues));
")

TOTAL=$(echo "$ISSUES_JSON" | jq 'length')
echo "📋 Total issues defined: ${TOTAL}"

# ── Fetch existing issue titles (all states) ─────────────────────────────────
echo "🔍 Fetching existing issues…"
EXISTING_TITLES=$(gh issue list \
  --repo "$REPO" \
  --state all \
  --limit 500 \
  --json title \
  --jq '[.[].title]')

# ── Create issues ────────────────────────────────────────────────────────────
CREATED=0
SKIPPED=0

while IFS= read -r issue; do
  TITLE=$(echo "$issue" | jq -r '.title')
  BODY=$(echo "$issue"  | jq -r '.body')
  # Build comma-separated label list for --label flag
  LABELS=$(echo "$issue" | jq -r '[.labels[]] | join(",")')

  # Idempotency check
  MATCH=$(echo "$EXISTING_TITLES" | jq --arg t "$TITLE" 'map(select(. == $t)) | length')
  if [[ "$MATCH" -gt 0 ]]; then
    echo "⏭  Skipping (already exists): ${TITLE}"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Create the issue via gh CLI
  gh issue create \
    --repo    "$REPO" \
    --title   "$TITLE" \
    --body    "$BODY" \
    --label   "$LABELS"

  echo "✅ Created: ${TITLE}"
  CREATED=$((CREATED + 1))

  # Respect GitHub secondary rate limit (~10 creates per minute)
  sleep 6.5
done < <(echo "$ISSUES_JSON" | jq -c '.[]')

echo ""
echo "Done. Created: ${CREATED}  Skipped (duplicate): ${SKIPPED}"
