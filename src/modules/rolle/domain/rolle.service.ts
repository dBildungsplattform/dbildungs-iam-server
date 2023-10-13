import { Injectable } from '@nestjs/common';
import { PersonRollenZuweisungRepo } from '../persistence/person-rollen-zuweisung.repo.js';
import { PersonRollenZuweisungDo } from './person-rollen-zuweisung.do.js';
import { RolleEntity } from '../persistence/rolle.entity.js';
import { RolleBerechtigungsZuweisungDo } from './rolle-berechtigungs-zuweisung.do.js';
import { RollenBerechtigungsZuweisungRepo } from '../persistence/rollen-berechtigungs-zuweisung.repo.js';
import { RolleRechtDo } from './rolle-recht.do.js';
import { ServiceProviderRepo } from '../persistence/service-provider.repo.js';
import { ServiceProviderZugriffDo } from './service-provider-zugriff.do.js';
import { ServiceProviderDo } from './service-provider.do.js';
import { RolleRechtRepo } from '../persistence/rolle-recht.repo.js';

@Injectable()
export class RolleService {
    public constructor(
        private readonly personRollenZuweisungRepo: PersonRollenZuweisungRepo,
        private readonly rolleBerechtigungsZuweisungRepo: RollenBerechtigungsZuweisungRepo,
        private readonly rolleRechtRepo: RolleRechtRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    public async getPersonRollenZuweisung(personId: string): Promise<PersonRollenZuweisungDo<true>[]> {
        const result: PersonRollenZuweisungDo<true>[] = await this.personRollenZuweisungRepo.findAllByPersonId(
            personId,
        );
        return result;
    }

    public async getRolleBerechtigungsZuweisung(rolle: RolleEntity): Promise<RolleBerechtigungsZuweisungDo<true>[]> {
        const result: RolleBerechtigungsZuweisungDo<true>[] =
            await this.rolleBerechtigungsZuweisungRepo.findAllRolleBerechtigungsZuweisungByRolle(rolle);
        return result;
    }

    public async getRolleBerechtigungsZuweisungByPersonId(
        personId: string,
    ): Promise<RolleBerechtigungsZuweisungDo<true>[]> {
        let rolleBerechtigungsZuweisungList: RolleBerechtigungsZuweisungDo<true>[] = [];
        const personRollenZuweisungen: PersonRollenZuweisungDo<true>[] = await this.getPersonRollenZuweisung(personId);
        for (const personRollenZuweisung of personRollenZuweisungen) {
            const rolleBerechtigungsZuweisungen: RolleBerechtigungsZuweisungDo<true>[] =
                await this.getRolleBerechtigungsZuweisung(personRollenZuweisung.role);
            rolleBerechtigungsZuweisungList = rolleBerechtigungsZuweisungList.concat(rolleBerechtigungsZuweisungen);
        }
        return rolleBerechtigungsZuweisungList;
    }

    public async getRolePermissionsByPersonId(personId: string): Promise<RolleRechtDo<true>[]> {
        const rolleRechtList: RolleRechtDo<true>[] = [];
        const rolleBerechtigungsZuweisungList: RolleBerechtigungsZuweisungDo<true>[] =
            await this.getRolleBerechtigungsZuweisungByPersonId(personId);
        rolleBerechtigungsZuweisungList.forEach((rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true>) => {
            rolleRechtList.push(rolleBerechtigungsZuweisung.rolePermission);
        });
        return rolleRechtList;
    }

    public async getServiceProviderZugriffList(personId: string): Promise<ServiceProviderZugriffDo<true>[]> {
        let serviceProviderZugriffList: ServiceProviderZugriffDo<true>[] = [];
        const rolleBerechtigungsZuweisungList: RolleBerechtigungsZuweisungDo<true>[] =
            await this.getRolleBerechtigungsZuweisungByPersonId(personId);
        for (const rolleBerechtigungsZuweisung of rolleBerechtigungsZuweisungList) {
            const serviceProviderForRolleBerechtigungsZuweisung: ServiceProviderZugriffDo<true>[] =
                await this.rolleRechtRepo.findAllServiceProvider(rolleBerechtigungsZuweisung);
            serviceProviderZugriffList = serviceProviderZugriffList.concat(
                serviceProviderForRolleBerechtigungsZuweisung,
            );
        }
        return serviceProviderZugriffList;
    }

    public async getServiceProvider(
        serviceProviderZugriff: ServiceProviderZugriffDo<true>,
    ): Promise<ServiceProviderDo<true>[]> {
        return this.serviceProviderRepo.findAll(serviceProviderZugriff);
    }

    public async getAvailableServiceProviders(personId: string): Promise<ServiceProviderDo<true>[]> {
        const serviceProviderZugriffList: ServiceProviderZugriffDo<true>[] = await this.getServiceProviderZugriffList(
            personId,
        );
        let serviceProviderList: ServiceProviderDo<true>[] = [];
        for (const serviceProviderZugriff of serviceProviderZugriffList) {
            const serviceProviderForServiceProviderZugriff: ServiceProviderDo<true>[] = await this.getServiceProvider(
                serviceProviderZugriff,
            );
            serviceProviderList = serviceProviderList.concat(serviceProviderForServiceProviderZugriff);
        }
        return serviceProviderList;
    }
}
