import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';

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

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  chat(@Req() req: { user: { id: string } }, @Body() dto: ChatDto) {
    return this.chatbotService.chat(dto.message, req.user.id, dto.history || []);
  }
}
