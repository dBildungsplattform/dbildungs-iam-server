import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { ClassLogger } from '../../logging/class-logger.js';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Counter, Meter } from '@opentelemetry/api';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { TelemetryConfig } from '../../../shared/config/telemtry.config.js';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
    private provider: WebTracerProvider;

    private exporter: OTLPTraceExporter;

    private meterProvider: MeterProvider;

    private metricsExporter: OTLPMetricExporter;

    private meter: Meter;

    private metricPostCounter: Counter;

    private metrics_url: string;

    private traces_url: string;

    private unregister!: () => void;

    public constructor(
        private readonly logger: ClassLogger,
        configService: ConfigService<ServerConfig>,
    ) {
        const TelemtryConfig: TelemetryConfig = configService.getOrThrow<TelemetryConfig>('TELEMETRY');
        this.metrics_url = TelemtryConfig.METRICS_URL;
        this.traces_url = TelemtryConfig.TRACES_URL;
        // traces setup
        const collectorOptions: {
            url: string;
            headers: object;
            concurrencyLimit: number;
        } = {
            url: this.traces_url,
            headers: {},
            concurrencyLimit: 10,
        };

        this.provider = new WebTracerProvider();
        this.exporter = new OTLPTraceExporter(collectorOptions);
        this.provider.addSpanProcessor(
            new BatchSpanProcessor(this.exporter, {
                maxQueueSize: 1000,
                maxExportBatchSize: 10,
                scheduledDelayMillis: 500,
                exportTimeoutMillis: 30000,
            }),
        );

        this.provider.register();

        // Metrics setup
        const metricsCollectorOptions: {
            url: string;
            headers: object;
            concurrencyLimit: number;
        } = {
            url: this.metrics_url,
            headers: {},
            concurrencyLimit: 1,
        };

        this.metricsExporter = new OTLPMetricExporter(metricsCollectorOptions);
        this.meterProvider = new MeterProvider();

        this.meterProvider.addMetricReader(
            new PeriodicExportingMetricReader({
                exporter: this.metricsExporter,
                exportIntervalMillis: 6000,
            }),
        );

        this.meter = this.meterProvider.getMeter('meter-meter');

        // counter
        this.metricPostCounter = this.meter.createCounter('metrics_posted');

        this.metricPostCounter.add(1);
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
