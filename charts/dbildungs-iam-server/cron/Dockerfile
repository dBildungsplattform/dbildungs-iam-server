FROM alpine:3.19

# Install necessary packages
RUN apk update && \
    apk add --no-cache bash cronie curl jq openssl vim

# Copy scripts into the image
COPY scripts/ /scripts/

# Set execute permissions for all .sh scripts in /scripts/ and create a log file
RUN chmod +x /scripts/*.sh \
    && touch /var/log/cron.log \
    && chmod 644 /var/log/cron.log

# Start the cron service in foreground
CMD ["/usr/sbin/crond", "-f"]
