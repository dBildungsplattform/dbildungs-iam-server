import { Injectable } from '@nestjs/common';

import { DomainError } from '../../../shared/error/domain.error.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { Rolle } from './rolle.js';

@Injectable()
export class RolleDeleteService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    public async delete(id: RolleID, permissions: PersonPermissions): Promise<Option<DomainError>> {
        const authorizedRole: Result<Rolle<true>, DomainError> = await this.rolleRepo.findByIdAuthorized(
            id,
            permissions,
        );
        if (!authorizedRole.ok) {
            return authorizedRole.error;
        }

        await this.rollenerweiterungRepo.deleteByRolleId(id);

        return this.rolleRepo.deleteInternal(id);
    }
}
