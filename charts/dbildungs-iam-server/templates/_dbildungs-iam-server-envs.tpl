{{- define "dbildungs-iam-server-backend-envs" }}
          - name: DB_SECRET
            valueFrom:
              secretKeyRef:
                  name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
                  key: db-password
          - name: DB_HOST
            valueFrom:
              secretKeyRef:
                  name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
                  key: db-host
          - name: KC_ADMIN_SECRET
            valueFrom:
              secretKeyRef:
                  name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
                  key: keycloak-adminSecret
          - name: DB_CLIENT_URL
            value: "postgres://$(DB_HOST)/"
          - name: KC_CLIENT_SECRET
            valueFrom:
              secretKeyRef:
                  name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
                  key: keycloak-clientSecret
          - name: FRONTEND_SESSION_SECRET
            valueFrom:
              secretKeyRef:
                  name: {{ default .Values.auth.existingSecret .Values.auth.secretName }}
                  key: frontend-sessionSecret
{{- end}}