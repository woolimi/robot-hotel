import { ALL_WAKE_WORDS, type RobotConfig } from '@/config/robots';
import { dispatchIntent } from './useIntentDispatch';
import { useSTT, type STTResult } from './useSTT';
import { useTTS } from './useTTS';
import { useVoiceStore } from '@/stores/voice';
import { useModeStore } from '@/stores/mode';

const LISTENING_WINDOW_MS = 5000;
// TTS 가 끝난 뒤 echo (스피커 → 마이크) 가 STT 로 다시 잡히는 걸 막기 위해 충분히 긴 윈도우
const COOLDOWN_MS = 1500;
// 호출어가 들어왔을 때 추가 발화를 기다리는 settle 시간.
// 이 시간 내에 새 interim 이 안 오면 그 시점 텍스트로 처리한다.
const WAKE_SETTLE_MS = 500;
const STOP_TOKENS = ['정지', '멈춰', '그만', '스톱'];

// STT 가 띄어쓰며 인식하는 케이스도 잡기 위해 wake word 음절 사이 \s* 허용
//   ex) "고고 핑", "에듀 핑", "노리 암"
const WAKE_WORD_PATTERNS = ALL_WAKE_WORDS.map((w) => w.split('').join('\\s*'));
const WAKE_WORD_REGEX = new RegExp(`(${WAKE_WORD_PATTERNS.join('|')})[\\s,.!?]*(.*)$`);

function normalizeWakeWord(matched: string): string {
  return matched.replace(/\s+/g, '');
}

function isStopIntent(text: string): boolean {
  return STOP_TOKENS.some((token) => text.includes(token));
}

