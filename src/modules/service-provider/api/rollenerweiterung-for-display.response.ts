import { ApiProperty } from '@nestjs/swagger';
import { OrganisationID, RolleID, ServiceProviderID } from '../../../shared/types';
import { RollenerweiterungForManageableServiceProvider } from '../domain/service-provider.service';

export class RollenerweiterungForDisplayResponse {
    @ApiProperty()
    public organisation: {
        id: OrganisationID;
        name: string;
        kennung?: string;
    };

    @ApiProperty()
    public rolle: {
        id: RolleID;
        name: string;
    };

    @ApiProperty()
    public serviceProvider: {
        id: ServiceProviderID;
        name: string;
    };

    public constructor(rollenerweiterungWithNames: RollenerweiterungForManageableServiceProvider) {
        this.organisation = rollenerweiterungWithNames.organisation;
        this.rolle = rollenerweiterungWithNames.rolle;
        this.serviceProvider = rollenerweiterungWithNames.serviceProvider;
    }
}
