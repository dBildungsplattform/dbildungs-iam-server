/* eslint-disable no-console */
import { NodeTracerProvider } from '@opentelemetry/node';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import * as grpc from '@grpc/grpc-js';
import { Meter } from '@opentelemetry/api';
import { Counter } from '@opentelemetry/api-metrics';

const provider: NodeTracerProvider = new NodeTracerProvider();
const exporter: CollectorTraceExporter = new CollectorTraceExporter({
    url: 'grpc://localhost:4317',
    credentials: grpc.credentials.createInsecure(),
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

const metricExporter: OTLPMetricExporter = new OTLPMetricExporter({
    url: 'grpc://localhost:4317',
    credentials: grpc.credentials.createInsecure(),
});
const meterProvider: MeterProvider = new MeterProvider();

meterProvider.addMetricReader(
    new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 6000,
    }),
);

const meter: Meter = meterProvider.getMeter('meter-meter');
const requestCounter: Counter = meter.createCounter('requests', {
    description: 'Count all incoming requests',
});
requestCounter.add(1);

export function setupTelemetry(): () => void {
    const unregister: () => void = registerInstrumentations({
        tracerProvider: provider,
        meterProvider: meterProvider,
        instrumentations: [
            new HttpInstrumentation(),
            new PgInstrumentation(),
            new RedisInstrumentation(),
            new NestInstrumentation(),
        ],
    });

    return unregister;
}

export function shutdownTelemetry(): void {
    provider
        .shutdown()
        .then(() => {
            console.log('Tracer provider shutdown successfully.');
        })
        .catch((err: string) => console.error('Tracer provider shutdown failed:', err));

    meterProvider
        .shutdown()
        .then(() => {
            console.log('Meter provider shutdown successfully.');
        })
        .catch((err: string) => console.error('Meter provider shutdown failed:', err));
}

export function flushTelemetry(): void {
    provider
        .forceFlush()
        .then(() => {
            console.log('Telemetry data flushed successfully.');
        })
        .catch((err: string) => console.error('Telemetry data flush failed:', err));
}
