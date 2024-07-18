import { IPersonPermissions } from './person-permissions.interface.js';

export class PersonPermissionsMock implements IPersonPermissions {
    public hasSystemrechteAtOrganisation(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public hasSystemrechtAtOrganisation(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public canModifyPerson(): Promise<boolean> {
        return Promise.resolve(true);
    }
}
