## Azure B2C Setup

### Register AD provider

```
az account set --subscription "Microsoft Azure Sponsorship"
az provider register --namespace Microsoft.AzureActiveDirectory
```

## Tenant configuration

- Tenant type: Azure Active Directory (B2C)
- Organization name: Verified Orchestration Onboarding Demo
- Initial domain name: voonboardingdemo.onmicrosoft.com
- Location: Australia
- Subscription: Microsoft Azure Sponsorship
- Resource group: vo-verified-orchestration-demo-b2c
- Resource group location: Australia East

## B2C flow: Sign in

Name: B2C_1_SignIn

### User attributes and token claims

- Given Name
- Surname
- Display Name
- Email Addresses
- User's Object ID
