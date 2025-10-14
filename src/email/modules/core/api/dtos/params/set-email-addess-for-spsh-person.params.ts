import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SetEmailAddressForSpshPersonParams {
    @IsString()
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The spshPersonId of the person.',
        required: true,
        nullable: false,
    })
    public readonly spshPersonId!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The username of the person.',
        required: true,
        nullable: false,
    })
    public readonly spshUsername!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The first name of the person in spsh.',
        required: true,
        nullable: false,
    })
    public readonly firstName!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The last name of the person in spsh.',
        required: true,
        nullable: false,
    })
    public readonly lastName!: string;

    @IsString()
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The domain Id from the email domain entity to be used.',
        required: true,
        nullable: false,
    })
    public readonly emailDomainId!: string;

    @IsNotEmpty()
    @ApiProperty({
        description: 'The domain Id from the email domain entity to be used.',
        required: true,
        nullable: false,
    })
    public readonly allSchoolDnr!: string[];
}
