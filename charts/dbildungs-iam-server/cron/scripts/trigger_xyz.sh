#!/bin/bash

endpoint_url="${BACKEND_HOSTNAME}"

echo "Triggering $endpoint_url at $(date)"

# Call get_access_token.sh and capture the access token
access_token=$(./get_access_token.sh)

# Use the access token as needed
echo "Access token obtained: $access_token"

# Make the PUT request with JWT authorization
response=$(curl -v -X PUT "$endpoint_url" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json")

# Output the response
echo "Response from server: $response"
