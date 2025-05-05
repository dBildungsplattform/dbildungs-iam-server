import { BaseEvent } from '../../../shared/events/index.js';
import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { KafkaEvent } from '../../../shared/events/kafka-event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { Constructor } from './util.types.js';

export type KafkaEventKey =
    | 'user.created.email'
    | 'user.deleted'
    | 'user.modified.name'
    | 'user.modified.email'
    | 'user.modified.personenkontexte';

export type KafkaTopic = 'user-topic';
export type KafkaTopicDlq = 'user-dlq-topic';
export interface KafkaEventMappingEntry {
    eventClass: Constructor<BaseEvent & KafkaEvent>;
    topic: KafkaTopic;
    topicDlq: KafkaTopicDlq;
}

export const KafkaEventMapping: Record<KafkaEventKey, KafkaEventMappingEntry> = {
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
};

export function isKafkaEventKey(value: unknown): value is KafkaEventKey {
    return typeof value === 'string' && value in KafkaEventMapping;
}
