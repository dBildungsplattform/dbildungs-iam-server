import { Injectable } from '@nestjs/common';
import { PersonRollenZuweisungRepo } from '../persistence/person-rollen-zuweisung.repo.js';
import { PersonRollenZuweisungDo } from './person-rollen-zuweisung.do.js';
import { RolleEntity } from '../../../persistence/rolle.entity.js';
import { RolleBerechtigungsZuweisungDo } from './rolle-berechtigungs-zuweisung.do.js';
import { RollenBerechtigungsZuweisungRepo } from '../persistence/rollen-berechtigungs-zuweisung.repo.js';

@Injectable()
export class RolleService {
    public constructor(
        private readonly personRollenZuweisungRepo: PersonRollenZuweisungRepo,
        private readonly rolleBerechtigungsZuweisungRepo: RollenBerechtigungsZuweisungRepo,
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

    public async getRolleBerechtigungsZuweisungByPersonId(personId: string): Promise<void> {
        const personRollenZuweisungen: PersonRollenZuweisungDo<true>[] = await this.getPersonRollenZuweisung(personId);
        for (const personRollenZuweisung of personRollenZuweisungen) {
            const rolleBerechtigungsZuweisungen: RolleBerechtigungsZuweisungDo<true>[] =
                await this.getRolleBerechtigungsZuweisung(personRollenZuweisung.role);
            rolleBerechtigungsZuweisungen.forEach((rolleBerechtigungsZuweisung: RolleBerechtigungsZuweisungDo<true>) =>
                console.log(rolleBerechtigungsZuweisung),
            );
        }
    }
}
