import { ImportExecutedEvent } from './import-executed.event.js';
import { KafkaEvent } from './kafka-event.js';

export class KafkaImportExecutedEvent extends ImportExecutedEvent implements KafkaEvent {
    public get kafkaKey(): string {
        return this.importVorgangId;
    }
}
