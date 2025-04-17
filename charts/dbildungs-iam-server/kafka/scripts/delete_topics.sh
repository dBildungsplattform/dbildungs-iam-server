#!/bin/sh

# Usage:
#   delete_topics.sh <prefix>
#
# Environment variables:
#   KAFKA_URL                - (required) The server to send the requests to
#   KAFKA_JAAS_FILE          - (optional) The JAAS file to use for authentication
#
# This script will delete all topics with the specified prefix

# Check for prefix argument
if [ -z "$1" ]; then
    echo "Usage: ./create_topics.sh <prefix>" && exit 1
fi

# Check for KAFKA_URL environment variable (required)
if [ -z "${KAFKA_URL}" ]; then
    echo "Environment-variable KAFKA_URL should point to the Kafka server! (e.g. localhost:9094)" && exit 1
fi

# Check for KAFKA_TOPIC_PREFIX (optional)
if [ -z "${KAFKA_JAAS_FILE}" ]; then
    echo "Environment-variable KAFKA_JAAS_FILE was not set, connecting without authentication."
else
    CONFIG_FLAG="--command-config ${KAFKA_JAAS_FILE}"
fi

echo "Deleting topics..."

# Run the topic-deletion for every line in the file
kafka-topics.sh \
    --bootstrap-server "${KAFKA_URL}" \
    --delete \
    --topic "${KAFKA_TOPIC_PREFIX}.*" \
    ${CONFIG_FLAG}

echo "Deleted all topics with prefix!"
