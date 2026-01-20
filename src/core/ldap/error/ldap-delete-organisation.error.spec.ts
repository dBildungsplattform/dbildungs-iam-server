import { LdapDeleteOrganisationError } from './ldap-delete-organisation.error.js';

describe('LdapDeleteOrganisationError', () => {
    describe.each([[{ kennung: '123456' }], [undefined]])(
        'when details are %s',
        (details: Record<string, string> | undefined) => {
            it('should construct error', () => {
                const error: LdapDeleteOrganisationError = new LdapDeleteOrganisationError(details);
                expect(error.message).toBe(`LDAP error: organisation could not be deleted`);
                expect(error.code).toBe('DELETE_ORGANISATION_FAILED');
                expect(error.details).toEqual(details);
            });
        },
    );
});
