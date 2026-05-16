#!/usr/bin/env bash
# FlightBuddy – One-shot Azure provisioning script
# Usage: ./deploy.sh
# Prerequisites: Azure CLI logged in (az login), Bicep installed (az bicep install)

set -e

RESOURCE_GROUP="rg-flightbuddy-prod"
LOCATION="eastus2"
BASE_NAME="flightbuddy"

echo "==================================================="
echo "  FlightBuddy – Azure Provisioning"
echo "==================================================="

# ── 1. Prompt for Google OAuth credentials ──────────────
echo ""
echo "You need a Google OAuth 2.0 Client ID and Secret."
echo "Create one at: https://console.cloud.google.com/apis/credentials"
echo ""
read -rsp "Google Client ID: " GOOGLE_CLIENT_ID; echo
read -rsp "Google Client Secret: " GOOGLE_CLIENT_SECRET; echo

# ── 2. Create resource group ───────────────────────────
echo ""
echo "▶ Creating resource group: $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# ── 3. Deploy Bicep template ──────────────────────────
echo "▶ Deploying infrastructure (Cosmos DB, SWA, ACS, Key Vault, App Insights)…"
DEPLOY_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters \
    baseName="$BASE_NAME" \
    location="$LOCATION" \
    googleClientId="$GOOGLE_CLIENT_ID" \
    googleClientSecret="$GOOGLE_CLIENT_SECRET" \
  --query "properties.outputs" \
  --output json)

echo "$DEPLOY_OUTPUT" | python3 -m json.tool

SWA_NAME=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['swaName']['value'])")
SWA_HOSTNAME=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['swaDefaultHostname']['value'])")

# ── 4. Assign Managed Identity roles ─────────────────
echo ""
echo "▶ Assigning managed identity roles…"

# Get SWA system-assigned identity principal ID
SWA_PRINCIPAL=$(az staticwebapp show \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "identity.principalId" \
  --output tsv)

# Cosmos DB built-in data contributor role
COSMOS_ID=$(az cosmosdb show \
  --name "cosmos-$BASE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id --output tsv)

az cosmosdb sql role assignment create \
  --account-name "cosmos-$BASE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --role-definition-id "00000000-0000-0000-0000-000000000002" \
  --principal-id "$SWA_PRINCIPAL" \
  --scope "$COSMOS_ID" \
  --output none

echo "  ✓ Cosmos DB Built-in Data Contributor assigned"

# Key Vault Secrets User role
KV_ID=$(az keyvault show \
  --name "kv-$BASE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id --output tsv)

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee "$SWA_PRINCIPAL" \
  --scope "$KV_ID" \
  --output none

echo "  ✓ Key Vault Secrets User assigned"

# ACS Contributor role
ACS_ID=$(az communication show \
  --name "acs-$BASE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id --output tsv)

az role assignment create \
  --role "Contributor" \
  --assignee "$SWA_PRINCIPAL" \
  --scope "$ACS_ID" \
  --output none

echo "  ✓ ACS Contributor assigned"

# ── 5. Update APP_URL now that we know the SWA hostname ──
echo ""
echo "▶ Updating APP_URL app setting with actual SWA hostname…"
APP_URL="https://$SWA_HOSTNAME"
az staticwebapp appsettings set \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --setting-names "APP_URL=$APP_URL" \
  --output none
echo "  ✓ APP_URL = $APP_URL"

# ── 6. Get SWA deployment token for GitHub Actions ───
echo ""
echo "▶ Getting SWA deployment token…"
SWA_TOKEN=$(az staticwebapp secrets list \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" \
  --output tsv)

echo ""
echo "==================================================="
echo "  ✅ Provisioning Complete!"
echo "==================================================="
echo ""
echo "  App URL:     https://$SWA_HOSTNAME"
echo ""
echo "  ⚠️  IMPORTANT: Add this secret to your GitHub repo:"
echo "  Settings → Secrets → Actions → New repository secret"
echo ""
echo "  Name:  AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "  Value: $SWA_TOKEN"
echo ""
echo "  Then push to 'main' — GitHub Actions will deploy automatically."
echo "==================================================="
