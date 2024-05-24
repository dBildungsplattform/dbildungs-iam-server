import { BaseEvent } from './base-event.js';
import { Organisation } from '../../modules/organisation/domain/organisation.js';

export class DeleteSchuleEvent extends BaseEvent {
    public constructor(public readonly organisation: Organisation<true>) {
        super();
    }
}
