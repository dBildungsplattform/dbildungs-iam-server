import { AutoMap } from '@automapper/classes';
import { IsNotEmpty } from 'class-validator';

export class DeletePersonenkontextDto {
    @AutoMap()
    @IsNotEmpty()
    public id!: string;

    @AutoMap()
    public revision!: string;
}
