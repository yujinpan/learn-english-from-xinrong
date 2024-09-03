import { sync } from 'glob';
import { upperFirst } from 'lodash-es';
import { fileURLToPath } from 'node:url';
import path from 'path';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getSources() {
  const files = sync(path.resolve(__dirname, '../sources/*.pdf'));

  return files.map((item) => {
    const name = path.basename(item, path.extname(item));
    const filename = name + '.md';

    return {
      name: upperFirst(name),
      filename,
      path: item,
    };
  });
}
