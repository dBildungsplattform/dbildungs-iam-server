import { AutoMap } from '@automapper/classes';
import { PagedDto } from '../../../shared/paging/index.js';
import { SichtfreigabeType } from '../../person-kontext/domain/personenkontext.enums.js';

export class FindPersonendatensatzDto extends PagedDto {
    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public familienname?: string;

    @AutoMap()
    public vorname?: string;

    @AutoMap(() => String)
    public sichtfreigabe!: SichtfreigabeType;
}
