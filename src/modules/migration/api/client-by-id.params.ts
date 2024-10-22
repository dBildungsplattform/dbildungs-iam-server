import { IsNotEmpty, IsString } from 'class-validator';

export class ClientByIdParams {
    @IsString()
    @IsNotEmpty()
    public id!: string;
}
