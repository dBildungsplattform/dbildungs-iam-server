import { IsNotEmpty, IsString } from 'class-validator';

export class UserRepresentationAttributesDto {
    @IsString()
    @IsNotEmpty()
    public ID_ITSLEARNING!: string;
}
