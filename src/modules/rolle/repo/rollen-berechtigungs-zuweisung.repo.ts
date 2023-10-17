import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleDo } from '../domain/rolle.do.js';

@Injectable()
export class RollenBerechtigungsZuweisungRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async findAllRolleBerechtigungsZuweisungByRolle(
        rolle: RolleDo<boolean>,
    ): Promise<RolleBerechtigungsZuweisungDo<true>[]> {
        const query: Record<string, unknown> = {};
        query['rolle'] = { $ilike: rolle.id };
        const result: RolleBerechtigungsZuweisungEntity[] = await this.em.find(
            RolleBerechtigungsZuweisungEntity,
            query,
            { populate: ['rolleRecht'] },
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
