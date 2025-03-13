#!/bin/bash

echo "stop running services; remove data"
docker compose --profile backend --profile frontend down -v

echo "start services"
docker compose --profile backend --profile frontend up -d

echo "waiting for services"
sleep 10 # todo: use keycloak health-probe instead

echo "creating certificate for ingress"
pushd nginx || exit 1
./create-cert.sh
popd || exit 1

# profiles messes with start order and the ingress will often try to use the ip of a container that was killed during startup
# reloading makes nginx re-resolve names and get the correct ip
echo "signal ingress to reload"
docker compose exec -it ingress nginx -s reload

echo "run db migrations"
docker compose exec -it backend node dist/src/console/main.js db migration-apply
sleep 1

echo "update keycloak"
docker compose exec -it backend node dist/src/console/main.js keycloak update-clients dev
sleep 1

echo "seed db"
docker compose exec -it backend node dist/src/console/main.js db seed dev
sleep 1

docker compose ps

