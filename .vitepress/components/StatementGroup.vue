<template>
  <div class="statement-group">
    <div
      class="statement-group__item"
      v-for="(item, index) in data"
      :key="index"
      @click="currentVisibleMap[index] = !currentVisibleMap[index]"
    >
      <h3>Session {{ index + 1 }}</h3>
      <div class="info custom-block">
        <p v-if="currentVisibleMap[index] || zhVisible">{{ item.zh }}</p>
        <p v-if="currentVisibleMap[index] || enVisible">{{ item.en }}</p>
        <p v-if="currentVisibleMap[index] || enVisible">{{ item.kk }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import type { PropType } from 'vue';

import { StatementVisibleMode, useGlobalStore } from '../store';

defineProps({
  data: Array as PropType<{ zh: string; en: string; kk: string }[]>,
});

const { statementVisibleMode } = useGlobalStore();

const currentVisibleMap = ref<Record<number, boolean>>({});

const zhVisible = computed(() => {
  return (
    statementVisibleMode.value === StatementVisibleMode.ALL ||
    statementVisibleMode.value === StatementVisibleMode.ZH
  );
});

const enVisible = computed(() => {
  return (
    statementVisibleMode.value === StatementVisibleMode.ALL ||
    statementVisibleMode.value === StatementVisibleMode.EN
  );
});
</script>

<style lang="scss" scoped>
.statement-group {
  p {
    font-size: 16px;
    line-height: 2em;
    margin: 0;
    + p {
      border-top: 1px dashed var(--vp-c-border);
    }
  }
  &__item {
    .info {
      padding: 16px;
    }
  }
}
</style>
