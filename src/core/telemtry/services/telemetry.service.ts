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

    private export_interval: number;

    private max_queue_size: number;

    private max_export_batch_size: number;

    private scheduled_delay_millis: number;

    private export_timeout_millis: number;

    private unregister!: () => void;

    public constructor(
        private readonly logger: ClassLogger,
        configService: ConfigService<ServerConfig>,
    ) {
        const TelemetryConfigSettings: TelemetryConfig = configService.getOrThrow<TelemetryConfig>('TELEMETRY');
        this.metrics_url = TelemetryConfigSettings.METRICS_URL;
        this.traces_url = TelemetryConfigSettings.TRACES_URL;
        this.export_interval = TelemetryConfigSettings.EXPORT_INTERVAL;
        this.max_queue_size = TelemetryConfigSettings.MAX_QUEUE_SIZE;
        this.max_export_batch_size = TelemetryConfigSettings.MAX_EXPORT_BATCH_SIZE;
        this.scheduled_delay_millis = TelemetryConfigSettings.SCHEDULED_DELAY_MILLIS;
        this.export_timeout_millis = TelemetryConfigSettings.EXPORT_TIMEOUT_MILLIS;
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
                maxQueueSize: this.max_queue_size,
                maxExportBatchSize: this.max_export_batch_size,
                scheduledDelayMillis: this.scheduled_delay_millis,
                exportTimeoutMillis: this.export_timeout_millis,
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
                exportIntervalMillis: this.export_interval,
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

    public async onModuleDestroy(): Promise<void> {
        if (this.unregister) {
            this.unregister();
        }
        await this.shutdownTelemetry();
        await this.flushTelemetry();
    }

    public async shutdownTelemetry(provider: WebTracerProvider = this.provider): Promise<void> {
        try {
            await provider.shutdown();

            this.logger.info('Tracer provider shutdown successfully.');
        } catch (err: unknown) {
            this.logger.error('Tracer provider shutdown failed:', err);
        }
    }

    public async flushTelemetry(provider: WebTracerProvider = this.provider): Promise<void> {
        try {
            await provider.forceFlush();

            this.logger.info('Telemetry data flushed successfully.');
        } catch (err: unknown) {
            this.logger.error('Tracer provider shutdown failed:', err);
        }
    }
}
