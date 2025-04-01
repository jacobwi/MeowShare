FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl

# Copy project file first
COPY ["MeowShare.Api/*.csproj", "MeowShare.Api/"]

# Configure NuGet source
ARG NUGET_APIKEY
ARG NUGET_SOURCE
RUN if [ -n "$NUGET_SOURCE" ]; then \
    dotnet nuget add source $NUGET_SOURCE \
    --name private-feed \
    --username "api" \
    --password $NUGET_APIKEY \
    --valid-authentication-types basic \
    --store-password-in-clear-text; \
    fi

# Restore dependencies
WORKDIR /app/MeowShare.Api
RUN dotnet restore

# Copy everything else, maintaining the directory structure
WORKDIR /app
COPY . .

# Ensure the seed-data.yaml is included
RUN if [ -f "MeowShare.Api/seed-data.yaml" ]; then echo "Seed data found"; else echo "Seed data not found"; fi

# Build
WORKDIR /app/MeowShare.Api
RUN dotnet build -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Generate self-signed certificate
RUN mkdir -p /app/publish/certs && \
    openssl req -x509 -newkey rsa:4096 -keyout /app/publish/certs/key.pem -out /app/publish/certs/cert.pem -days 365 -nodes -subj "/CN=localhost" && \
    openssl pkcs12 -export -out /app/publish/certs/cert.pfx -inkey /app/publish/certs/key.pem -in /app/publish/certs/cert.pem -passout pass:your_cert_password

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=publish /app/publish .

# Copy seed data explicitly
COPY --from=publish /app/MeowShare.Api/seed-data.yaml ./

# Copy certificates
COPY --from=publish /app/publish/certs /app/certs

EXPOSE 8080
ENTRYPOINT ["dotnet", "MeowShare.Api.dll"]