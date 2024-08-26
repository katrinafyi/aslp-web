import * as Comlink from './lib/comlink.mjs';
import ks from './lib/keystone-aarch64.min.js';
import cs from './lib/capstone-arm64.min.js';

const keystone = new ks.Keystone(ks.ARCH_ARM64, ks.MODE_LITTLE_ENDIAN);
const capstone = new cs.Capstone(cs.ARCH_ARM64, cs.MODE_LITTLE_ENDIAN);
console.log('stones:', keystone, capstone);

const memo = {
  asm2bytes: {},
  bytes2asm: {},
};

const _sep = Math.random().toString();

const memoise = (key, preprocess, f) => (...args) => {
  const argskey = (preprocess ? args.map(preprocess) : args).join(_sep);

  const old = memo[key][argskey];
  memo[key][argskey] = (old === undefined ? f(...args) : old);
  // console.log(memo);
  return memo[key][argskey];
}

const preprocessAsm = s => s.toLowerCase().replace(/\s+/g, ' ').replace(/, /g, ',').trim();

const methods = {
  asm2bytes: memoise('asm2bytes', preprocessAsm, (asm) => {
    let bytes = new Uint8Array([]);
    let err = null;

    const result = keystone.asm(asm, 0);

    if (result.failed) {
      const errno = keystone.errno();
      const msg = ks.strerror(errno);
      err = `${msg}`;
    } else {
      bytes = result.mc;
    }
    // console.log(ks.strerror(assembler.errno()));

    return {
      bytes,
      err
    };
  }),

  bytes2asm: memoise('bytes2asm', null, (uint8array) => {
    const isns = capstone.disasm(uint8array, 0);
    const mnemonic = isns[0].mnemonic + ' ' + isns[0].op_str;

    return mnemonic;
  }),

};

Comlink.expose(methods);

