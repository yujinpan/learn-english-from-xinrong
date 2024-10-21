import * as fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export function getPdfTextContent(filePath: string) {
  const line = '\n' + Array(16).fill('-').join('') + '\n';

  return getDocument({
    data: new Uint8Array(fs.readFileSync(filePath)),
  }).promise.then(async (res) => {
    let result = '';
    for (let i = 1; i <= res.numPages; i++) {
      result +=
        (await res
          .getPage(i)
          .then((res) =>
            res
              .getTextContent()
              .then((res) =>
                res.items
                  .map((item) =>
                    'str' in item
                      ? item.str + (item.hasEOL ? '\n' : '')
                      : '123',
                  )
                  .join(''),
              ),
          )) + line;
    }
    return result;
  });
}
