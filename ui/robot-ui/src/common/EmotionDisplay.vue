<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { EmotionId } from '@/config/robots';
import { useVoiceStore } from '@/stores/voice';

const props = defineProps<{ emotion: EmotionId }>();

const voice = useVoiceStore();
const { state } = storeToRefs(voice);

const ACCENT_BY_EMOTION: Record<EmotionId, string> = {
  basic: '#94a3b8',
  hello: '#fb923c',
  happy: '#fbbf24',
  fun: '#ec4899',
  interest: '#a78bfa',
  bored: '#94a3b8',
  sad: '#60a5fa',
  angry: '#ef4444',
  sleep: '#7c83b8',
};

const accent = computed(() => ACCENT_BY_EMOTION[props.emotion]);
const isListening = computed(
  () => state.value === 'listening' || state.value === 'wake_detected'
);
</script>

<template>
  <div class="stage">
    <div
      class="face"
      :class="{ listening: isListening }"
      :style="{ '--accent': accent }"
    >
      <span class="notch">
        <span class="notch-dot"></span>
      </span>
      <div class="screen">
        <img :src="`/emotions/${emotion}.webp`" :alt="emotion" class="emotion" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.face {
  --accent: #94a3b8;
  position: relative;
  width: min(80vw, calc(60vh * 4 / 3));
  aspect-ratio: 4 / 3;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fdf4f7 100%);
  border-radius: 36px;
  box-shadow:
    0 18px 44px rgba(196, 84, 111, 0.18),
    0 0 0 1.5px color-mix(in srgb, var(--accent) 40%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  animation: bob 4s ease-in-out infinite;
  transition: box-shadow 0.5s ease;
}

.face::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 38px;
  pointer-events: none;
  opacity: 0;
  box-shadow: 0 0 0 0 var(--accent);
  transition: opacity 0.3s ease;
}
.face.listening::after {
  opacity: 1;
  animation: glow 2.4s ease-in-out infinite;
}

.notch {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 64px;
  height: 7px;
  background: #2a3441;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.notch-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 4px var(--accent);
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 22px;
  overflow: hidden;
  background: #ffe8ec;
  box-shadow: inset 0 4px 14px rgba(0, 0, 0, 0.08);
}

.emotion {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent);
  }
  50% {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent) 0%, transparent),
      0 0 24px color-mix(in srgb, var(--accent) 50%, transparent);
  }
}
</style>
