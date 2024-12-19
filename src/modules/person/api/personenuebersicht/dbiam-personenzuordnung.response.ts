import { ApiProperty } from '@nestjs/swagger';
import { RolleID } from '../../../../shared/types/index.js';
import { Personenkontext } from '../../../personenkontext/domain/personenkontext.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../../organisation/domain/organisation.do.js';
import { OrganisationsTyp, OrganisationsTypName } from '../../../organisation/domain/organisation.enums.js';
import { RollenArt, RollenArtTypName, RollenMerkmal, RollenMerkmalTypName } from '../../../rolle/domain/rolle.enums.js';

export class DBiamPersonenzuordnungResponse {
    @ApiProperty({ type: String })
    public readonly sskId: string;

    @ApiProperty({ type: String })
    public readonly rolleId: RolleID;

    @ApiProperty({ type: String })
    public readonly sskName: string;

    @ApiProperty({ type: String })
    public readonly sskDstNr: string;

    @ApiProperty({ type: String })
    public readonly rolle: string;

    @ApiProperty({ enum: RollenArt, enumName: RollenArtTypName, nullable: false })
    public readonly rollenArt: RollenArt;

    @ApiProperty({ type: String })
    public readonly administriertVon?: string;

    @ApiProperty({ enum: OrganisationsTyp, enumName: OrganisationsTypName, nullable: true })
    public readonly typ?: OrganisationsTyp;

    @ApiProperty({ type: Boolean })
    public readonly editable: boolean;

    @ApiProperty({ type: Date })
    public readonly befristung?: Date;

    @ApiProperty({ enum: RollenMerkmal, enumName: RollenMerkmalTypName, nullable: true })
    public readonly merkmale?: RollenMerkmal[];

    public constructor(
        personenkontext: Personenkontext<true>,
        organisation: OrganisationDo<true>,
        rolle: Rolle<true>,
        editable: boolean,
    ) {
        //use Organisation Aggregate as soon as there is one
        this.sskId = personenkontext.organisationId;
        this.rolleId = personenkontext.rolleId;
        this.sskName = organisation.name!;
        this.sskDstNr = organisation.kennung!;
        this.rolle = rolle.name;
        this.rollenArt = rolle.rollenart;
        this.administriertVon = organisation.administriertVon;
        this.typ = organisation.typ;
        this.editable = editable;
        this.merkmale = rolle.merkmale;
        this.befristung = personenkontext.befristung;
    }
}
