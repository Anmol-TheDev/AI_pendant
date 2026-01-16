import { Router } from 'express';
import * as chatroomController from '../controllers/chatroom.controller';

const router = Router();

/** Get today's chatroom */
router.get('/today', chatroomController.getTodayChatroom);

/** Get chatroom by ID */
router.get('/:id', chatroomController.getChatroomById);

/** Enter chatroom with transcript context */
router.post('/:id/enter', chatroomController.enterChatroom);

/** Get messages from a chatroom (simple) */
router.get('/:id/messages', chatroomController.getChatroomMessages);

/** Get paginated messages for infinite scroll */
router.get('/:id/messages/paginated', chatroomController.getPaginatedMessages);

/** Get all chatrooms */
router.get('/', chatroomController.getAllChatrooms);

export default router;
