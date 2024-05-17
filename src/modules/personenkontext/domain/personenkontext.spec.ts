import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Personenkontext } from './personenkontext.js';

describe('Personenkontext aggregate', () => {
    const personRepoMock: DeepMocked<PersonRepo> = createMock<PersonRepo>();
    const organisationRepoMock: DeepMocked<OrganisationRepo> = createMock<OrganisationRepo>();
    const rolleRepoMock: DeepMocked<RolleRepo> = createMock<RolleRepo>();

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('checkReferences', () => {
        it('should check if all references exist', async () => {
            const personenkontext: Personenkontext<false> | DomainError = await Personenkontext.createNew(
                personRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(personenkontext).not.toBeInstanceOf(DomainError);
            if (personenkontext instanceof DomainError) {
                return;
            }

            await personenkontext.checkReferences();

            expect(personRepoMock.exists).toHaveBeenCalledWith(personenkontext.personId);
            expect(organisationRepoMock.exists).toHaveBeenCalledWith(personenkontext.organisationId);
            expect(rolleRepoMock.exists).toHaveBeenCalledWith(personenkontext.rolleId);
        });

        it('should return no error if all references exist', async () => {
            personRepoMock.exists.mockResolvedValueOnce(true);
            organisationRepoMock.exists.mockResolvedValueOnce(true);
            rolleRepoMock.exists.mockResolvedValueOnce(true);

            const personenkontext: Personenkontext<false> | DomainError = await Personenkontext.createNew(
                personRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(personenkontext).not.toBeInstanceOf(DomainError);
        });

        it('should return EntityNotFoundError if person does not exist', async () => {
            personRepoMock.exists.mockResolvedValueOnce(false);
            organisationRepoMock.exists.mockResolvedValueOnce(true);
            rolleRepoMock.exists.mockResolvedValueOnce(true);

            const personenkontext: Personenkontext<false> | DomainError = await Personenkontext.createNew(
                personRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );

            expect(personenkontext).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if organisation does not exist', async () => {
            personRepoMock.exists.mockResolvedValueOnce(true);
            organisationRepoMock.exists.mockResolvedValueOnce(false);
            rolleRepoMock.exists.mockResolvedValueOnce(true);

            const personenkontext: Personenkontext<false> | DomainError = await Personenkontext.createNew(
                personRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(personenkontext).toBeInstanceOf(EntityNotFoundError);
        });

        it('should return EntityNotFoundError if rolle does not exist', async () => {
            personRepoMock.exists.mockResolvedValueOnce(true);
            organisationRepoMock.exists.mockResolvedValueOnce(true);
            rolleRepoMock.exists.mockResolvedValueOnce(false);

            const personenkontext: Personenkontext<false> | DomainError = await Personenkontext.createNew(
                personRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(personenkontext).toBeInstanceOf(EntityNotFoundError);
        });
    });
});
