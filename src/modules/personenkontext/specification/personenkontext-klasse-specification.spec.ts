import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UpdateInvalidRollenartForLernError } from '../domain/error/update-invalid-rollenart-for-lern.error.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { GleicheRolleAnKlasseWieSchuleError } from './error/gleiche-rolle-an-klasse-wie-schule.error.js';
import { NurLehrUndLernAnKlasseError } from './error/nur-lehr-und-lern-an-klasse.error.js';
import { GleicheRolleAnKlasseWieSchule } from './gleiche-rolle-an-klasse-wie-schule.js';
import { NurLehrUndLernAnKlasse } from './nur-lehr-und-lern-an-klasse.js';
import { CheckRollenartLernSpecification } from './nur-rolle-lern.js';
import { PersonenkontextKlasseSpecification } from './personenkontext-klasse-specification.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';

describe('PersonenkontextKlasseSpecification Integration', () => {
    let specification: PersonenkontextKlasseSpecification;
    let nurLehrUndLernAnKlasseMock: DeepMocked<NurLehrUndLernAnKlasse>;
    let gleicheRolleAnKlasseWieSchuleMock: DeepMocked<GleicheRolleAnKlasseWieSchule>;
    let checkRollenartLernSpecificationMock: DeepMocked<CheckRollenartLernSpecification>;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: NurLehrUndLernAnKlasse,
                    useValue: createMock<NurLehrUndLernAnKlasse>(),
                },
                {
                    provide: GleicheRolleAnKlasseWieSchule,
                    useValue: createMock<GleicheRolleAnKlasseWieSchule>(),
                },
                {
                    provide: CheckRollenartLernSpecification,
                    useValue: createMock<CheckRollenartLernSpecification>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                PersonenkontextKlasseSpecification,
            ],
        }).compile();

        specification = module.get(PersonenkontextKlasseSpecification);
        nurLehrUndLernAnKlasseMock = module.get(NurLehrUndLernAnKlasse);
        gleicheRolleAnKlasseWieSchuleMock = module.get(GleicheRolleAnKlasseWieSchule);
        checkRollenartLernSpecificationMock = module.get(CheckRollenartLernSpecification);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should return UpdateInvalidRollenartForLernError when checkRollenartLern fails', async () => {
        specification = new PersonenkontextKlasseSpecification(
            nurLehrUndLernAnKlasseMock,
            gleicheRolleAnKlasseWieSchuleMock,
            checkRollenartLernSpecificationMock,
        );
        const personenkontextMock: DeepMocked<Personenkontext<boolean>> = createMock<Personenkontext<boolean>>();

        checkRollenartLernSpecificationMock.checkRollenartLern.mockResolvedValueOnce(false);
        nurLehrUndLernAnKlasseMock.isSatisfiedBy.mockResolvedValueOnce(true);
        gleicheRolleAnKlasseWieSchuleMock.isSatisfiedBy.mockResolvedValueOnce(true);

        const result: Option<DomainError> = await specification.returnsError(personenkontextMock);

        expect(result).toBeInstanceOf(UpdateInvalidRollenartForLernError);
    });

    it('should return NurLehrUndLernAnKlasseError when NurLehrUndLernAnKlasse fails', async () => {
        specification = new PersonenkontextKlasseSpecification(
            nurLehrUndLernAnKlasseMock,
            gleicheRolleAnKlasseWieSchuleMock,
            checkRollenartLernSpecificationMock,
        );
        const personenkontextMock: DeepMocked<Personenkontext<boolean>> = createMock<Personenkontext<boolean>>();

        checkRollenartLernSpecificationMock.checkRollenartLern.mockResolvedValue(true);
        nurLehrUndLernAnKlasseMock.isSatisfiedBy.mockResolvedValue(false);
        gleicheRolleAnKlasseWieSchuleMock.isSatisfiedBy.mockResolvedValue(true);

        const result: Option<DomainError> = await specification.returnsError(personenkontextMock);

        expect(result).toBeInstanceOf(NurLehrUndLernAnKlasseError);
    });

    it('should return GleicheRolleAnKlasseWieSchuleError when GleicheRolleAnKlasseWieSchule fails', async () => {
        specification = new PersonenkontextKlasseSpecification(
            nurLehrUndLernAnKlasseMock,
            gleicheRolleAnKlasseWieSchuleMock,
            checkRollenartLernSpecificationMock,
        );
        const personenkontextMock: DeepMocked<Personenkontext<boolean>> = createMock<Personenkontext<boolean>>();

        checkRollenartLernSpecificationMock.checkRollenartLern.mockResolvedValue(true);
        nurLehrUndLernAnKlasseMock.isSatisfiedBy.mockResolvedValue(true);
        gleicheRolleAnKlasseWieSchuleMock.isSatisfiedBy.mockResolvedValue(false);

        const result: Option<DomainError> = await specification.returnsError(personenkontextMock);

        expect(result).toBeInstanceOf(GleicheRolleAnKlasseWieSchuleError);
    });

    it('should return undefined when all checks pass', async () => {
        specification = new PersonenkontextKlasseSpecification(
            nurLehrUndLernAnKlasseMock,
            gleicheRolleAnKlasseWieSchuleMock,
            checkRollenartLernSpecificationMock,
        );
        const personenkontextMock: DeepMocked<Personenkontext<boolean>> = createMock<Personenkontext<boolean>>();

        checkRollenartLernSpecificationMock.checkRollenartLern.mockResolvedValue(true);
        nurLehrUndLernAnKlasseMock.isSatisfiedBy.mockResolvedValue(true);
        gleicheRolleAnKlasseWieSchuleMock.isSatisfiedBy.mockResolvedValue(true);

        const result: Option<DomainError> = await specification.returnsError(personenkontextMock);

        expect(result).toBeUndefined();
    });
});
