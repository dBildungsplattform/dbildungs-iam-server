import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class HatSystemrechtBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String, required: true })
    public readonly systemRecht!: string;
}
