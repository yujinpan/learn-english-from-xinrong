import { defineConfig } from 'vitepress';

import { getSources } from '../scripts/utils';

export default defineConfig({
  base: '/learn-english-from-xinrong',
  title: 'Learn English form Xinrong',
  description: 'This is a website that helps us review Xinrong video courses.',
  appearance: true,
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/yujinpan/learn-english-from-xinrong/',
      },
    ],
    nav: [{ text: 'Courses', link: '/courses' }],
    sidebar: {
      '/courses/': [
        {
          text: 'Courses',
          items: (function () {
            return getSources().map((item) => ({
              text: item.name,
              link: item.name.toLowerCase(),
            }));
          })(),
        },
      ],
    },
    outline: 'deep',
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 yujinpan',
    },
  },
  async transformHtml(code) {
    return code.replace(
      '</body>',
      `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S66MPLRFJZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-S66MPLRFJZ');
</script>
</body>`,
    );
  },
});
