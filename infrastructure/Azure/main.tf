terraform {
  required_version = ">= 0.12.0"

  required_providers {
    azurerm = {
      version = "~> 3.0"
      source  = "hashicorp/azurerm"
    }
  }

  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

locals {
  root                 = replace("${var.prefix}-${var.project_name}", "/[^a-zA-Z0-9]/", "") # Naming root to use for all resources
  backend_storage      = substr(lower("${local.root}func"), 0, 24)                          # Name to use for the function app storage account
  backend_file_storage = substr(lower("${local.root}file"), 0, 24)                          # Name to use for the file storage account (used to store files for TTS)
  backend_asp          = substr(lower("${local.root}-plan"), 0, 60)                         # Name to use for the app service plan
  backend_function     = substr(lower("${local.root}-func"), 0, 30)                         # Name to use for the function app
  backend_app_insights = substr(lower("${local.root}-ai"), 0, 30)                           # Name to use for the app insights
  backend_keyvault     = substr(lower("${local.root}-kv"), 0, 24)                           # Name to use for the key vault
  backend_cosmos_db    = substr(lower("${local.root}-cosmosdb"), 0, 64)                     # Name to use for the cosmos db
  frontend_storage     = substr(lower("${local.root}web"), 0, 24)                           # Name to use for the web app storage account
}
