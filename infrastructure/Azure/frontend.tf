# Frontend storage resource group
resource "azurerm_resource_group" "frontendRG" {
  name     = "frontend"
  location = var.location
}

# Storage account for the frontend
resource "azurerm_storage_account" "frontendStorage" {
  name                     = local.frontend_storage
  resource_group_name      = azurerm_resource_group.frontendRG.name
  location                 = azurerm_resource_group.frontendRG.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }
}

