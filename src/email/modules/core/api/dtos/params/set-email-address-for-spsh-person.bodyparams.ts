import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SetEmailAddressForSpshPersonBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The username of the person.',
        required: true,
        nullable: false,
    })
    public readonly spshUsername!: string;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    @ApiProperty({
        description: 'Array of all school kennungen the person is associated with in spsh.',
        required: true,
        nullable: false,
    })
    public readonly kennungen!: string[];

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
        description: 'The spshServiceProviderId from the email domain entity to be used.',
        required: true,
        nullable: false,
    })
    public readonly spshServiceProviderId!: string;
}
