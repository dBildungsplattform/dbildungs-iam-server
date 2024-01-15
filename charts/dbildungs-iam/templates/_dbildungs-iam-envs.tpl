{{- define "dbiam-backend-envs" }}
- name: NODE_ENV
  value: {{.Values.environment | quote}}
- name: DEPLOY_STAGE
  value: {{.Values.environment | quote}}
- name: DB_NAME
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: db.name
- name: DB_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: db.password
- name: DB_CLIENT_URL
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: db.url
- name: KC_ADMIN_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: keycloak.adminSecret
- name: KC_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: keycloak.clientSecret
- name: FRONTEND_SESSION_SECRET
  value: {{ randAlphaNum 20 | quote }}
{{- end}}