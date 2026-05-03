import { onBeforeUnmount, ref } from 'vue';

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface STTResult {
  text: string;
  isFinal: boolean;
}

export interface UseSTTOptions {
  lang?: string;
  onResult: (result: STTResult) => void;
  onError?: (message: string) => void;
}

export function useSTT(options: UseSTTOptions): {
  start: () => void;
  stop: () => void;
  isRunning: ReturnType<typeof ref<boolean>>;
} {
  const isRunning = ref(false);
  let recognition: SpeechRecognitionLike | null = null;
  let shouldRestart = false;

  function build(): SpeechRecognitionLike | null {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      options.onError?.('이 브라우저는 Web Speech API 를 지원하지 않습니다 (Chrome 사용 권장).');
      return null;
    }
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = options.lang ?? 'ko-KR';
    r.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        options.onResult({
          text: result[0].transcript,
          isFinal: result.isFinal,
        });
      }
    };
    r.onerror = (event) => {
      const message = (event as unknown as { error?: string }).error ?? 'unknown';
      if (message === 'no-speech' || message === 'aborted') return;
      options.onError?.(`STT 오류: ${message}`);
    };
    r.onend = () => {
      isRunning.value = false;
      if (shouldRestart) {
        window.setTimeout(() => {
          if (shouldRestart) {
            try {
              r.start();
              isRunning.value = true;
            } catch {
              // already started or other transient — ignore
            }
          }
        }, 200);
      }
    };
    return r;
  }

  function start(): void {
    shouldRestart = true;
    if (!recognition) recognition = build();
    if (!recognition) return;
    try {
      recognition.start();
      isRunning.value = true;
    } catch {
      // start() throws if already started — safe to ignore
    }
  }

  function stop(): void {
    shouldRestart = false;
    recognition?.stop();
    isRunning.value = false;
  }

  onBeforeUnmount(() => {
    shouldRestart = false;
    recognition?.abort();
  });

  return { start, stop, isRunning };
}
