import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { RolleEntity } from '../../../persistence/rolle.entity.js';
import { RolleBerechtigungsZuweisungEntity } from '../../../persistence/rolle-berechtigungs-zuweisung.entity.js';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';

@Injectable()
export class RollenBerechtigungsZuweisungRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async findAllRolleBerechtigungsZuweisungByRolle(
        rolle: RolleEntity,
    ): Promise<RolleBerechtigungsZuweisungDo<true>[]> {
        const query: Record<string, unknown> = {};
        query['role'] = { $ilike: rolle.id };
        const result: RolleBerechtigungsZuweisungEntity[] = await this.em.find(
            RolleBerechtigungsZuweisungEntity,
            query,
            { populate: ['rolePermission'] },
        );
        return result.map((rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungEntity) =>
            this.mapper.map(
                rolleBerechtigungsZuweisung,
                RolleBerechtigungsZuweisungEntity,
                RolleBerechtigungsZuweisungDo,
            ),
        );
    }
}
