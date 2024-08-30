import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { PagedQueryParams } from '../../../../shared/paging/index.js';
import { PersonID } from '../../../../shared/types/aggregate-ids.types.js';

export class PersonenuebersichtQueryParams extends PagedQueryParams {

    @ApiProperty({
        description: 'An array of IDs for the persons.',
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    public readonly personIds?: PersonID[];
}
