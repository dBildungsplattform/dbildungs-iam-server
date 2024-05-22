/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable no-console */

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Counter } from '@opentelemetry/api-metrics';

// docker run --rm -p 4317:4317 otel/opentelemetry-collector
export function setupTelemetry(): void {
    // Tracing setup
    const provider: NodeTracerProvider = new NodeTracerProvider();
    const exporter1: CollectorTraceExporter = new CollectorTraceExporter({
        url: 'http://localhost:4317/v1/traces',
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

    // Setup for logs
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
    console.log('Logger setup complete');

    // Metrics setup
    const collectorOptions = {
        url: 'http://localhost:4317/v1/metrics',
        headers: {},
        concurrencyLimit: 1,
    };
    const metricExporter = new OTLPMetricExporter(collectorOptions);
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
}
