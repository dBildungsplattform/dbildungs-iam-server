#!/bin/sh
set -e

# === Input aus Umgebungsvariablen ===
KAFKA_URL="${KAFKA_URL:?Missing KAFKA_URL}"
KAFKA_CA_FILE="${KAFKA_CA_FILE:?Missing CA file}"
KAFKA_CERT_FILE="${KAFKA_CERT_FILE:?Missing client cert}"
KAFKA_KEY_FILE="${KAFKA_KEY_FILE:?Missing client key}"
PASSWORD="${TLS_KEYSTORE_PASSWORD:?Missing TLS_KEYSTORE_PASSWORD}"

KEYSTORE_DIR="${TLS_KEYSTORE_DIR:-/jks}"
P12_FILE="/tmp/client.p12"
KEYSTORE_FILE="${KEYSTORE_DIR}/client.keystore.jks"
TRUSTSTORE_FILE="${KEYSTORE_DIR}/client.truststore.jks"

# === Argument prüfen ===
TOPIC_PREFIX="$1"
[ -z "$TOPIC_PREFIX" ] && { echo "Usage: $0 <topic-prefix>"; exit 1; }

# === PKCS#12 erzeugen ===
echo "🔐 Erzeuge PKCS12-Datei..."
openssl pkcs12 -export \
  -in "${KAFKA_CERT_FILE}" \
  -inkey "${KAFKA_KEY_FILE}" \
  -certfile "${KAFKA_CA_FILE}" \
  -name kafka-client \
  -out "${P12_FILE}" \
  -passout pass:"${PASSWORD}"

# === Keystore erzeugen ===
echo "🔐 Importiere in JKS Keystore (${KEYSTORE_FILE})..."
keytool -importkeystore \
  -deststorepass "${PASSWORD}" \
  -destkeypass "${PASSWORD}" \
  -destkeystore "${KEYSTORE_FILE}" \
  -srckeystore "${P12_FILE}" \
  -srcstoretype PKCS12 \
  -srcstorepass "${PASSWORD}" \
  -alias kafka-client

# === Truststore erzeugen ===
echo "🛡️ Erstelle Truststore (${TRUSTSTORE_FILE})..."
keytool -import \
  -trustcacerts \
  -alias CARoot \
  -file "${KAFKA_CA_FILE}" \
  -keystore "${TRUSTSTORE_FILE}" \
  -storepass "${PASSWORD}" \
  -noprompt

# === Client Properties Datei schreiben ===
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

# === Alle Topics mit PREFIX abrufen ===
echo "🔍 Suche nach Topics mit Prefix '${TOPIC_PREFIX}'..."

TOPICS=$(kafka-topics.sh \
    --bootstrap-server "${KAFKA_URL}" \
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
    --bootstrap-server "${KAFKA_URL}" \
    --delete \
    --topic "$topic" \
    --command-config "${CONFIG}"
done

echo "✅ Alle Topics mit Prefix '${TOPIC_PREFIX}' gelöscht."

