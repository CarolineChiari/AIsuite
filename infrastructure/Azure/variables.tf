variable "tenant_id" {
  type        = string
  description = "Your Azure Tenant ID"
}

variable "location" {
  type        = string
  description = "Azure region to deploy resources"
}

variable "project_name" {
  type        = string
  description = "Name of the project"
}

variable "prefix" {
  type        = string
  description = "Prefix to add to all resources"
}
