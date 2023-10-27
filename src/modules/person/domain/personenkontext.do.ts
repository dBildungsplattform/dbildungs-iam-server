import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { Jahrgangsstufe, Personenstatus, Rolle } from './personenkontext.enums.js';

export class PersonenkontextDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    @AutoMap(() => Date)
    public createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap(() => Date)
    public updatedAt!: Persisted<Date, WasPersisted>;

    @AutoMap(() => String)
    public id!: Persisted<string, WasPersisted>;

    @AutoMap()
    public personId!: string;

    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public mandant!: string;

    @AutoMap()
    public organisation!: OrganisationDo<true>;

    @AutoMap()
    public rolle!: Rolle;

    @AutoMap()
    public personenstatus?: Personenstatus;

    @AutoMap()
    public jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap()
    public sichtfreigabe?: boolean = false;

    @AutoMap()
    public loeschungZeitpunkt?: Date;

    @AutoMap()
    public revision!: string;
}
