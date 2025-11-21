{{- define "dbildungs-iam-server-email-backend-envs" }}
- name: DB_SECRET
  valueFrom:
    secretKeyRef:
        name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
        key: db-password
- name: DB_USERNAME
  valueFrom:
    secretKeyRef:
        name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
        key: db-username
- name: DB_HOST
  valueFrom:
    secretKeyRef:
        name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
        key: db-host
- name: DB_CLIENT_URL
  value: "postgres://$(DB_HOST)/"
- name: LDAP_BIND_DN
  valueFrom:
    secretKeyRef:
        name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
        key: ldap-bind-dn
- name: LDAP_ADMIN_PASSWORD
  valueFrom:
    secretKeyRef:
        name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
        key: ldap-admin-password
- name: OX_PASSWORD
  valueFrom:
    secretKeyRef:
        name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
        key: ox-password
{{- end}}
