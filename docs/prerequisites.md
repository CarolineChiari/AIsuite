# Prerequisists

## Azure

### Service Principal

This service principal is used for the infrastructure deployment.

You can follow the instructions here: [https://learn.microsoft.com/en-us/purview/create-service-principal-azure](https://learn.microsoft.com/en-us/purview/create-service-principal-azure)

### Subscription

You need an Azure subscription to deploy the infrastructure. You can use an existing subscription, but it's better if you create a new one so multiple terraform deployments don't interfere with each other.

**Grant owner permissions to the service principal created previously**

### Terraform Storage account

You need a storage account to store the terraform state. You can create one using the Azure portal.

You probably want to put all your terraform deployments in their own subscription, so they are separate from your other resources.

**Grant Storage Blob Contributor access to your SPN**

## OpenAI

Create a new API key.

## GitHub

Create the following secrets:

- **ARM_CLIENT_ID**: Client ID of the service principal
- **ARM_CLIENT_SECRET**: Client secret of the service principal
- **ARM_SUBSCRIPTION_ID**: Subscription ID for the infrastructure deployment
- **ARM_TENANT_ID**: Tenant ID for infrastructure deployment
- **ENVIRONMENT_SETTINGS**: See [frontend](./frontend.md)
- **FRONTEND_STORAGE_ACCOUNT_KEY**: You will get this after infrastructure deployment.
- **FRONTEND_STORAGE_ACCOUNT_NAME**: You will get this after infrastructure deployment.
- **INFRASTRUCTURE_CONTAINER_NAME**: Container name for the infrastructure deployment (where to store the tfstate file)
- **INFRASTRUCTURE_KEY**: Key for the infrastructure deployment (name of the tfstate file)
- **INFRASTRUCTURE_STORAGE_ACCOUNT_KEY**: Storage account key for the infrastructure deployment storage account
- **INFRASTRUCTURE_STORAGE_ACCOUNT_NAME**: Storage account name for the infrastructure deployment
- **SUBSCRIPTION_ID**: Subscription ID for the backend deployment
