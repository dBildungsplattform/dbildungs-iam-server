import { Module } from '@nestjs/common';
import { ImportWorkflowFactory } from './domain/import-workflow.factory.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';

@Module({
    imports: [RolleModule, OrganisationModule],
    providers: [ImportWorkflowFactory],
    exports: [ImportWorkflowFactory],
})
export class ImportModule {}
