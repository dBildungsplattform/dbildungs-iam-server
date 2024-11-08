import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked } from '@golevelup/ts-jest';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RolleFactory } from './rolle.factory.js';
import { RolleWorkflow } from './rolle-workflow.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { MikroORM } from '@mikro-orm/core';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
} from '../../../../test/utils/index.js';
import { Rolle } from './rolle.js';
import { CreateRolleBodyParams } from '../api/create-rolle.body.params.js';
import { RollenArt } from './rolle.enums.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';

describe('RolleWorkflow', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let organisationRepository: OrganisationRepository;
    let rolleRepo: RolleRepo;
    let rolleFactory: DeepMocked<RolleFactory>;
    let rolleWorkflow: RolleWorkflow;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), EventModule],
            providers: [OrganisationRepository, ServiceProviderRepo, RolleRepo, RolleFactory],
        }).compile();
        rolleRepo = module.get(RolleRepo);
        organisationRepository = module.get(OrganisationRepository);
        rolleFactory = module.get(RolleFactory);
        rolleWorkflow = RolleWorkflow.createNew(rolleRepo, rolleFactory);
        orm = module.get(MikroORM);
        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    }, 100000);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(rolleWorkflow).toBeDefined();
    });

    describe('createNewRolle', () => {
        let persistedSSK: Organisation<true>;

        beforeEach(async () => {
            await DatabaseTestModule.clearDatabase(orm);
            const ssk: Organisation<boolean> = DoFactory.createOrganisation(false, {
                name: 'SSK',
                typ: OrganisationsTyp.LAND,
                administriertVon: undefined,
                zugehoerigZu: undefined,
            });
            persistedSSK = await organisationRepository.save(ssk);
            const lehrerRolle: Rolle<false> = DoFactory.createRolle(false, {
                name: 'Lehrkraft',
                administeredBySchulstrukturknoten: persistedSSK.id,
            });
            await rolleRepo.save(lehrerRolle);
        });
        describe('when RolleNameUniqueOnSSK is NOT satisfied because rolle with same name exists on SSK', () => {
            it('should return RolleNameNotUniqueOnSskError', async () => {
                const createRolleParams: CreateRolleBodyParams = {
                    name: 'Lehrkraft',
                    administeredBySchulstrukturknoten: persistedSSK.id,
                    merkmale: [],
                    systemrechte: [],
                    rollenart: RollenArt.LEHR,
                };
                const rolleCreationResult: Rolle<false> | DomainError =
                    await rolleWorkflow.createNewRolleAndValidateNameUniquenessOnSSK(createRolleParams);

                expect(rolleCreationResult).toBeInstanceOf(DomainError);
            });
        });

        describe('when RolleNameUniqueOnSSK is satisfied because NO other rolle with rolle-name on SSK exists', () => {
            it('should return rolle', async () => {
                const createRolleParams: CreateRolleBodyParams = {
                    name: 'LiV',
                    administeredBySchulstrukturknoten: persistedSSK.id,
                    merkmale: [],
                    systemrechte: [],
                    rollenart: RollenArt.LEHR,
                };
                const rolleCreationResult: Rolle<false> | DomainError =
                    await rolleWorkflow.createNewRolleAndValidateNameUniquenessOnSSK(createRolleParams);

                expect(rolleCreationResult).toBeInstanceOf(Rolle);
            });
        });
    });
});
