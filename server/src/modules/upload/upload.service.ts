import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';

type UploadsProvider = 'auto' | 'cloudinary' | 'local';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly hasCloudinaryConfig: boolean;
  private readonly uploadsProvider: UploadsProvider;

  constructor() {
    this.hasCloudinaryConfig = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
    );

    const uploadsProviderRaw = (process.env.UPLOADS_PROVIDER || 'auto')
      .trim()
      .toLowerCase();
    this.uploadsProvider =
      uploadsProviderRaw === 'cloudinary' ||
      uploadsProviderRaw === 'local' ||
      uploadsProviderRaw === 'auto'
        ? uploadsProviderRaw
        : 'auto';

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'hostel-complaints',
    baseUrl?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WEBP images are allowed',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image must be under 10MB');
    }

    if (this.uploadsProvider === 'cloudinary' && !this.hasCloudinaryConfig) {
      throw new BadRequestException(
        'Uploads are set to Cloudinary, but Cloudinary env vars are missing on the server.',
      );
    }

    const shouldUseCloudinary =
      this.uploadsProvider === 'cloudinary' ||
      (this.uploadsProvider === 'auto' && this.hasCloudinaryConfig);

    if (!shouldUseCloudinary) {
      const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
      const allowEphemeral =
        (process.env.ALLOW_EPHEMERAL_UPLOADS || '').toLowerCase() === 'true';

      if (isProd && !allowEphemeral) {
        throw new BadRequestException(
          'Uploads are not configured. Set CLOUDINARY_* env vars (recommended) or set ALLOW_EPHEMERAL_UPLOADS=true to use non-persistent local uploads.',
        );
      }

      this.logger.warn(
        'Using local upload storage. Uploaded files may be lost on server restarts/redeploys.',
      );
      return this.uploadToLocal(file, baseUrl);
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            transformation: [
              { width: 1200, height: 900, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(
                new BadRequestException(
                  'Upload failed. Check Cloudinary configuration on server.',
                ),
              );
              return;
            }

            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    baseUrl?: string,
  ): Promise<string> {
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const extension =
      extname(file.originalname || '') || this.extensionFromMime(file.mimetype);
    const fileName = `${randomUUID()}${extension}`;
    const filePath = join(uploadsDir, fileName);

    await writeFile(filePath, file.buffer);

    const serverBase =
      baseUrl ||
      process.env.SERVER_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || 3001}`;

    return `${serverBase.replace(/\/$/, '')}/uploads/${fileName}`;
  }

  private extensionFromMime(mimeType: string): string {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '.jpg';
  }
}
