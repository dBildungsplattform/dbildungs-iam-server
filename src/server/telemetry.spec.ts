/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable no-console */
import { setupTelemetry } from './telemetry.js'; // Adjust the import path
import { NodeTracerProvider } from '@opentelemetry/node';
//import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import * as grpc from '@grpc/grpc-js';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

jest.mock('@opentelemetry/node');
jest.mock('@opentelemetry/instrumentation');
jest.mock('@opentelemetry/exporter-collector-grpc');
jest.mock('@opentelemetry/tracing');
jest.mock('@opentelemetry/sdk-metrics-base');
jest.mock('@opentelemetry/exporter-metrics-otlp-grpc');
jest.mock('@grpc/grpc-js', () => ({
    credentials: {
        createInsecure: jest.fn(),
    },
}));
jest.mock('@opentelemetry/instrumentation-http');
jest.mock('@opentelemetry/instrumentation-pg');
jest.mock('@opentelemetry/instrumentation-redis');
jest.mock('@opentelemetry/instrumentation-nestjs-core');

describe('setupTelemetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set up the tracing provider', () => {
        const providerInstance: Partial<NodeTracerProvider> = {
            addSpanProcessor: jest.fn(),
            register: jest.fn(),
            // add other methods and properties as needed
        };

        (NodeTracerProvider as jest.MockedClass<typeof NodeTracerProvider>).mockImplementation(
            () => providerInstance as NodeTracerProvider,
        );
        const exporterInstance = {};
        (CollectorTraceExporter as jest.Mock).mockImplementation(() => exporterInstance);
        const spanProcessorInstance = {};
        (SimpleSpanProcessor as jest.Mock).mockImplementation(() => spanProcessorInstance);
        const meterInstance: Partial<MeterProvider> = {
            getMeter: jest.fn().mockReturnValue({
                createCounter: jest.fn(),
            }),
            addMetricReader: jest.fn(),
        };

        (MeterProvider as jest.MockedClass<typeof MeterProvider>).mockImplementation(
            () => meterInstance as MeterProvider,
        );

        (HttpInstrumentation as jest.Mock).mockImplementation(() => ({}));
        (PgInstrumentation as jest.Mock).mockImplementation(() => ({}));
        (RedisInstrumentation as unknown as jest.Mock).mockImplementation(() => ({}));
        (NestInstrumentation as unknown as jest.Mock).mockImplementation(() => ({}));

        setupTelemetry();

        expect(NodeTracerProvider).toHaveBeenCalled();
        expect(CollectorTraceExporter).toHaveBeenCalledWith({
            url: 'grpc://localhost:4317',
            credentials: grpc.credentials.createInsecure(),
        });
        expect(providerInstance.addSpanProcessor).toHaveBeenCalledWith(spanProcessorInstance);
        expect(providerInstance.register).toHaveBeenCalled();
    });

    // it('should register instrumentations', () => {
    //     setupTelemetry();

    //     expect(registerInstrumentations).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             tracerProvider: expect.instanceOf(NodeTracerProvider),
    //             instrumentations: expect.arrayContaining([
    //                 expect.instanceOf(HttpInstrumentation),
    //                 expect.instanceOf(PgInstrumentation),
    //                 expect.instanceOf(RedisInstrumentation),
    //                 expect.instanceOf(NestInstrumentation),
    //             ]),
    //         }),
    //     );
    // });

    it('should set up metrics correctly', () => {
        const meterProviderInstance = {
            addMetricReader: jest.fn(),
            getMeter: jest.fn().mockReturnValue({
                createCounter: jest.fn(),
            }),
        };
        (MeterProvider as jest.Mock).mockImplementation(() => meterProviderInstance);
        const metricExporterInstance = {};
        (OTLPMetricExporter as jest.Mock).mockImplementation(() => metricExporterInstance);
        const periodicExportingMetricReaderInstance = {};
        (PeriodicExportingMetricReader as jest.Mock).mockImplementation(() => periodicExportingMetricReaderInstance);

        setupTelemetry();

        expect(MeterProvider).toHaveBeenCalled();
        expect(OTLPMetricExporter).toHaveBeenCalledWith({
            url: 'grpc://localhost:4317',
            credentials: grpc.credentials.createInsecure(),
        });
        expect(meterProviderInstance.addMetricReader).toHaveBeenCalledWith(periodicExportingMetricReaderInstance);
        expect(meterProviderInstance.getMeter).toHaveBeenCalledWith('example-meter');
    });

    it('should post metrics at the correct interval', () => {
        jest.useFakeTimers();
        const meterProviderInstance = {
            addMetricReader: jest.fn(),
            getMeter: jest.fn().mockReturnValue({
                createCounter: jest.fn().mockReturnValue({
                    add: jest.fn(),
                }),
            }),
        } as {
            addMetricReader: jest.MockedFunction<typeof MeterProvider.prototype.addMetricReader>;
            getMeter: jest.MockedFunction<
                () => {
                    createCounter: jest.MockedFunction<() => { add: jest.Mock }>;
                }
            >;
        };
        (MeterProvider as jest.Mock).mockImplementation(() => meterProviderInstance);

        setupTelemetry();

        jest.advanceTimersByTime(6000);
        expect(meterProviderInstance.getMeter().createCounter().add).toHaveBeenCalled();
    });
});
