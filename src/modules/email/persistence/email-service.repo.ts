import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailEntity } from './email.entity.js';
import { Loaded } from '@mikro-orm/postgresql';

/*
    This repo is used to avoid a circle in the relationship EmailGeneratorService <-> EmailRepo.
 */
@Injectable()
export class EmailServiceRepo {
    public constructor(protected readonly em: EntityManager) {}

    public async exists(address: string): Promise<boolean> {
        const emailEntity: Option<Loaded<EmailEntity, never, 'id', never>> = await this.em.findOne(
            EmailEntity,
            { address },
            { fields: ['address'] as const },
        );

        return !!emailEntity;
    }
}
