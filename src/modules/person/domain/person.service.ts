import { Injectable } from '@nestjs/common';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonScope } from '../persistence/person.scope.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonFactory } from './person.factory.js';
import { Person } from './person.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationMatchesRollenart } from '../../personenkontext/specification/organisation-matches-rollenart.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { NurLehrUndLernAnKlasseError } from '../../personenkontext/specification/error/nur-lehr-und-lern-an-klasse.error.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';

@Injectable()
export class PersonService {
    public constructor(
        private readonly personRepo: PersonRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly personRepository: PersonRepository,
        private readonly personFactory: PersonFactory,
    ) {}

    public async findPersonById(id: string): Promise<Result<PersonDo<true>, DomainError>> {
        const person: Option<PersonDo<true>> = await this.personRepo.findById(id);
        if (person) {
            return { ok: true, value: person };
        }
        return { ok: false, error: new EntityNotFoundError('Person', id) };
    }

    public async findAllPersons(
        personDo: Partial<PersonDo<false>>,
        offset?: number,
        limit?: number,
    ): Promise<Paged<PersonDo<true>>> {
        const scope: PersonScope = new PersonScope()
            .findBy({
                vorname: personDo.vorname,
                familienname: personDo.familienname,
                geburtsdatum: personDo.geburtsdatum,
            })
            .sortBy('vorname', ScopeOrder.ASC)
            .paged(offset, limit);
        const [persons, total]: Counted<PersonDo<true>> = await this.personRepo.findBy(scope);

        return {
            total,
            offset: offset ?? 0,
            limit: limit ?? total,
            items: persons,
        };
    }

    public async createPerson(
        permissions: PersonPermissions,
        vorname: string,
        familienname: string,
        organisationId: string,
        rolleId: string,
    ): Promise<Person<true> | DomainError> {
        //Person.createNew()
        const person: Person<false> | DomainError = await this.personFactory.createNew({
            vorname: vorname,
            familienname: familienname,
        });
        if (person instanceof DomainError) {
            return person;
        }
        //Check references: ob der Admin berechtigt ist
        const referenceError: Option<DomainError> = await this.checkReferences(organisationId, rolleId);
        if (referenceError) {
            return referenceError;
        }
        //Check Permissions für Personenkontext
        const permissionsError: Option<DomainError> = await this.checkPermissions(permissions, organisationId);
        if (permissionsError) {
            return permissionsError;
        }
        //CheckSpecifications (NurLehrUndLernAnKlasse)
        // Für GleicheRolleAnKlasseWieSchule ist die Prüfung nicht notwendig weil der User (Person) an der Schule gehängt sein muss, bevor Person in eine Klasse hinzugefügt wird?
        if (!(await this.checkSpecificationNurLehrUndLernAnKlasse(organisationId, rolleId))) {
            return new NurLehrUndLernAnKlasseError();
        }
        //Save Person
        const savedPerson: DomainError | Person<true> = await this.personRepository.create(person);
        return savedPerson;
    }

    private async checkReferences(organisationId: string, rolleId: string): Promise<Option<DomainError>> {
        const [orga, rolle]: [Option<Organisation<true>>, Option<Rolle<true>>] = await Promise.all([
            this.organisationRepo.findById(organisationId),
            this.rolleRepo.findById(rolleId),
        ]);

        if (!orga) {
            return new EntityNotFoundError('Organisation', organisationId);
        }

        if (!rolle) {
            return new EntityNotFoundError('Rolle', rolleId);
        }

        // Can rolle be assigned at target orga
        const canAssignRolle: boolean = await rolle.canBeAssignedToOrga(organisationId);
        if (!canAssignRolle) {
            return new EntityNotFoundError('rolle', rolleId); // Rolle does not exist for the chosen organisation
        }

        //The aimed organisation needs to match the type of role to be assigned
        const organisationMatchesRollenart: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        if (!organisationMatchesRollenart.isSatisfiedBy(orga, rolle)) {
            return new RolleNurAnPassendeOrganisationError();
        }

        return undefined;
    }

    private async checkPermissions(
        permissions: PersonPermissions,
        organisationId: string,
    ): Promise<Option<DomainError>> {
        // Check if logged in person has permission
        const hasPermissionAtOrga: boolean = await permissions.hasSystemrechtAtOrganisation(organisationId, [
            RollenSystemRecht.PERSONEN_VERWALTEN,
        ]);

        // Missing permission on orga
        if (!hasPermissionAtOrga) {
            return new MissingPermissionsError('Unauthorized to manage persons at the organisation');
        }

        return undefined;
    }

    private async checkSpecificationNurLehrUndLernAnKlasse(organisationId: string, rolleId: string): Promise<boolean> {
        //NurLehrUndLernAnKlasse
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(organisationId);
        if (!organisation) return false;
        if (organisation.typ !== OrganisationsTyp.KLASSE) return true;

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(rolleId);
        if (!rolle) return false;
        return rolle.rollenart === RollenArt.LEHR || rolle.rollenart === RollenArt.LERN;
    }
}
