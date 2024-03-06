import { Personenkontext } from './personenkontext.js';
import { DBiamPersonenkontextRepo } from '../dbiam/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonenkontextAnlageError } from '../../../shared/error/personenkontext-anlage.error.js';
import { OrganisationScope } from '../../organisation/persistence/organisation.scope.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';

export class PersonenkontextAnlage {
    public organisationId?: string;

    public rolleId?: string;

    private constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    public static construct(
        rolleRepo: RolleRepo,
        organisationRepo: OrganisationRepo,
        dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ): PersonenkontextAnlage {
        return new PersonenkontextAnlage(rolleRepo, organisationRepo, dBiamPersonenkontextRepo);
    }

    public async findSchulstrukturknoten(rolleId: string, sskName: string): Promise<OrganisationDo<true>[]> {
        this.rolleId = rolleId;
        const ssks: Option<OrganisationDo<true>[]> = await this.organisationRepo.findByNameOrKennung(sskName);
        if (!ssks || ssks.length === 0) return [];
        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByRolle(this.rolleId);

        const allOrganisations: OrganisationDo<true>[] = [];
        for (const personenkontext of personenkontexte) {
            const parentOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
                personenkontext.organisationId,
            );
            if (!parentOrganisation) continue;
            allOrganisations.push(parentOrganisation);
            const childOrganisations: OrganisationDo<true>[] = await this.findChildOrganisations(
                personenkontext.organisationId,
            );
            if (childOrganisations.length > 0) {
                allOrganisations.push(...childOrganisations);
            }
        }

        return ssks.filter((ssk: OrganisationDo<true>) =>
            allOrganisations.some((organisation: OrganisationDo<true>) => ssk.id === organisation.id),
        );
    }

    public async findRollen(rolleName: string): Promise<Rolle<true>[]> {
        const rollen: Option<Rolle<true>[]> = await this.rolleRepo.findByName(rolleName);
        if (rollen) return rollen;
        return [];
    }

    public async validieren(): Promise<Result<boolean, PersonenkontextAnlageError>> {
        if (!this.rolleId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolleId is undefined'),
            };
        if (!this.organisationId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisationId is undefined'),
            };

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(this.rolleId);
        if (!rolle)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolle could not be found'),
            };
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(this.organisationId);
        if (!organisation)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisation could not be found'),
            };

        const rolleSSK: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            rolle.administeredBySchulstrukturknoten,
        );
        if (!rolleSSK)
            return {
                ok: false,
                error: new PersonenkontextAnlageError(
                    'PersonenkontextAnlage invalid: organisation administering rolle could not be found',
                ),
            };
        if (organisation.id == rolleSSK.id) return { ok: true, value: true };

        const children: OrganisationDo<true>[] = await this.findChildOrganisations(rolleSSK.id);
        if (children.some((c: OrganisationDo<true>) => c.id == organisation.id)) {
            return { ok: true, value: true };
        } else {
            return { ok: false, error: new EntityNotFoundError() };
        }
    }

    public async zuweisen(personId: string): Promise<Result<Personenkontext<true>, PersonenkontextAnlageError>> {
        if (!this.rolleId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: rolleId is undefined'),
            };
        if (!this.organisationId)
            return {
                ok: false,
                error: new PersonenkontextAnlageError('PersonenkontextAnlage invalid: organisationId is undefined'),
            };

        const isValid: Result<boolean, PersonenkontextAnlageError> = await this.validieren();
        if (!isValid.ok) return { ok: false, error: isValid.error };

        const personenkontext: Personenkontext<false> = Personenkontext.createNew(
            personId,
            this.organisationId,
            this.rolleId,
        );
        const createdPersonenkontext: Personenkontext<true> = await this.dBiamPersonenkontextRepo.save(personenkontext);
        return { ok: true, value: createdPersonenkontext };
    }

    private async findChildOrganisations(parentOrganisationId: string): Promise<OrganisationDo<true>[]> {
        const scope: OrganisationScope = new OrganisationScope().findAdministrierteVon(parentOrganisationId);
        const counted: Counted<OrganisationDo<true>> = await this.organisationRepo.findBy(scope);
        const children: OrganisationDo<true>[] = counted[0];
        return children;
    }
}
