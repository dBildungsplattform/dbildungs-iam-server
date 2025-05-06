import { DoFactory } from '../../../test/utils/do-factory.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { KafkaRolleUpdatedEvent } from './kafka-rolle-updated.event.js';

describe('KafkaRolleUpdatedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const rolle: Rolle<true> = DoFactory.createRolle(true);

        const event: KafkaRolleUpdatedEvent = new KafkaRolleUpdatedEvent(
            rolle.id,
            rolle.rollenart,
            rolle.merkmale,
            rolle.systemrechte,
            rolle.serviceProviderIds,
        );

        expect(event).toBeInstanceOf(KafkaRolleUpdatedEvent);
        expect(event.kafkaKey).toBe(rolle.id);
    });
});
