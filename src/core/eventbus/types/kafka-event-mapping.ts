import { BaseEvent } from '../../../shared/events/index.js';
import { KafkaEmailAddressChangedEvent } from '../../../shared/events/kafka-email-address-changed.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/kafka-email-address-generated.event.js';
import { KafkaPersonCreatedEvent } from '../../../shared/events/kafka-person-created.event.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { Constructor } from './util.types.js';

export const KafkaEventMapping: Record<string, Constructor<BaseEvent>> = {
    'user.created': KafkaPersonCreatedEvent,
    'user.created.email': KafkaEmailAddressGeneratedEvent,
    'user.deleted': KafkaPersonDeletedEvent,
    'user.modified.name': KafkaPersonRenamedEvent,
    'user.modified.email': KafkaEmailAddressChangedEvent,
    'school.assigned': PersonenkontextUpdatedEvent,
    'school.unassigned': PersonenkontextUpdatedEvent,
};
