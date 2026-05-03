export type RobotId = 'eduping' | 'gogoping' | 'noriarm';

export type EmotionId =
  | 'basic'
  | 'hello'
  | 'happy'
  | 'fun'
  | 'interest'
  | 'bored'
  | 'sad'
  | 'angry'
  | 'sleep';

export interface RobotConfig {
  id: RobotId;
  displayName: string;
  wakeWord: string;
  modes: string[];
  defaultEmotionByMode: Record<string, EmotionId>;
  restrictedVoiceMode: string | null;
}

export const ROBOT_CONFIGS: Record<RobotId, RobotConfig> = {
  eduping: {
    id: 'eduping',
    displayName: 'EduPing',
    wakeWord: '에듀핑',
    modes: ['대기', '율동', '가게놀이', '정리정돈', '무궁화꽃이 피었습니다'],
    defaultEmotionByMode: {
      대기: 'basic',
      율동: 'fun',
      가게놀이: 'fun',
      정리정돈: 'interest',
      '무궁화꽃이 피었습니다': 'fun',
    },
    restrictedVoiceMode: null,
  },
  gogoping: {
    id: 'gogoping',
    displayName: 'GogoPing',
    wakeWord: '고고핑',
    modes: ['대기', '등원', '하원', '보조', '숨바꼭질', '자장가'],
    defaultEmotionByMode: {
      대기: 'basic',
      등원: 'hello',
      하원: 'hello',
      보조: 'basic',
      숨바꼭질: 'fun',
      자장가: 'sleep',
    },
    restrictedVoiceMode: '보조',
  },
  noriarm: {
    id: 'noriarm',
    displayName: 'NoriArm',
    wakeWord: '노리암',
    modes: ['대기', '블럭쌓기', '정리'],
    defaultEmotionByMode: {
      대기: 'basic',
      블럭쌓기: 'interest',
      정리: 'interest',
    },
    restrictedVoiceMode: null,
  },
};

export const ALL_WAKE_WORDS = Object.values(ROBOT_CONFIGS).map((c) => c.wakeWord);

export function getCurrentRobot(): RobotConfig {
  const id = (import.meta.env.VITE_ROBOT ?? 'gogoping') as RobotId;
  const config = ROBOT_CONFIGS[id];
  if (!config) {
    throw new Error(`Unknown VITE_ROBOT="${id}". Use eduping | gogoping | noriarm.`);
  }
  return config;
}
