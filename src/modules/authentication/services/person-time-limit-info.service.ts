import { Injectable } from '@nestjs/common';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonTimeLimitInfo } from '../domain/person-time-limit-info.js';
import { DBiamPersonenkontextService } from '../../personenkontext/domain/dbiam-personenkontext.service.js';
import { TimeLimitOccasion } from '../domain/time-limit-occasion.enums.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';

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
        if (
            !person.personalnummer &&
            (await this.dBiamPersonenkontextService.isPersonalnummerRequiredForAnyPersonenkontextForPerson(person.id))
        ) {
            const kopersKontext: Personenkontext<true> | undefined =
                await this.dBiamPersonenkontextService.getKopersPersonenkontext(person.id);
            if (kopersKontext) {
                const kopersdeadline: Date = new Date(kopersKontext.createdAt);
                kopersdeadline.setDate(kopersdeadline.getDate() + 56);
                lockInfos.push(new PersonTimeLimitInfo(TimeLimitOccasion.KOPERS, kopersdeadline));
            }
        }

        return lockInfos;
    }
}
