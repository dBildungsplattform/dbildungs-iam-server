import { EntityManager } from '@mikro-orm/postgresql';
import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { RepoBase } from '../../shared/types/index.js';
import { PersonEntity } from './person.entity.js';

@Injectable()
export class PersonRepo extends RepoBase<PersonEntity> {
    public constructor(em: EntityManager) {
        super(em);
    }

    public override get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public findByReferrer(referrer: string): Promise<Option<PersonEntity>> {
        return this.em.findOne(this.entityName, { referrer });
    }
}
