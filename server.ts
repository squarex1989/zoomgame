import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { wsServer } from './lib/websocket/server';
import { gameStore } from './lib/store';
import { v4 as uuidv4 } from 'uuid';
import { RANDOM_NAMES, getAvatarUrl } from './lib/game/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 自定义 API 路由处理
function handleApiRequest(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return true;
  }

  // 创建房间
  if (pathname === '/api/room' && req.method === 'POST') {
    const hostId = uuidv4();
    const hostName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const hostAvatar = getAvatarUrl(hostName);

    const room = gameStore.createRoom(hostId, hostName, hostAvatar);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      roomId: room.id,
      hostId: room.hostId,
      joinUrl: `/room/${room.id}`,
    }));
    return true;
  }

  // 获取房间信息
  const roomMatch = pathname.match(/^\/api\/room\/([A-Z0-9]+)$/);
  if (roomMatch && req.method === 'GET') {
    const roomId = roomMatch[1];
    const room = gameStore.getRoom(roomId);

    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Room not found' }));
      return true;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      room: gameStore.serializeRoom(room),
    }));
    return true;
  }

  return false;
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const { pathname } = parsedUrl;

      // 先检查是否是我们的自定义 API
      if (pathname?.startsWith('/api/room') && handleApiRequest(req, res, pathname)) {
        return;
      }

      // 否则交给 Next.js 处理
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket 和 HTTP 使用同一个端口（Railway 只分配一个端口）
  wsServer.initialize(server);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server running on same port`);
  });
});
