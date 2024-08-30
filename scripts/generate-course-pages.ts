import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'path';
import PDFParser from 'pdf2json';

import { getSources } from './utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

build();

function build() {
  const coursesPath = path.resolve(__dirname, '../courses');

  fs.rmdirSync(coursesPath, { recursive: true });
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

function readPdfToTxt(pdf: string) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);

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
    } else if (isStatements(txt, index)) {
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
            return findNotSpace(txt, i + 2);
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

function isStatements(txt: string, index: number): boolean {
  if (txt.slice(index, index + tableTitle.length) === tableTitle) {
    return true;
  }
}
function readStatements(
  txt: string,
  index: number,
): { result: string; length: string } {
  const data: { zh: string; en: string; kk: string }[] = [];

  let i: number;

  for (i = index + tableTitle.length; i < txt.length; i++) {
    if (isBreak(txt, i)) {
      i += readBreak(txt, i).length - 1;
    } else if (/\n/.test(txt, i - 1) && !isSpace(txt, i)) {
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
    }
  }

  return {
    result: `<script setup>
const statementData = ${JSON.stringify(data)}
</script>

<StatementGroup :data="statementData" />`,
    length: i - index,
  };
}

function isTable(txt: string, index: number): boolean {}
function readTable(txt: string, index: number): string {}

function isZh(txt: string, index: number) {
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\xff]/.test(txt[index]);
}

function readZh(txt: string, index: number) {
  for (let i = index; i < txt.length; i++) {
    if (txt[i] === ' ') {
      return txt.slice(index, i);
    }
  }
  throw new Error(`Can not find ZH ending: ${txt.slice(index)}`);
}

function readEn(txt: string, index: number) {
  for (let i = index; i < txt.length; i++) {
    if (/\//.test(txt[i])) {
      return txt.slice(index, i);
    }
  }
  throw new Error(`Can not find EN ending: ${txt.slice(index)}`);
}

function readKk(txt: string, index: number, result = '') {
  for (let i = index; i < txt.length; i++) {
    if (txt[i] === '/') {
      const endingIndex = findEnding(txt, i + 1);
      if (endingIndex) {
        result += txt.slice(index, endingIndex + 1);
        return readKk(txt, endingIndex + 1, result);
      } else {
        return result;
      }
    } else if (!/\s/.test(txt[i])) {
      return result;
    }
  }
  return result;

  function findEnding(txt: string, index: number) {
    for (let i = index; i < txt.length; i++) {
      if (txt[i] === '/') return i;
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

function findNotSpace(txt: string, index: number) {
  for (let i = index; i < txt.length; i++) {
    if (!isSpace(txt, i)) return i;
  }
  return txt.length - 1;
}
