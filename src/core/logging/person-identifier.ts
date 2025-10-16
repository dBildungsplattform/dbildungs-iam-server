import { PersonID, PersonUsername } from '../../shared/types/aggregate-ids.types.js';
import { OXUserID, OXUserName } from '../../shared/types/ox-ids.types.js';
import { Person } from '../../modules/person/domain/person.js';

export type PersonIdentifier = {
    personId: PersonID | undefined;
    username: PersonUsername | undefined;
};

export type PersonEmailIdentifier = {
    personId: PersonID;
    username: PersonUsername;
    oxUserId: OXUserID;
    oxUserName: OXUserName;
    person: Person<true>;
};
