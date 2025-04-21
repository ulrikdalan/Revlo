#!/bin/bash

# First, run the cleanup script
echo "Running cleanup script..."
./scripts/cleanup.sh

# Now build the project
echo "Building project..."
npm run build

echo "Build completed!" 