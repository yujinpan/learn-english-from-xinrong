<template>
  <Layout>
    <template #sidebar-nav-before>
      <div class="review">
        <h3>Review Mode:</h3>
        <RadioBase
          :options="[
            { value: StatementVisibleMode.ALL, label: 'All' },
            { value: StatementVisibleMode.ZH, label: 'Chinese' },
            { value: StatementVisibleMode.EN, label: 'English' },
          ]"
          :value="statementVisibleMode"
          @change="setStatementVisibleMode"
        />
      </div>
    </template>
  </Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme';

import RadioBase from '../components/RadioBase.vue';
import { StatementVisibleMode, useGlobalStore } from '../store';

const { Layout } = DefaultTheme;

const { statementVisibleMode, setStatementVisibleMode } = useGlobalStore();
</script>

<style lang="scss" scoped>
.review {
  padding: 16px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  h3 {
    margin-bottom: 8px;
  }
}
</style>
