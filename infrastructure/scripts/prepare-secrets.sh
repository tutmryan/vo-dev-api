#!/bin/bash

# This script is designed to be run in a GitHub Actions workflow to prepare secrets for a keyvault using openssl rand
# The first argument is the name of the key vault
# Arguments for the secrets are colon-separated strings in the format secretName:encoding:numberOfBytes. Encoding can be hex or base64.
# The script will output values for every secret to the GITHUB_OUTPUT environment variable as key-value pairs e.g. {secretName}={secretValue}
# For existing secrets, the value will be empty. For secrets that need to be created, a value will be generated and returned.

keyVaultName=${1}
shift

az keyvault show --name $keyVaultName -o none
keyVaultExists=$?

if [ $keyVaultExists -ne 0 ]; then
  secretNames=""
  echo "Key vault $keyVaultName does not yet exist"
else
  # get the current IP address
  ip=$(curl -s ipinfo.io/ip)
  ret=$?
  if [ $ret -ne 0 ]; then
    echo "Error reading IP address"
    exit 1
  fi

  # list the current firewall rules for the key vault
  list=$(az keyvault network-rule list --name $keyVaultName --query "ipRules[].value" -o tsv 2>/dev/null)
  ret=$?
  if [ $ret -ne 0 ]; then
    echo "Error reading firewall rules for key vault $keyVaultName"
    exit 1
  fi

  # check if the IP address is already in the list of firewall rules
  if [[ $list == *$ip* ]]; then
    echo "Firewall rule for IP address $ip already exists in key vault $keyVaultName"
  else
    # add the IP address to the list of firewall rules
    echo "Adding firewall rule to key vault $keyVaultName for IP address $ip"
    az keyvault network-rule add --name $keyVaultName --ip-address $ip -o none
    ret=$?
    if [ $ret -ne 0 ]; then
      echo "Error adding firewall rule to key vault $keyVaultName for IP address $ip"
      exit 1
    fi
    # wait for the firewall rule to be updated
    az keyvault network-rule wait --name $keyVaultName --updated -o none
  fi

  secretNames=$(az keyvault secret list --vault-name $keyVaultName --query "[].name" -o tsv 2>/dev/null)
  ret=$?
  if [ $ret -ne 0 ]; then
    echo "Error listing secret names from vault $keyVaultName"
    exit 1
  fi

  echo "Removing firewall rule from key vault $keyVaultName for IP address $ip"
  az keyvault network-rule remove --name $keyVaultName --ip-address $ip -o none
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
