import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UsernameGeneratorService {
    public constructor(private repository: UserRepository) {}

    public async generateUsername(firstname: string, lastname: string): Promise<string> {
        if (firstname.length == 0) {
            throw new Error('First name not given');
        }
        if (lastname.length == 0) {
            throw new Error('Last name not given');
        }
        const calculatedUsername: string = this.cleanString(firstname)[0] + this.cleanString(lastname);

        return this.repository.getNextAvailableUsername(calculatedUsername);
    }

    private cleanString(name: string): string {
        const lowerCaseInput: string = name.toLowerCase();

        const normalizedString: string = [...lowerCaseInput]
            .map((s: string) => {
                switch (s) {
                    case 'ä':
                        return 'ae';
                    case 'ö':
                        return 'oe';
                    case 'ü':
                        return 'ue';
                    case 'ß':
                        return 'ss';
                    default:
                        return s;
                }
            })
            .join('')
            .normalize('NFKD');
        return normalizedString.replace(new RegExp('[^\u0061-\u007a]', 'g'), '');
    }
}
