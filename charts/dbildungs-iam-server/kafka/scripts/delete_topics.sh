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

# === Argument prüfen ===
TOPIC_PREFIX="$1"
[ -z "$TOPIC_PREFIX" ] && { echo "Usage: $0 <topic-prefix>"; exit 1; }

# === Client Properties Datei schreiben ===
cat > "${CONFIG}" <<EOF
security.protocol=SSL
ssl.keystore.type=PEM
ssl.keystore.location=${KEYSTORE_FILE}
ssl.truststore.type=PEM
ssl.truststore.location=${TRUSTSTORE_FILE}
ssl.enabled.protocols=TLSv1.2,TLSv1.1
EOF

echo "🔧 TLS-Konfiguration geschrieben in ${CONFIG}"

# === Alle Topics mit PREFIX abrufen ===
echo "🔍 Suche nach Topics mit Prefix '${TOPIC_PREFIX}'..."

TOPICS=$(kafka-topics.sh \
    --bootstrap-server "${KAFKA_BROKER}" \
    --list --command-config "${CONFIG}" | grep "^${TOPIC_PREFIX}")

if [ -z "$TOPICS" ]; then
    echo "⚠️ Keine Topics gefunden mit Prefix '${TOPIC_PREFIX}'"
    exit 0
fi

# === Topics löschen ===
echo "🗑️ Lösche Topics..."
for topic in $TOPICS; do
  echo "❌ Lösche Topic: $topic"
  kafka-topics.sh \
    --bootstrap-server "${KAFKA_BROKER}" \
    --delete \
    --topic "$topic" \
    --command-config "${CONFIG}"
done

echo "✅ Alle Topics mit Prefix '${TOPIC_PREFIX}' gelöscht."
