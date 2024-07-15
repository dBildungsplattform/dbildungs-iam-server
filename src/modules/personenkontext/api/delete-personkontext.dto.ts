import { AutoMap } from '@automapper/classes';
import { IsUUID } from 'class-validator';

export class DeletePersonenkontextDto {
    @IsUUID()
    public id!: string;

    public revision!: string;
}
