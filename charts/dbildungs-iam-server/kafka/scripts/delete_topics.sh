#!/bin/sh

# Usage:
#   delete_topics.sh <prefix>
#
# Environment variables:
#   KAFKA_BROKER             - (required) The server to send the requests to
#   KAFKA_TOPIC_PREFIX       - (optional) A prefix that will determine all topics to be deleted
#   KAFKA_SSL_ENABLED        - (optional) Wether SSL should be used
#   KAFKA_SSL_CA_PATH        - (required if SSL enabled) CA file in PEM format
#   KAFKA_SSL_CERT_PATH      - (required if SSL enabled) Certificate file in PEM format
#   KAFKA_SSL_KEY_PATH       - (required if SSL enabled) Key file in PEM format
#   KAFKA_JAAS_FILE          - (optional) The JAAS file to use for authentication (does nothing, when SSL_ENABLED is set)
#
# This script will delete all topics with the specified prefix

# Check for prefix argument
if [ -z "$1" ]; then
    echo "Usage: ./delete_topics.sh <prefix>" && exit 1
fi

# Check for KAFKA_BROKER environment variable (required)
if [ -z "${KAFKA_BROKER}" ]; then
    echo "Environment-variable KAFKA_BROKER should point to the Kafka server! (e.g. localhost:9094)" && exit 1
fi

# Check for KAFKA_TOPIC_PREFIX (optional)
if [ -z "${KAFKA_TOPIC_PREFIX}" ]; then
    echo "Environment-variable KAFKA_TOPIC_PREFIX was not set, ALL topics will be deleted!"
fi

# When KAFKA_SSL_ENABLED is set create JAAS file
KAFKA_SSL_ENABLED=$(tr '[:upper:]' '[:lower:]' <<< "$KAFKA_SSL_ENABLED" )
if [ "$KAFKA_SSL_ENABLED" = "true" ]; then
    if [ ! -e "$KAFKA_SSL_CA_PATH" ]; then
        echo "KAFKA_SSL_CA_PATH file does not exist!" && exit 1
    fi

    if [ ! -e "$KAFKA_SSL_CERT_PATH" ]; then
        echo "KAFKA_SSL_CERT_PATH file does not exist!" && exit 1
    fi

    if [ ! -e "$KAFKA_SSL_KEY_PATH" ]; then
        echo "KAFKA_SSL_KEY_PATH file does not exist!" && exit 1
    fi

    CONFIG_DIR=$(mktemp -d)
    KAFKA_JAAS_FILE="${CONFIG_DIR}/client.properties"
    KEYSTORE_FILE="${CONFIG_DIR}/keystore.pem"
    TRUSTSTORE_FILE="${CONFIG_DIR}/truststore.pem"

    # Create Keystore and Truststore
    cat "${KAFKA_SSL_KEY_PATH}" "${KAFKA_SSL_CERT_PATH}" > "${KEYSTORE_FILE}"
    cp "${KAFKA_SSL_CA_PATH}" "${TRUSTSTORE_FILE}"

    cat <<EOF > ${KAFKA_JAAS_FILE}
security.protocol=SSL
ssl.keystore.type=PEM
ssl.keystore.location=${KEYSTORE_FILE}
ssl.truststore.type=PEM
ssl.truststore.location=${TRUSTSTORE_FILE}
ssl.enabled.protocols=TLSv1.2,TLSv1.1
EOF
else
    echo "The env KAFKA_SSL_ENABLED is not set. Not creating JAAS file."
fi

# Check for KAFKA_TOPIC_PREFIX (optional)
if [ -z "${KAFKA_JAAS_FILE}" ]; then
    echo "Environment-variable KAFKA_JAAS_FILE was not set, connecting without authentication."
else
    CONFIG_FLAG="--command-config ${KAFKA_JAAS_FILE}"
fi

echo "Deleting topics..."

# Run the topic-deletion for every line in the file
/opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server "${KAFKA_BROKER}" \
    --delete \
    --topic "${KAFKA_TOPIC_PREFIX}.*" \
    ${CONFIG_FLAG}

echo "Deleted all topics with prefix!"
