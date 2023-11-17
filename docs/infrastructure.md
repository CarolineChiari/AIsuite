# Infrastructure Deployment

The infrastructure for this project is running on Azure. All the resources are serverless, so the cost should be minimal.

The deployment is done using Terraform, some modification is needed for your own deployment.

There is also additional manual configuration needed for the backend and frontend deployment.

## Prerequisites

Make sure you followed the instructions in [prerequisites](./prerequisites.md)

## Deployment

Open a pull request and merge it to your main branch. This will trigger the GitHub Actions workflow. If there are no errors, merge the pull request and the infrastructure will be deployed.
