#!/bin/bash
echo "Trigger XYZ executed at $(date)" >> /var/log/cron.log

# Call get_access_token.sh and capture the access token
access_token=$(./get_access_token.sh)

# Use the access token as needed
echo "Access token obtained: $access_token"
