import { IsNotEmpty, IsObject, IsString } from 'class-validator';

// TODO: Split into params and body?
export class UpdateKeycloakClientParams {
    @IsString()
    @IsNotEmpty()
    public id!: string;

    @IsObject()
    public payload!: object;
}
