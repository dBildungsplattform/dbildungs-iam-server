#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE privacyidea;
    GRANT ALL PRIVILEGES ON DATABASE privacyidea TO $POSTGRES_USER;
EOSQL
