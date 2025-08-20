#!/bin/sh
set -e

# === Input aus Umgebungsvariablen ===
KAFKA_BROKER="${KAFKA_BROKER:?Missing KAFKA_BROKER}"
SSL_CA_PATH="${KAFKA_SSL_CA_PATH:?Missing CA file}"
SSL_CERT_PATH="${KAFKA_SSL_CERT_PATH:?Missing client cert}"
SSL_KEY_PATH="${KAFKA_SSL_KEY_PATH:?Missing client key}"
PASSWORD="${TLS_KEYSTORE_PASSWORD:?Missing KAFKA_TLS_KEYSTORE_PASSWORD}"

KEYSTORE_DIR="${TLS_KEYSTORE_DIR:-/jks}"
P12_FILE="/tmp/client.p12"
KEYSTORE_FILE="${KEYSTORE_DIR}/client.keystore.jks"
TRUSTSTORE_FILE="${KEYSTORE_DIR}/client.truststore.jks"

TOPIC_PREFIX="$1"
[ -z "$TOPIC_PREFIX" ] && { echo "Usage: $0 <topic-prefix>"; exit 1; }

echo "🔐 Erzeuge PKCS12-file..."
openssl pkcs12 -export \
  -in "${SSL_CERT_PATH}" \
  -inkey "${SSL_KEY_PATH}" \
  -certfile "${SSL_CA_PATH}" \
  -name kafka-client \
  -out "${P12_FILE}" \
  -passout pass:"${PASSWORD}"

echo "🔐 Import in JKS Keystore (${KEYSTORE_FILE})..."
keytool -importkeystore \
  -deststorepass "${PASSWORD}" \
  -destkeypass "${PASSWORD}" \
  -destkeystore "${KEYSTORE_FILE}" \
  -srckeystore "${P12_FILE}" \
  -srcstoretype PKCS12 \
  -srcstorepass "${PASSWORD}" \
  -alias kafka-client

keytool -import \
  -trustcacerts \
  -alias CARoot \
  -file "${SSL_CA_PATH}" \
  -keystore "${TRUSTSTORE_FILE}" \
  -storepass "${PASSWORD}" \
  -noprompt

# === Client Properties file creation===
CONFIG="/tmp/client.properties"
cat > "${CONFIG}" <<EOF
security.protocol=SSL
ssl.keystore.type=JKS
ssl.keystore.location=${KEYSTORE_FILE}
ssl.keystore.password=${PASSWORD}
ssl.key.password=${PASSWORD}
ssl.truststore.type=JKS
ssl.truststore.location=${TRUSTSTORE_FILE}
ssl.truststore.password=${PASSWORD}
ssl.enabled.protocols=TLSv1.2,TLSv1.1
EOF

echo "🔧 TLS-Konfiguration geschrieben in ${CONFIG}"

echo "🔍 Search for Topics with prefix '${TOPIC_PREFIX}'..."

TOPICS=$(kafka-topics.sh \
    --bootstrap-server "${KAFKA_BROKER}" \
    --list --command-config "${CONFIG}" | grep "^${TOPIC_PREFIX}")

if [ -z "$TOPICS" ]; then
    echo "⚠️ No Topics with  Prefix '${TOPIC_PREFIX}' found"
    exit 0
fi

echo "🗑️ Delete Topics..."
for topic in $TOPICS; do
  echo "❌ Delete Topic: $topic"
  kafka-topics.sh \
    --bootstrap-server "${KAFKA_BROKER}" \
    --delete \
    --topic "$topic" \
    --command-config "${CONFIG}"
done

echo "✅ All Topics with Prefix '${TOPIC_PREFIX}' deleted."