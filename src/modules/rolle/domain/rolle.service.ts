import { Inject, Injectable } from '@nestjs/common';
import { PersonRollenZuweisungRepo } from '../repo/person-rollen-zuweisung.repo.js';
import { PersonRollenZuweisungDo } from './person-rollen-zuweisung.do.js';
import { RolleBerechtigungsZuweisungDo } from './rolle-berechtigungs-zuweisung.do.js';
import { RollenBerechtigungsZuweisungRepo } from '../repo/rollen-berechtigungs-zuweisung.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProviderZugriffDo } from './service-provider-zugriff.do.js';
import { ServiceProviderDo } from './service-provider.do.js';
import { RolleRechtRepo } from '../repo/rolle-recht.repo.js';
import { Rolle } from './rolle.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { GetServiceProviderInfoDo } from './get-service-provider-info.do.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

export interface KeyCloakUser {
    sub: string;
}

@Injectable()
export class RolleService {
    public constructor(
        private readonly personRepo: PersonRepo,
        private readonly personRollenZuweisungRepo: PersonRollenZuweisungRepo,
        private readonly rolleBerechtigungsZuweisungRepo: RollenBerechtigungsZuweisungRepo,
        private readonly rolleRechtRepo: RolleRechtRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async getPersonRollenZuweisung(personId: string): Promise<PersonRollenZuweisungDo<true>[]> {
        return this.personRollenZuweisungRepo.findAllByPersonId(personId);
    }

    public async getRolleBerechtigungsZuweisung(rolle: Rolle): Promise<RolleBerechtigungsZuweisungDo<true>[]> {
        return this.rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle(rolle);
    }

    public async getRolleBerechtigungsZuweisungByPersonId(
        personId: string,
    ): Promise<RolleBerechtigungsZuweisungDo<true>[]> {
        let rolleBerechtigungsZuweisungList: RolleBerechtigungsZuweisungDo<true>[] = [];
        const personRollenZuweisungen: PersonRollenZuweisungDo<true>[] = await this.getPersonRollenZuweisung(personId);
        for (const personRollenZuweisung of personRollenZuweisungen) {
            const rolleBerechtigungsZuweisungen: RolleBerechtigungsZuweisungDo<true>[] =
                await this.getRolleBerechtigungsZuweisung(personRollenZuweisung.rolle);
            rolleBerechtigungsZuweisungList = rolleBerechtigungsZuweisungList.concat(rolleBerechtigungsZuweisungen);
        }
        return rolleBerechtigungsZuweisungList;
    }

    public async getServiceProvider(
        serviceProviderZugriff: ServiceProviderZugriffDo<true>,
    ): Promise<ServiceProviderDo<true>[]> {
        return this.serviceProviderRepo.findAll(serviceProviderZugriff);
    }

    public async getServiceProviderZugriffList(personId: string): Promise<ServiceProviderZugriffDo<true>[]> {
        let serviceProviderZugriffList: ServiceProviderZugriffDo<true>[] = [];
        const rolleBerechtigungsZuweisungList: RolleBerechtigungsZuweisungDo<true>[] =
            await this.getRolleBerechtigungsZuweisungByPersonId(personId);
        for (const rolleBerechtigungsZuweisung of rolleBerechtigungsZuweisungList) {
            const serviceProviderForRolleBerechtigungsZuweisung: ServiceProviderZugriffDo<true>[] =
                await this.rolleRechtRepo.findAllServiceProviderZugriff(rolleBerechtigungsZuweisung);
            serviceProviderZugriffList = serviceProviderZugriffList.concat(
                serviceProviderForRolleBerechtigungsZuweisung,
            );
        }
        return serviceProviderZugriffList;
    }

    public async getAvailableServiceProviders(personId: string): Promise<ServiceProviderDo<true>[]> {
        const serviceProviderZugriffList: ServiceProviderZugriffDo<true>[] =
            await this.getServiceProviderZugriffList(personId);
        let serviceProviderList: ServiceProviderDo<true>[] = [];
        for (const serviceProviderZugriff of serviceProviderZugriffList) {
            const serviceProviderForServiceProviderZugriff: ServiceProviderDo<true>[] =
                await this.getServiceProvider(serviceProviderZugriff);
            serviceProviderList = serviceProviderList.concat(serviceProviderForServiceProviderZugriff);
        }
        return serviceProviderList;
    }

    public async getAvailableServiceProvidersByUserSub(keycloakSub: string): Promise<ServiceProviderDo<true>[]> {
        return this.personRepo.findByKeycloakUserId(keycloakSub).then((person: Option<PersonDo<true>>) => {
            if (person) {
                return this.getAvailableServiceProviders(person.id);
            }
            return [];
        });
    }

    private convertServiceProviderDoList(serviceProviderDoList: ServiceProviderDo<true>[]): GetServiceProviderInfoDo[] {
        return serviceProviderDoList.map((serviceProviderDo: ServiceProviderDo<true>) =>
            this.mapper.map(serviceProviderDo, ServiceProviderDo, GetServiceProviderInfoDo),
        );
    }

    public async getServiceProviderInfoListByUserSub(keycloakSub: string): Promise<GetServiceProviderInfoDo[]> {
        const serviceProviderZugriffDoList: ServiceProviderDo<true>[] =
            await this.getAvailableServiceProvidersByUserSub(keycloakSub);
        return this.convertServiceProviderDoList(serviceProviderZugriffDoList);
    }

    public hasKeycloakUserSub(obj: unknown): obj is KeyCloakUser {
        return (obj as KeyCloakUser)?.sub !== undefined;
    }
}
