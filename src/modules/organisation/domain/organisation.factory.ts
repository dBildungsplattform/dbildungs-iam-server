import { Injectable } from '@nestjs/common';

import { OrganisationsTyp, Traegerschaft } from './organisation.enums.js';
import { DomainError } from '../../../shared/error/index.js';
import { Organisation } from './organisation.js';
import { OrgRecService } from './org-rec.service.js';

@Injectable()
export class OrganisationFactory {
    public constructor(private readonly orgRecService: OrgRecService) {}

    public construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        administriertVon?: string,
        zugehoerigZu?: string,
        kennung?: string,
        name?: string,
        namensergaenzung?: string,
        kuerzel?: string,
        typ?: OrganisationsTyp,
        traegerschaft?: Traegerschaft,
        emailDomain?: string,
    ): Organisation<WasPersisted> {
        return Organisation.construct(
            this.orgRecService,
            id,
            createdAt,
            updatedAt,
            administriertVon,
            zugehoerigZu,
            kennung,
            name,
            namensergaenzung,
            kuerzel,
            typ,
            traegerschaft,
            emailDomain,
        );
    }

    public createNew(
        administriertVon?: string,
        zugehoerigZu?: string,
        kennung?: string,
        name?: string,
        namensergaenzung?: string,
        kuerzel?: string,
        typ?: OrganisationsTyp,
        traegerschaft?: Traegerschaft,
        emailDomain?: string,
    ): Organisation<false> | DomainError {
        return Organisation.createNew(
            this.orgRecService,
            administriertVon,
            zugehoerigZu,
            kennung,
            name,
            namensergaenzung,
            kuerzel,
            typ,
            traegerschaft,
            emailDomain,
        );
    }
}
