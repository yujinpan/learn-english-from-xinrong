import { computed, ref } from 'vue';

export enum StatementVisibleMode {
  ALL,
  EN,
  ZH,
}

const store = ref({
  statementVisibleMode: StatementVisibleMode.ALL,
});

export const useGlobalStore = () => {
  const statementVisibleMode = computed(() => {
    return store.value.statementVisibleMode;
  });

  const setStatementVisibleMode = (mode: StatementVisibleMode) => {
    store.value.statementVisibleMode = mode;
  };

  return {
    statementVisibleMode,
    setStatementVisibleMode,
  };
};
