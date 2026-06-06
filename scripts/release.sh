#!/usr/bin/env bash
# Cut a release: verify, bump version, tag, and push.
# The pushed tag triggers .github/workflows/release.yml which builds and
# publishes to npm with provenance, then creates the GitHub Release.
#
# Usage: ./scripts/release.sh [patch|minor|major|<version>]   (default: patch)
set -euo pipefail

BUMP="${1:-patch}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty — commit or stash changes first" >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "error: releases must be cut from 'main' (current: $BRANCH)" >&2
  exit 1
fi

echo "==> Verifying"
bun run typecheck
bun test

echo "==> Bumping version ($BUMP)"
# npm version creates the commit and the vX.Y.Z tag.
NEW_VERSION="$(npm version "$BUMP" -m "chore(release): v%s")"
echo "    $NEW_VERSION"

echo "==> Pushing commit and tag"
git push --follow-tags

echo "==> Done. Release workflow will publish $NEW_VERSION to npm."
