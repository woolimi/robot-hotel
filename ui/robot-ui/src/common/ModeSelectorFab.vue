<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/mode';
import { postModeClick } from '@/composables/useIntentDispatch';

const mode = useModeStore();
const { robot, currentMode } = storeToRefs(mode);

const expanded = ref(false);
const root = ref<HTMLElement | null>(null);

function toggle(): void {
  expanded.value = !expanded.value;
}

async function selectMode(picked: string): Promise<void> {
  expanded.value = false;
  if (picked === currentMode.value) return;
  mode.setMode(picked);
  try {
    await postModeClick(picked, robot.value.id);
  } catch {
    // mock or real backend error — UI 는 이미 갱신, 다음 push 로 정렬됨
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (!expanded.value) return;
  const target = event.target as Node | null;
  if (target && root.value && !root.value.contains(target)) {
    expanded.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <div class="fab-root" ref="root">
    <transition name="panel">
      <div v-if="expanded" class="panel">
        <button
          v-for="m in robot.modes"
          :key="m"
          class="mode-btn"
          :class="{ active: m === currentMode }"
          @click="selectMode(m)"
        >
          {{ m }}
        </button>
      </div>
    </transition>
    <button class="fab" :class="{ open: expanded }" @click.stop="toggle" aria-label="모드 메뉴">
      <svg v-if="!expanded" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
      <span v-if="!expanded" class="badge">{{ robot.modes.length }}</span>
    </button>
  </div>
</template>

<style scoped>
.fab-root {
  position: absolute;
  right: 50px;
  bottom: 50px;
  z-index: 20;
}
.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  color: #c4546f;
  border: none;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
  position: relative;
}
.fab:hover {
  transform: scale(1.05);
}
.fab.open {
  background: #ff6b8a;
  color: white;
}
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff6b8a;
  color: white;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 700;
}
.panel {
  position: absolute;
  right: 0;
  bottom: 70px;
  background: white;
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, 1fr));
  gap: 6px;
  width: 280px;
}
.mode-btn {
  background: #fafafa;
  border: 1px solid #f0e0e4;
  border-radius: 10px;
  padding: 12px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: background 0.1s;
}
.mode-btn:hover {
  background: #fff0f3;
}
.mode-btn.active {
  background: #ff6b8a;
  color: white;
  border-color: #c4546f;
}
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.15s, transform 0.15s;
  transform-origin: bottom right;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
}
</style>
