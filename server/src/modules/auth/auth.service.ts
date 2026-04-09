import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { parseJwtExpiresIn } from './jwt-expiry';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const existingEnrollment = await this.prisma.user.findUnique({
      where: { enrollmentNo: dto.enrollmentNo },
    });
    if (existingEnrollment) {
      throw new ConflictException('Enrollment number already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        enrollmentNo: dto.enrollmentNo,
        course: dto.course,
        coursePreference: dto.coursePreference,
        gender: dto.gender,
        sportsInterests: dto.sportsInterests,
        hobbies: dto.hobbies,
        sleepSchedule: dto.sleepSchedule,
        noiseTolerance: dto.noiseTolerance,
        studyHours: dto.studyHours,
        sleepHours: dto.sleepHours,
        careerGoal: dto.careerGoal,
        address: dto.address,
        parentContactNo: dto.parentContactNo,
        role: Role.STUDENT,
        password: hashedPassword,
        approvalStatus: 'PENDING',
        approvedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
      },
    });

    return {
      user,
      requiresApproval: true,
      message:
        'Registration submitted. Your account will be activated after admin or warden approval.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: hashedPassword, ...safeUser } = user;
    const valid = await bcrypt.compare(dto.password, hashedPassword);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === Role.STUDENT && user.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Your registration is pending approval. Please wait for admin or warden approval.',
      );
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: safeUser, ...tokens };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'hostel-jwt-secret',
      expiresIn: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN, '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: parseJwtExpiresIn(process.env.JWT_REFRESH_EXPIRES_IN, '7d'),
    });

    return { accessToken, refreshToken };
  }
}
