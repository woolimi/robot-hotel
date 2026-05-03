import { onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/mode';

interface ModeAudioConfig {
  src: string;
  loop?: boolean;
  volume?: number;
}

/**
 * 모드별로 mp3 를 자동 재생/정지.
 * 모드 진입 시 src 재생, 다른 모드로 전환되면 정지.
 */
export function useModeAudio(audioByMode: Record<string, ModeAudioConfig>): void {
  const mode = useModeStore();
  const { currentMode } = storeToRefs(mode);

  const elements = new Map<string, HTMLAudioElement>();

  function getElement(modeName: string, config: ModeAudioConfig): HTMLAudioElement {
    let el = elements.get(modeName);
    if (!el) {
      el = new Audio(config.src);
      el.loop = config.loop ?? false;
      el.volume = config.volume ?? 1.0;
      el.preload = 'auto';
      elements.set(modeName, el);
    }
    return el;
  }

  function stopAll(): void {
    for (const el of elements.values()) {
      el.pause();
      el.currentTime = 0;
    }
  }

  watch(
    currentMode,
    (next, prev) => {
      if (prev && prev !== next) {
        const prevEl = elements.get(prev);
        if (prevEl) {
          prevEl.pause();
          prevEl.currentTime = 0;
        }
      }
      const config = audioByMode[next];
      if (!config) return;
      const el = getElement(next, config);
      el.currentTime = 0;
      el.play().catch(() => {
        // autoplay 정책 — StartOverlay 클릭 전이거나 권한 없음. 다음 user gesture 시 재시도 안 함.
      });
    },
    { immediate: false }
  );

  onBeforeUnmount(() => {
    stopAll();
    elements.clear();
  });
}
