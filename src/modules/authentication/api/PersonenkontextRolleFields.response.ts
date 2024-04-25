import { ApiProperty } from '@nestjs/swagger';
import { OrganisationID } from '../../../shared/types/index.js';

export class PersonenkontextRolleFieldsResponse {
    @ApiProperty({ type: String })
    public organisationsId: OrganisationID = '';

    @ApiProperty({
        type: Object,
        example: {
            systemrechte: ['systemrecht1', 'systemrecht2'],
            serviceProviderIds: ['serviceProviderId1', 'serviceProviderId2'],
        },
    })
    public rolle: {
        systemrechte: string[];
        serviceProviderIds: string[];
    } = { systemrechte: [], serviceProviderIds: [] };
}
