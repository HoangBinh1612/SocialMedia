let { Server } = require('socket.io');
let jwt = require('jsonwebtoken');
let userModel = require('../schemas/users');
let messageController = require('../controllers/messages');
let reactionController = require('../controllers/reactions');
let notificationController = require('../controllers/notifications');
let { SECRET_KEY } = require('./authHandler');

let ioInstance = null;
let userSocketsInstance = new Map();

module.exports = {
  serverSocket: function (server) {
    let io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    ioInstance = io;
    let userSockets = userSocketsInstance;

    io.on('connection', async (socket) => {
      let token = socket.handshake.auth.token;
      let userId = null;

      // Verify JWT
      try {
        if (!token) {
          socket.disconnect();
          return;
        }
        let result = jwt.verify(token, SECRET_KEY);
        if (result.exp * 1000 < Date.now()) {
          socket.disconnect();
          return;
        }
        userId = result.id;
        let user = await userModel.findById(userId);
        if (!user) {
          socket.disconnect();
          return;
        }

        // Join personal room
        socket.join(userId);
        userSockets.set(userId, socket);

        socket.emit('connected', { userId: userId, username: user.username });
        console.log('Socket connected: user', user.username);
      } catch (error) {
        socket.disconnect();
        return;
      }

      // Send 1-1 message
      socket.on('sendMessage', async (data) => {
        try {
          let { toUserId, content, imageUrl, videoUrl } = data;
          let msg = await messageController.SendMessage(userId, toUserId, content, imageUrl, videoUrl);

          let event = { type: 'NEW_MESSAGE', data: msg };
          // Gui cho nguoi nhan
          io.to(toUserId).emit('newMessage', event);
          // Gui lai cho nguoi gui (ack)
          socket.emit('newMessage', event);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Send group message
      socket.on('sendGroupMessage', async (data) => {
        try {
          let { toGroupId, content, imageUrl, videoUrl } = data;
          let msg = await messageController.SendGroupMessage(userId, toGroupId, content, imageUrl, videoUrl);

          let event = { type: 'NEW_MESSAGE', data: msg };
          let groupModel = require('../schemas/groups');
          let group = await groupModel.findById(toGroupId);
          
          if (group && !group.isDeleted) {
            group.members.forEach(member => {
              io.to(member.toString()).emit('newMessage', event);
            });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });


      // React post
      socket.on('reactPost', async (data) => {
        try {
          let { postId, type } = data;
          await reactionController.ReactPost(postId, userId, type);
          // Broadcast to all
          io.emit('postReacted', { postId, userId, type });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        let { toUserId, isTyping } = data;
        io.to(toUserId).emit('userTyping', { userId, isTyping });
      });

      // Mark message as read
      socket.on('markRead', async (data) => {
        try {
          let { messageId, fromUserId } = data;
          if (messageId) {
            await messageController.MarkRead(userId, messageId);
          }
          if (fromUserId) {
            await messageController.MarkAllReadFromUser(userId, fromUserId);
          }
          // Notify sender that messages were read
          if (fromUserId) {
            io.to(fromUserId).emit('messagesRead', { readBy: userId });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Friend events
      socket.on('friendEvent', (data) => {
        let { targetUserId, eventType } = data;
        io.to(targetUserId).emit('friendEvent', {
          type: eventType,
          fromUserId: userId,
          data: data
        });
      });

      socket.on('disconnect', () => {
        if (userId) {
          userSockets.delete(userId);
          console.log('Socket disconnected: user', userId);
        }
      });
    });
  },
  getIO: () => ioInstance,
  getUserSockets: () => userSocketsInstance
};
