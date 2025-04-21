#!/bin/bash

# Remove potentially conflicting duplicate folder
rm -rf ./Revlo

echo "Removing any duplicate type definition files..."
find . -type f -name "types.ts" -not -path "./types/onboarding.ts" -exec rm {} \;

echo "Checking for and removing duplicate component files..."
components=(
  "CustomerStep.tsx"
  "ReviewTypeStep.tsx"
  "ReviewPlatformsStep.tsx"
  "ReviewLinkStep.tsx"
  "WelcomeStep.tsx"
  "CompleteStep.tsx"
)

# Prefer files in the steps/ directory
for component in "${components[@]}"; do
  files=($(find ./components -name "$component"))
  
  # If we found multiple instances
  if [ ${#files[@]} -gt 1 ]; then
    echo "Found duplicate files for $component:"
    
    # Prefer files in the steps directory
    keep=""
    for file in "${files[@]}"; do
      if [[ "$file" == *"/steps/"* ]]; then
        keep="$file"
        break
      fi
    done
    
    # If no steps version found, keep the first one
    if [ -z "$keep" ]; then
      keep="${files[0]}"
    fi
    
    echo "Keeping: $keep"
    
    # Remove duplicates
    for file in "${files[@]}"; do
      if [ "$file" != "$keep" ]; then
        echo "Removing duplicate: $file"
        rm "$file"
      fi
    done
  fi
done

echo "Cleanup complete!" 