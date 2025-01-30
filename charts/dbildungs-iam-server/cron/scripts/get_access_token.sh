#!/bin/bash

# Ensure the script exits on any error
set -e

# Function to perform base64 URL encoding
base64url_encode() {
  # Base64 encode the input, replace '+' with '-', '/' with '_', and remove padding '='
  echo -n "$1" | openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

base64url_decode() {
    local input="$1"

    # Replace URL-specific characters with Base64 standard characters
    local base64_str="${input//-/+}"
    base64_str="${base64_str//_/\/}"

    # Calculate the required padding
    local padding=$((4 - ${#base64_str} % 4))
    if (( padding != 4 )); then
        base64_str+=$(printf '=%.0s' $(seq 1 $padding))
    fi

    # Decode the Base64 string
    # The -w0 option ensures no line wrapping (GNU base64)
    if base64 --help 2>&1 | grep -q -- '-w'; then
        echo "$base64_str" | base64 -d -w0
    else
        echo "$base64_str" | base64 -d
    fi
}

# Function to decode base64url and convert to hex, preserving leading zeros
decode_to_hex() {
  base64url_decode "$1" | hexdump -v -e '/1 "%02x"'
}

# Generate a random string for 'jti' claim
generate_jti() {
  head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13
}

# Load environment variables
clientId="${KC_CLIENT_ID}"
kc_token_url="${KC_TOKEN_URL}"
kc_public_token_url="${KC_PUBLIC_TOKEN_URL}"

# Load JWKS from environment variable or file
if [ -n "$JWKS" ]; then
  # JWKS is set in the environment, use it directly
  jwks="$JWKS"
elif [ -n "$JWKS_FILE_PATH" ] && [ -f "$JWKS_FILE_PATH" ]; then
  # JWKS_FILE_PATH is set, use the file
  jwks=$(cat "$JWKS_FILE_PATH")
else
  echo "Error: No JWKS environment variable or JWKS file found." >> "${LOG_FILE_PATH}"
  exit 1
fi

# Check if environment variables are set
if [[ -z "$clientId" || -z "$kc_token_url" || -z "$jwks" ]]; then
    echo "Error: CLIENT_ID, TOKEN_URL, and JWKS environment variables must be set." >> "${LOG_FILE_PATH}"
    exit 1
fi

# Extract the first key from the JWKS
key_json=$(echo "$jwks" | jq -c '.keys[0]')

# Check if key_json is empty
if [[ -z "$key_json" ]]; then
  echo "Error: No keys found in JWKS." >> "${LOG_FILE_PATH}"
  exit 1
fi

# Extract RSA components from JWK
n=$(echo "$key_json" | jq -r '.n')
e=$(echo "$key_json" | jq -r '.e')
d=$(echo "$key_json" | jq -r '.d')
p=$(echo "$key_json" | jq -r '.p')
q=$(echo "$key_json" | jq -r '.q')
dp=$(echo "$key_json" | jq -r '.dp')
dq=$(echo "$key_json" | jq -r '.dq')
qi=$(echo "$key_json" | jq -r '.qi')

# Decode the base64url-encoded components and convert to hex
n_dec=$(decode_to_hex "$n")
e_dec=$(decode_to_hex "$e")
d_dec=$(decode_to_hex "$d")
p_dec=$(decode_to_hex "$p")
q_dec=$(decode_to_hex "$q")
dp_dec=$(decode_to_hex "$dp")
dq_dec=$(decode_to_hex "$dq")
qi_dec=$(decode_to_hex "$qi")

# Create an ASN.1 structure for the RSA private key
asn1_structure=$(mktemp)

cat > "$asn1_structure" <<EOF
asn1=SEQUENCE:private_key

[private_key]
version=INTEGER:0
n=INTEGER:0x$n_dec
e=INTEGER:0x$e_dec
d=INTEGER:0x$d_dec
p=INTEGER:0x$p_dec
q=INTEGER:0x$q_dec
dp=INTEGER:0x$dp_dec
dq=INTEGER:0x$dq_dec
qi=INTEGER:0x$qi_dec
EOF

echo "Starting to generate PEM-formatted private key" >> "${LOG_FILE_PATH}"

# Generate the PEM-formatted private key
temp_key_file=$(mktemp)
openssl asn1parse -genconf "$asn1_structure" -out "$temp_key_file" > /dev/null 2>&1
openssl rsa -in "$temp_key_file" -inform DER -outform PEM -out "$temp_key_file.pem" > /dev/null 2>&1

echo "Ending to generate PEM-formatted private key" >> "${LOG_FILE_PATH}"

# Remove temporary files
rm "$asn1_structure" "$temp_key_file"

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
  "aud": "$kc_public_token_url",
  "jti": "$jti",
  "exp": $exp_time
}
EOF
)
payload_base64=$(base64url_encode "$payload")

# Combine header and payload
header_payload="$header_base64.$payload_base64"

echo "Payload created" >> "${LOG_FILE_PATH}"

# Sign the JWT
signature=$(echo -n "$header_payload" | \
  openssl dgst -sha256 -sign "$temp_key_file.pem" | \
  openssl enc -base64 -A | tr '+/' '-_' | tr -d '=')

echo "Signed the JWT" >> "${LOG_FILE_PATH}"

# Remove the temporary PEM key file
rm "$temp_key_file.pem"

# Create the JWT assertion
jwt_assertion="$header_payload.$signature"

# Make the POST request to Keycloak to get the access token
response=$(wget -qO- --post-data "grant_type=client_credentials&client_id=$clientId&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=$jwt_assertion" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  "$kc_token_url")

echo "Access token requested" >> "${LOG_FILE_PATH}"

# Check if the response contains an access token
if echo "$response" | grep -q '"access_token"'; then
  # Extract the access token from the response
  access_token=$(echo "$response" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  echo "$access_token"
else
  echo "Failed to retrieve access token. Response:" >> "${LOG_FILE_PATH}"
  echo "$response" >> "${LOG_FILE_PATH}"
  exit 1
fi
