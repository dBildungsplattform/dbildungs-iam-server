import { AutoMap } from '@automapper/classes';

export abstract class PagedDto {
    @AutoMap()
    public readonly offset?: number;

    @AutoMap()
    public readonly limit?: number;
}
