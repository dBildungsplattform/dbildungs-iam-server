import { BaseEvent } from '../../../shared/events/index.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';

import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { KafkaImportExecutedEvent } from '../../../shared/events/kafka-import-executed.event.js';
import { KafkaGroupAndRoleCreatedEvent } from '../../../shared/events/kafka-kc-group-and-role-event.js';
import { KafkaKlasseCreatedEvent } from '../../../shared/events/kafka-klasse-created.event.js';
import { KafkaKlasseDeletedEvent } from '../../../shared/events/kafka-klasse-deleted.event.js';
import { KafkaKlasseUpdatedEvent } from '../../../shared/events/kafka-klasse-updated.event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KafkaPersonExternalSystemsSyncEvent } from '../../../shared/events/kafka-person-external-systems-sync.event.js';
import { KafkaPersonLdapSyncEvent } from '../../../shared/events/kafka-person-ldap-sync.event.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { KafkaRolleUpdatedEvent } from '../../../shared/events/kafka-rolle-updated.event.js';
import { KafkaSchuleCreatedEvent } from '../../../shared/events/kafka-schule-created.event.js';
import { KafkaSchuleItslearningEnabledEvent } from '../../../shared/events/kafka-schule-itslearning-enabled.event.js';
import { Constructor } from './util.types.js';
import { KafkaPersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/kafka-person-deleted-after-deadline-exceeded.event.js';
import { KafkaEmailAddressAlreadyExistsEvent } from '../../../shared/events/email/kafka-email-address-already-exists.event.js';
import { KafkaEmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/kafka-email-address-marked-for-deletion.event.js';
import { KafkaEmailAddressDeletedInDatabaseEvent } from '../../../shared/events/email/kafka-email-address-deleted-in-database.event.js';
import { KafkaLdapEmailAddressDeletedEvent } from '../../../shared/events/ldap/kafka-ldap-email-address-deleted.event.js';
import { KafkaEmailAddressDisabledEvent } from '../../../shared/events/email/kafka-email-address-disabled.event.js';
import { KafkaDisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-disabled-email-address-generated.event.js';
import { KafkaEmailAddressesPurgedEvent } from '../../../shared/events/email/kafka-email-addresses-purged.event.js';
import { KafkaLdapPersonEntryChangedEvent } from '../../../shared/events/ldap/kafka-ldap-person-entry-changed.event.js';
import { KafkaLdapEntryDeletedEvent } from '../../../shared/events/ldap/kafka-ldap-entry-deleted.event.js';
import { KafkaLdapPersonEntryRenamedEvent } from '../../../shared/events/ldap/kafka-ldap-person-entry-renamed.event.js';
import { KafkaOxAccountDeletedEvent } from '../../../shared/events/ox/kafka-ox-account-deleted.event.js';
import { KafkaDisabledOxUserChangedEvent } from '../../../shared/events/ox/kafka-disabled-ox-user-changed.event.js';
import { KafkaOxEmailAddressDeletedEvent } from '../../../shared/events/ox/kafka-ox-email-address-deleted.event.js';
import { KafkaOxMetadataInKeycloakChangedEvent } from '../../../shared/events/ox/kafka-ox-metadata-in-keycloak-changed.event.js';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';

export type KafkaEventKey =
    | 'user.created.email'
    | 'user.deleted'
    | 'user.deleted_deadline'
    | 'user.modified.name'
    | 'user.modified.email'
    | 'user.modified.personenkontexte'
    | 'user.synced'
    | 'user.email.disabled_generated'
    | 'user.email.already_exists'
    | 'user.email.deleted_in_database'
    | 'user.email.deleted'
    | 'user.email.disabled'
    | 'user.email.purged'
    | 'user.ldap.synced'
    | 'user.ldap.entry_deleted'
    | 'user.ldap.entry_changed'
    | 'user.ldap.entry_renamed'
    | 'user.ldap.email_deleted'
    | 'user.ox.disabled_changed'
    | 'user.ox.deleted'
    | 'user.ox.email_deleted'
    | 'user.ox.kc_metadata_changed'
    | 'user.ox.user_changed'
    | 'import.executed'
    | 'group_role.created'
    | 'klasse.created'
    | 'klasse.deleted'
    | 'klasse.updated'
    | 'rolle.updated'
    | 'schule.created'
    | 'schule.itslearning_enabled';

type TopicPrefixes = 'user' | 'import' | 'group-role' | 'klasse' | 'rolle' | 'schule';

export type KafkaTopic = `${TopicPrefixes}-topic`;
export type KafkaTopicDlq = `${TopicPrefixes}-dlq-topic`;

export interface KafkaEventMappingEntry {
    eventClass: Constructor<BaseEvent & KafkaEvent>;
    topic: KafkaTopic;
    topicDlq: KafkaTopicDlq;
}

export const KafkaEventMapping: Record<KafkaEventKey, KafkaEventMappingEntry> = {
    'user.created.email': {
        eventClass: KafkaEmailAddressGeneratedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.deleted': {
        eventClass: KafkaPersonDeletedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.deleted_deadline': {
        eventClass: KafkaPersonDeletedAfterDeadlineExceededEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.modified.name': {
        eventClass: KafkaPersonRenamedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.modified.email': {
        eventClass: KafkaEmailAddressChangedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.modified.personenkontexte': {
        eventClass: KafkaPersonenkontextUpdatedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.synced': {
        eventClass: KafkaPersonExternalSystemsSyncEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ldap.synced': {
        eventClass: KafkaPersonLdapSyncEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },

    'import.executed': {
        eventClass: KafkaImportExecutedEvent,
        topic: 'import-topic',
        topicDlq: 'import-dlq-topic',
    },

    'group_role.created': {
        eventClass: KafkaGroupAndRoleCreatedEvent,
        topic: 'group-role-topic',
        topicDlq: 'group-role-dlq-topic',
    },

    'rolle.updated': {
        eventClass: KafkaRolleUpdatedEvent,
        topic: 'rolle-topic',
        topicDlq: 'rolle-dlq-topic',
    },

    'klasse.created': {
        eventClass: KafkaKlasseCreatedEvent,
        topic: 'klasse-topic',
        topicDlq: 'klasse-dlq-topic',
    },
    'klasse.deleted': {
        eventClass: KafkaKlasseDeletedEvent,
        topic: 'klasse-topic',
        topicDlq: 'klasse-dlq-topic',
    },
    'klasse.updated': {
        eventClass: KafkaKlasseUpdatedEvent,
        topic: 'klasse-topic',
        topicDlq: 'klasse-dlq-topic',
    },

    'schule.created': {
        eventClass: KafkaSchuleCreatedEvent,
        topic: 'schule-topic',
        topicDlq: 'schule-dlq-topic',
    },
    'schule.itslearning_enabled': {
        eventClass: KafkaSchuleItslearningEnabledEvent,
        topic: 'schule-topic',
        topicDlq: 'schule-dlq-topic',
    },

    'user.email.already_exists': {
        eventClass: KafkaEmailAddressAlreadyExistsEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.email.deleted': {
        eventClass: KafkaEmailAddressMarkedForDeletionEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.email.deleted_in_database': {
        eventClass: KafkaEmailAddressDeletedInDatabaseEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ldap.email_deleted': {
        eventClass: KafkaLdapEmailAddressDeletedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.email.disabled': {
        eventClass: KafkaEmailAddressDisabledEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.email.disabled_generated': {
        eventClass: KafkaDisabledEmailAddressGeneratedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.email.purged': {
        eventClass: KafkaEmailAddressesPurgedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },

    'user.ldap.entry_changed': {
        eventClass: KafkaLdapPersonEntryChangedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ldap.entry_deleted': {
        eventClass: KafkaLdapEntryDeletedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ldap.entry_renamed': {
        eventClass: KafkaLdapPersonEntryRenamedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },

    'user.ox.deleted': {
        eventClass: KafkaOxAccountDeletedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ox.disabled_changed': {
        eventClass: KafkaDisabledOxUserChangedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ox.email_deleted': {
        eventClass: KafkaOxEmailAddressDeletedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ox.kc_metadata_changed': {
        eventClass: KafkaOxMetadataInKeycloakChangedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.ox.user_changed': {
        eventClass: KafkaOxUserChangedEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
};

export function isKafkaEventKey(value: unknown): value is KafkaEventKey {
    return typeof value === 'string' && value in KafkaEventMapping;
}
