# AIsuite

## Deployment

### Infrastructure

The infrastructure for this project is running on Azure. All the resources are serverless, so the cost should be minimal. The resources are:

- Azure Functions: for the backend
- Azure Storage: for the frontend
- Azure Cosmos DB: for the database
- Azure Key Vault: for the secrets

Infrastructure deployment information can be found here: [Backend](./docs/infrastructure.md)

### Frontend

The frontend is a single page application hosted on Azure Storage. The deployment is done using GitHub Actions. The deployment information can be found here: [Frontend](./docs/frontend.md)

### Backend

The backend is a serverless application hosted on Azure Functions. The deployment is done using GitHub Actions. The deployment information can be found here: [Backend](./docs/backend.md)
