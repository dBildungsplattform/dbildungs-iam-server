FROM alpine:3.19

# Install necessary packages
RUN apk update && \
    apk add --no-cache bash cronie jq openssl vim wget

# Create a new user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy scripts into the image
COPY scripts/ /scripts/

# Set execute permissions for all .sh scripts in /scripts/ and create a log file
RUN chmod +x /scripts/*.sh \
    && touch /var/log/cron.log \
    && chmod 644 /var/log/cron.log \
    && chown -R appuser:appgroup /scripts /var/log/cron.log

# Switch to the new user
USER appuser

# Start the cron service in foreground
CMD ["/usr/sbin/crond", "-f"]
