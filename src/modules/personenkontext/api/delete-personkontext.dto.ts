import { IsUUID } from 'class-validator';

export class DeletePersonenkontextDto {
    @IsUUID()
    public id!: string;

    public revision!: string;
}
