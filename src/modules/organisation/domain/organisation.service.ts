import { Injectable } from '@nestjs/common';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { DomainError } from '../../../shared/error/index.js';
import { OrganisationDo } from './organisation.do.js';

@Injectable()
export class OrganisationService {
    public constructor(private readonly organisationRepo: OrganisationRepo) {}

    public async createOrganisation(
        organisationDo: OrganisationDo<false>,
    ): Promise<Result<OrganisationDo<true>, DomainError>> {
        const organisation: OrganisationDo<true> = await this.organisationRepo.save(organisationDo);
        return { ok: true, value: organisation };
    }
}
