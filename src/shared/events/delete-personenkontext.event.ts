import { BaseEvent } from './base-event.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';

export class DeletePersonenkontextEvent extends BaseEvent {
    public constructor(public readonly personenkontext: Personenkontext<true>) {
        super();
    }
}
