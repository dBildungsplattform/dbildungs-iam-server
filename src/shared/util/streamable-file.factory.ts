import { Injectable, StreamableFile } from '@nestjs/common';
import { StreamableFileOptions } from '@nestjs/common/file-stream/interfaces';
import { Readable } from 'stream';

import { ClassLogger } from '../../core/logging/class-logger.js';

@Injectable()
export class StreamableFileFactory {
    public constructor(private readonly logger: ClassLogger) {}

    public fromBuffer(buffer: Uint8Array, options?: StreamableFileOptions): StreamableFile {
        const streamableFile: StreamableFile = new StreamableFile(buffer, options).setErrorLogger(
            this.streamableFileErrorLogger,
        );

        return streamableFile;
    }

    public fromReadable(readable: Readable, options?: StreamableFileOptions): StreamableFile {
        const streamableFile: StreamableFile = new StreamableFile(readable, options).setErrorLogger(
            this.streamableFileErrorLogger,
        );

        return streamableFile;
    }

    private streamableFileErrorLogger = (err: NodeJS.ErrnoException): void => {
        if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
            this.logger.info('Filestream was closed prematurely');
        } else {
            this.logger.error(err.message, err.stack);
        }
    };
}
