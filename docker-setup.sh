#!/bin/bash

echo "stop running services; remove data"
docker compose --profile backend --profile frontend down -v

echo "start services"
docker compose --profile backend --profile frontend up -d

echo "waiting for services"
sleep 20
docker compose ps

# profiles messes with start order and the ingress will often try to use the ip of a container that was killed during startup
# reloading makes nginx re-resolve names and get the correct ip
echo "signal ingress to reload"
docker compose exec -it ingress nginx -s reload

echo "seeding"
docker compose exec -it backend node dist/src/console/main.js db migration-apply && node dist/src/console/main.js keycloak update-clients dev && node dist/src/console/main.js db seed dev

echo "done"
