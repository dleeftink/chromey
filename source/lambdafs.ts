// @ts-nocheck

import { createReadStream, createWriteStream, existsSync, exists } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { extract } from 'tar-fs';
import { /*createBrotliDecompress,*/ createUnzip } from 'node:zlib';

import { decompressBrotli } from 'brotli-compress/js'
import { Transform } from 'stream'; 

function existsAsync(path) {
  return new Promise(function(resolve, reject){
    exists(path, function(exists){
      resolve(exists);
    })
  })
}

function createBrotliTransform({highWaterMark = 2**21} = {}) { 

  function _transform(chunk, encoding, callback) {
    this.push(decompressBrotli(chunk));
    callback();
  }  

  function _flush(callback) {
    callback()
  }
  
  const tfm = new Transform({
    highWaterMark,
    transform: _transform,
    flush: _flush
  })

  return tfm
}

class LambdaFS {
  /**
   * Decompresses a (tarballed) Brotli or Gzip compressed file and returns the path to the decompressed file/folder.
   *
   * @param filePath Path of the file to decompress.
   */
  static inflate(filePath: string): Promise<string> {
    const output = filePath.includes("swiftshader") ? tmpdir() : join(tmpdir(), basename(filePath).replace(/[.](?:t(?:ar(?:[.](?:br|gz))?|br|gz)|br|gz)$/i, ''));

    return new Promise(async (resolve, reject) => {
      if (filePath.includes("swiftshader")) {
        if (await existsAsync(`${output}/libGLESv2.so`)) {
          return resolve(output);
        }
      } else {
        if (await existsAsync(output) === true) {
          return resolve(output);
        }
      }

      let source = createReadStream(filePath, { highWaterMark: 2 ** 23 });
      let target = null;

      if (/[.](?:t(?:ar(?:[.](?:br|gz))?|br|gz))$/i.test(filePath) === true) {
        target = extract(output);

        target.once('finish', () => {
          return resolve(output);
        });
      } else {
        target = createWriteStream(output, { mode: 0o700 });
      }

      source.once('error', (error: Error) => {
        return reject(error);
      });

      target.once('error', (error: Error) => {
        return reject(error);
      });

      target.once('close', () => {
        return resolve(output);
      });

      if (/(?:br|gz)$/i.test(filePath) === true) {
        source.pipe(/br$/i.test(filePath) 
          ? createBrotliTransform()
            // createBrotliDecompress({ chunkSize: 2 ** 21 }) 
          : createUnzip({ chunkSize: 2 ** 21 })).pipe(target);
      } else {
        source.pipe(target);
      }
    });
  }
}

export = LambdaFS;
