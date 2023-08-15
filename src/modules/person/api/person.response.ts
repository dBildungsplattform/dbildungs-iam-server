import { AutoMap } from '@automapper/classes';

export interface NameOfPerson {
    firstName: string;
    lastName: string;
    initialsFirstName?: string;
    initialsLastName?: string;
    nameSortIndex?: string;
}
export class PersonResponse {
    @AutoMap()
    public id!: string;

    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public client: string = '';

    @AutoMap()
    public name: NameOfPerson = {
        firstName: '',
        lastName: '',
        initialsFirstName: '',
        initialsLastName: '',
        nameSortIndex: '',
    };
}
