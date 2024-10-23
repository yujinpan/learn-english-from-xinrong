import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'path';

import { getPdfTextContent } from './pdf';
import { getSources } from './utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

build();

function build() {
  const coursesPath = path.resolve(__dirname, '../courses');

  if (fs.existsSync(coursesPath)) {
    fs.rmSync(coursesPath, { recursive: true });
  }
  fs.mkdirSync(coursesPath);

  const sources = getSources();

  sources.forEach(async (item) => {
    const txt = await getPdfTextContent(item.path);
    const page = parseTxtToPage(txt);

    fs.writeFileSync(path.resolve(coursesPath, item.filename + '.txt'), txt);
    fs.writeFileSync(
      path.resolve(coursesPath, item.filename),
      `# ${item.name}\n\n${page}`,
    );
  });

  const index = sources
    .map((item) => {
      return `- [${item.name}](${item.filename})`;
    })
    .join('\n');

  fs.writeFileSync(
    path.resolve(coursesPath, 'index.md'),
    `# Courses\n\n${index}`,
  );
}

export function parseTxtToPage(txt: string) {
  let result = '';

  let index = 0;

  while (index < txt.length) {
    if (isBreak(txt, index)) {
      index += readBreak(txt, index).length;
    } else if (isStatementsTitle(txt, index)) {
      index += tableTitle.length;

      const { result: result1, length } = readStatements(txt, index);

      result += result1;
      index += length;
    } else if (isSpace(txt, index)) {
      const space = readSpace(txt, index);

      if (space.length === 1) {
        result += txt[index];
      } else {
        result += isSpaceLine(space)
          ? '\n\n'
          : space.includes('\n')
            ? '\n'
            : ' ';
      }

      index += space.length;
    } else if (isTable(txt, index)) {
      const table = readTable(txt, index);
      result += table.result;
      index += table.length;
    } else {
      result += txt[index];
      index++;
    }
  }

  return result.trim();
}

function isBreak(txt: string, index: number) {
  for (let i = index; i < index + 16; i++) {
    if (txt[i] !== '-') return false;
  }
  return true;
}

function readBreak(txt: string, index: number): string {
  return txt.slice(index, findNum(txt, index + 16));

  function findNum(txt: string, index: number) {
    for (let i = index; i < txt.length; i++) {
      if (/\d/.test(txt[i]) && txt[i + 1] === '\n') {
        return i + 1;
      }
    }
    return txt.length - 1;
  }
}

const tableTitle = '中文 英文 K.K.音标';

function isStatementsTitle(txt: string, index: number) {
  if (txt.slice(index, index + tableTitle.length) === tableTitle) {
    return true;
  }
}

function readStatements(
  txt: string,
  index: number,
  // mixed table rows
  _tableColumnsLen?: number,
): {
  data: { zh: string; en: string; kk: string }[];
  result: string;
  length: number;
} {
  const data: { zh: string; en: string; kk: string }[] = [];

  let i: number;

  for (i = index; i < txt.length; i++) {
    if (isBreak(txt, i)) {
      i += readBreak(txt, i).length - 1;
    } else if (
      /\n/.test(txt[i - 1]) &&
      !isSpace(txt, i) &&
      txt.slice(i, i + 5) !== '中文 原形' &&
      txt.slice(i, i + 5) !== '中⽂ 原形' &&
      readTableRow(txt, i).result.length !== _tableColumnsLen
    ) {
      let current = i;
      try {
        const zh = readZh(txt, current);
        current += zh.length;
        const en = readEn(txt, current);
        current += en.length;
        const kk = readKk(txt, current);
        current += kk.length - 1;
        data.push({ zh: zh.trim(), en: en.trim(), kk: kk.trim() });

        i = current;
      } catch (e) {
        break;
      }
    } else if (!isSpace(txt, i)) {
      break;
    }
  }

  // Some content is wrong, table rows and statements are mixed
  let count = 0;
  for (let j = i; j < txt.length; j++) {
    if (isBreak(txt, j)) {
      if (count > 1) {
        txt = txt.slice(0, j);
        break;
      }
      count++;
    }
  }

  if (i !== index) {
    for (let j = i; j < txt.length; j++) {
      if (txt[j - 1] === '\n') {
        let tableColumnsLen: number | undefined;

        // remove table first
        if (isTable(txt, j)) {
          const table = readTable(txt, j, false);
          j += table.length;
          tableColumnsLen = table.head.length;
        }

        const mixedData = readStatements(
          txt,
          j,
          tableColumnsLen || _tableColumnsLen,
        );

        if (mixedData.data.length) {
          data.push(...mixedData.data);
        }
        j += mixedData.length;
      }
    }
  }

  return {
    data,
    result: `<script setup>
const statementData = ${JSON.stringify(data)}
</script>

<StatementGroup :data="statementData" />\n\n`,
    length: i - index,
  };
}

