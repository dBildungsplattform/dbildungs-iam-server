import { ServiceProviderNichtNachtraeglichZuweisbarError } from './service-provider-nicht-nachtraeglich-zuweisbar.error.js';

describe('ServiceProviderNichtNachtraeglichZuweisbarError', () => {
    it('should create an error with the correct message', () => {
        const error: ServiceProviderNichtNachtraeglichZuweisbarError =
            new ServiceProviderNichtNachtraeglichZuweisbarError();
        expect(error.message).toBe(
            'The ServiceProviders for the Rolle cannot be updated, because one or more ServiceProviders can not be assigned after Rolle creation.',
        );
    });

    it('should allow additional details', () => {
        const details: Record<string, undefined> = { key: undefined };
        const error: ServiceProviderNichtNachtraeglichZuweisbarError =
            new ServiceProviderNichtNachtraeglichZuweisbarError(details);
        expect(error.details).toEqual(details);
    });
});
