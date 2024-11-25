## Cron Jobs

**Overview**

The cron jobs are defined in the `values.yaml` file and are executed using the scripts located in the `charts/sbildung-iam-server/cron/scripts` directory. The cron jobs can be configured with a schedule, endpoint, HTTP method, and which script to run.

**Example cron job**

```yaml
Schedule: 20 0 \* \* \*
Endpoint: `/api/cron/kopers-lock`
HTTP Method: PUT
Script: `cron_trigger.sh`
```

**Adding a New Cron Job**

1. Define the Cron Job in `values.yaml`:

    - Add a new entry under the `cronjobs.jobs` section in the `values.yaml` file.
    - Specify the schedule, endpoint, HTTP method, and script.

2. Create another script if the current one doesn't meet the requirements.

3. Update the `cronjob-scripts-configmap.yaml` file to include the new script.

4. Deploy the changes to your Kubernetes cluster to apply the new cron job configuration.

**Authentication**

The jobs use a JWKS from the secrets vault to authenticate against the `spsh-service` Keycloak client. The associated technical user has `CRON_DURCHFUEHREN` permissions, which will be checked against in the cron endpoints.
