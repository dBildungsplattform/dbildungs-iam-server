# Kafka

The Kafka image used in the project is `bitnami/kafka`.

The container exposes an external client on port 9094.

Running the `kafka-init` using `docker compose` will create a topic for every line in `config/kafka-topics.txt` (if it doesn't already exist)

The file kafka-topics.txt needs to have LV line endings. Please make sure that `git autorcrlf` is set to `false`. If it was set to true while checking out, you need to change the line endings manually. In VS Code there is a little button on the lower right.

## Using a Kafka-client using docker

You can use the same image to create a container with an interactive shell:

`docker run -it --rm --network host bitnami/kafka:3.9.0 bash`

Inside this shell you can access the shell-scripts provided by Kafka.
Just make sure to include `--bootstrap-server localhost:9094` so the client points to the container from the `compose.yaml`.

### Examples

Create new topic:
`kafka-topics.sh --bootstrap-server localhost:9094 --create --if-not-exists --topic test_topic --partitions 1`

List topics:
`kafka-topics.sh --bootstrap-server localhost:9094 --list`

Listen to messages:
`kafka-console-consumer.sh --bootstrap-server localhost:9094 --topic test_topic`

Produce messages:
`kafka-console-producer.sh --bootstrap-server localhost:9094 --topic test_topic`


### Using Kafka-client in cluster

> [!IMPORTANT]
> Take care of the kube-config you want to use via **_--kubeconfig_** parameter!
> Examples below assume that your kube-configs are located in ~/.kube/ and file-names do not differ from the original OnePassword-files!
> You can also ignore the **_--kubeconfig_** parameter.

> [!WARNING]
> If **_--kubeconfig_** parameter is used any changes of selected namespace via kubectl is ignored, so watch the namespace your container will be deployed!

> [!TIP]
> use ~/.kube/spsh-staging-schulportal.yaml instead of ~/.kube/spsh-dev-schulportal.yaml for usage on STAGE cluster


Deploy and run a new kafka-tools-container:
`kubectl run kafka-tools-2369 -n spsh --image docker.io/bitnami/kafka:3.9.0-debian-12-r6 --env="KAFKA_USER=Elizabeth" --env="KAFKA_PASS=TopangaCity" --restart=Never --kubeconfig ~/.kube/spsh-dev-schulportal.yaml --command sleep infinity`


Enter bash of the container:
`kubectl exec -i -t -n spsh kafka-tools-2369 --kubeconfig ~/.kube/spsh-dev-schulportal.yaml -- bash`

Execute command:
`echo "security.protocol=SASL_PLAINTEXT
sasl.mechanism=SCRAM-SHA-256
sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required \
username=\"$KAFKA_USER\" \
password=\"$KAFKA_PASS\";" > /tmp/client.properties`


#### Different commands for usage in cluster:

Print everything:
`kafka-console-consumer.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --topic spsh-user-topic --from-beginning --property print.key=true --property print.value=true --property print.headers=true --consumer.config /tmp/client.properties`

Print from a certain point/offset:
`kafka-console-consumer.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --topic spsh-user-topic --partition 0 --offset 747 --max-messages 3 --consumer.config /tmp/client.properties`

Print topics:
`kafka-topics.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --list --command-config /tmp/client.properties`

Delete topics:
`kafka-topics.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --delete --topic user-dlq-topic --command-config /tmp/client.properties`

Create topics:
`kafka-topics.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --create --topic user-dlq-topic --command-config /tmp/client.properties`

Print consumer groups:
`kafka-consumer-groups.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --list --command-config /tmp/client.properties`

Print offsets:
`kafka-consumer-groups.sh --bootstrap-server dbildungs-iam-kafka.spsh.svc.cluster.local:9092 --describe --group spsh-group --command-config /tmp/client.properties`
