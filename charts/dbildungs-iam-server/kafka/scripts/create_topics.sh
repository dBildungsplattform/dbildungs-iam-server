#!/bin/sh
set -e

# === Input aus Umgebungsvariablen ===
BROKER="${BROKER:?Missing BROKER}"
KAFKA_SSL_CA_PATH="${KAFKA_SSL_CA_PATH:?Missing CA file}"
KAFKA_SSL_CERT_PATH="${KAFKA_SSL_CERT_PATH:?Missing client cert}"
KAFKA_SSL_KEY_PATH="${KAFKA_SSL_KEY_PATH:?Missing client key}"
PASSWORD="${TLS_KEYSTORE_PASSWORD:?Missing TLS_KEYSTORE_PASSWORD}"

#  Neues beschreibbares Zielverzeichnis (z. B. /jks via emptyDir)
KEYSTORE_DIR="${TLS_KEYSTORE_DIR:-/jks}"

# Dateien im beschreibbaren Pfad erzeugen
P12_FILE="/tmp/client.p12"
KEYSTORE_FILE="${KEYSTORE_DIR}/client.keystore.jks"
TRUSTSTORE_FILE="${KEYSTORE_DIR}/client.truststore.jks"

# Optional
TOPIC_FILE="$1"
[ -z "$TOPIC_FILE" ] && { echo "Usage: $0 <topics-file>"; exit 1; }
PARTITIONS="${KAFKA_TOPIC_PARTITIONS:-3}"
[ -n "$KAFKA_REPLICATION_FACTOR" ] && REPL="--replication-factor ${KAFKA_REPLICATION_FACTOR}"
PREFIX="${KAFKA_TOPIC_PREFIX:-}"

# === Konvertierung ===
echo " Erzeuge PKCS12-Datei..."
openssl pkcs12 -export \
  -in "${KAFKA_SSL_CERT_PATH}" \
  -inkey "${KAFKA_SSL_KEY_PATH}" \
  -certfile "${KAFKA_SSL_CA_PATH}" \
  -name kafka-client \
  -out "${P12_FILE}" \
  -passout pass:"${PASSWORD}"

echo " Importiere in JKS Keystore (${KEYSTORE_FILE})..."
keytool -importkeystore \
  -deststorepass "${PASSWORD}" \
  -destkeypass "${PASSWORD}" \
  -destkeystore "${KEYSTORE_FILE}" \
  -srckeystore "${P12_FILE}" \
  -srcstoretype PKCS12 \
  -srcstorepass "${PASSWORD}" \
  -alias kafka-client

echo "🛡️ Erstelle Truststore (${TRUSTSTORE_FILE})..."
keytool -import \
  -trustcacerts \
  -alias CARoot \
  -file "${KAFKA_SSL_CA_PATH}" \
  -keystore "${TRUSTSTORE_FILE}" \
  -storepass "${PASSWORD}" \
  -noprompt

# === client.properties schreiben ===
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

echo " TLS-Konfiguration geschrieben in ${CONFIG}"

# === Topics anlegen ===
echo "📌 Erzeuge Topics..."
< "${TOPIC_FILE}" xargs -I % \
  kafka-topics.sh --bootstrap-server "${BROKER}" \
    --create --if-not-exists \
    --topic "${PREFIX}%" \
    --partitions "${PARTITIONS}" ${REPL} \
    --command-config "${CONFIG}"

echo " Topics erstellt. Anzeige folgt:"
kafka-topics.sh --bootstrap-server "${BROKER}" \
  --describe --command-config "${CONFIG}"