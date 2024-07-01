import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailAddressEntity } from './email-address.entity.js';

/*
    This repo is used to avoid a circle in the relationship EmailGeneratorService <-> EmailRepo.
 */
@Injectable()
export class EmailServiceRepo {
    public constructor(protected readonly em: EntityManager) {}

    public async existsEmailAddress(address: string): Promise<boolean> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            { address: address },
            {},
        );

        return !!emailAddressEntity;
    }
}
