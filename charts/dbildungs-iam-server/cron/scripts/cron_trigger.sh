#!/bin/bash

# Check if BACKEND_ENDPOINT_URL is set
if [ -z "$BACKEND_ENDPOINT_URL" ]; then
  echo "Error: BACKEND_ENDPOINT_URL is not set."
  exit 1
fi

# Check if HTTP_METHOD is set
if [ -z "$HTTP_METHOD" ]; then
  echo "Error: HTTP_METHOD is not set."
  exit 1
fi

endpoint_url="${BACKEND_ENDPOINT_URL}"

echo "Triggering $endpoint_url with $HTTP_METHOD at $(date)"

# Call get_access_token.sh and capture the access token
access_token=$(./get_access_token.sh)

# Make the request with JWT authorization and capture the HTTP status code and response body
response=$(curl -s -w "\n%{http_code}" -X "$HTTP_METHOD" "$endpoint_url" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json")

# Split the response into body and status code
response_body=$(echo "$response" | sed '$d')
http_status=$(echo "$response" | tail -n1)

# Output the response details
echo "Finished triggering $endpoint_url with $HTTP_METHOD at $(date)
HTTP Status: $http_status
Response Body: $response_body"

# Exit with status 1 if the HTTP status code is not 200
if [ "$http_status" -ne 200 ]; then
  echo "Error: HTTP request failed with status code $http_status"
  exit 1
fi
