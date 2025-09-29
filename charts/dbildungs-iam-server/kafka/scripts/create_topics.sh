#!/bin/sh

# Usage:
#   create_topics.sh <file>
#
# Environment variables:
#   KAFKA_BROKER             - (required) The server to send the requests to
#   KAFKA_SSL_ENABLED        - (optional) Wether SSL should be used
#   KAFKA_SSL_CA_PATH        - (required if SSL enabled) CA file in PEM format
#   KAFKA_SSL_CERT_PATH      - (required if SSL enabled) Certificate file in PEM format
#   KAFKA_SSL_KEY_PATH       - (required if SSL enabled) Key file in PEM format
#   KAFKA_TOPIC_PREFIX       - (optional) A prefix that will be prepended to every created topic
#   KAFKA_TOPIC_PARTITIONS   - (optional) The number of partitions to use
#   KAFKA_TOPIC_REPLICATIONS - (optional) The replication factor to use
#   KAFKA_JAAS_FILE          - (optional) The JAAS file to use for authentication (does nothing, when SSL_ENABLED is set)
#
# This script will create a topic for every line in the input file (if it does not already exist)

# Check for file argument
if [ -z "$1" ]; then
    echo "Usage: ./create_topics.sh <topics-file>" && exit 1
fi

# Check for KAFKA_BROKER environment variable (required)
if [ -z "${KAFKA_BROKER}" ]; then
    echo "Environment-variable KAFKA_BROKER should point to the Kafka server! (e.g. localhost:9094)" && exit 1
fi

# Check for KAFKA_TOPIC_PREFIX (optional)
if [ -z "${KAFKA_TOPIC_PREFIX}" ]; then
    echo "Environment-variable KAFKA_TOPIC_PREFIX was not set, creating topics without a prefix."
fi

# Check for KAFKA_TOPIC_PARTITIONS (optional)
# Set to "1" as a default
if [ -z "${KAFKA_TOPIC_PARTITIONS}" ]; then
    KAFKA_TOPIC_PARTITIONS="3"
    echo "Environment-variable KAFKA_TOPIC_PARTITIONS was not set, using the default (= 3)."
fi

# Check for KAFKA_TOPIC_REPLICATIONS (optional)
# If not set, omit it from the create-topics command (uses cluster default)
if [ -z "${KAFKA_TOPIC_REPLICATIONS}" ]; then
    echo "Environment-variable KAFKA_TOPIC_REPLICATIONS was not set, using the cluster default."
else
    REPLICATION_FLAG="--replication-factor ${KAFKA_TOPIC_REPLICATIONS}"
fi

# When KAFKA_SSL_ENABLED is set create JAAS file
KAFKA_SSL_ENABLED=$(echo "$KAFKA_SSL_ENABLED" | tr '[:upper:]' '[:lower:]')
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

# Check for KAFKA_JAAS_FILE
if [ -z "${KAFKA_JAAS_FILE}" ]; then
    echo "Environment-variable KAFKA_JAAS_FILE was not set, connecting without authentication."
else
    CONFIG_FLAG="--command-config ${KAFKA_JAAS_FILE}"
fi

echo "Creating all topics..."

# Run the topic-creation for every line in the file
<"$1" xargs -I % \
    /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server "${KAFKA_BROKER}" \
    --create \
    --if-not-exists \
    --topic "${KAFKA_TOPIC_PREFIX}%" \
    --partitions "${KAFKA_TOPIC_PARTITIONS}" \
    ${REPLICATION_FLAG} \
    ${CONFIG_FLAG}

echo "Created all topics!"

# Output all topics and metadata
echo "Running kafka-topics.sh --describe"
/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${KAFKA_BROKER}" ${CONFIG_FLAG} --describe
