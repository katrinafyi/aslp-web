import './builder.bc.js';
import * as pako from './lib/pako.esm.mjs';

const IS_NODE = typeof self !== 'object';
const fs = IS_NODE ? await import('fs') : null;
const path = IS_NODE ? await import('path') : null;

export const marshal = () => {
  if (!IS_NODE) throw Error("marshalling only supported on node");

  console.log('marshalling aslp environment...');
  const arr = pako.gzip(libASL_builder.marshal(libASL_builder.force()));

  let marshalUrl;
  if (IS_NODE) {
    fs.writeFileSync('aslp.heap', Buffer.from(arr));
    marshalUrl = path.resolve('.', 'aslp.heap');

  } else {
    marshalUrl = URL.createObjectURL(
      new File(
        [arr],
        'aslp.heap',
        { lastModified: Date.now(), type: 'application/octet-stream' }));

  }
  console.log(marshalUrl);
};


export const unmarshal = async (/* ArrayBuffer */ buf) => {
  try {
    const arr = pako.ungzip(new Uint8Array(buf));

    libASL_web.unmarshal(arr);
    console.log(`heap loaded: ${arr.length} bytes, ${buf.byteLength} compressed`);

  } catch (e) {
    console.warn('failed to fetch heap');
    console.warn(e);
  }
};

if (IS_NODE) {
  marshal();
}
