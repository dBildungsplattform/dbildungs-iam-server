import { Injectable } from '@nestjs/common';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextService } from '../../personenkontext/domain/dbiam-personenkontext.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonTimeLimitInfo } from './person-time-limit-info.js';
import { TimeLimitOccasion } from './time-limit-occasion.enums.js';
import { KONTEXT_EXPIRES_IN_DAYS, KOPERS_DEADLINE_IN_DAYS, NO_KONTEXTE_DEADLINE_IN_DAYS } from './person-time-limit.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';

@Injectable()
export default class PersonTimeLimitService {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly dBiamPersonenkontextService: DBiamPersonenkontextService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
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

        if (person.orgUnassignmentDate) {
            const noKontexteDeadline: Date = new Date(person.orgUnassignmentDate);
            noKontexteDeadline.setDate(noKontexteDeadline.getDate() + NO_KONTEXTE_DEADLINE_IN_DAYS);
            lockInfos.push(new PersonTimeLimitInfo(TimeLimitOccasion.NO_KONTEXTE, noKontexteDeadline));
        }

        const personenKontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);

        const timeLimitInfosPromises: Promise<PersonTimeLimitInfo | null>[] = personenKontexte.map(
            async (personenKontext: Personenkontext<true>) => {
                if (personenKontext.befristung != null) {
                    const personenKontextExpires: Date = new Date(personenKontext.befristung);

                    const currentDate: Date = new Date();
                    const timeDiffMs: number = personenKontextExpires.getTime() - currentDate.getTime();
                    const timeDiffDays: number = Math.floor(timeDiffMs / (1000 * 3600 * 24));
                    if (timeDiffDays <= KONTEXT_EXPIRES_IN_DAYS) {
                        const organisation: Option<Organisation<true>> = await personenKontext.getOrganisation();
                        const rolle: Option<Rolle<true>> = await personenKontext.getRolle();

                        return new PersonTimeLimitInfo(
                            TimeLimitOccasion.PERSONENKONTEXT_EXPIRES,
                            personenKontextExpires,
                            organisation?.name,
                            rolle?.name,
                        );
                    }
                }
                return null;
            },
        );

        const timeLimitInfos: (PersonTimeLimitInfo | null)[] = await Promise.all(timeLimitInfosPromises);
        const validTimeLimitInfos: PersonTimeLimitInfo[] = timeLimitInfos.filter(
            (info: PersonTimeLimitInfo | null): info is PersonTimeLimitInfo => info !== null,
        );
        return lockInfos.concat(validTimeLimitInfos);
    }
}
