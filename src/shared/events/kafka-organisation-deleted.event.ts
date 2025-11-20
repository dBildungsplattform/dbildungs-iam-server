import { KafkaEvent } from './kafka-event.js';
import { OrganisationDeletedEvent } from './organisation-deleted.event.js';

export class KafkaOrganisationDeletedEvent extends OrganisationDeletedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.organisationId;
    }
}
