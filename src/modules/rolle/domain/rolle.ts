import { AutoMap } from '@automapper/classes';

import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenMerkmal, RollenArt } from './rolle.enums.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';

export class Rolle {
    @AutoMap()
    public id?: string;

    @AutoMap()
    public createdAt?: Date;

    @AutoMap()
    public updatedAt?: Date;

    @AutoMap()
    public name!: string;

    @AutoMap()
    public administeredBySchulstrukturknoten!: string;

    @AutoMap(() => String)
    public rollenart!: RollenArt;

    @AutoMap(() => [String])
    public merkmale!: RollenMerkmal[];

    public async save(
        rolleRepo: RolleRepo,
        organisationService: OrganisationService,
    ): Promise<void | SchulConnexError> {
        const orgResult: Result<OrganisationDo<true>, DomainError> = await organisationService.findOrganisationById(
            this.administeredBySchulstrukturknoten,
        );

        if (!orgResult.ok) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(orgResult.error);
        }

        const rolle: Rolle = await rolleRepo.save(this);

        Object.assign(this, rolle);
    }

    public addMerkmal(merkmal: RollenMerkmal): void {
        if (!this.merkmale.includes(merkmal)) {
            this.merkmale.push(merkmal);
        }
    }

    public removeMerkmal(merkmal: RollenMerkmal): void {
        const idx: number = this.merkmale.indexOf(merkmal);
        if (idx !== -1) {
            this.merkmale.splice(idx, 1);
        }
    }
}
