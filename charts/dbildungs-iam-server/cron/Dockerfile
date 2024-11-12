FROM alpine:latest

# Install necessary packages
RUN apk update && \
    apk add --no-cache bash openssl curl cronie jq vim

# Copy scripts into the image
COPY scripts/ /scripts/

# Set execute permissions for all .sh scripts in /scripts/
RUN chmod +x /scripts/*.sh

# Create a log file if your scripts write to a file
RUN touch /var/log/cron.log && \
    chmod 644 /var/log/cron.log

# Start the cron service in foreground
CMD ["/usr/sbin/crond", "-f"]
