/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable import/extensions */
import { QueryOrderMap } from '@mikro-orm/core';
import { SortOrderMap, SortOrder } from '../../../shared/interface/find-options';
import { PersonDo } from '../domain/person.do';
import { PersonEntity } from './person.entity';

export class PersonSortingMapper {
    static mapDOSortOrderToQueryOrder(sort: SortOrderMap<PersonDo<boolean>>): QueryOrderMap<PersonEntity> {
        const queryOrderMap: QueryOrderMap<PersonEntity> = {
            id: sort ? (sort.id ? sort.id : SortOrder.asc) : SortOrder.asc,
            firstName: sort ? (sort.firstName ? sort.firstName : SortOrder.asc) : SortOrder.asc,
            lastName: sort ? (sort.lastName ? sort.lastName : SortOrder.asc) : SortOrder.asc,
            birthDate: sort ? (sort.birthDate ? sort.birthDate : SortOrder.asc) : SortOrder.asc,
        };
        // ehmaliger filter von undefined funktioniert nicht
        // Object.keys(queryOrderMap)
        //     .filter((key) => queryOrderMap[key] === undefined)
        //     .forEach((key) => delete queryOrderMap[key]);
        return queryOrderMap;
    }
}
