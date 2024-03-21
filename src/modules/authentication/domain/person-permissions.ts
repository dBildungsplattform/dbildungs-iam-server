import { RolleID } from '../../../shared/types/index.js';
import { Person } from '../../person/domain/person.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';

export class PersonPermissions {
    private personenkontexts?: Personenkontext<true>[];

    private personInternal: Person<true>;

    public constructor(
        private personenkontextRepo: DBiamPersonenkontextRepo,
        person: Person<true>,
    ) {
        this.personInternal = person;
    }

    public async getRoleIds(): Promise<RolleID[]> {
        if (!this.personenkontexts) {
            this.personenkontexts = await this.personenkontextRepo.findByPerson(this.person.id);
        }
        return this.personenkontexts.map((personenkontext: Personenkontext<true>) => {
            return personenkontext.rolleId;
        });
    }

    public get person(): Person<true> {
        return this.personInternal;
    }
}
