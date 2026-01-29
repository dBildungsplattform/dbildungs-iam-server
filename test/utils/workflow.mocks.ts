import { MockedObject } from 'vitest';
import { LandesbediensteterWorkflowAggregate } from '../../src/modules/landesbediensteter/domain/landesbediensteter-workflow';
import { OrganisationRepository } from '../../src/modules/organisation/persistence/organisation.repository';
import { PersonRepository } from '../../src/modules/person/persistence/person.repository';
import { PersonLandesbediensteterSearchService } from '../../src/modules/person/person-landesbedienstete-search/person-landesbediensteter-search.service';
import { DbiamPersonenkontextFactory } from '../../src/modules/personenkontext/domain/dbiam-personenkontext.factory';
import { PersonenkontextWorkflowSharedKernel } from '../../src/modules/personenkontext/domain/personenkontext-workflow-shared-kernel';
import { DBiamPersonenkontextRepo } from '../../src/modules/personenkontext/persistence/dbiam-personenkontext.repo';
import { RolleRepo } from '../../src/modules/rolle/repo/rolle.repo';
import { createMock } from './createMock';
import { EventRoutingLegacyKafkaService } from '../../src/core/eventbus/services/event-routing-legacy-kafka.service';
import { ClassLogger } from '../../src/core/logging/class-logger';
import { DbiamPersonenkontextBodyParams } from '../../src/modules/personenkontext/api/param/dbiam-personenkontext.body.params';
import { PersonenkontextFactory } from '../../src/modules/personenkontext/domain/personenkontext.factory';
import { PersonenkontexteUpdate } from '../../src/modules/personenkontext/domain/personenkontexte-update';
import { DBiamPersonenkontextRepoInternal } from '../../src/modules/personenkontext/persistence/internal-dbiam-personenkontext.repo';
import { IPersonPermissions } from '../../src/shared/permissions/person-permissions.interface';
import { PersonID } from '../../src/shared/types';

export function createLandesbediensteterWorkflowAggregateMock(): MockedObject<LandesbediensteterWorkflowAggregate> {
    const landesbediensteterWorkflowAggregate: LandesbediensteterWorkflowAggregate =
        LandesbediensteterWorkflowAggregate.createNew(
            createMock(RolleRepo),
            createMock(OrganisationRepository),
            createMock(DBiamPersonenkontextRepo),
            createMock(DbiamPersonenkontextFactory),
            createMock(PersonRepository),
            createMock(PersonLandesbediensteterSearchService),
            createMock(PersonenkontextWorkflowSharedKernel),
        );
    return vi.mockObject(landesbediensteterWorkflowAggregate);
}export function createPersonenkontexteUpdateMock(): MockedObject<PersonenkontexteUpdate> {
    const personenkontexteUpdate: PersonenkontexteUpdate = PersonenkontexteUpdate.createNew(
        null as unknown as EventRoutingLegacyKafkaService,
        null as unknown as ClassLogger,
        null as unknown as DBiamPersonenkontextRepo,
        null as unknown as DBiamPersonenkontextRepoInternal,
        null as unknown as PersonRepository,
        null as unknown as RolleRepo,
        null as unknown as OrganisationRepository,
        null as unknown as PersonenkontextFactory,
        null as unknown as PersonID,
        null as unknown as Date | undefined,
        null as unknown as number,
        null as unknown as DbiamPersonenkontextBodyParams[],
        null as unknown as IPersonPermissions,
        null as unknown as string
    );
    return vi.mockObject(personenkontexteUpdate);
}

