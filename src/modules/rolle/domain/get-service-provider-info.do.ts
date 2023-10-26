import { AutoMap } from '@automapper/classes';

export class GetServiceProviderInfoDo {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    @AutoMap()
    public id!: string;

    @AutoMap()
    public name!: string;

    @AutoMap()
    public url!: string;
}
