import { Injectable } from '@nestjs/common';

import { EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { RolleHatPersonenkontexteError } from './rolle-hat-personenkontexte.error.js';
import { Rolle } from './rolle.js';

@Injectable()
export class RolleDeleteService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    public async delete(
        id: RolleID,
        permissions: IPersonPermissions,
    ): Promise<Option<EntityNotFoundError | MissingPermissionsError | RolleHatPersonenkontexteError>> {
        const authorizedRole: Result<
            Rolle<true>,
            EntityNotFoundError | MissingPermissionsError
        > = await this.rolleRepo.findByIdAuthorized(id, permissions);
        if (!authorizedRole.ok) {
            return authorizedRole.error;
        }

        const hasExistingPersonenkontexte: boolean = await this.personenkontextRepo.existsByRolleId(id);
        if (hasExistingPersonenkontexte) {
            return new RolleHatPersonenkontexteError();
        }

        await this.rollenerweiterungRepo.deleteByRolleId(id);

        return this.rolleRepo.deleteInternal(id);
    }
}
