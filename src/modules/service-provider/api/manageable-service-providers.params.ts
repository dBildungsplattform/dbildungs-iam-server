/* v8 ignore file @preserv */
// apparently v8 does not cover empty classes like this one, even though they are used in tests, so we have to ignore this file for coverage purposes.
// is this class necessary or should we remove it? There are more like this.
import { PagedQueryParams } from '../../../shared/paging/index.js';

export class ManageableServiceProvidersParams extends PagedQueryParams {}
