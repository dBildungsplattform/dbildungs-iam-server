import { AutoMap } from '@automapper/classes';

export class PersonGeburtDto {
    @AutoMap()
    public geburtsort?: string;

    @AutoMap(() => Date)
    public datum?: Date;
}
