import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { PersonPermissions } from '../../modules/authentication/domain/person-permissions.js';
import { OrganisationID, RolleID } from '../types/aggregate-ids.types.js';
import { KafkaImportExecutedEvent } from './kafka-import-executed.event.js';

describe('KafkaImportExecutedEvent', () => {
    it('should correctly initialize and implement KafkaEvent', () => {
        const importVorgangId: string = faker.string.uuid();
        const organisationId: OrganisationID = faker.string.uuid();
        const rolleId: RolleID = faker.string.uuid();
        const permissionsMock: PersonPermissions = createMock<PersonPermissions>();

        const event: KafkaImportExecutedEvent = new KafkaImportExecutedEvent(
            importVorgangId,
            organisationId,
            rolleId,
            permissionsMock,
        );

        expect(event).toBeInstanceOf(KafkaImportExecutedEvent);
        expect(event.kafkaKey).toBe(importVorgangId);
    });
});
