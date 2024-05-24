/* eslint-disable no-console */

//import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import * as grpc from '@grpc/grpc-js';
import { Meter } from '@opentelemetry/api';
import { Counter } from '@opentelemetry/api-metrics';

export function setupTelemetry(): () => void {
    // diagnostics logger toggle for debugging
    //diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

    // Tracing setup
    const provider: NodeTracerProvider = new NodeTracerProvider();
    const exporter: CollectorTraceExporter = new CollectorTraceExporter({
        url: 'grpc://localhost:4317',
        credentials: grpc.credentials.createInsecure(),
    });

    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();

    // Metrics setup
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

    meter.createCounter('metrics_posted');

    return unregister;
}
