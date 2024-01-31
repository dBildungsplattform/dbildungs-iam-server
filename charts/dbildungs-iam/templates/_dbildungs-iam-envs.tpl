{{- define "dbiam-backend-envs" }}
- name: NODE_ENV
  value: {{.Values.environment | quote}}
- name: DEPLOY_STAGE
  value: {{.Values.environment | quote}}
- name: DB_NAME
  valueFrom:
    configMapKeyRef:
        name: {{.Values.configmap.name}}
        key: db-name
- name: DB_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: db-password
- name: DB_HOST
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: db-host
- name: DB_CLIENT_URL
  value: "postgres://$(DB_HOST)/"
- name: KC_BASE_URL
  valueFrom:
    configMapKeyRef:
        name: {{.Values.configmap.name}}
        key: keycloak-base-url
- name: FRONTEND_OIDC_CALLBACK_URL
  valueFrom:
    configMapKeyRef:
        name: {{.Values.configmap.name}}
        key: frontend-oidc-callback-url
- name: FRONTEND_DEFAULT_LOGIN_REDIRECT
  valueFrom:
    configMapKeyRef:
        name: {{.Values.configmap.name}}
        key: frontend-default-login-redirect
- name: FRONTEND_LOGOUT_REDIRECT
  valueFrom:
    configMapKeyRef:
        name: {{.Values.configmap.name}}
        key: frontend-logout-redirect
- name: KC_ADMIN_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: keycloak-adminSecret
- name: KC_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: keycloak-clientSecret
- name: FRONTEND_SESSION_SECRET
  valueFrom:
    secretKeyRef:
        name: {{.Values.secrets.name}}
        key: frontend-sessionSecret
{{- end}}