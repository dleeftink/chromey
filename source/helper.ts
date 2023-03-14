import { unlink } from 'node:fs';
import { https } from 'follow-redirects';
import { tmpdir } from 'node:os';
import { extract } from 'tar-fs';
import { parse } from 'node:url';
import type { UrlWithStringQuery } from 'node:url';

/*import * as BrowserFS from 'browserfs';

const fs = BrowserFS.BFSRequire('fs');

const { unlink } = fs;*/

interface FollowRedirOptions extends UrlWithStringQuery {
  maxBodyLength: number;
}

export const isValidUrl = (input: string) => {
  try {
    return !!new URL(input);
  } catch (err) {
    return false;
  }
};

export const downloadAndExtract = async (url: string) =>
  new Promise<string>((resolve, reject) => {
    const getOptions = parse(url) as FollowRedirOptions;
    getOptions.maxBodyLength = 60 * 1024 * 1024; // 60mb
    const destDir = `${tmpdir()}/chromium-pack`;
    console.log('setting up extractor at ' + destDir);
    const extractObj = extract(destDir);
    console.log('extract obj defined', extractObj);
    https
      .get(url, (response) => {
        console.log('piping web request');
        response.pipe(extractObj);
        console.log('piping web request intermediate step');
        extractObj.on('finish', () => {
          console.log('piping web request finished');
          resolve(destDir);
          console.log('piping web request resolved');
        });
      })
      .on('error', (err) => {
        console.log('web request error', err);
        unlink(destDir, (_) => {
          console.log('unlink error inside ' + destDir);
          reject(err);
        });
        console.log('unlink error at ' + destDir);
      });
  });
