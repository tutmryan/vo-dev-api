# Gettting started with Verified Orchestration

## Install the app into the tenant

Assuming [Azure Command-Line Interface (CLI)](https://learn.microsoft.com/en-us/cli/azure/) is installed,

1. Log in to the tenant you want to install the app into; `az login --tenant <tenant_id>`.
1. Install sandbox verision of Verified Orchestration app; `az ad sp create --id <instance app registration client id>`.
1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Enterprise applications".
1. Remove "Application type == Enterprise Applications" filter.
1. Enter `Verified Orchestration` into "Search by application name or object ID" text box to locate the newly installed app and then click on it.
1. In the "Security" section, click on "Permissions".
1. Click on "Grant admin consent for [tenant name]", then confirm the consent.
1. In the "Manage" section, click on "Users and groups".
1. Click on "+ Add user/group", then select users and groups and assign them to one of the application roles;
   - Credential Admin
   - Issuer
   - Partner Admin
   - Reader
1. Repeat the last step until all necessary users/groups to the application roles mappings exist.
