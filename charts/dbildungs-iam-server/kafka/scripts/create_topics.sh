#!/bin/sh

# Usage:
#   create_topics.sh <file>
#
# Environment variables:
#   KAFKA_URL                - (required) The server to send the requests to
#   KAFKA_USERNAME           - (optional) The username to authenicate with
#   KAFKA_PASSWORD           - (optional) The password to authenicate with
#   KAFKA_TOPIC_PREFIX       - (optional) A prefix that will be prepended to every created topic
#   KAFKA_TOPIC_PARTITIONS   - (optional) The number of partitions to use
#   KAFKA_REPLICATION_FACTOR - (optional) The replication factor to use
#   KAFKA_JAAS_FILE          - (optional) The JAAS file to use for authentication (does nothing, when username and password are set)
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

# Check for KAFKA_TOPIC_PARTITIONS (optional)
# Set to "1" as a default
if [ -z "${KAFKA_TOPIC_PARTITIONS}" ]; then
    KAFKA_TOPIC_PARTITIONS="3"
    echo "Environment-variable KAFKA_TOPIC_PARTITIONS was not set, using the default (= 3)."
fi

# Check for KAFKA_REPLICATION_FACTOR (optional)
# If not set, omit it from the create-topics command (uses cluster default)
if [ -z "${KAFKA_REPLICATION_FACTOR}" ]; then
    echo "Environment-variable KAFKA_REPLICATION_FACTOR was not set, using the cluster default."
else
    REPLICATION_FLAG="--replication-factor ${KAFKA_REPLICATION_FACTOR}"
fi

# When KAFKA_USERNAME and KAFKA_PASSWORD are set create JAAS file
if [ ! -z "${KAFKA_USERNAME}" ] && [ ! -z "${KAFKA_PASSWORD}" ]; then
    KAFKA_JAAS_FILE="/tmp/client.info"
    cat <<EOF > ${KAFKA_JAAS_FILE}
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="${KAFKA_USERNAME}" password="${KAFKA_PASSWORD}";
security.protocol=SASL_PLAINTEXT
sasl.mechanism=PLAIN
EOF
else
    echo "The envs KAFKA_USERNAME and KAFKA_PASSWORD not set. Authentication may fail."
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
    kafka-topics.sh \
    --bootstrap-server "${KAFKA_URL}" \
    --create \
    --if-not-exists \
    --topic "${KAFKA_TOPIC_PREFIX}%" \
    --partitions "${KAFKA_TOPIC_PARTITIONS}" \
    ${REPLICATION_FLAG} \
    ${CONFIG_FLAG}

echo "Created all topics!"

# Output all topics and metadata
echo "Running kafka-topics.sh --describe"
kafka-topics.sh --bootstrap-server "${KAFKA_URL}" ${CONFIG_FLAG} --describe
