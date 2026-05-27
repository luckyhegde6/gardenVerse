import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly maxSize = 10 * 1024 * 1024;
  private readonly allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, subfolder = 'general'): Promise<{ url: string; filename: string }> {
    if (!file) throw new BadRequestException('No file provided');

    if (file.size > this.maxSize) {
      throw new BadRequestException(`File exceeds max size of ${this.maxSize / 1024 / 1024}MB`);
    }

    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${uuid()}${ext}`;
    const subDir = path.join(this.uploadDir, subfolder);

    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }

    const filePath = path.join(subDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/${subfolder}/${filename}`;
    this.logger.log(`File uploaded: ${url} (${file.size} bytes)`);

    return { url, filename };
  }

  async deleteFile(url: string): Promise<void> {
    const filePath = path.join(this.uploadDir, url.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`File deleted: ${url}`);
    }
  }
}
