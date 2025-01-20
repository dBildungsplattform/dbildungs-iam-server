import { IsNotEmpty, IsString } from 'class-validator';

export class InternalCommunicationApiKeyConfig {
    @IsString()
    @IsNotEmpty()
    public readonly INTERNAL_COMMUNICATION_API_KEY!: string;
}
