import { Injectable } from '@nestjs/common';
import { EmailAddressRepo } from '../persistence/email-address.repo';

@Injectable()
export class DeleteEmailsAddressesForSpshPersonService {
    public constructor(private readonly emailAddressRepo: EmailAddressRepo) {}
    public async deleteEmailAddressesForSpshPerson(spshPersonId: string): Promise<void> {
        await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
    }
}
