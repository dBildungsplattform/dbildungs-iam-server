import { PersonID, PersonReferrer } from '../../shared/types/aggregate-ids.types.js';

export type PersonIdentifier = {
    personId: PersonID | undefined;
    username: PersonReferrer | undefined;
};
