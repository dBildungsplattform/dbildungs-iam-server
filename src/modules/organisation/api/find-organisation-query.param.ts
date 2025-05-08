import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';
import { RollenSystemRecht, RollenSystemRechtTypName } from '../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp, OrganisationsTypName, SortFieldOrganisation } from '../domain/organisation.enums.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';

export class FindOrganisationQueryParams extends PagedQueryParams {
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly kennung?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly searchString?: string;

    @IsEnum(OrganisationsTyp)
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: OrganisationsTyp,
        enumName: OrganisationsTypName,
        default: OrganisationsTyp.SONSTIGE,
    })
    public readonly typ?: OrganisationsTyp;

    @IsOptional()
    @TransformToArray()
    @IsEnum(RollenSystemRecht, { each: true })
    @ArrayUnique()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: RollenSystemRecht,
        enumName: RollenSystemRechtTypName,
        isArray: true,
    })
    public readonly systemrechte: RollenSystemRecht[] = [];

    @IsOptional()
    @TransformToArray()
    @IsEnum(OrganisationsTyp, { each: true })
    @ArrayUnique()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: OrganisationsTyp,
        enumName: OrganisationsTypName,
        isArray: true,
    })
    public readonly excludeTyp?: OrganisationsTyp[];

    @IsOptional()
    @TransformToArray()
    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly administriertVon?: string[];

    @IsOptional()
    @TransformToArray()
    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
        description: 'Liefert die Kind-Organisationen, die den angegebenen IDs zugehörig sind.',
    })
    public readonly zugehoerigZu?: string[];

    @IsOptional()
    @TransformToArray()
    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
        description:
            'Liefert Organisationen mit den angegebenen IDs, selbst wenn andere Filterkriterien nicht zutreffen (ODER-verknüpft mit anderen Kriterien).',
    })
    public readonly organisationIds?: string[];

    @IsOptional()
    @IsEnum(ScopeOrder)
    @ApiProperty({
        enum: ScopeOrder,
        required: false,
        nullable: true,
        description: 'Order to sort by.',
    })
    public readonly sortOrder?: ScopeOrder;

    @IsOptional()
    @IsEnum(SortFieldOrganisation)
    @ApiProperty({
        enum: SortFieldOrganisation,
        required: false,
        nullable: true,
        description: 'Field to sort by.',
    })
    public readonly sortField?: SortFieldOrganisation;
}
