# Resource group for the backend
resource "azurerm_resource_group" "backendRG" {
  name     = "backend"
  location = var.location
}

# Storage account for the Azure function
resource "azurerm_storage_account" "FunctionStorage" {
  name                     = local.backend_storage
  resource_group_name      = azurerm_resource_group.backendRG.name
  location                 = azurerm_resource_group.backendRG.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# Storage account for the file storage
resource "azurerm_storage_account" "FileStorage" {
  name                     = local.backend_file_storage
  resource_group_name      = azurerm_resource_group.backendRG.name
  location                 = azurerm_resource_group.backendRG.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# App service plan for the Azure function
resource "azurerm_service_plan" "functionASP" {
  name                = local.backend_asp
  resource_group_name = azurerm_resource_group.backendRG.name
  location            = azurerm_resource_group.backendRG.location
  os_type             = "Linux"
  sku_name            = "Y1"
}

# Application insights for the Azure function
resource "azurerm_application_insights" "backendai" {
  name                = local.backend_app_insights
  location            = azurerm_resource_group.backendRG.location
  resource_group_name = azurerm_resource_group.backendRG.name
  application_type    = "web"

}

# Azure function
resource "azurerm_linux_function_app" "backendFunction" {
  #set the name to lowercase var.projectName with -backend at the end
  name                       = local.backend_function
  resource_group_name        = azurerm_resource_group.backendRG.name
  location                   = azurerm_resource_group.backendRG.location
  service_plan_id            = azurerm_service_plan.functionASP.id
  storage_account_access_key = azurerm_storage_account.FunctionStorage.primary_access_key
  storage_account_name       = azurerm_storage_account.FunctionStorage.name
  https_only                 = true
  site_config {
    application_insights_connection_string = azurerm_application_insights.backendai.connection_string
    application_insights_key               = azurerm_application_insights.backendai.instrumentation_key
    application_stack {
      node_version = "18"
    }
  }
  identity {
    type = "SystemAssigned"
  }
  lifecycle {
    ignore_changes = [
      app_settings,
      tags,
      auth_settings_v2,
      site_config,
      sticky_settings
    ]
  }
}

# Cosmos DB
resource "azurerm_cosmosdb_account" "db" {
  name                      = local.backend_cosmos_db
  location                  = azurerm_resource_group.backendRG.location
  resource_group_name       = azurerm_resource_group.backendRG.name
  offer_type                = "Standard"
  kind                      = "GlobalDocumentDB"
  enable_automatic_failover = false
  enable_free_tier          = true
  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }
  geo_location {
    location          = "eastus2"
    failover_priority = 0
  }
  capabilities {
    name = "EnableServerless"
  }

}

# Key vault
resource "azurerm_key_vault" "kv" {
  name                = local.backend_keyvault
  location            = azurerm_resource_group.backendRG.location
  resource_group_name = azurerm_resource_group.backendRG.name
  sku_name            = "standard"
  tenant_id           = var.tenant_id
}

# Azure function access to key vault
resource "azurerm_role_assignment" "functionKeyvault" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_function_app.backendFunction.identity[0].principal_id
  depends_on = [
    azurerm_key_vault.kv,
    azurerm_linux_function_app.backendFunction
  ]
}


resource "azurerm_key_vault_secret" "cosmosSecret" {
  name         = "cosmosdbkey"
  value        = azurerm_cosmosdb_account.db.primary_key
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "fileStorageSecret" {
  name         = "filestoragekey"
  value        = azurerm_storage_account.FileStorage.primary_access_key
  key_vault_id = azurerm_key_vault.kv.id
}
