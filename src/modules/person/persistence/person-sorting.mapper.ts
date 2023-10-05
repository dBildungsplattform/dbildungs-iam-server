/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable import/extensions */
import { QueryOrderMap } from '@mikro-orm/core';
import { SortOrderMap } from '../../../shared/interface/find-options';
import { PersonDo } from '../domain/person.do';
import { PersonEntity } from './person.entity';

export class PersonSortingMapper {
    static mapDOSortOrderToQueryOrder(sort: SortOrderMap<PersonDo<boolean>>): QueryOrderMap<PersonEntity> {
        const queryOrderMap: SortOrderMap<PersonEntity | undefined> = {
            id: sort.id,
            firstName: sort.firstName,
            lastName: sort.lastName,
            birthDate: sort.birthDate,
        };
        Object.keys(queryOrderMap)
            .filter((key) => queryOrderMap[key] === undefined)
            .forEach((key) => delete queryOrderMap[key]);
        return queryOrderMap;
    }
}
