import { ApiProperty } from '@nestjs/swagger';

import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import {
    ServiceProviderKategorie,
    ServiceProviderKategorieTypName,
    ServiceProviderMerkmal,
    ServiceProviderMerkmalTypName,
} from '../domain/service-provider.enum.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { RollenerweiterungForManageableServiceProvider } from '../domain/service-provider.service.js';
import { RollenerweiterungForDisplayResponse } from './rollenerweiterung-for-display.response.js';

export class ManageableServiceProviderResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public name: string;

    @ApiProperty()
    public administrationsebene: { id: string; name: string; kennung?: string };

    @ApiProperty({ enum: ServiceProviderKategorie, enumName: ServiceProviderKategorieTypName })
    public kategorie: ServiceProviderKategorie;

    @ApiProperty()
    public requires2fa: boolean;

    @ApiProperty({ enum: ServiceProviderMerkmal, enumName: ServiceProviderMerkmalTypName, isArray: true })
    public merkmale: ServiceProviderMerkmal[];

    @ApiProperty({ type: [RollenerweiterungForDisplayResponse], isArray: true })
    public rollenerweiterungen: RollenerweiterungForDisplayResponse[];

    @ApiProperty()
    public rollen: { id: string; name: string }[];

    public constructor(
        serviceProvider: ServiceProvider<true>,
        organisation: Organisation<true>,
        rollen: Rolle<true>[],
        rollenerweiterungen: RollenerweiterungForManageableServiceProvider[],
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
        this.rollenerweiterungen = rollenerweiterungen.map(
            (re: RollenerweiterungForManageableServiceProvider) => new RollenerweiterungForDisplayResponse(re),
        );
        this.rollen = rollen.map((r: Rolle<true>) => ({ id: r.id, name: r.name }));
    }
}
