import { ApiProperty } from '@nestjs/swagger';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';;
import {
    ServiceProviderKategorie,
    ServiceProviderKategorieTypName,
    ServiceProviderMerkmal,
    ServiceProviderMerkmalTypName,
} from '../domain/service-provider.enum.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { OrganisationRefResponse } from './organisation-ref.response.js';
import { RolleRefResponse } from './rolle-ref.response.js';
import { RollenerweiterungForManageableServiceProviderResponse } from './RollenerweiterungForManageableServiceProviderResponse.js';

export class ManageableServiceProviderListEntryResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public name: string;

    @ApiProperty({ type: OrganisationRefResponse })
    public administrationsebene: OrganisationRefResponse;

    @ApiProperty({ enum: ServiceProviderKategorie, enumName: ServiceProviderKategorieTypName })
    public kategorie: ServiceProviderKategorie;

    @ApiProperty()
    public requires2fa: boolean;

    @ApiProperty({ enum: ServiceProviderMerkmal, enumName: ServiceProviderMerkmalTypName, isArray: true })
    public merkmale: ServiceProviderMerkmal[];

    @ApiProperty({ type: RollenerweiterungForManageableServiceProviderResponse, isArray: true })
    public rollenerweiterungen: RollenerweiterungForManageableServiceProviderResponse[];

    @ApiProperty({ type: RolleRefResponse, isArray: true })
    public rollen: RolleRefResponse[];

    public constructor(
        serviceProvider: ServiceProvider<true>,
        organisation: Organisation<true>,
        rollen: Rolle<true>[],
        rollenerweiterungen: RollenerweiterungForManageableServiceProviderResponse[],
    ) {
        this.id = serviceProvider.id;
        this.name = serviceProvider.name;
        this.administrationsebene = {
            id: organisation.id,
            name: organisation.name ?? '',
            kennung: organisation.kennung,
        };
        this.kategorie = serviceProvider.kategorie;
        this.requires2fa = serviceProvider.requires2fa;
        this.merkmale = serviceProvider.merkmale;
        this.rollenerweiterungen = rollenerweiterungen;
        this.rollen = rollen.map((r: Rolle<true>) => ({ id: r.id, name: r.name }));
    }
}