function isTable(txt: string, index: number) {
  // [文] is difference
  if (
    txt.slice(index, index + 5) === '中文 原形' ||
    txt.slice(index, index + 5) === '中⽂ 原形'
  ) {
    try {
      return isTableRows(txt, index);
    } catch (e) {
      return false;
    }
  }

  function isTableRows(txt: string, index: number, count = 2, _len?: number) {
    if (!isBreak(txt, index)) {
      const row = readTableRow(txt, index);
      if (row.result.length > 2) {
        if (!_len || row.result.length === _len) {
          if (count > 1) {
            return isTableRows(
              txt,
              index + row.length,
              count - 1,
              row.result.length,
            );
          } else {
            return true;
          }
        }
      }
    }
  }
}
function readTableRow(
  txt: string,
  index: number,
): { result: string[]; length: number } {
  let result = '';
  for (let i = index; i < txt.length; i++) {
    if (
      (txt[i] === '\n' && txt[i - 1] !== '；' && /\D/.test(txt[i - 1])) ||
      i === txt.length - 1
    ) {
      return {
        result: result.trim().split(' '),
        length: i - index + 1,
      };
    } else if (
      txt[i] === ' ' &&
      (txt[i + 1] === ')' ||
        txt[i + 1] === '）' ||
        ((txt.slice(i - 3, i) === 'ing' || txt.slice(i - 2, i) === 'ed') &&
          txt.slice(i + 1, i + 3) === '形式'))
    ) {
      continue;
    } else if (txt[i] === '\n') {
      continue;
    } else if (txt[i] !== ' ') {
      if (
        isZh(txt, i - 1) &&
        txt[i - 1] !== '（' &&
        txt[i - 1] !== '）' &&
        /[a-z]/i.test(txt[i])
      ) {
        result += ' ';
      }
    }

    result += txt[i];
  }
  throw new Error(`Can not find TableRow ending: ${txt.slice(index)}`);
}
function readTable(
  txt: string,
  index: number,
  _skipMixed = true,
  _headRow?: { result: string[]; length: number },
): { head: string[]; body: string[][]; result: string; length: number } {
  const headRow = _headRow || readTableRow(txt, index);
  const { result: head, length } = headRow;

  const body: string[][] = [];
  let i: number;
  for (i = index + (_headRow ? 0 : length); i < txt.length; i++) {
    if (isBreak(txt, i)) {
      i += readBreak(txt, i).length - 1;
    } else {
      try {
        const { result, length } = readTableRow(txt, i);
        if (result.length === head.length) {
          body.push(result);
          i += length - 1;
        } else {
          if (_skipMixed) {
            const statements = readStatements(txt, i, head.length);
            if (statements.length) {
              const index = i + statements.length;
              const table = readTable(txt, index, _skipMixed, headRow);
              if (table.head.length === head.length) {
                body.push(...table.body);
                i += index + table.length;
              }
            }
          }
          break;
        }
      } catch (e) {
        break;
      }
    }
  }

  const tableHead = '|' + head.join('|') + '|\n';
  const tableDivide = '|' + head.map(() => '-').join('|') + '|\n';
  const tableBody = body
    .map((item) => {
      return '|' + item.join('|') + '|\n';
    })
    .join('');

  return {
    head,
    body,
    result: tableHead + tableDivide + tableBody,
    length: i - index,
  };
}

function isZh(txt: string, index: number) {
  // eslint-disable-next-line no-control-regex
  return /[\u4e00-\u9fa5]/.test(txt[index]);
}

function readZh(txt: string, index: number) {
  for (let i = index; i < txt.length; i++) {
    if ((txt[i - 1] === ' ' || txt[i - 1] === '\n') && /[a-z]/i.test(txt[i])) {
      return txt.slice(index, i);
    }
  }
  throw new Error(`Can not find ZH ending: ${txt.slice(index)}`);
}

function readEn(txt: string, index: number) {
  let result = '';
  for (let i = index; i < txt.length; i++) {
    // eslint-disable-next-line no-misleading-character-class
    if (/[a-z'\s\w ́´？?…,]/i.test(txt[i])) {
      result += txt[i];
    } else {
      break;
    }
  }

  if (!result.trim()) {
    throw new Error(`Can not find EN ending: ${txt.slice(index)}`);
  } else {
    return result;
  }
}

function readKk(txt: string, index: number, result = '') {
  for (let i = index; i < txt.length; i++) {
    if (!result && txt[i] !== '/') {
      if (!isSpace(txt, i - 2) && isSpace(txt, i - 1) && !isSpace(txt, i)) {
        return '';
      } else if (isValid(txt, i)) {
        // "/ju" or "ju/" is valid
      } else {
        break;
      }
    } else if (isSpace(txt, i)) continue;

    if (isValid(txt, i)) {
      const endingIndex = findEnding(txt, i + 1);
      if (endingIndex) {
        result += txt.slice(index, endingIndex + 1);
        return readKk(txt, endingIndex + 1, result);
      } else {
        break;
      }
    } else if (!isSpace(txt, i)) {
      break;
    }
  }

  if (!result) throw new Error(`Can not find KK ending: ${txt.slice(index)}`);

  return result;

  function findEnding(txt: string, index: number) {
    for (let i = index; i < txt.length; i++) {
      if (txt[i] === '/' || isSpace(txt, i) || i === txt.length - 1) return i;
    }
  }

  function isValid(txt: string, index: number) {
    for (let i = index; i < txt.length; i++) {
      if (isSpace(txt, i)) return false;
      if (txt[i] === '/') return true;
    }
  }
}

function isSpace(txt: string, index: number) {
  return /\s/.test(txt[index]);
}

function isSpaceLine(txt: string) {
  let result = 0;
  for (let i = 0; i < txt.length; i++) {
    if (txt[i] === '\n') {
      if (++result === 2) {
        return true;
      }
    }
  }
}

function readSpace(txt: string, index: number) {
  for (let i = index; i < txt.length; i++) {
    if (!isSpace(txt, i)) {
      return txt.slice(index, i);
    }
  }
  return txt.slice(index);
}
