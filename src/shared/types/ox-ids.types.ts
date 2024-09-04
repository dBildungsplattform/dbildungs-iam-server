import { Flavor } from './flavor.types.js';

declare const oxUserIdSymbol: unique symbol;
export type OXUserID = Flavor<string, typeof oxUserIdSymbol>;

declare const oxContextIdSymbol: unique symbol;
export type OXContextID = Flavor<string, typeof oxContextIdSymbol>;
