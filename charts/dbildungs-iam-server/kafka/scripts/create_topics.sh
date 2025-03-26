#!/bin/sh

# Usage:
#   create_topics.sh <file>
#
# Environment variables:
#   KAFKA_URL                - (required) The server to send the requests to
#   KAFKA_TOPIC_PREFIX       - (optional) A prefix that will be prepended to every created topic
#   KAFKA_TOPIC_PARTITIONS   - (optional) The number of partitions to use
#   KAFKA_REPLICATION_FACTOR - (optional) The replication factor to use
#
# This script will create a topic for every line in the input file (if it does not already exist)

# Check for file argument
if [ -z "$1" ]; then
    echo "Usage: ./create_topics.sh <topics-file>" && exit 1
fi

# Check for KAFKA_URL environment variable (required)
if [ -z "${KAFKA_URL}" ]; then
    echo "Environment-variable KAFKA_URL should point to the Kafka server! (e.g. localhost:9094)" && exit 1
fi

# Check for KAFKA_TOPIC_PREFIX (optional)
if [ -z "${KAFKA_TOPIC_PREFIX}" ]; then
    echo "Environment-variable KAFKA_TOPIC_PREFIX was not set, creating topics without a prefix."
fi

# Check for KAFKA_TOPIC_PREFIX (optional)
# Set to "1" as a default
if [ -z "${KAFKA_TOPIC_PARTITIONS}" ]; then
    KAFKA_TOPIC_PARTITIONS="1"
    echo "Environment-variable KAFKA_TOPIC_PARTITIONS was not set, using the default (= 1)."
fi

# Check for KAFKA_REPLICATION_FACTOR (optional)
# If not set, omit it from the create-topics command (uses cluster default)
if [ -z "${KAFKA_REPLICATION_FACTOR}" ]; then
    echo "Environment-variable KAFKA_REPLICATION_FACTOR was not set, using the cluster default."
else
    REPLICATION_FLAG="--replication-factor ${KAFKA_REPLICATION_FACTOR}"
fi

echo "Creating all topics..."

# Run the topic-creation for every line in the file
<"$1" xargs -I % \
    kafka-topics.sh \
    --bootstrap-server "${KAFKA_URL}" \
    --create \
    --if-not-exists \
    --topic "${KAFKA_TOPIC_PREFIX}%" \
    --partitions "${KAFKA_TOPIC_PARTITIONS}" \
    ${REPLICATION_FLAG}

echo "Created all topics!"

# Ouput all topics and metadata
echo "Running kafka-topics.sh --describe"
kafka-topics.sh --bootstrap-server "${KAFKA_URL}" --describe
