import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError, EntityCouldNotBeUpdated, EntityNotFoundError } from '../../../shared/error/index.js';
import { EventService } from '../../../core/eventbus/index.js';
import { OrganisationFactory } from './organisation.factory.js';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { OrganisationUpdate } from './organisation-update.js';
import { OrganisationDo } from './organisation.do.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { OrganisationsTyp } from './organisation.enums.js';
import { KlassenNameAnSchuleEindeutig } from '../specification/klassen-name-an-schule-eindeutig.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';
import { KlassenNameAnSchuleEindeutigError } from '../specification/error/klassen-name-an-schule-eindeutig.error.js';
import { NameRequiredForKlasseError } from '../specification/error/name-required-for-klasse.error.js';

describe('OrganisationUpdate', () => {
    let module: TestingModule;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let organisationFactory: OrganisationFactory;
    let sut: OrganisationUpdate;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                EventService,
                OrganisationFactory,
            ],
        }).compile();
        organisationRepoMock = module.get(OrganisationRepo);
        organisationFactory = module.get(OrganisationFactory);

        sut = organisationFactory.createNewOrganisationUpdate(faker.string.uuid());
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(organisationFactory).toBeDefined();
    });

    describe('updateKlassenName', () => {
        describe('when organisation does not exist', () => {
            it('should return EntityNotFoundError', async () => {
                organisationRepoMock.findById.mockResolvedValueOnce(undefined);
                const updateError: DomainError | void = await sut.updateKlassenName('name');

                expect(updateError).toBeInstanceOf(EntityNotFoundError);
            });
        });

        describe('If organisation is not a Klasse', () => {
            it('should return EntityCouldNotBeUpdated', async () => {
                const orga: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                    typ: OrganisationsTyp.SCHULE,
                });
                organisationRepoMock.findById.mockResolvedValueOnce(orga);
                const updateError: DomainError | void = await sut.updateKlassenName('name');

                expect(updateError).toBeInstanceOf(EntityCouldNotBeUpdated);
            });
        });

        describe('If checkKlasseSpecifications fails', () => {
            it('should return OrganisationSpecificationError', async () => {
                const orga: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                    typ: OrganisationsTyp.KLASSE,
                });
                organisationRepoMock.findById.mockResolvedValueOnce(orga);
                const klassenNameAnSchuleEindeutigMock: DeepMocked<KlassenNameAnSchuleEindeutig> =
                    createMock<KlassenNameAnSchuleEindeutig>();
                klassenNameAnSchuleEindeutigMock.isSatisfiedBy.mockResolvedValueOnce(false);

                const updateError: DomainError | void = await sut.updateKlassenName('name');

                expect(updateError).toBeInstanceOf(OrganisationSpecificationError);
            });
        });

        describe('When all validations pass', () => {
            it('should return void', async () => {
                const orga: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    name: 'name',
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const otherOrga: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const parentOrga: OrganisationDo<boolean> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });
                organisationRepoMock.findById.mockResolvedValueOnce(orga).mockResolvedValueOnce(parentOrga);
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([otherOrga]);

                const result: DomainError | void = await sut.updateKlassenName('newName');
                expect(organisationRepoMock.save).toHaveBeenCalled();
                expect(result).not.toBeInstanceOf(DomainError);
            });

            it('should return ', async () => {
                const orga: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    name: 'name',
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const otherOrga: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const parentOrga: OrganisationDo<boolean> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });
                organisationRepoMock.findById.mockResolvedValueOnce(orga).mockResolvedValueOnce(parentOrga);
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([otherOrga]);

                const result: DomainError | void = await sut.updateKlassenName('newName');
                expect(organisationRepoMock.save).toHaveBeenCalled();
                expect(result).not.toBeInstanceOf(DomainError);
            });
        });
    });

    describe('checkKlasseSpecifications', () => {
        describe('if KlassenNameAnSchuleEindeutig is not valid', () => {
            it('should return KlassenNameAnSchuleEindeutigError', async () => {
                const orga: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    name: 'name',
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const otherOrga: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    name: 'name',
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: faker.string.uuid(),
                });
                const parentOrga: OrganisationDo<boolean> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });
                organisationRepoMock.findById.mockResolvedValueOnce(orga).mockResolvedValueOnce(parentOrga);
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([otherOrga]);

                const updateError: OrganisationSpecificationError | undefined = await sut.checkKlasseSpecifications(
                    organisationRepoMock,
                    orga,
                );

                expect(updateError).toBeInstanceOf(KlassenNameAnSchuleEindeutigError);
            });
        });

        describe('if NameRequiredForKlasse is not valid', () => {
            it('should return NameRequiredForKlasseError', async () => {
                const orga: OrganisationDo<boolean> = DoFactory.createOrganisation(false, {
                    name: '',
                    typ: OrganisationsTyp.KLASSE,
                });

                const updateError: OrganisationSpecificationError | undefined = await sut.checkKlasseSpecifications(
                    organisationRepoMock,
                    orga,
                );

                expect(updateError).toBeInstanceOf(NameRequiredForKlasseError);
            });
        });
    });
});
