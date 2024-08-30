import DefaultTheme from 'vitepress/theme';

import type { Theme } from 'vitepress';

import CustomLayout from './CustomLayout.vue';
import StatementGroup from '../components/StatementGroup.vue';

export default {
  extends: DefaultTheme,
  async enhanceApp(context) {
    context.app.component('StatementGroup', StatementGroup);
  },
  Layout: CustomLayout,
} as Theme;
