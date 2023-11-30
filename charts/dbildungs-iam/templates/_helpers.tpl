{{/*
Full name (e.g., chart name)
*/}}
{{- define "dbildungs-iam.fullname" -}}
{{- printf "%s" (include "dbildungs-iam.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Template name
*/}}
{{- define "dbildungs-iam.templateName" -}}
{{- printf "%s-template" (include "dbildungs-iam.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Common labels */}}
{{- define "dbildungs-iam.labels" -}}
app.kubernetes.io/name: {{ include "dbildungs-iam.name" . }}
{{- end -}}

{{/* Common name */}}
{{- define "dbildungs-iam.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Layer label for backend */}}
{{- define "dbildungs-iam.backendLayerLabel" -}}
layer: dbildungs-iam-backend
{{- end -}}

{{/* Layer label for BFF */}}
{{- define "dbildungs-iam.bffLayerLabel" -}}
layer: dbildungs-iam-bff
{{- end -}}
{{/*
Service name for BFF
*/}}
{{- define "dbildungs-iam.bffServiceName" -}}
{{- printf "%s-bff" (include "dbildungs-iam.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{/*
Selector label for BFF
*/}}
{{- define "dbildungs-iam.bffSelectorLabels" -}}
layer: dbildungs-iam-bff
{{- end -}}
{{/*
Service name for backend
*/}}
{{- define "dbildungs-iam.backendServiceName" -}}
{{- printf "%s-backend" (include "dbildungs-iam.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{/*
Selector label for backend
*/}}
{{- define "dbildungs-iam.backendSelectorLabels" -}}
layer: dbildungs-iam-backend
{{- end -}}
{{/*
Ingress name for backend
*/}}
{{- define "dbildungs-iam.backendIngressName" -}}
{{ .Release.Name }}-backend
{{- end -}}

{{/*
Backend host name
*/}}
{{- define "dbildungs-iam.backendHostname" -}}
{{ default "backend.default.domain" .Values.backendHostname }}
{{- end -}}
{{/*
ServiceMonitor name
*/}}
{{- define "dbildungs-iam.serviceMonitorName" -}}
{{ .Release.Name }}-servicemonitor
{{- end -}}
{{/*
Redis resources labels
*/}}
{{- define "dbildungs-iam.redisLabels" -}}
app.kubernetes.io/name: dbildungs-iam
{{- end -}}

{{/*
Redis ConfigMap name
*/}}
{{- define "dbildungs-iam.redisConfigMapName" -}}
dbiam-redis-tls-config
{{- end -}}

{{/*
Redis Deployment name
*/}}
{{- define "dbildungs-iam.redisDeploymentName" -}}
dbiam-server-redis-deployment
{{- end -}}

{{/*
Redis Service name
*/}}
{{- define "dbildungs-iam.redisServiceName" -}}
redis-service
{{- end -}}

{{/*
Redis layer label
*/}}
{{- define "dbildungs-iam.redisLayerLabel" -}}
layer: dbildungs-iam-redis
{{- end -}}
{{/*
Redis port name
*/}}
{{- define "dbildungs-iam.redisPortName" -}}
redis-port
{{- end -}}
{{/*
Metadata name for Redis deployment
*/}}
{{- define "dbildungs-iam.redisMetadataName" -}}
{{- printf "%s-redis" (include "dbildungs-iam.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{/*
Container name for Redis
*/}}
{{- define "dbildungs-iam.redisContainerName" -}}
{{- printf "%s-redis" (include "dbildungs-iam.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
