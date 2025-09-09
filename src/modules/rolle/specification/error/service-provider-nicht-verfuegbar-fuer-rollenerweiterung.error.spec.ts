import { ServiceProviderNichtVerfuegbarFuerRollenerweiterungError } from './service-provider-nicht-verfuegbar-fuer-rollenerweiterung.error.js';

describe('ServiceProviderNichtNachtraeglichZuweisbarError', () => {
    it('should create an error with the correct message', () => {
        const error: ServiceProviderNichtVerfuegbarFuerRollenerweiterungError =
            new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError();
        expect(error.message).toBe(
            'The Rollenerweiterung is not possible, because the ServiceProvider is not available for Rollenerweiterung.',
        );
    });

    it('should allow additional details', () => {
        const details: Record<string, undefined> = { key: undefined };
        const error: ServiceProviderNichtVerfuegbarFuerRollenerweiterungError =
            new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError(details);
        expect(error.details).toEqual(details);
    });
});
