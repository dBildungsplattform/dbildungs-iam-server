/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable no-console */

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc'; // Ensure this is the gRPC exporter
// previous implementation
// import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'; // Use the gRPC exporter for metrics
// previous implementation
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Counter } from '@opentelemetry/api-metrics';
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
        credentials: grpc.credentials.createInsecure(), // Ensure gRPC without SSL
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
        url: 'grpc://localhost:4317', // Use gRPC protocol without SSL for metrics
        credentials: grpc.credentials.createInsecure(), // Explicitly disable SSL
    });
    const meterProvider = new MeterProvider();
    console.log('Metric exporter and meter provider initialized');

    // Add the exporter to the meter provider using PeriodicExportingMetricReader
    meterProvider.addMetricReader(
        new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 60000,
        }),
    );
    console.log('Metric reader added to meter provider');

    const meter = meterProvider.getMeter('meter-meter');
    const requestCounter: Counter = meter.createCounter('requests', {
        description: 'Count all incoming requests',
    });
    console.log('Request counter created');

    requestCounter.add(1);
    console.log('Request counter incremented');

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
