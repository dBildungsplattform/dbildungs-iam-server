/* eslint-disable no-console */
import { setupTelemetry } from './telemetry.js';

describe('setupTelemetry', () => {
    it('setupTelemetry', () => {
        //expect(() => setupTelemetry()).not.toThrow();
        const unregister = setupTelemetry();
        unregister();
    });
});
