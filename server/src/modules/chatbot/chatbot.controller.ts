import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class ChatHistoryDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

class ChatDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryDto)
  history?: ChatHistoryDto[];
}

class KnowledgeBaseCreateDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: string;
}

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @UseGuards(RolesGuard)
  @Roles('STUDENT')
  chat(@Req() req: { user: { id: string } }, @Body() dto: ChatDto) {
    return this.chatbotService.chat(
      dto.message,
      req.user.id,
      dto.history || [],
    );
  }

  @Post('message/stream')
  @UseGuards(RolesGuard)
  @Roles('STUDENT')
  async chatStream(
    @Req() req: { user: { id: string } },
    @Body() dto: ChatDto,
    @Res() res: Response,
  ) {
    res.setHeader('content-type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.chatbotService.chatStream(
        dto.message,
        req.user.id,
        dto.history || [],
      )) {
        res.write(`${JSON.stringify(chunk)}\n`);
      }
    } finally {
      res.end();
    }
  }

  @Get('kb/entries')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  kbEntries(@Query('q') q?: string) {
    return this.chatbotService.listKnowledgeBase(q);
  }

  @Post('kb/entry')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  kbCreate(@Body() dto: KnowledgeBaseCreateDto) {
    return this.chatbotService.createKnowledgeBaseEntry(dto);
  }

  @Delete('kb/entry/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  kbDelete(@Param('id') id: string) {
    return this.chatbotService.deleteKnowledgeBaseEntry(id);
  }

  @Post('kb/reindex')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  reindexKnowledgeBase() {
    return this.chatbotService.reindexKnowledgeBase();
  }
}
