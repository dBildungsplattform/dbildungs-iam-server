import { Injectable } from '@nestjs/common';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { DomainError, IdWasSentWithPayload } from '../../../shared/error/index.js';
import { OrganisationDo } from './organisation.do.js';

@Injectable()
export class OrganisationService {
    public constructor(private readonly organisationRepo: OrganisationRepo) {}

    public async createOrganisation(
        organisationDo: OrganisationDo<false>,
    ): Promise<Result<OrganisationDo<true>, DomainError>> {
        if (organisationDo.id) {
            return {
                ok: false,
                error: new IdWasSentWithPayload(
                    `zu erstellende Organisation darf keien ID ${organisationDo.id} in der Payload haben`,
                ),
            };
        }
        const organisation: OrganisationDo<true> = await this.organisationRepo.save(organisationDo);
        return { ok: true, value: organisation };
    }
}
