#!/bin/bash
# GardenVerse Feature Creator
# Usage: .specify/scripts/create-feature.sh "My Feature Name"

set -e

FEATURE_NAME="$1"
if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: $0 \"Feature Name\""
  exit 1
fi

# Convert to kebab-case for directory name
FEATURE_DIR=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
SPEC_DIR="specs/${FEATURE_DIR}"

# Create spec directory
mkdir -p "$SPEC_DIR"

# Copy templates
cp .specify/templates/spec-template.md "$SPEC_DIR/spec.md"
cp .specify/templates/plan-template.md "$SPEC_DIR/plan.md"
cp .specify/templates/tasks-template.md "$SPEC_DIR/tasks.md"

# Replace placeholders
sed -i "s/\[Feature Name\]/$FEATURE_NAME/g" "$SPEC_DIR/spec.md"

# Create branch
git checkout -b "feature/${FEATURE_DIR}"

echo "✅ Feature '$FEATURE_NAME' created at $SPEC_DIR/"
echo "📝 Edit the spec: $SPEC_DIR/spec.md"
echo "📋 Then run: /specify.clarify, /specify.plan, /specify.tasks, /specify.implement"
