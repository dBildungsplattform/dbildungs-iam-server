import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class HatSystemrechtBodyParams {
    @IsNotEmpty()
    @ApiProperty({ type: String, required: true })
    public readonly systemRecht!: string;
}
