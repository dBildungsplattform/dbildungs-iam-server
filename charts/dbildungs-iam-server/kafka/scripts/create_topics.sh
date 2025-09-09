#!/bin/sh
set -e

# === Input aus Umgebungsvariablen ===
KAFKA_BROKER="${KAFKA_BROKER:?Missing KAFKA_BROKER}"
KAFKA_SSL_CA_PATH="${KAFKA_SSL_CA_PATH:?Missing CA file}"
KAFKA_SSL_CERT_PATH="${KAFKA_SSL_CERT_PATH:?Missing client cert}"
KAFKA_SSL_KEY_PATH="${KAFKA_SSL_KEY_PATH:?Missing client key}"

CONFIG_DIR=$(mktemp -d)

CONFIG="${CONFIG_DIR}/client.properties"

KEYSTORE_FILE="${CONFIG_DIR}/keystore.pem"
TRUSTSTORE_FILE="${CONFIG_DIR}/truststore.pem"

# Create Keystore and Truststore
cat "${KAFKA_SSL_KEY_PATH}" "${KAFKA_SSL_CERT_PATH}" > "${KEYSTORE_FILE}"
cp "${KAFKA_SSL_CA_PATH}" "${TRUSTSTORE_FILE}"

# Optional
TOPIC_FILE="$1"
[ -z "$TOPIC_FILE" ] && { echo "Usage: $0 <topics-file>"; exit 1; }

PARTITIONS="${KAFKA_TOPIC_PARTITIONS:-1}"
REPLICATIONS="${KAFKA_TOPIC_REPLICATIONS:-1}"
PREFIX="${KAFKA_TOPIC_PREFIX:-}"

# === client.properties schreiben ===
cat > "${CONFIG}" <<EOF
security.protocol=SSL
ssl.keystore.type=PEM
ssl.keystore.location=${KEYSTORE_FILE}
ssl.truststore.type=PEM
ssl.truststore.location=${TRUSTSTORE_FILE}
ssl.enabled.protocols=TLSv1.2,TLSv1.1
EOF

echo "TLS-Konfiguration geschrieben in ${CONFIG}"

# === Topics anlegen ===
echo "📌 Erzeuge Topics..."
< "${TOPIC_FILE}" xargs -I % \
  kafka-topics.sh --bootstrap-server "${KAFKA_BROKER}" \
    --create --if-not-exists \
    --topic "${PREFIX}%" \
    --partitions "${PARTITIONS}" \
    --replication-factor ${REPLICATIONS} \
    --command-config "${CONFIG}"

echo " Topics erstellt. Anzeige folgt:"
kafka-topics.sh --bootstrap-server "${KAFKA_BROKER}" \
  --describe --command-config "${CONFIG}"
