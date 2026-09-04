import { ApiProperty } from '@nestjs/swagger';
import { Organisation } from '../domain/organisation.js';
import { ParentInfoResponse } from './parent-info.response.js';

export class ParentsTreeResponse {
    @ApiProperty({ type: [ParentInfoResponse] })
    public readonly parentsTree!: Array<ParentInfoResponse>;

    public constructor(organisation: Array<Organisation<true>>) {
        this.parentsTree = organisation.map((parents: Organisation<true>) => new ParentInfoResponse(parents));
    }
}
