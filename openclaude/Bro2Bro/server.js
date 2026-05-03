const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { getToken } = require('next-auth/jwt');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = await getToken({
        req: socket.handshake,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || !token.sub) {
        return next(new Error('Authentication error'));
      }

      // Store user info on socket
      socket.userId = token.sub;
      socket.user = token;
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication error'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room for targeted messages
    socket.join(`user:${socket.userId}`);

    // Track online status
    socket.broadcast.emit('user:online', socket.userId);

    // Update user's last active timestamp
    updateUserActivity(socket.userId);

    // Handle bro sending
    socket.on('bro:send', async (data, callback) => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const bro = await prisma.bro.create({
          data: {
            senderId: socket.userId,
            receiverId: data.receiverId,
            type: data.type,
            message: data.message,
            isAnonymous: data.isAnonymous || false,
            status: 'PENDING',
            reactionCount: 0,
            engagementScore: 0,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                image: true,
              },
            },
          },
        });

        // Notify receiver
        io.to(`user:${data.receiverId}`).emit('bro:received', bro);

        // Broadcast to feed for non-anonymous bros
        if (!data.isAnonymous) {
          socket.broadcast.emit('feed:update', bro);
        }

        callback({ success: true, bro });
      } catch (error) {
        console.error('Socket bro:send error:', error);
        callback({ success: false, error: 'Failed to send bro' });
      }
    });

    // Handle bro reactions
    socket.on('bro:react', async (data, callback) => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Upsert reaction
        const reaction = await prisma.reaction.upsert({
          where: {
            broId_userId: {
              broId: data.broId,
              userId: socket.userId,
            },
          },
          update: { type: data.type },
          create: {
            broId: data.broId,
            userId: socket.userId,
            type: data.type,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                image: true,
              },
            },
          },
        });

        // Update bro status and count
        await prisma.bro.update({
          where: { id: data.broId },
          data: { status: 'REACTED' },
        });

        // Get bro details to find sender
        const bro = await prisma.bro.findUnique({
          where: { id: data.broId },
          select: { senderId: true },
        });

        // Notify sender about reaction
        io.to(`user:${bro.senderId}`).emit('bro:reaction', {
          broId: data.broId,
          reaction,
        });

        callback({ success: true, reaction });
      } catch (error) {
        console.error('Socket bro:react error:', error);
        callback({ success: false, error: 'Failed to add reaction' });
      }
    });

    // Handle location updates
    socket.on('user:location', async (location) => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.user.update({
          where: { id: socket.userId },
          data: {
            latitude: location.latitude,
            longitude: location.longitude,
            locationUpdatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Location update error:', error);
      }
    });

    // Handle heartbeat
    socket.on('user:heartbeat', async () => {
      await updateUserActivity(socket.userId);
    });

    // Handle typing indicator
    socket.on('user:typing', (receiverId) => {
      socket.to(`user:${receiverId}`).emit('user:typing', socket.userId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.broadcast.emit('user:offline', socket.userId);
      updateUserActivity(socket.userId, false);
    });
  });

  // Helper to update user activity
  async function updateUserActivity(userId, isOnline = true) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActiveAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Update activity error:', error);
    }
  }

  // Periodic task: Update trending bros
  setInterval(async () => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get trending bros
      const trendingBros = await prisma.bro.findMany({
        where: {
          createdAt: { gte: oneDayAgo },
          isAnonymous: false,
          reactionCount: { gt: 0 },
        },
        orderBy: { reactionCount: 'desc' },
        take: 10,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true,
            },
          },
        },
      });

      // Update trending ranks and engagement scores
      for (let i = 0; i < trendingBros.length; i++) {
        const bro = trendingBros[i];
        const ageMinutes = (now.getTime() - new Date(bro.createdAt).getTime()) / (1000 * 60);
        const hotnessScore = Math.pow(bro.reactionCount, 1.5) / Math.pow(ageMinutes + 60, 0.5);

        await prisma.bro.update({
          where: { id: bro.id },
          data: {
            trendingRank: i + 1,
            engagementScore: hotnessScore,
          },
        });
      }

      // Broadcast trending update to all clients
      io.emit('trending:update', trendingBros);
    } catch (error) {
      console.error('Trending update error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  // Periodic task: Check streak expirations
  setInterval(async () => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const expiringStreaks = await prisma.streak.findMany({
        where: {
          expiresAt: {
            lte: twoHoursFromNow,
            gt: now,
          },
          count: { gt: 3 },
        },
        include: {
          user1: { select: { id: true } },
          user2: { select: { id: true } },
        },
      });

      for (const streak of expiringStreaks) {
        const hoursRemaining = Math.ceil(
          (new Date(streak.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        io.to(`user:${streak.user1.id}`).emit('streak:update', {
          ...streak,
          timeRemaining: hoursRemaining,
          isExpiringSoon: true,
        });

        io.to(`user:${streak.user2.id}`).emit('streak:update', {
          ...streak,
          timeRemaining: hoursRemaining,
          isExpiringSoon: true,
        });
      }
    } catch (error) {
      console.error('Streak check error:', error);
    }
  }, 30 * 60 * 1000); // Every 30 minutes

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
