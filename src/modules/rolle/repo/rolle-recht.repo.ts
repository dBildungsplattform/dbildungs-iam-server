import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleRechtEntity } from '../entity/rolle-recht.entity.js';
import { RolleRechtDo } from '../domain/rolle-recht.do.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';

@Injectable()
export class RolleRechtRepo {
    public constructor(
        private readonly em: EntityManager,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async findAllRolleRecht(
        rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<boolean>,
    ): Promise<RolleRechtDo<boolean>[]> {
        const query: Record<string, unknown> = {};
        if (rolleBerechtigungsZuweisung.rolleRecht.id) {
            query['id'] = { $ilike: rolleBerechtigungsZuweisung.rolleRecht.id };
        }
        const result: RolleRechtEntity[] = await this.em.find(RolleRechtEntity, query);
        return result.map((rolleRecht: RolleRechtEntity) =>
            this.mapper.map(rolleRecht, RolleRechtEntity, RolleRechtDo),
        );
    }

    public async findAllServiceProviderZugriff(
        rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<boolean>,
    ): Promise<ServiceProviderZugriffDo<boolean>[]> {
        const query: Record<string, unknown> = {};
        if (rolleBerechtigungsZuweisung.rolleRecht.id) {
            query['id'] = { $ilike: rolleBerechtigungsZuweisung.rolleRecht.id };
        }
        const result: ServiceProviderZugriffEntity[] = await this.em.find(ServiceProviderZugriffEntity, query);
        return result.map((serviceProviderZugriff: ServiceProviderZugriffEntity) =>
            this.mapper.map(serviceProviderZugriff, ServiceProviderZugriffEntity, ServiceProviderZugriffDo),
        );
    }
}
