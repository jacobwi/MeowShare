#!/bin/bash
# Bash script to build and push MeowShare to registry.bcat.cloud
# Usage: ./build-and-push.sh [docker|podman]
# Default is podman if no argument provided

# Set container engine based on argument
ENGINE="podman"
if [ $# -gt 0 ]; then
  if [ "$1" = "docker" ] || [ "$1" = "podman" ]; then
    ENGINE="$1"
  else
    echo "Invalid container engine specified. Use 'docker' or 'podman'."
    exit 1
  fi
fi

echo "Using container engine: $ENGINE"

# Exit on error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded from .env file"
else
  echo "Warning: .env file not found"
fi

# Set image name and tag
REGISTRY="registry.bcat.cloud"
REPOSITORY="bcat/meowshare"
TAG="latest"
FULL_IMAGE_NAME="${REGISTRY}/${REPOSITORY}:${TAG}"

echo "Building MeowShare image..."

# Build the image with all required build arguments
$ENGINE build -t ${FULL_IMAGE_NAME} -f Dockerfile \
  --build-arg NUGET_APIKEY="${NUGET_APIKEY}" \
  --build-arg NUGET_SOURCE="${NUGET_SOURCE}" \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_APP_NAME="${VITE_APP_NAME}" \
  --build-arg VITE_DEMO_MODE="${DEMO_MODE}" \
  .

echo "Build completed successfully!"
echo "Pushing image to ${FULL_IMAGE_NAME}..."

# Push the image to registry without login
$ENGINE push ${FULL_IMAGE_NAME}

echo "Image successfully pushed to ${FULL_IMAGE_NAME}"