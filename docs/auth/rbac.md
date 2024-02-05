# Role-based access control (RBAC) setup

It is assumed that the Verified Orchestration app registration has been carried out with all the roles including both application and user specific roles as described in the [multitenant auth setup](../infrastructure/multitenant-auth-setup.md#create-an-app-registration-for-the-verified-orchestration).

## Create security groups in Azure AD to ease assignment of users to app roles

Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.

1. In the "Manage" section, click on "Groups", then on "New group".
1. Keep group type as `Security`, membership type as `Assigned`, and `No` for Entra role assignment as per default.
1. Enter a group name, select relevant members, and finalise the group creation.

Perform the above steps for each of the user roles and environments.

| Role                                 | Group name                                      |
| ------------------------------------ | ----------------------------------------------- |
| VerifiableCredential.Reader          | Verified Orchestration Reader ([env])           |
| VerifiableCredential.Issuer          | Verified Orchestration Issuer ([env])           |
| VerifiableCredential.CredentialAdmin | Verified Orchestration Credential Admin ([env]) |
| VerifiableCredential.PartnerAdmin    | Verified Orchestration Partner Admin ([env])    |

## Map Azure AD security groups to app roles

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Enterprise applications", then select `Verified Orchestration API ([env])` from the list.
1. In the "Manage" section, click on "Users and groups", then on "Add user/group".
1. Select the matching pair of Azure AD security group and app role as per the table above.
1. Repeat adding groups until all matching pairs are created.
