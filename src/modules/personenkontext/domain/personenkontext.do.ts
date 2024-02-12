import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from './personenkontext.enums.js';

export class PersonenkontextDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    @AutoMap(() => String)
    public id!: Persisted<string, WasPersisted>;

    @AutoMap(() => Date)
    public createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap(() => Date)
    public updatedAt!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public personId!: string;

    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public mandant!: string;

    @AutoMap(() => OrganisationDo)
    public organisation!: OrganisationDo<true>;

    @AutoMap(() => String)
    public rolle!: Rolle;

    @AutoMap(() => String)
    public personenstatus?: Personenstatus;

    @AutoMap(() => String)
    public jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    public sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => Date)
    public loeschungZeitpunkt?: Date;

    @AutoMap()
    public revision!: string;
}
