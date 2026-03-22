import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController, MessageActionsController } from './messages.controller';

@Module({
  controllers: [MessagesController, MessageActionsController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
