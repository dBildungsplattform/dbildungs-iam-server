import { ApiProperty } from '@nestjs/swagger';
import { OrganisationID } from '../../../shared/types/index.js';

export class PersonenkontextRolleFieldsResponse {
    @ApiProperty({ type: String })
    public organisationsId: OrganisationID = '';

    @ApiProperty({
        type: 'object',
        properties: {
            systemrechte: { type: 'array', items: { type: 'string' } },
            serviceProviderIds: { type: 'array', items: { type: 'string' } },
        },
    })
    public rolle: {
        systemrechte: string[];
        serviceProviderIds: string[];
    } = { systemrechte: [], serviceProviderIds: [] };
}
