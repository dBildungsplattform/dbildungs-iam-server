import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
import { ClassLogger } from '../../logging/class-logger.js';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
    private provider: NodeTracerProvider;

    private exporter: CollectorTraceExporter;

    private metricExporter: OTLPMetricExporter;

    private meterProvider: MeterProvider;

    private meter: Meter;

    private requestCounter: Counter;

    private unregister!: () => void;

    //private logger: ClassLogger;

    public constructor(private readonly logger: ClassLogger) {
        this.provider = new NodeTracerProvider();
        this.exporter = new CollectorTraceExporter({
            url: 'grpc://localhost:4317',
            credentials: grpc.credentials.createInsecure(),
        });

        this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));
        this.provider.register();

        this.metricExporter = new OTLPMetricExporter({
            url: 'grpc://localhost:4317',
            credentials: grpc.credentials.createInsecure(),
        });

        this.meterProvider = new MeterProvider();
        this.meterProvider.addMetricReader(
            new PeriodicExportingMetricReader({
                exporter: this.metricExporter,
                exportIntervalMillis: 6000,
            }),
        );

        this.meter = this.meterProvider.getMeter('meter-meter');
        this.requestCounter = this.meter.createCounter('requests', {
            description: 'Count all incoming requests',
        });
        this.requestCounter.add(1);
        //this.unregister;
    }

    public onModuleInit(): void {
        this.unregister = registerInstrumentations({
            tracerProvider: this.provider,
            meterProvider: this.meterProvider,
            instrumentations: [
                new HttpInstrumentation(),
                new PgInstrumentation(),
                new RedisInstrumentation(),
                new NestInstrumentation(),
            ],
        });
    }

    public onModuleDestroy(): void {
        if (this.unregister) {
            this.unregister();
        }
        this.shutdownTelemetry();
        this.flushTelemetry();
    }

    public shutdownTelemetry(): void {
        this.provider
            .shutdown()
            .then(() => {
                this.logger.info('Tracer provider shutdown successfully.');
            })
            .catch((err: string) => this.logger.error('Tracer provider shutdown failed:', err));

        this.meterProvider
            .shutdown()
            .then(() => {
                this.logger.info('Meter provider shutdown successfully.');
            })
            .catch((err: string) => this.logger.error('Meter provider shutdown failed:', err));
    }

    public flushTelemetry(): void {
        this.provider
            .forceFlush()
            .then(() => {
                this.logger.info('Telemetry data flushed successfully.');
            })
            .catch((err: string) => this.logger.error('Telemetry data flush failed:', err));
    }
}
