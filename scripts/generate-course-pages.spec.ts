import { describe, expect, it } from 'vitest';

import { parseTxtToPage } from './generate-course-pages';

describe('generate-course-pages', () => {
  it('readBreak', () => {
    expect(
      parseTxtToPage(`
----------------
1
你好，我是星荣。 

必须做 have to do /hæv/ /tə/ /du/ 
我必须做这件事情 I have to do it /aɪ/ /hæv/ /tə/ /du/ /ɪt/ 
----------------
6
我今`),
    ).toBe(`你好，我是星荣。

必须做 have to do /hæv/ /tə/ /du/
我必须做这件事情 I have to do it /aɪ/ /hæv/ /tə/ /du/ /ɪt/

我今`);
  });

  it('readStatements', () => {
    expect(
      parseTxtToPage(`微信：xingrong-english 公众号：Hi要大声说出来


中文 英文 K.K.音标
我 I /aɪ/
喜欢 like /laɪk/
我今天必须做这件事情 I have ́ to do it today /aɪ/ /hæv/ /tə/ /du/ /ɪt/ /tə'de/ 
所以 so /so/ 
它是重要的对我来说 
所以我必须做这件事 
It is important for me  
so I have to do it 
/ɪt/ /ɪz/ /ɪm'pɔrtnt/ /fɝ/ /mi/  
/so/ /aɪ/ /hæv/ /tə/ /du/ /ɪt/ `),
    ).toBe(
      `微信：xingrong-english 公众号：Hi要大声说出来

<script setup>
const statementData = [{"zh":"我","en":"I","kk":"/aɪ/"},{"zh":"喜欢","en":"like","kk":"/laɪk/"},{"zh":"我今天必须做这件事情","en":"I have ́ to do it today","kk":"/aɪ/ /hæv/ /tə/ /du/ /ɪt/ /tə'de/"},{"zh":"所以","en":"so","kk":"/so/"},{"zh":"它是重要的对我来说 \\n所以我必须做这件事","en":"It is important for me  \\nso I have to do it","kk":"/ɪt/ /ɪz/ /ɪm'pɔrtnt/ /fɝ/ /mi/  \\n/so/ /aɪ/ /hæv/ /tə/ /du/ /ɪt/"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });

  it('readStatements new line', () => {
    expect(
      parseTxtToPage(`微信：xingrong-english 公众号：Hi要大声说出来


中文 英文 K.K.音标
我(已经)在那个公司工作了三
年了 
I have worked at that company 
for three years 
/aɪ/ /hæv/ /wɝkt/ /ət/ /ðæt/ /ˈkʌmpəni/ 
/fɚ/ /θri/ /jɪrz/ `),
    ).toBe(
      `微信：xingrong-english 公众号：Hi要大声说出来

<script setup>
const statementData = [{"zh":"我(已经)在那个公司工作了三\\n年了","en":"I have worked at that company \\nfor three years","kk":"/aɪ/ /hæv/ /wɝkt/ /ət/ /ðæt/ /ˈkʌmpəni/ \\n/fɚ/ /θri/ /jɪrz/"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });

  it('readStatements empty kk', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
我是 I am /aɪ/ /æm/ 
星荣 Xingrong
我是星荣 I am Xingrong /aɪ/ /æm/ `),
    ).toBe(
      `<script setup>
const statementData = [{"zh":"我是","en":"I am","kk":"/aɪ/ /æm/"},{"zh":"星荣","en":"Xingrong","kk":""},{"zh":"我是星荣","en":"I am Xingrong","kk":"/aɪ/ /æm/"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });

  it('readStatements missing kk', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
我是 I am /aɪ/ /æm`),
    ).toBe(
      `<script setup>
const statementData = [{"zh":"我是","en":"I am","kk":"/aɪ/ /æm"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });

  it('readStatements can read two space between kk', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
星荣 Xingrong
我是星荣 I am Xingrong /aɪ/  /æm/ `),
    ).toBe(
      `<script setup>
const statementData = [{"zh":"星荣","en":"Xingrong","kk":""},{"zh":"我是星荣","en":"I am Xingrong","kk":"/aɪ/  /æm/"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });

  it('readStatements can read kk with new line', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
星荣 Xingrong
我是星荣 I am Xingrong /aɪ/
/æm/`),
    ).toBe(
      `<script setup>
const statementData = [{"zh":"星荣","en":"Xingrong","kk":""},{"zh":"我是星荣","en":"I am Xingrong","kk":"/aɪ/\\n/æm/"}]
</script>

<StatementGroup :data="statementData" />`,
    );
  });

  it('readTable', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
我 I /aɪ/
喜欢 like /laɪk/
      
中文 原形 第三人称单数 过去式 ing形式ed形式 \r
想要 want wants wanted wanting wanted 
喜欢 like likes liked liking liked 
有；
(+to )不得不 have has had having had 
计划 plan plans planned planning planned 
`),
    ).toBe(`<script setup>
const statementData = [{"zh":"我","en":"I","kk":"/aɪ/"},{"zh":"喜欢","en":"like","kk":"/laɪk/"}]
</script>

<StatementGroup :data="statementData" />

|中文|原形|第三人称单数|过去式|ing形式|ed形式|
|-|-|-|-|-|-|
|想要|want|wants|wanted|wanting|wanted|
|喜欢|like|likes|liked|liking|liked|
|有；(+to)不得不|have|has|had|having|had|
|计划|plan|plans|planned|planning|planned|`);
  });

  it('readTable with 4 columns', () => {
    expect(
      parseTxtToPage(`中文 原形 第三人称单数 过去式
想要 want wants wanted 
喜欢 like likes liked
问题 that question /ðæt/ /'kwɛstʃən/
(I，过去时)be was /wəz/
`),
    ).toBe(`|中文|原形|第三人称单数|过去式|
|-|-|-|-|
|想要|want|wants|wanted|
|喜欢|like|likes|liked|
问题 that question /ðæt/ /'kwɛstʃən/
(I，过去时)be was /wəz/`);
  });

  it('read statements and table', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
我 I /aɪ/
我们自从2020年以来(已经)
学习英文了
we have studied English since
2020
/wi/ /hæv/ /ˈstʌdid/ /ˈɪŋɡlɪʃ/ /sɪns/
/'twɛnti/ /'twɛnti/
----------------
7
中文 原形 第三人称单数 过去式 ing形式ed形式
想要 want wants wanted wanting wanted
想要 want wants wanted wanting wanted
是 be（am） is was was was
是 be（is ） is was was was
`),
    ).toBe(`<script setup>
const statementData = [{"zh":"我","en":"I","kk":"/aɪ/"},{"zh":"我们自从2020年以来(已经)\\n学习英文了","en":"we have studied English since\\n2020","kk":"/wi/ /hæv/ /ˈstʌdid/ /ˈɪŋɡlɪʃ/ /sɪns/\\n/'twɛnti/ /'twɛnti/"}]
</script>

<StatementGroup :data="statementData" />

|中文|原形|第三人称单数|过去式|ing形式|ed形式|
|-|-|-|-|-|-|
|想要|want|wants|wanted|wanting|wanted|
|想要|want|wants|wanted|wanting|wanted|
|是|be（am）|is|was|was|was|
|是|be（is）|is|was|was|was|`);
  });

  it('read statements and table with mixins', () => {
    expect(
      parseTxtToPage(`
中文 英文 K.K.音标
我 I /aɪ/
喜欢 like /laɪk/
----------------
7
中文 原形 第三人称单数 过去式
想要 want wants wanted
喜欢 like /laɪk/
想要 want wants wanted
`),
    ).toBe(`<script setup>
const statementData = [{"zh":"我","en":"I","kk":"/aɪ/"},{"zh":"喜欢","en":"like","kk":"/laɪk/"},{"zh":"喜欢","en":"like","kk":"/laɪk/"}]
</script>

<StatementGroup :data="statementData" />

|中文|原形|第三人称单数|过去式|
|-|-|-|-|
|想要|want|wants|wanted|
|想要|want|wants|wanted|`);
  });
});
