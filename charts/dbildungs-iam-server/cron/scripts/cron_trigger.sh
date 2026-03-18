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

AUTHMODE="${AUTH_MODE:-jwt}"

endpoint_url="${BACKEND_ENDPOINT_URL}"

echo "Triggering $endpoint_url with $HTTP_METHOD using AUTH_MODE=$AUTH_MODE at $(date)"

auth_header=""

case "$AUTH_MOD" in

    jwt)
        # Call get_access_token.sh and capture the access token
        echo "Using JWT authentication..."
        access_token=$(./get_access_token.sh)
        if [ -z "$access_token" ]; then
            echo "Error: could not obtain JWT access token"
            exit 1
        fi
        auth_header="Authorization: Bearer $access_token"
        ;;

    apikey)
        echo "Using INTERNAL_COMMUNICATION_API_KEY authentication..."
        if [ -z "$INTERNAL_COMMUNICATION_API_KEY" ]; then
            echo "Error: INTERNAL_COMMUNICATION_API_KEY is not set."
            exit 1
        fi
        auth_header="INTERNAL_COMMUNICATION_API_KEY: ${INTERNAL_COMMUNICATION_API_KEY}"
        ;;
    *)
        echo "Error: AUTH_MODE must be one of: jwt, apikey"
        exit 1
        ;;
esac

# Create temporary files for headers and body
header_file=$(mktemp)
body_file=$(mktemp)

# Function to clean up temporary files on exit
cleanup() {
  rm -f "$header_file" "$body_file"
}
trap cleanup EXIT

# Make the request with JWT authorization
wget --quiet \
     --method="$HTTP_METHOD" \
     --header="Content-Type: application/json" \
     ${auth_header:+"--header=$auth_header"} \
     --output-document="$body_file" \
     --server-response \
     "$endpoint_url" \
     2> "$header_file"

# Extract the HTTP status code from the headers
http_status=$(awk '/^  HTTP\// {print $2; exit}' "$header_file")

# Extract the response body
response_body=$(cat "$body_file")

# Output the response details
echo "Finished triggering $endpoint_url with $HTTP_METHOD at $(date)"
echo "HTTP Status: $http_status"
echo "Response Body: $response_body"

# Exit with status 1 if the HTTP status code is not 200
if [ "$http_status" -ne 200 ]; then
  echo "Error: HTTP request failed with status code $http_status"
  exit 1
fi
