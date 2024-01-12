{{- define "dbiam-backend-envs" }}
        - name: NODE_ENV
          value: {{.Values.environment | quote}}
        - name: DEPLOY_STAGE
          value: {{.Values.environment | quote}}
        - name: DB_NAME
          value: {{ required "config.db.name required" .Values.config.db.name | quote}}
        - name: DB_SECRET
          value: {{ required "config.db.password required" .Values.config.db.password | quote}}
        - naem: DB_CLIENT_URL
          value: {{required "config.db.url required" .Values.config.db.url | quote}}
        - name: KC_ADMIN_SECRET
          value: {{required "config.keycloak.adminSecret required" .Values.config.keycloak.adminSecret | quote}}
        - name: KC_CLIENT_SECRET
          value: {{required "config.keycloak.clientSecret required" .Values.config.keycloak.clientSecret | quote}}
        - name: FRONTEND_SESSION_SECRET
          value: {{ randAlphaNum 20 | quote }}
{{- end}}