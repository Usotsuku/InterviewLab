import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, unlink, access, stat } from 'fs/promises';
import { join, dirname, resolve, sep } from 'path';

@Injectable()
export class StorageService {
  private readonly _logger = new Logger(StorageService.name);
  private readonly _basePath: string;

  constructor(private readonly _config: ConfigService) {
    this._basePath = this._config.get<string>('config.storage.localUploadPath') || './uploads';
  }

  async store(fileBuffer: Buffer, relativePath: string): Promise<string> {
    const fullPath = join(this._basePath, relativePath);
    this._assertWithinBase(fullPath);
    const dir = dirname(fullPath);

    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, fileBuffer);

    this._logger.log(`[store] File stored: ${fullPath}`);
    return relativePath;
  }

  async getFullPath(relativePath: string): Promise<string> {
    return join(this._basePath, relativePath);
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      await access(join(this._basePath, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(relativePath: string): Promise<number> {
    const stats = await stat(join(this._basePath, relativePath));
    return stats.size;
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = join(this._basePath, relativePath);
    this._assertWithinBase(fullPath);
    try {
      await unlink(fullPath);
      this._logger.log(`[deleteFile] File deleted: ${fullPath}`);
    } catch (error) {
      this._logger.warn(`[deleteFile] File not found or already deleted: ${fullPath}`);
    }
  }

  private _assertWithinBase(fullPath: string): void {
    const resolvedBase = resolve(this._basePath);
    const resolvedFull = resolve(fullPath);
    if (resolvedFull !== resolvedBase && !resolvedFull.startsWith(resolvedBase + sep)) {
      throw new BadRequestException('Invalid file path.');
    }
  }
}
