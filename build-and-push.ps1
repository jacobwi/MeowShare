# PowerShell script to build and push MeowShare to registry.bcat.cloud
# Usage: .\build-and-push.ps1 [docker|podman]
# Default is podman if no argument provided

param (
    [string]$engine = "podman"
)

# Validate container engine parameter
if ($engine -ne "docker" -and $engine -ne "podman") {
    Write-Host "Invalid container engine specified. Use 'docker' or 'podman'." -ForegroundColor Red
    exit 1
}

Write-Host "Using container engine: $engine" -ForegroundColor Green

# Load environment variables from .env file
$envFile = Get-Content .env | Where-Object { -not $_.StartsWith('#') -and $_.Trim() -ne '' }
$envFile | ForEach-Object {
    $key, $value = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($key, $value)
    Set-Item -Path "Env:$key" -Value $value
}

# Set image name and tag
$REGISTRY="registry.bcat.cloud"
$REPOSITORY="bcat/meowshare"
$TAG="latest"
$FULL_IMAGE_NAME="$REGISTRY/$REPOSITORY`:$TAG"

Write-Host "Building MeowShare Docker image..." -ForegroundColor Green

# Build the image with all required build arguments
& $engine build -t $FULL_IMAGE_NAME -f Dockerfile `
  --build-arg NUGET_APIKEY=$env:NUGET_APIKEY `
  --build-arg NUGET_SOURCE=$env:NUGET_SOURCE `
  --build-arg VITE_API_URL=/api `
  --build-arg VITE_APP_NAME=$env:VITE_APP_NAME `
  --build-arg VITE_DEMO_MODE=$env:DEMO_MODE .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building image. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "Pushing image to $FULL_IMAGE_NAME..." -ForegroundColor Green

# Push the image to registry without login
& $engine push $FULL_IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing image. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "Image successfully pushed to $FULL_IMAGE_NAME" -ForegroundColor Green