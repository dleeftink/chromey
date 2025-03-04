// @ts-nocheck

import * as fs from 'node:fs';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  exists,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { extract } from 'tar-fs';
import { /*createBrotliDecompress,*/ createUnzip } from 'node:zlib';

import { decompress } from 'brotli-compress/js';
import { Transform } from 'stream';

function existsAsync(path) {
  return new Promise(function (resolve, reject) {
    exists(path, function (exists) {
      resolve(exists);
    });
  });
}

function createBrotliTransform({ highWaterMark = 2 ** 26 } = {}) {
  function _transform(chunk, encoding, callback) {
    console.log('brotli at ', chunk, encoding);
    this.push(/*decompress*/(chunk));
    callback();
  }

  function _flush(callback) {
    callback();
  }

  const tfm = new Transform({
    highWaterMark,
    transform: _transform,
    flush: _flush,
  });

  return tfm;
}

function tarFsWriteStreamFactory(name) {
  return createWriteStream(name, { highWaterMark: 2 ** 26 });
}

class LambdaFS {
  /**
   * Decompresses a (tarballed) Brotli or Gzip compressed file and returns the path to the decompressed file/folder.
   *
   * @param filePath Path of the file to decompress.
   */
  static inflate(filePath: string): Promise<string> {
    const output = filePath.includes('swiftshader')
      ? tmpdir()
      : join(
          tmpdir(),
          basename(filePath).replace(
            /[.](?:t(?:ar(?:[.](?:br|gz))?|br|gz)|br|gz)$/i,
            ''
          )
        );

    return new Promise(async (resolve, reject) => {
      if (filePath.includes('swiftshader')) {
        if (await existsAsync(`${output}/libGLESv2.so`)) {
          console.log('looking for libGLESv2.so');
          return resolve(output);
        }
      } else {
        if ((await existsAsync(output)) === true) {
          console.log('looking for ' + output);
          return resolve(output);
        }
      }

      console.log('setting up source + target');

      let source = createReadStream(filePath, { highWaterMark: 2 ** 26 });
      console.log('read stream created');
      let target = null;

      console.log('source + target defined');

      if (/[.](?:t(?:ar(?:[.](?:br|gz))?|br|gz))$/i.test(filePath) === true) {
        console.log('extraction started');
        target = extract(output, {
          fs: { ...fs, createWriteStream: tarFsWriteStreamFactory },
        });

        target.once('finish', () => {
          console.log('extraction completed');
          return resolve(output);
        });
      } else {
        console.log('write stream created');
        target = createWriteStream(output, {
          mode: 0o700,
          highWaterMark: 2 ** 26,
        });
      }

      source.once('error', (error: Error) => {
        return reject(error);
      });

      target.once('error', (error: Error) => {
        return reject(error);
      });

      target.once('close', () => {
        console.log('target finished');
        return resolve(output);
      });

      if (/(?:br|gz)$/i.test(filePath) === true) {
        source.pipe(
          /br$/i.test(filePath)
            ? (console.log('init brotli'), createBrotliTransform())
            : // createBrotliDecompress({ chunkSize: 2 ** 21 })
              (console.log('init unzip'),
              createUnzip({ chunkSize: 2 ** 26 })).pipe(target)
        );
      } else {
        console.log('init source -> target pipe');
        source.pipe(target);
      }
    });
  }
}

export = LambdaFS;
