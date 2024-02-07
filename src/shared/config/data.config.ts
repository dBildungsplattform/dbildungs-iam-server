import { IsNotEmpty, IsString } from 'class-validator';

export class DataConfig {
    @IsString()
    @IsNotEmpty()
    public readonly ROOT_ORGANISATION_ID!: string;
}
