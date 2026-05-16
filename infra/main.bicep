@description('Base name for all resources (e.g. flightbuddy)')
param baseName string = 'flightbuddy'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Google OAuth Client ID (from Google Cloud Console)')
@secure()
param googleClientId string

@description('Google OAuth Client Secret (from Google Cloud Console)')
@secure()
param googleClientSecret string

@description('Your public app URL (set after SWA is created, update + redeploy)')
param appUrl string = 'https://placeholder.azurestaticapps.net'

// ─────────────────────────────────────────────
// Cosmos DB (Serverless, NoSQL)
// ─────────────────────────────────────────────
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: 'cosmos-${baseName}'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      { name: 'EnableServerless' }
    ]
    enableAutomaticFailover: false
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: 'flightbuddy'
  properties: {
    resource: { id: 'flightbuddy' }
  }
}

resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDatabase
  name: 'users'
  properties: {
    resource: {
      id: 'users'
      partitionKey: { paths: ['/id'], kind: 'Hash' }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
      }
    }
  }
}

resource tripsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDatabase
  name: 'trips'
  properties: {
    resource: {
      id: 'trips'
      partitionKey: { paths: ['/userId'], kind: 'Hash' }
      defaultTtl: -1  // TTL enabled, controlled per document via 'ttl' field
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    }
  }
}

resource matchesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDatabase
  name: 'matches'
  properties: {
    resource: {
      id: 'matches'
      partitionKey: { paths: ['/requesterId'], kind: 'Hash' }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    }
  }
}

// ─────────────────────────────────────────────
// Azure Communication Services (Email)
// ─────────────────────────────────────────────
resource acs 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: 'acs-${baseName}'
  location: 'global'
  properties: {
    dataLocation: 'United States'
  }
}

resource acsEmailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: 'acs-email-${baseName}'
  location: 'global'
  properties: {
    dataLocation: 'United States'
  }
}

// Managed Azure domain (free, no DNS needed)
resource acsDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: acsEmailService
  name: 'AzureManagedDomain'
  location: 'global'
  properties: {
    domainManagement: 'AzureManaged'
  }
}

// ─────────────────────────────────────────────
// Application Insights + Log Analytics Workspace
// ─────────────────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${baseName}'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${baseName}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ─────────────────────────────────────────────
// Key Vault
// ─────────────────────────────────────────────
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${baseName}'
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true  // Use RBAC, not access policies
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

// Store Google credentials in Key Vault
resource kvGoogleClientId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'GOOGLE-CLIENT-ID'
  properties: {
    value: googleClientId
  }
}

resource kvGoogleClientSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'GOOGLE-CLIENT-SECRET'
  properties: {
    value: googleClientSecret
  }
}

// Store ACS endpoint in Key Vault
resource kvAcsEndpoint 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ACS-ENDPOINT'
  properties: {
    value: 'https://${acs.name}.communication.azure.com'
  }
}

// Store App Insights connection string in Key Vault
resource kvAppInsights 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'APPLICATIONINSIGHTS-CONNECTION-STRING'
  properties: {
    value: appInsights.properties.ConnectionString
  }
}

// ─────────────────────────────────────────────
// Static Web App (Standard — required for custom auth)
// ─────────────────────────────────────────────
resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'swa-${baseName}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// App settings for SWA (Functions pick these up too)
resource swaSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: swa
  name: 'appsettings'
  properties: {
    COSMOS_ENDPOINT: cosmosAccount.properties.documentEndpoint
    ACS_ENDPOINT: 'https://${acs.name}.communication.azure.com'
    ACS_SENDER_ADDRESS: 'DoNotReply@${acsDomain.properties.mailFromSenderDomain}'
    APP_URL: appUrl
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    GOOGLE_CLIENT_ID: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=GOOGLE-CLIENT-ID)'
    GOOGLE_CLIENT_SECRET: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=GOOGLE-CLIENT-SECRET)'
  }
}

// ─────────────────────────────────────────────
// Outputs
// ─────────────────────────────────────────────
output swaName string = swa.name
output swaDefaultHostname string = swa.properties.defaultHostname
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output acsEndpoint string = 'https://${acs.name}.communication.azure.com'
output acsSenderDomain string = acsDomain.properties.mailFromSenderDomain
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output keyVaultName string = keyVault.name
