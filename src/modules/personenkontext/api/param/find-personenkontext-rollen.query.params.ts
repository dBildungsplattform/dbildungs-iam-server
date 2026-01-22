import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class FindPersonenkontextRollenQueryParams {
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Rolle name used to filter for rollen in personenkontext.',
        required: false,
        nullable: false,
    })
    public readonly rolleName?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: false,
        nullable: false,
    })
    public readonly limit?: number;

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    @ApiProperty({
        description: 'OrganisationIDs to filter rollen',
        required: false,
        nullable: false,
    })
    @Transform(({ value }: TransformFnParams): Array<string> => {
        const arrayValue: Array<unknown> = Array.isArray(value) ? value : [value];
        return arrayValue.map((v: unknown) => {
            if (typeof v !== 'string') {
                return String(v);
            }
            return v;
        });
    })
    public readonly organisationIds?: string[];
}
