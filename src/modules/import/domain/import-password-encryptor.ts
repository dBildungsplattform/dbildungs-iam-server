import { Injectable } from '@nestjs/common';
import { Cipher, createCipheriv, createDecipheriv, Encoding, randomBytes, scrypt } from 'crypto';
import { ImportConfig } from '../../../shared/config/import.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import { ImportDomainError } from './import-domain.error.js';

@Injectable()
export class ImportPasswordEncryptor {
    private PASSPHRASE_SECRET!: string;

    private PASSPHRASE_SALT!: string;

    private readonly ALGORITHM: string = 'aes-256-ctr';

    private readonly INPUT_ENCODING: Encoding = 'utf8';

    private readonly OUTPUT_ENCODING: Encoding = 'hex';

    public constructor(private readonly config: ConfigService<ServerConfig>) {
        this.PASSPHRASE_SECRET = this.config.getOrThrow<ImportConfig>('IMPORT').PASSPHRASE_SECRET;
        this.PASSPHRASE_SALT = this.config.getOrThrow<ImportConfig>('IMPORT').PASSPHRASE_SALT;
    }

    public async encryptPassword(password: string): Promise<string> {
        const iv: Buffer = randomBytes(16);

        const key: Buffer = await this.generateKey();
        const cipher: Cipher = createCipheriv(this.ALGORITHM, key, iv);

        const encryptedPassword: string =
            cipher.update(password, this.INPUT_ENCODING, this.OUTPUT_ENCODING) + cipher.final(this.OUTPUT_ENCODING);
        const ivString: string = iv.toString(this.OUTPUT_ENCODING);

        return [encryptedPassword, ivString].join('|');
    }

    public async decryptPassword(encryptedPasswordData: string, importvorgangId: string): Promise<string> {
        const [encryptedPassword, iv]: string[] = encryptedPasswordData.split('|');

        if (!iv) {
            throw new ImportDomainError('iv for decryption not found', importvorgangId);
        }
        const key: Buffer = await this.generateKey();
        const decipher: Cipher = createDecipheriv(this.ALGORITHM, key, Buffer.from(iv, this.OUTPUT_ENCODING));

        if (!encryptedPassword) {
            throw new ImportDomainError('encryptedPassword for decryption not found', importvorgangId);
        }
        const password: string =
            decipher.update(encryptedPassword, this.OUTPUT_ENCODING, this.INPUT_ENCODING) +
            decipher.final(this.INPUT_ENCODING);
        return password;
    }

    private async generateKey(): Promise<Buffer> {
        return (await promisify(scrypt)(this.PASSPHRASE_SECRET, this.PASSPHRASE_SALT, 32)) as Buffer;
    }
}
