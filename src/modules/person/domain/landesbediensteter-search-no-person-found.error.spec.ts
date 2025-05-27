import { LandesbediensteterSearchNoPersonFoundError } from './landesbediensteter-search-no-person-found.error.js';

describe('LandesbediensteterSearchNoPersonFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: LandesbediensteterSearchNoPersonFoundError =
                    new LandesbediensteterSearchNoPersonFoundError({});
                expect(error.message).toBe('No person found for search criteria');
                expect(error.code).toBe('LANDESBEDIENSTETER_SEARCH');
            });
        });
    });
});
