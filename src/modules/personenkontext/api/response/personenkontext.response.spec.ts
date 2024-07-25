import { faker } from '@faker-js/faker';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { LoeschungResponse } from '../../../person/api/loeschung.response.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../../domain/personenkontext.enums.js';
import { Personenkontext } from '../../domain/personenkontext.js';
import { PersonenkontextFactory } from '../../domain/personenkontext.factory.js';
import { PersonRepository } from '../../../person/persistence/person.repository.js';
import { OrganisationRepository } from '../../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../../../rolle/repo/rolle.repo.js';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
//import { DeepMocked } from '@golevelup/ts-jest';

describe('PersonenkontextResponse', () => {
    let module: TestingModule;

    let personenkontextFactory: PersonenkontextFactory;
    // let personRepoMock: DeepMocked<PersonRepository>;
    // let organisationRepoMock: DeepMocked<OrganisationRepository>;
    // let rolleRepoMock: DeepMocked<RolleRepo>;
    let baseProps: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        personId: string;
        organisationId: string;
        rolleId: Rolle;
        referrer: string;
        mandant: string;
        personenstatus: Personenstatus;
        jahrgangsstufe: Jahrgangsstufe;
        sichtfreigabe: SichtfreigabeType;
        loeschungZeitpunkt: Date | undefined;
        revision: string;
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenkontextFactory,
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
            ],
        }).compile();

        personenkontextFactory = module.get(PersonenkontextFactory);
        // personRepoMock = module.get(PersonRepository);
        // organisationRepoMock = module.get(OrganisationRepository);
        // rolleRepoMock = module.get(RolleRepo);
    });

    beforeEach(() => {
        jest.resetAllMocks();

        baseProps = {
            id: faker.string.uuid(),
            createdAt: new Date(),
            updatedAt: new Date(),
            personId: faker.string.uuid(),
            organisationId: faker.string.uuid(),
            rolleId: Rolle.LEHRENDER,
            referrer: faker.lorem.word(),
            mandant: faker.lorem.word(),
            personenstatus: Personenstatus.AKTIV,
            jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
            sichtfreigabe: SichtfreigabeType.JA,
            loeschungZeitpunkt: new Date(),
            revision: faker.string.uuid(),
        };
    });
    describe('constructor', () => {
        describe('when setting loeschung prop', () => {
            it('should create instance of LoeschungResponse', async () => {
                // Arrage
                const personenkontext: Personenkontext<true> = personenkontextFactory.construct(
                    baseProps.id,
                    baseProps.createdAt,
                    baseProps.updatedAt,
                    baseProps.personId,
                    baseProps.organisationId,
                    baseProps.rolleId,
                    baseProps.referrer,
                    baseProps.mandant,
                    baseProps.personenstatus,
                    baseProps.jahrgangsstufe,
                    baseProps.sichtfreigabe,
                    baseProps.loeschungZeitpunkt,
                    baseProps.revision,
                );
                // Act
                const result: PersonenkontextResponse = await PersonenkontextResponse.construct(personenkontext);

                // Assert
                expect(result.loeschung).toBeInstanceOf(LoeschungResponse);
            });
        });

        describe('when setting loeschung prop to undefined', () => {
            it('should not create instance of LoeschungResponse', async () => {
                // Arrage
                baseProps.loeschungZeitpunkt = undefined;

                const personenkontext: Personenkontext<true> = personenkontextFactory.construct(
                    baseProps.id,
                    baseProps.createdAt,
                    baseProps.updatedAt,
                    baseProps.personId,
                    baseProps.organisationId,
                    baseProps.rolleId,
                    baseProps.referrer,
                    baseProps.mandant,
                    baseProps.personenstatus,
                    baseProps.jahrgangsstufe,
                    baseProps.sichtfreigabe,
                    baseProps.loeschungZeitpunkt,
                    baseProps.revision,
                );

                // Act
                const result: PersonenkontextResponse = await PersonenkontextResponse.construct(personenkontext);

                // Assert
                expect(result.loeschung).toBeUndefined();
            });
        });
    });
});
