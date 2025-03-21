#!/bin/bash

# This script is designed to be run in a GitHub Actions workflow to prepare secrets for a keyvault using openssl rand
# The first argument is the name of the key vault
# The second argument is the object ID of the service principal that will be used to access the key vault
# Arguments for the secrets are colon-separated strings in the format secretName:encoding:numberOfBytes. Encoding can be hex or base64.
# The script will output values for every secret to the GITHUB_OUTPUT environment variable as key-value pairs e.g. {secretName}={secretValue}
# For existing secrets, the value will be empty. For secrets that need to be created, a value will be generated and returned.

keyVaultName=${1}
shift

servicePrincipalObjectId=${1}
shift

az keyvault show --name $keyVaultName -o none
keyVaultExists=$?

if [ $keyVaultExists -ne 0 ]; then
  secretNames=""
  echo "Key vault $keyVaultName does not yet exist"
else
  secretNames=$(az keyvault secret list --vault-name $keyVaultName --query "[].name" -o tsv 2>/dev/null)
  ret=$?
  if [ $ret -ne 0 ]; then
    echo "Error listing secret names from vault $keyVaultName"
    exit 1
  fi
fi

while test ${#} -gt 0
do
  secretName=$(echo "$1"|cut -d\: -f1)
  encoding=$(echo "$1"|cut -d\: -f2)
  numberOfBytes=$(echo "$1"|cut -d\: -f3)

  if [[ $secretNames == *$secretName* ]]; then
    echo "Secret $secretName already exists"
  else
    secretValue=$(openssl rand -$encoding $numberOfBytes)
    echo "::add-mask::$secretValue"
    echo "$secretName=$secretValue" >> $GITHUB_OUTPUT
    echo "Secret $secretName value populated with $numberOfBytes bytes encoded as $encoding"
  fi

  shift
done
