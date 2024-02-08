import { AutoMap } from '@automapper/classes';
import { PagedDto } from '../../../shared/paging/paged.dto.js';
import { Personenstatus, Rolle, SichtfreigabeType } from '../../person/domain/personenkontext.enums.js';

export class FindPersonenkontextDto extends PagedDto {
    @AutoMap()
    public personId?: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap(() => String)
    public readonly rolle?: Rolle;

    @AutoMap(() => String)
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;
}
