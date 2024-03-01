import { Personenkontext } from './personenkontext.js';
import { DBiamPersonenkontextRepo } from '../dbiam/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';

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
        const ssks: Option<OrganisationDo<true>[]> = await this.organisationRepo.findByName(sskName);
        if (!ssks || ssks.length === 0) return [];
        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByRolle(this.rolleId);
        return personenkontexte.filter((pk: Personenkontext<true>) =>
            ssks.some((ssk: OrganisationDo<true>) => ssk.id === pk.organisationId),
        );
    }

    public async findRollen(rolleName: string): Promise<Rolle<true>[]> {
        const rollen: Option<Rolle<true>[]> = await this.rolleRepo.findByName(rolleName);
        if (rollen) return rollen;
        return [];
    }

    public validieren(): void {}

    public async zuweisen(personId: string): Promise<Personenkontext<true>> {
        if (!this.organisationId || !this.rolleId) throw Error();
        const personenkontext: Personenkontext<false> = Personenkontext.createNew(
            personId,
            this.organisationId,
            this.rolleId,
        );
        return this.dBiamPersonenkontextRepo.save(personenkontext);
    }
}
