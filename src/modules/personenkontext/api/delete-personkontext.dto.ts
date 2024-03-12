import { AutoMap } from '@automapper/classes';
import { IsUUID } from 'class-validator';

export class DeletePersonenkontextDto {
    @AutoMap()
    @IsUUID()
    public id!: string;

    @AutoMap()
    public revision!: string;
}
