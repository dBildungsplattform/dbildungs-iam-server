#!/bin/bash

# Ensure the script exits on any error
set -e

# Function to perform base64 URL encoding
base64url_encode() {
  # Base64 encode the input, replace '+' with '-', '/' with '_', and remove padding '='
  echo -n "$1" | openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

# Generate a random string for 'jti' claim
generate_jti() {
  head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13
}

# Load environment variables
clientId="${CLIENT_ID}"
url="${TOKEN_URL}"
private_key_file="${PRIVATE_KEY_FILE}"

# Check if environment variables are set
if [[ -z "$clientId" || -z "$url" || -z "$private_key_file" ]]; then
  echo "Error: CLIENT_ID, TOKEN_URL, and PRIVATE_KEY_FILE environment variables must be set."
  exit 1
fi

# Check if the private key file exists
if [[ ! -f "$private_key_file" ]]; then
  echo "Private key file '$private_key_file' not found."
  exit 1
fi

# Create JWT header
header='{"alg":"RS256","typ":"JWT"}'
header_base64=$(base64url_encode "$header")

# Create JWT payload
current_time=$(date +%s)
exp_time=$((current_time + 300))  # Token valid for 5 minutes
jti=$(generate_jti)

payload=$(cat <<EOF
{
  "iss": "$clientId",
  "sub": "$clientId",
  "aud": "$url",
  "jti": "$jti",
  "exp": $exp_time
}
EOF
)
payload_base64=$(base64url_encode "$payload")

# Combine header and payload
header_payload="$header_base64.$payload_base64"

# Sign the JWT
signature=$(echo -n "$header_payload" | \
  openssl dgst -sha256 -sign "$private_key_file" | \
  openssl enc -base64 -A | tr '+/' '-_' | tr -d '=')

# Create the JWT assertion
jwt_assertion="$header_payload.$signature"

# Make the POST request to Keycloak to get the access token
response=$(curl -s -X POST "$url" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$clientId" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=$jwt_assertion")

# Check if the response contains an access token
if echo "$response" | grep -q '"access_token"'; then
  # Extract the access token from the response
  access_token=$(echo "$response" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  echo "$access_token"
else
  echo "Failed to retrieve access token. Response:"
  echo "$response"
  exit 1
fi
