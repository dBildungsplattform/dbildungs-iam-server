/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable no-console */

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc';
// import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
// previous implementation
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
// does not work on docker for some reason
// import { Counter } from '@opentelemetry/api-metrics';
import { context, trace } from '@opentelemetry/api';
import { SpanKind } from '@opentelemetry/api';
import * as grpc from '@grpc/grpc-js'; // Import grpc for creating insecure credentials

export function setupTelemetry(): void {
    // Set up diagnostics logger
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
    console.log('Logger setup complete');

    // Tracing setup
    const provider: NodeTracerProvider = new NodeTracerProvider();
    const exporter1: CollectorTraceExporter = new CollectorTraceExporter({
        url: 'grpc://localhost:4317',
        credentials: grpc.credentials.createInsecure(),
    });

    console.log('Initializing span processor...');
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter1));
    provider.register();
    console.log('Tracer provider registered');

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

    // Add the exporter to the meter provider using PeriodicExportingMetricReader
    meterProvider.addMetricReader(
        new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 6000,
        }),
    );
    console.log('Metric reader added to meter provider');

    const meter = meterProvider.getMeter('example-meter');

    // Define a counter
    const metricPostCounter = meter.createCounter('metrics_posted');

    function postMetric(): void {
        metricPostCounter.add(1);
        console.log('Metric post counter incremented');
    }

    const interval = 6000;
    setInterval(postMetric, interval);

    // For debugging only
    const tracer = provider.getTracer('example-tracer');
    const span = tracer.startSpan('example-span', { kind: SpanKind.SERVER });
    context.with(trace.setSpan(context.active(), span), () => {
        console.log('Test span started');
        const currentSpan = trace.getSpan(context.active());
        if (currentSpan) {
            currentSpan.end();
            console.log('Test span ended');
        } else {
            console.log('No active span');
        }
    });
}
