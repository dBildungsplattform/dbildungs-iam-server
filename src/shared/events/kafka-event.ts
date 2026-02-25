/* v8 ignore file @preserv */
// interfaces can not be covered by v8, since the code does not exist at runtime
export interface KafkaEvent {
    kafkaKey: string | undefined;
}
