import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, ConversationQueryDto } from './dto/chat.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations list' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversation')
  @ApiOperation({ summary: 'Get conversation with user' })
  async getConversation(@CurrentUser('id') userId: string, @Query() query: ConversationQueryDto) {
    return this.chatService.getConversation(userId, query);
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get group messages' })
  async getGroupMessages(@CurrentUser('id') userId: string, @Param('groupId') groupId: string) {
    return this.chatService.getGroupMessages(userId, groupId);
  }

  @Get('messages/:id/decrypt')
  @ApiOperation({ summary: 'Decrypt a message' })
  async decryptMessage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.chatService.decryptMessage(id, userId);
  }
}
