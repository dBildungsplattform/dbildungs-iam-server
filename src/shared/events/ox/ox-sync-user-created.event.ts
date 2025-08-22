import { OxUserChangedEvent } from './ox-user-changed.event.js';

/**
 * This event should only be published after creation of an OxUser-account and if a new OxSync should be triggered afterward.
 */
export class OxSyncUserCreatedEvent extends OxUserChangedEvent {}
