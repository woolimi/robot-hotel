import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

type RobotId = 'eduping' | 'gogoping' | 'noriarm';

const ROBOT_MODES: Record<RobotId, string[]> = {
  eduping: ['대기', '율동', '가게놀이', '정리정돈', '무궁화꽃이 피었습니다'],
  gogoping: ['대기', '등원', '하원', '보조', '숨바꼭질', '자장가'],
  noriarm: ['대기', '블럭쌓기', '정리'],
};

const STOP_TOKENS = ['정지', '멈춰', '그만', '스톱', 'stop'];

type IntentResponse =
  | { kind: 'mode_change'; mode: string }
  | { kind: 'sub_command'; action: string }
  | { kind: 'chat'; reply: string }
  | { kind: 'ignored' };

function classifyIntent(text: string, robot: RobotId): IntentResponse {
  const lower = text.toLowerCase();
  const modes = ROBOT_MODES[robot] ?? [];

  for (const mode of modes) {
    if (text.includes(mode)) {
      return { kind: 'mode_change', mode };
    }
  }
  for (const token of STOP_TOKENS) {
    if (lower.includes(token.toLowerCase())) {
      return { kind: 'sub_command', action: 'stop' };
    }
  }
  return { kind: 'chat', reply: `"${text}" 말씀이시군요. 선생님께 같이 여쭤볼까요?` };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function intentMockPlugin(): Plugin {
  return {
    name: 'intent-mock-plugin',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        const originalUrl = req.originalUrl ?? req.url ?? '';

        if (!originalUrl.startsWith('/api/voice/intent') && !originalUrl.startsWith('/api/mode')) {
          next();
          return;
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'method not allowed' });
          return;
        }

        try {
          const raw = await readBody(req);
          const body = raw ? (JSON.parse(raw) as { text?: string; robot?: RobotId; mode?: string }) : {};

          if (originalUrl.startsWith('/api/voice/intent')) {
            const text = (body.text ?? '').trim();
            const robot = body.robot ?? 'gogoping';
            sendJson(res, 200, classifyIntent(text, robot));
            return;
          }

          if (originalUrl.startsWith('/api/mode')) {
            const robot = body.robot ?? 'gogoping';
            const mode = body.mode ?? '대기';
            sendJson(res, 200, { ok: true, robot, mode });
            return;
          }
        } catch (err) {
          sendJson(res, 400, { error: (err as Error).message });
        }
      };

      server.middlewares.use(handler);
    },
  };
}
