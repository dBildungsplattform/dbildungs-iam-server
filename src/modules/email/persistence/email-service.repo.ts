import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Loaded } from '@mikro-orm/postgresql';
import { EmailAddressEntity } from './email-address.entity.js';

/*
    This repo is used to avoid a circle in the relationship EmailGeneratorService <-> EmailRepo.
 */
@Injectable()
export class EmailServiceRepo {
    public constructor(protected readonly em: EntityManager) {}

    public async existsEmailAddress(address: string): Promise<boolean> {
        const emailAddressEntity: Option<Loaded<EmailAddressEntity, never, 'id', never>> = await this.em.findOne(
            EmailAddressEntity,
            { address },
            { fields: ['address'] as const },
        );

        return !!emailAddressEntity;
    }
}
