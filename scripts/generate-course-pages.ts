import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'path';
import PDFParser from 'pdf2json';

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
    const txt = await readPdfToTxt(item.path);
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

function readPdfToTxt(pdf: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(undefined, true);

    pdfParser.on('pdfParser_dataError', (errData) =>
      reject(errData.parserError),
    );
    pdfParser.on('pdfParser_dataReady', () => {
      resolve(pdfParser.getRawTextContent());
    });

    pdfParser.loadPDF(pdf);
  });
}

export function parseTxtToPage(txt: string) {
  let result = '';

  let index = 0;

  while (index < txt.length) {
    if (isBreak(txt, index)) {
      index += readBreak(txt, index).length;
    } else if (isStatementsTitle(txt, index)) {
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
  for (let i = index + 16; i < txt.length; i++) {
    if (isBreak(txt, i)) {
      return txt.slice(index, findNum(txt, i + 16));
    }
  }

  throw new Error(`Can not find break ending: ${txt.slice(index)}`);

  function findNum(txt: string, index: number) {
    for (let i = index; i < txt.length; i++) {
      if (!isSpace(txt, i)) {
        if (/\d/.test(txt[i])) {
          if (isSpace(txt, i + 1)) {
            return findNotSpace(txt, i + 1);
          }
        } else {
          return i;
        }
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
): { result: string; length: number } {
  const data: { zh: string; en: string; kk: string }[] = [];

  let i: number;

  for (i = index + tableTitle.length; i < txt.length; i++) {
    if (isBreak(txt, i)) {
      i += readBreak(txt, i).length - 1;
    } else if (/\n/.test(txt[i - 1]) && !isSpace(txt, i)) {
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

  return {
    result: `<script setup>
const statementData = ${JSON.stringify(data)}
</script>

<StatementGroup :data="statementData" />\n\n`,
    length: i - index,
  };
}

function isTable(txt: string, index: number) {
  if (txt[index - 1] === '\n' && !isSpace(txt, index)) {
    try {
      const row1 = readTableRow(txt, index);
      if (row1.result.length > 2) {
        if (!isBreak(txt, index + row1.length)) {
          const row2 = readTableRow(txt, index + row1.length);
          if (row2.result.length > 2) {
            if (row1.result.length === row2.result.length) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      return false;
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
      (txt[i] === '\n' &&
        (txt.slice(i - 2, i) === ' \r' || txt[i - 1] === ' ')) ||
      (txt[i] === ' ' && i === txt.length - 1)
    ) {
      return {
        result: result.trim().split(' '),
        length: i - index + 1,
      };
    } else if (txt[i] === ' ' && txt[i + 1] === ')') {
      continue;
    } else if (txt[i] === '\n' || txt[i] === '\r') {
      continue;
    } else if (txt[i] !== ' ') {
      if (isZh(txt, i - 1) && /[a-z]/i.test(txt[i])) {
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
): { result: string; length: number } {
  const { result: head, length } = readTableRow(txt, index);

  const body: string[][] = [];
  let i: number;
  for (i = index + length; i < txt.length; i++) {
    if (isBreak(txt, i)) {
      i += readBreak(txt, i).length - 1;
    } else {
      try {
        const { result, length } = readTableRow(txt, i);
        if (result.length === head.length) {
          body.push(result);
          i += length - 1;
        } else {
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
    result: tableHead + tableDivide + tableBody,
    length: i - index,
  };
}

function isZh(txt: string, index: number) {
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\xff]/.test(txt[index]);
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
    if (/[a-z'\s\w ́]/i.test(txt[i])) {
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
    if (isSpace(txt, i)) continue;

    if (!result && txt[i] !== '/') {
      if (isTwoSpaceNewLine(txt, i - 3)) {
        return '';
      } else if (isValid(txt, i)) {
        // "/ju" or "ju/" is valid
      } else {
        break;
      }
    }

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

function isSpaceNotEmpty(txt: string, index: number) {
  return /[\f\n\r\t\v]/.test(txt[index]);
}

function isTwoSpace(txt: string, index: number) {
  return isSpace(txt, index) && isSpace(txt, index + 1);
}

function isTwoSpaceNewLine(txt: string, index: number) {
  return isTwoSpace(txt, index) && isSpaceNotEmpty(txt, index + 2);
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

function findNotSpace(txt: string, index: number) {
  for (let i = index; i < txt.length; i++) {
    if (!isSpace(txt, i)) return i;
  }
  return txt.length - 1;
}
