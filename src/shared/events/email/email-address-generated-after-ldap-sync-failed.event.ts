import { EmailAddressGeneratedEvent } from './email-address-generated.event.js';

/**
 * This event should be triggered when a new email-address is generated for a user and persisted successfully in the database,
 * due to a former failed LDAP-sync.
 * It is used for synchronization of email-address generation and the process of requesting user-creation in OX afterward.
 * It should NOT be triggered by any OX-related operation.
 */
export class EmailAddressGeneratedAfterLdapSyncFailedEvent extends EmailAddressGeneratedEvent {}
