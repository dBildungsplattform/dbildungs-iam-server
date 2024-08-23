import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserRepresentationAttributesDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    public ID_ITSLEARNING?: string;
}
