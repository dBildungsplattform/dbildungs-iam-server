import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ClassLogger } from '../../logging/class-logger.js';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { Counter, Meter } from '@opentelemetry/api';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { TelemetryConfig } from '../../../shared/config/telemetry.config.js';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
    private provider: NodeTracerProvider;

    private exporter: OTLPTraceExporter;

    private meterProvider: MeterProvider;

    private metricsExporter: OTLPMetricExporter;

    private meter: Meter;

    private metricPostCounter: Counter;

    private metrics_url: string;

    private traces_url: string;

    private export_interval: number;

    private unregister!: () => void;

    public constructor(
        private readonly logger: ClassLogger,
        configService: ConfigService<ServerConfig>,
    ) {
        const TelemetryConfigSettings: TelemetryConfig = configService.getOrThrow<TelemetryConfig>('TELEMETRY');
        this.metrics_url = TelemetryConfigSettings.METRICS_URL;
        this.traces_url = TelemetryConfigSettings.TRACES_URL;
        this.export_interval = TelemetryConfigSettings.EXPORT_INTERVAL;
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

        this.provider = new NodeTracerProvider({
            resource: new Resource({
                [SEMRESATTRS_SERVICE_NAME]: 'SPSH',
            }),
        });
        this.exporter = new OTLPTraceExporter(collectorOptions);
        this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));

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

        const metricReader: PeriodicExportingMetricReader = new PeriodicExportingMetricReader({
            exporter: this.metricsExporter,
            exportIntervalMillis: this.export_interval,
        });

        this.meterProvider = new MeterProvider({
            readers: [metricReader],
        });

        this.meter = this.meterProvider.getMeter('meter-meter');

        this.metricPostCounter = this.meter.createCounter('metrics_posted');

        this.metricPostCounter.add(1);
    }

    public onModuleInit(): void {
        this.unregister = registerInstrumentations({
            tracerProvider: this.provider,
            meterProvider: this.meterProvider,
            instrumentations: getNodeAutoInstrumentations(),
        });
    }

    public async onModuleDestroy(): Promise<void> {
        if (this.unregister) {
            this.unregister();
        }
        await this.shutdownTelemetry();
        await this.flushTelemetry();
    }

    public async shutdownTelemetry(provider: NodeTracerProvider = this.provider): Promise<void> {
        try {
            await provider.shutdown();

            this.logger.info('Tracer provider shutdown successfully.');
        } catch (err: unknown) {
            this.logger.error('Tracer provider shutdown failed:', err);
        }
    }

    public async flushTelemetry(provider: NodeTracerProvider = this.provider): Promise<void> {
        try {
            await provider.forceFlush();

            this.logger.info('Telemetry data flushed successfully.');
        } catch (err: unknown) {
            this.logger.error('Tracer provider shutdown failed:', err);
        }
    }
}
