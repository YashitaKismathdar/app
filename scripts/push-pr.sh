#!/usr/bin/env bash
# ==============================================================================
# WavyGo ERP - Automated Git Push & Pull Request Helper Script
# ==============================================================================

set -e

# Configuration
REPO_URL="https://github.com/garv-svnitcse/app"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "======================================================================"
echo "🚀 WavyGo ERP Git Push & Pull Request Helper"
echo "======================================================================"
echo "📌 Current Branch: $CURRENT_BRANCH"

# Step 1: Branch Management
if [ -n "$1" ]; then
    TARGET_BRANCH="$1"
else
    read -p "🌿 Enter branch name to push to [default: $CURRENT_BRANCH]: " TARGET_BRANCH
    TARGET_BRANCH=${TARGET_BRANCH:-$CURRENT_BRANCH}
fi

if [ "$TARGET_BRANCH" != "$CURRENT_BRANCH" ]; then
    echo "🔀 Switching to branch: $TARGET_BRANCH"
    git checkout -b "$TARGET_BRANCH" 2>/dev/null || git checkout "$TARGET_BRANCH"
fi

# Step 2: Stage & Commit
echo "📦 Staging changed files..."
git add .

if git diff --staged --quiet; then
    echo "⚠️  No unstaged/staged changes detected. Proceeding to push..."
else
    if [ -n "$2" ]; then
        COMMIT_MSG="$2"
    else
        read -p "📝 Enter commit message: " COMMIT_MSG
        while [ -z "$COMMIT_MSG" ]; do
            echo "❌ Commit message cannot be empty!"
            read -p "📝 Enter commit message: " COMMIT_MSG
        done
    fi

    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MSG"
fi

# Step 3: Push to GitHub
echo "🌐 Pushing changes to remote 'origin/$TARGET_BRANCH'..."
git push -u origin "$TARGET_BRANCH"

# Step 4: Open / Generate PR Link
PR_URL="${REPO_URL}/pull/new/${TARGET_BRANCH}"

echo ""
echo "======================================================================"
echo "✅ SUCCESS! Code pushed successfully to GitHub."
echo "======================================================================"
echo "🔗 Open this link in your browser to create your Pull Request (PR):"
echo ""
echo "   👉  $PR_URL"
echo ""
echo "======================================================================"

# Attempt to auto-open URL on macOS if available
if command -v open >/dev/null 2>&1; then
    read -p "🌐 Would you like to open the PR link in your default browser now? (y/N): " OPEN_BROWSER
    if [[ "$OPEN_BROWSER" =~ ^[Yy]$ ]]; then
        open "$PR_URL"
    fi
fi
