import { AutoMap } from '@automapper/classes';

export class FindPersonenkontextByIdDto {
    @AutoMap()
    public readonly personenkontextId!: string;
}
