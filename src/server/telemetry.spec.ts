import { setupTelemetry, shutdownTelemetry, flushTelemetry } from './telemetry.js';

describe('setupTelemetry', () => {
    beforeAll(() => {
        setupTelemetry();
    });

    afterAll(() => {
        shutdownTelemetry();
        flushTelemetry();
    });

    it('should execute setupTelemetry without throwing an error', () => {
        expect(() => setupTelemetry()).not.toThrow();
    });
});
