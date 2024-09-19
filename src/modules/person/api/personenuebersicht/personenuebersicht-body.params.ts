import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PagedQueryParams } from '../../../../shared/paging/index.js';
import { PersonID } from '../../../../shared/types/aggregate-ids.types.js';

export class PersonenuebersichtBodyParams extends PagedQueryParams {
    @ApiProperty({
        description: 'An array of IDs for the persons.',
        type: [String],
    })
    @IsString({ each: true })
    public readonly personIds?: PersonID[];
}
