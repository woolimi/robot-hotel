import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import type { EmotionId, RobotConfig } from '@/config/robots';
import { getCurrentRobot } from '@/config/robots';
import type { IntentResponse } from '@/composables/useIntentDispatch';

export const useModeStore = defineStore('mode', () => {
  const robot = shallowRef<RobotConfig>(getCurrentRobot());
  const currentMode = ref<string>(robot.value.modes[0] ?? '대기');
  const currentEmotion = ref<EmotionId>(
    robot.value.defaultEmotionByMode[currentMode.value] ?? 'basic'
  );
  const proximityHalt = ref<boolean>(false);

  function setMode(mode: string): void {
    if (!robot.value.modes.includes(mode)) return;
    currentMode.value = mode;
    currentEmotion.value = robot.value.defaultEmotionByMode[mode] ?? 'basic';
  }

  function setEmotionTransient(emotion: EmotionId, durationMs: number): void {
    const previous = currentEmotion.value;
    currentEmotion.value = emotion;
    window.setTimeout(() => {
      if (currentEmotion.value === emotion) {
        currentEmotion.value = previous;
      }
    }, durationMs);
  }

  function setProximityHalt(value: boolean): void {
    proximityHalt.value = value;
  }

  function applyIntent(response: IntentResponse): void {
    switch (response.kind) {
      case 'mode_change':
        setMode(response.mode);
        break;
      case 'sub_command':
        if (response.action === 'stop') proximityHalt.value = true;
        break;
      case 'chat':
      case 'ignored':
        break;
    }
  }

  return {
    robot,
    currentMode,
    currentEmotion,
    proximityHalt,
    setMode,
    setEmotionTransient,
    setProximityHalt,
    applyIntent,
  };
});
