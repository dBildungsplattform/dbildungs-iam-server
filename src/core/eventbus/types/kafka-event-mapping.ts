import { BaseEvent } from '../../../shared/events/index.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';

import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { KafkaImportExecutedEvent } from '../../../shared/events/kafka-import-executed.event.js';
import { KafkaGroupAndRoleCreatedEvent } from '../../../shared/events/kafka-kc-group-and-role-event.js';
import { KafkaKlasseCreatedEvent } from '../../../shared/events/kafka-klasse-created.event.js';
import { KafkaKlasseDeletedEvent } from '../../../shared/events/kafka-klasse-deleted.event.js';
import { KafkaKlasseUpdatedEvent } from '../../../shared/events/kafka-klasse-updated.event.js';
import { KafkaPersonCreatedEvent } from '../../../shared/events/kafka-person-created.event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KafkaPersonExternalSystemsSyncEvent } from '../../../shared/events/kafka-person-external-systems-sync.event.js';
import { KafkaPersonLdapSyncEvent } from '../../../shared/events/kafka-person-ldap-sync.event.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { KafkaRolleUpdatedEvent } from '../../../shared/events/kafka-rolle-updated.event.js';
import { KafkaSchuleCreatedEvent } from '../../../shared/events/kafka-schule-created.event.js';
import { KafkaSchuleItslearningEnabledEvent } from '../../../shared/events/kafka-schule-itslearning-enabled.event.js';
import { Constructor } from './util.types.js';

export type KafkaEventKey =
    | 'user.created'
    | 'user.created.email'
    | 'user.deleted'
    | 'user.modified.name'
    | 'user.modified.email'
    | 'user.modified.personenkontexte'
    | 'user.synced'
    | 'user.syncedldap'
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
    'user.created': {
        eventClass: KafkaPersonCreatedEvent, // CHECKED
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.created.email': {
        eventClass: KafkaEmailAddressGeneratedEvent, // CHECKED
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.deleted': {
        eventClass: KafkaPersonDeletedEvent, // CHECKED
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.modified.name': {
        eventClass: KafkaPersonRenamedEvent, // CHECKED
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.modified.email': {
        eventClass: KafkaEmailAddressChangedEvent, // CHECKED
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.modified.personenkontexte': {
        eventClass: KafkaPersonenkontextUpdatedEvent, // CHECKED
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.synced': {
        eventClass: KafkaPersonExternalSystemsSyncEvent,
        topic: 'user-topic',
        topicDlq: 'user-dlq-topic',
    },
    'user.syncedldap': {
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
};

export function isKafkaEventKey(value: unknown): value is KafkaEventKey {
    return typeof value === 'string' && value in KafkaEventMapping;
}
