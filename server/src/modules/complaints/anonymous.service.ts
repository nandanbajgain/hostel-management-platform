import { BadRequestException, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Injectable()
export class AnonymousService {
  private readonly anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: CreateComplaintDto, userId: string) {
    if (!dto.imageUrl) {
      throw new BadRequestException(
        'Anonymous complaints require photograph proof. Please upload a supporting image.',
      );
    }

    const allowedAnonymousCategories = new Set(['SECURITY', 'OTHER']);
    if (!allowedAnonymousCategories.has(dto.category)) {
      throw new BadRequestException(
        'Anonymous complaints are limited to student/staff reports with proof. Please use Maintenance for plumbing/cleaning/electrical requests.',
      );
    }

    const isValid = await this.validateImage(dto.imageUrl);
    if (!isValid) {
      throw new BadRequestException(
        'Uploaded image does not look like valid proof for an anonymous report. Please upload a relevant photo.',
      );
    }

    const allocation = await this.prisma.roomAllocation.findUnique({
      where: { userId },
      include: { room: { select: { number: true } } },
    });

    const complaint = await this.prisma.complaint.create({
      data: {
        isAnonymous: true,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        status: 'PENDING',
        roomNumber: allocation?.isActive ? allocation.room.number : null,
      },
    });

    const studentHash = crypto
      .createHash('sha256')
      .update(userId + (process.env.HASH_SALT || 'default-salt'))
      .digest('hex');

    await this.prisma.complaintIdentity.create({
      data: { complaintId: complaint.id, studentHash },
    });

    return {
      token: complaint.token,
      message:
        'Your complaint has been submitted anonymously. Save this token to track your complaint.',
    };
  }

  async track(token: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { token: token.trim().toLowerCase() },
      select: {
        token: true,
        category: true,
        title: true,
        description: true,
        status: true,
        adminNote: true,
        roomNumber: true,
        createdAt: true,
        resolvedAt: true,
        updatedAt: true,
      },
    });

    if (!complaint) {
      throw new BadRequestException('Invalid token. No complaint found.');
    }

    return complaint;
  }

  async publicTrack(token: string) {
    return this.track(token);
  }

  private async validateImage(imageUrl: string): Promise<boolean> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return true;
    }

    try {
      const messages: Anthropic.Messages.MessageParam[] = [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            {
              type: 'text',
              text: 'Does this image appear to be relevant proof for a hostel-related complaint about a student or staff member (e.g., incident evidence, rule violation evidence, unsafe behavior evidence) rather than a random/unrelated photo? Reply only YES or NO.',
            },
          ],
        },
      ];

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 20,
        messages,
      });

      const answer = (
        response.content[0] as {
          text?: string;
        }
      ).text
        ?.trim()
        .toUpperCase();

      return answer === 'YES';
    } catch (error) {
      console.error('Image validation error:', error);
      return true;
    }
  }
}
