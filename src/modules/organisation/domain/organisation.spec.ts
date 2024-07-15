import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { MapperTestModule } from '../../../../test/utils/mapper-test.module.js';
import { Organisation } from './organisation.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { OrganisationsTyp } from './organisation.enums.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';
import { KlassenNameAnSchuleEindeutigError } from '../specification/error/klassen-name-an-schule-eindeutig.error.js';
import { NameRequiredForKlasseError } from '../specification/error/name-required-for-klasse.error.js';
import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('Organisation', () => {
    let module: TestingModule;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule],
            providers: [
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
            ],
        }).compile();
        organisationRepositoryMock = module.get(OrganisationRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('construct', () => {
        it('should return persisted organisation', () => {
            const organisation: Organisation<true> = Organisation.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
                undefined,
                undefined,
            );

            expect(organisation).toBeDefined();
            expect(organisation).toBeInstanceOf(Organisation<true>);
        });
    });

    describe('createNew', () => {
        it('should return non pesisted organisation', () => {
            const organisation: Organisation<false> = Organisation.createNew(
                faker.string.uuid(),
                faker.string.uuid(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
                undefined,
                undefined,
            );

            expect(organisation).toBeDefined();
            expect(organisation).toBeInstanceOf(Organisation<false>);
        });
    });

    describe('checkKlasseSpecifications', () => {
        describe('if KlassenNameAnSchuleEindeutig is not valid', () => {
            it('should return KlassenNameAnSchuleEindeutigError', async () => {
                const orga: Organisation<true> = DoFactory.createOrganisationAggregate(true, {
                    name: 'name',
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const otherOrga: Organisation<true> = DoFactory.createOrganisationAggregate(true, {
                    name: 'name',
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const parentOrga: Organisation<boolean> = DoFactory.createOrganisationAggregate(true, {
                    typ: OrganisationsTyp.SCHULE,
                });
                organisationRepositoryMock.findById.mockResolvedValueOnce(orga).mockResolvedValueOnce(parentOrga);
                organisationRepositoryMock.findChildOrgasForIds.mockResolvedValueOnce([otherOrga]);

                const updateError: OrganisationSpecificationError | undefined =
                    await orga.checkKlasseSpecifications(organisationRepositoryMock);

                expect(updateError).toBeInstanceOf(KlassenNameAnSchuleEindeutigError);
            });
        });

        describe('if NameRequiredForKlasse is not valid', () => {
            it('should return NameRequiredForKlasseError', async () => {
                const orga: Organisation<boolean> = DoFactory.createOrganisationAggregate(false, {
                    name: '',
                    typ: OrganisationsTyp.KLASSE,
                });

                const updateError: OrganisationSpecificationError | undefined =
                    await orga.checkKlasseSpecifications(organisationRepositoryMock);

                expect(updateError).toBeInstanceOf(NameRequiredForKlasseError);
            });
        });
    });
});