export function useVoiceController(robot: RobotConfig): {
  start: () => void;
  stop: () => void;
  processCommand: (text: string) => Promise<void>;
} {
  const voice = useVoiceStore();
  const mode = useModeStore();

  let listeningTimer: number | null = null;
  let cooldownTimer: number | null = null;
  let settleTimer: number | null = null;
  let pendingSettleText = '';
  let suppressUntil = 0;
  // dispatching 중 호출어로 가로채기 위한 abort controller
  let dispatchAbort: AbortController | null = null;

  const tts = useTTS({
    onStart: () => voice.setSpeaking(true),
    onEnd: () => {
      voice.setSpeaking(false);
      // grace period after TTS to swallow echo picked up by STT
      suppressUntil = Date.now() + COOLDOWN_MS;
    },
  });

  const stt = useSTT({
    lang: 'ko-KR',
    onResult: (result) => handleSttResult(result),
    onError: (message) => voice.setError(message),
  });

  function clearListeningTimer(): void {
    if (listeningTimer !== null) {
      window.clearTimeout(listeningTimer);
      listeningTimer = null;
    }
  }

  function clearCooldownTimer(): void {
    if (cooldownTimer !== null) {
      window.clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
  }

  function clearSettleTimer(): void {
    if (settleTimer !== null) {
      window.clearTimeout(settleTimer);
      settleTimer = null;
    }
    pendingSettleText = '';
  }

  function tryWakeFromText(text: string): { wakeWord: string; remainder: string } | null {
    const match = text.match(WAKE_WORD_REGEX);
    if (!match) return null;
    const normalized = normalizeWakeWord(match[1] ?? '');
    if (normalized !== robot.wakeWord) return null;
    return { wakeWord: normalized, remainder: (match[2] ?? '').trim() };
  }

  async function fireSettle(): Promise<void> {
    settleTimer = null;
    const text = pendingSettleText;
    pendingSettleText = '';
    if (voice.state !== 'idle') return;
    const settled = tryWakeFromText(text);
    if (settled) await enterWakeDetected(settled.remainder);
  }

  function enterCooldown(): void {
    voice.setState('cooldown');
    clearCooldownTimer();
    cooldownTimer = window.setTimeout(() => {
      voice.setState('idle');
      cooldownTimer = null;
    }, COOLDOWN_MS);
  }

  function shouldDropResult(): boolean {
    if (voice.isSpeaking) return true;
    if (Date.now() < suppressUntil) return true;
    return false;
  }

  /**
   * dispatching / wake_detected / listening / cooldown 중 호출어가 다시 들리면
   * 진행 중 작업 (fetch / TTS / 타이머) 을 모두 취소하고 새 흐름 시작.
   */
  async function bargeIn(remainder: string): Promise<void> {
    if (dispatchAbort) {
      dispatchAbort.abort();
      dispatchAbort = null;
    }
    tts.cancel();
    clearListeningTimer();
    clearCooldownTimer();
    clearSettleTimer();
    voice.setSpeaking(false);
    suppressUntil = 0;
    await enterWakeDetected(remainder);
  }

  async function handleSttResult(result: STTResult): Promise<void> {
    if (shouldDropResult()) return;

    // 사용자 발화만 입력창에 표시. wake_detected/dispatching/cooldown 동안엔 echo 가 새는 걸
    // 막기 위해 sttText 자체를 갱신 안 함. 사용자가 입력창에 직접 타이핑 중일 때도 덮어쓰지 않음.
    const canUpdate =
      !voice.inputLocked && (voice.state === 'idle' || voice.state === 'listening');
    if (canUpdate) {
      voice.setSttText(result.text);
    }

    const trimmed = result.text.trim();

    // barge-in — idle / listening 외 상태에서도 호출어 들어오면 가로챈다.
    // (idle 은 아래 settle 로직, listening 은 일반 후속 발화 처리)
    if (
      result.isFinal &&
      (voice.state === 'wake_detected' ||
        voice.state === 'dispatching' ||
        voice.state === 'cooldown')
    ) {
      const wake = tryWakeFromText(trimmed);
      if (wake) {
        await bargeIn(wake.remainder);
        return;
      }
    }

    if (voice.state === 'idle') {
      // final 이면 즉시 처리 + settle 타이머 무력화
      if (result.isFinal) {
        clearSettleTimer();
        const wake = tryWakeFromText(trimmed);
        if (wake) await enterWakeDetected(wake.remainder);
        return;
      }

      // interim — 호출어 매칭되면 settle 타이머로 추가 발화 기다림
      const wake = tryWakeFromText(trimmed);
      if (!wake) return;

      // 텍스트가 실제로 자랐을 때만 reset, 같은 텍스트 반복 (STT chatter) 은 무시
      const grew = trimmed.length > pendingSettleText.length;
      pendingSettleText = trimmed;

      if (settleTimer === null) {
        // 첫 매칭 — 타이머 시작
        settleTimer = window.setTimeout(fireSettle, WAKE_SETTLE_MS);
      } else if (grew) {
        // 사용자가 계속 말하는 중 — 타이머 reset
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(fireSettle, WAKE_SETTLE_MS);
      }
      return;
    }

    if (voice.state === 'listening' && result.isFinal) {
      clearListeningTimer();
      await enterDispatching(trimmed);
    }
  }

  async function enterWakeDetected(remainder: string): Promise<void> {
    voice.setState('wake_detected');
    mode.setEmotionTransient('hello', 1500);

    if (remainder.length > 0) {
      // 호출어 + 명령이 같이 온 경우 — TTS 응답 생략, 바로 명령 처리
      await enterDispatching(remainder);
      return;
    }
    // 호출어 단독 — 응답하고 listening 윈도우 열어 후속 발화 대기
    await tts.speak('네!');
    voice.setState('listening');
    clearListeningTimer();
    listeningTimer = window.setTimeout(() => {
      listeningTimer = null;
      enterCooldown();
    }, LISTENING_WINDOW_MS);
  }

  async function enterDispatching(text: string): Promise<void> {
    voice.setState('dispatching');
    voice.setLastSpokenText(text);

    const restricted = robot.restrictedVoiceMode === mode.currentMode;
    if (restricted && !isStopIntent(text)) {
      // 보조 모드: 정지 의도 외 발화는 의도 분류 건너뛰고 직전 동작 재개 신호
      mode.setProximityHalt(false);
      enterCooldown();
      return;
    }

    const controller = new AbortController();
    dispatchAbort = controller;
    try {
      const response = await dispatchIntent(text, robot.id, controller.signal);
      if (controller.signal.aborted) return;
      mode.applyIntent(response);
      if (response.kind === 'chat') {
        await tts.speak(response.reply);
      }
    } catch (err) {
      // barge-in 으로 abort 된 경우는 정상 — error 로 표시 안 함
      if ((err as Error).name === 'AbortError') return;
      voice.setError((err as Error).message);
    } finally {
      if (dispatchAbort === controller) dispatchAbort = null;
      // barge-in 으로 이미 다른 상태 (wake_detected 등) 로 전이됐다면 cooldown 으로 덮지 않음
      if (!controller.signal.aborted && voice.state === 'dispatching') enterCooldown();
    }
  }

  function start(): void {
    stt.start();
  }

  function stop(): void {
    stt.stop();
    tts.cancel();
    if (dispatchAbort) {
      dispatchAbort.abort();
      dispatchAbort = null;
    }
    clearListeningTimer();
    clearCooldownTimer();
    clearSettleTimer();
    voice.setState('idle');
  }

  /**
   * 텍스트 명령을 음성과 동일한 흐름으로 처리.
   * - wake word 단독이면 wake_detected (TTS 응답)
   * - "wake word + 명령" 이면 잔여 텍스트로 dispatch
   * - wake word 없으면 그대로 dispatch
   * 타이핑 입력에서 호출.
   */
  async function processCommand(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const wake = tryWakeFromText(trimmed);

    if (wake) {
      if (wake.remainder) {
        // 호출어 + 명령 — TTS 응답 생략, 바로 dispatch
        mode.setEmotionTransient('hello', 800);
        await enterDispatching(wake.remainder);
      } else {
        // 호출어 단독 — 응답만 (타이핑은 follow-up 의미 없으므로 listening 안 함)
        voice.setState('wake_detected');
        mode.setEmotionTransient('hello', 1500);
        await tts.speak('네!');
        enterCooldown();
      }
      return;
    }
    // 호출어 없는 직접 명령 (타이핑 전용)
    await enterDispatching(trimmed);
  }

  return { start, stop, processCommand };
}

export type VoiceController = ReturnType<typeof useVoiceController>;
