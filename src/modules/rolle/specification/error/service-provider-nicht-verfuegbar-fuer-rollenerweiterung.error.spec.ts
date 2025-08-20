import { ServiceProviderNichtVerfuegbarFuerRollenerweiterungError } from './service-provider-nicht-verfuegbar-fuer-rollenerweiterung.error.js';

describe('ServiceProviderNichtNachtraeglichZuweisbarError', () => {
    it('should create an error with the correct message', () => {
        const error: ServiceProviderNichtVerfuegbarFuerRollenerweiterungError =
            new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError();
        expect(error.message).toBe(
            'The Rolle cannot be updated, because one or more ServiceProviders are not available for RollenErweiterung.',
        );
    });

    it('should allow additional details', () => {
        const details: Record<string, undefined> = { key: undefined };
        const error: ServiceProviderNichtVerfuegbarFuerRollenerweiterungError =
            new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError(details);
        expect(error.details).toEqual(details);
    });
});
