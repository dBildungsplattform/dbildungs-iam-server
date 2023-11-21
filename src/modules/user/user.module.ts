import { Module } from '@nestjs/common';
import { UsernameGeneratorService } from './username-generator.service.js';

@Module({ providers: [UsernameGeneratorService] })
export class UserModule {}
