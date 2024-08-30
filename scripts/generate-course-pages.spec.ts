import { describe, expect, it } from 'vitest';

import { parseTxtToPage } from './generate-course-pages';

describe('generate-course-pages', () => {
  it('readBreak', () => {
    expect(
      parseTxtToPage(`
----------------Page (0) Break----------------
1 
 
你好，我是星荣。 

必须做 have to do /hæv/ /tə/ /du/ 
我必须做这件事情 I have to do it /aɪ/ /hæv/ /tə/ /du/ /ɪt/ 

----------------Page (5) Break----------------
6 
 
 
 

我今`),
    ).toBe(`你好，我是星荣。

必须做 have to do /hæv/ /tə/ /du/
我必须做这件事情 I have to do it /aɪ/ /hæv/ /tə/ /du/ /ɪt/

我今`);
  });

  it('readTable', () => {
    expect(
      parseTxtToPage(`微信：xingrong-english 公众号：Hi要大声说出来


中文 英文 K.K.音标
我 I /aɪ/
喜欢 like /laɪk/
我喜欢 I like /aɪ/ /laɪk/
食物 the food /ðə/ /fud/
我喜欢这个食物 I like the food /aɪ/ /laɪk//ðə/ /fud/
不 don't /dont/`),
    ).toBe(
      `微信：xingrong-english 公众号：Hi要大声说出来

<script setup>
const statementData = [{"zh":"我","en":"I","kk":"/aɪ/"},{"zh":"喜欢","en":"like","kk":"/laɪk/"},{"zh":"我喜欢","en":"I like","kk":"/aɪ/ /laɪk/"},{"zh":"食物","en":"the food","kk":"/ðə/ /fud/"},{"zh":"我喜欢这个食物","en":"I like the food","kk":"/aɪ/ /laɪk//ðə/ /fud/"},{"zh":"不","en":"don't","kk":"/dont/"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });
});
