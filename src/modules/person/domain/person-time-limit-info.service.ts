import { Injectable } from '@nestjs/common';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextService } from '../../personenkontext/domain/dbiam-personenkontext.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonTimeLimitInfo } from './person-time-limit-info.js';
import { TimeLimitOccasion } from './time-limit-occasion.enums.js';
import { KOPERS_DEADLINE_IN_DAYS } from './person-time-limit.js';

@Injectable()
export default class PersonTimeLimitService {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly dBiamPersonenkontextService: DBiamPersonenkontextService,
    ) {}

    public async getPersonTimeLimitInfo(personId: string): Promise<PersonTimeLimitInfo[]> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return [];
        }
        const lockInfos: PersonTimeLimitInfo[] = [];
        if (!person.personalnummer) {
            const kopersKontexte: Personenkontext<true>[] =
                await this.dBiamPersonenkontextService.getKopersPersonenkontexte(person.id);
            if (kopersKontexte.length > 0) {
                const earliestKopersKontext: Personenkontext<true> = kopersKontexte.reduce(
                    (prev: Personenkontext<true>, current: Personenkontext<true>) =>
                        prev.createdAt < current.createdAt ? prev : current,
                    kopersKontexte[0]!,
                );
                const kopersdeadline: Date = new Date(earliestKopersKontext.createdAt);
                kopersdeadline.setDate(kopersdeadline.getDate() + KOPERS_DEADLINE_IN_DAYS);
                lockInfos.push(new PersonTimeLimitInfo(TimeLimitOccasion.KOPERS, kopersdeadline));
            }
        }
        return lockInfos;
    }
}
