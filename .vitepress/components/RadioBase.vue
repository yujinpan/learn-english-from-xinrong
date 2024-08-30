<template>
  <div class="radio-base">
    <div v-for="item in options" :key="item.value">
      <input
        name="visibleMode"
        type="radio"
        :id="item.value"
        :value="item.value"
        :checked="item.value === model"
        @change="model = +$event.target.value"
      />
      <label style="padding-left: 8px" :for="item.value">{{
        item.label
      }}</label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

const props = defineProps({
  value: {},
  options: Array as PropType<{ value; label }[]>,
});

const emit = defineEmits(['change']);

const model = defineModel({
  get() {
    return props.value;
  },
  set(val) {
    emit('change', val);
  },
});
</script>

<!--<style lang="scss" scoped>-->
<!--// @import '~@/styles/common-variables.scss';-->
<!--</style>-->
