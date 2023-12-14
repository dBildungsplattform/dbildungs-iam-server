import { AutoMap } from '@automapper/classes';

import { RolleRepo } from '../repo/rolle.repo.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';

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

    public async save(rolleRepo: RolleRepo, organisationService: OrganisationService): Promise<void> {
        const orgResult: Result<OrganisationDo<true>, DomainError> = await organisationService.findOrganisationById(
            this.administeredBySchulstrukturknoten,
        );

        if (!orgResult.ok) {
            throw orgResult.error;
        }

        const rolle: Rolle = await rolleRepo.save(this);

        Object.assign(this, rolle);
    }
}
