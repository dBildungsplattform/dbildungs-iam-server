/* eslint-disable @typescript-eslint/typedef */
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

export function setupTelemetry(): void {
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

    registerInstrumentations({
        tracerProvider: provider,
        instrumentations: [
            new HttpInstrumentation(),
            new PgInstrumentation(),
            new RedisInstrumentation(),
            new NestInstrumentation(),
        ],
    });
    console.log('Instrumentations registered');

    // Metrics setup
    const metricExporter = new OTLPMetricExporter({
        url: 'grpc://localhost:4317',
        credentials: grpc.credentials.createInsecure(),
    });
    const meterProvider = new MeterProvider();
    console.log('Metric exporter and meter provider initialized');

    meterProvider.addMetricReader(
        new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 6000,
        }),
    );

    const meter = meterProvider.getMeter('example-meter');

    // Define a counter
    const metricPostCounter = meter.createCounter('metrics_posted');

    function postMetric(): void {
        metricPostCounter.add(1);
    }

    const interval = 6000;
    setInterval(postMetric, interval);
}
