/**
 * Supporting code to enable ASLp-in-JS. Handles input/output.
 */

import * as Comlink from "./lib/comlink.mjs";
import { makeAslpOutput } from "./aslp_output.js";

/** Queries for a single matching element, asserting that at least one exists. */
const get = query => {
  const result = document.querySelector(query);
  console.assert(result, "query returned null: " + query);
  return result;
};


const form = get('#form');

// inputs
const opcodeInput = get('#opcode');
const bytesInput = get('#bytes');
const asmInput = get('#asm');
const inputError = get('#inputerror');

// additional options
const vectorCheckbox = get('#vectors');
const debugInput = get('#debug');

// main buttons
const goButton = get('#go');
const loadingText = get('#loading');

// share buttons
const clearButton = get('#clear');
const shareButton = get('#share');
const copyArea = get('#copy');


/** Parses an integer while detecting suprious characters. */
const parseIntSafe = (s, radix) => {
  const x = parseInt(s, radix);
  if (isNaN(x)) throw new Error('parseInt returned NaN');
  if (radix === 16 && !s.match(/^[0-9a-fA-F]+$/)) throw new Error('invalid hexadecimal number');
  if (radix === 10 && !s.match(/^[0-9]+$/)) throw new Error('invalid decimal number');
  return x;
};

/** Wraps the given async function, enforcing mutual exclusion across calls to this function. */
const mutex = asyncfn => {
  let prev = Promise.resolve();

  const go = prev => async (...args) => {
    try { await prev; }
    finally { return asyncfn(...args); }
  };

  const wrapped = (...args) => {
    // successive calls to the wrapped function are forced
    // to wait for the completion of the (directly) prior call.
    prev = go(prev)(...args);
    return prev;
  };

  return wrapped;
};


const onlineOutput = makeAslpOutput('online', get('.online'), () => previousOpcode);
const offlineOutput = makeAslpOutput('offline', get('.offline'), () => previousOpcode);

const worker = Comlink.wrap(new Worker('worker.js'));
await worker.init(Comlink.proxy((iserr, s) => onlineOutput.write(iserr)(s)));
const offline = Comlink.wrap(new Worker('worker-offline.js'));
await offline.init(Comlink.proxy((iserr, s) => offlineOutput.write(iserr)(s)));

const stoneworker = Comlink.wrap(new Worker('worker-stone.js', { type: 'module' }));

await worker.boop(Comlink.proxy(console.log));


console.log('ready');


/**
 * OUTPUT INTERACTION (CLEAR, DOWNLOAD, SHARE)
 */

const outputDataOffline = [];
let previousOpcode = null;
let formData = null;

export const clearOutput = () => {
  outputDataOffline.length = 0;
  previousOpcode = null;
  formData = null;


  clearButton.disabled = true;
  shareButton.disabled = true;
  copyArea.value = '';

  onlineOutput.clear();
  offlineOutput.clear();
};

export const shareLink = () => {
  if (copyArea.value.trim() != '') {
    history.pushState({}, null, copyArea.value);

    copyArea.focus();
    copyArea.select();
    document.execCommand('copy');
  }
};

/**
 * SEMANTICS BUTTON CLICK AND OUTPUT WRITING
 */

export const submit = mutex(async () => {
  // console.log('a')
  onlineOutput.clear();

  previousOpcode = opcodeInput.value.trim();
  formData = new FormData(form);

  const params = new URLSearchParams(formData).toString();
  const url = new URL(window.location.href);
  url.search = '?' + params;

  copyArea.value = url.toString();

  const flag = bool => bool ? '+' : '-';

  const arg = {
    opcode: previousOpcode,
    debug: parseInt(debugInput.value),
    flags: [`${flag(vectorCheckbox.checked)}dis:vectors`], // TODO: generalise to more flags
  };

  try {
    onlineOutput.catch_errors(() => worker.dis(arg));
    offlineOutput.catch_errors(() => offline.dis(arg));
  } finally {
    onlineOutput.enable_download(true);
    offlineOutput.enable_download(true);

    clearButton.disabled = false;
    shareButton.disabled = false;
    // console.log('b')
  }
});


/**
 * OPCODE INPUT HANDLING
 */


const readInputs = async el => {
  // opcode as UInt8Array of bytes, in little-endian order
  let bytes = null;
  let err = null;
  try {

    if (el === opcodeInput) {
      let s = opcodeInput.value.trim()
        .replace(/^0x/, '')
        .padStart(8, '0')
        .match(/.{1,2}/g);
      bytes = new Uint8Array(s.map(x => parseIntSafe(x, 16)).reverse());

    } else if (el === bytesInput) {
      let s = bytesInput.value.trim()
        .replace(/\s/g, '')
        .padEnd(8, '0')
        .match(/.{1,2}/g);
      bytes = new Uint8Array(s.map(x => parseIntSafe(x, 16)));

    } else if (el === asmInput) {
      ({ bytes, err } = await stoneworker.asm2bytes(asmInput.value));
    }

  } catch (exn) {
    bytes = new Uint8Array([]);
    err = exn.toString();
  }

  if (bytes.length > 4) {
    err = "input too long";
  }

  return { bytes, err };
};

const synchroniseInputs = async (writeback, el) => {
  let { bytes, err } = await readInputs(el);

  console.assert(bytes !== null, 'assertion failure in oninput handler.');
  if (!bytes)
    return;

  const toHexByte = x => x.toString(16).padStart(2, '0');

  if (writeback || el !== opcodeInput) {
    const hex = Array.from(bytes).reverse().map(toHexByte).join('').toLowerCase();
    opcodeInput.value = hex !== '' ? `0x${hex}` : hex;
  }

  if (writeback || el !== bytesInput)
    bytesInput.value = Array.from(bytes).map(toHexByte).join(' ').toUpperCase();

  if (/* writeback || */ el !== asmInput) { // no writeback as it would delete the user's asm input
    let mnemonic = '';
    try {
      mnemonic = !err ? await stoneworker.bytes2asm(Comlink.transfer(bytes, [bytes.buffer])) : '';
    } catch (exn) {
      let s = exn.toString();
      if (s.includes('CS_ERR_OK'))
        s = 'no recognised instruction';
      err = err || s;
      // console.error('error in bytes2asm:', exn);
    }
    asmInput.value = mnemonic;
  }

  inputError.textContent = err ? `${el.id} input: ${err}` : '';
  // goButton.disabled = !!err;
  // console.log(bytes);
};


/**
 * INITIALISATION CODE ON STARTUP
 */

const HEAP = 'aslp.heap';
const fetchHeap = async () => {
  if (!window.caches) {
    console.warn('fallback to non-cached fetch');
    return fetch(HEAP);
  }

  const cache = await caches.open('aslp-web-' + window.location.pathname);

  if (await cache.match(HEAP) == null) {
    console.log('not cached');
    await cache.add(HEAP);
  } else {
    console.log('cached');
  }

  return cache.match(HEAP);
}

const init = async () => {

  window.submit = submit
  // window.setOpcodeMode = setOpcodeMode
  window.clearOutput = clearOutput
  window.shareLink = shareLink

  const urlData = new URLSearchParams(window.location.search);
  try {
    if (urlData.get('opcode') != null) opcodeInput.value = urlData.get('opcode');
    if (urlData.get('bytes') != null) bytesInput.value = urlData.get('bytes');
    if (urlData.get('asm') != null) asmInput.value = urlData.get('asm');
    if (urlData.get('debug') != null) debugInput.value = urlData.get('debug');
    if (urlData.get('vectors') != null) vectorCheckbox.checked = urlData.get('vectors') === 'on';
  } catch (exn) {
    console.error('exception during url loading:', exn);
  }

  const resp = await fetchHeap();
  if (!resp.ok) throw new Error('fetch failure');
  const buf = await resp.arrayBuffer();
  await worker.unmarshal(Comlink.transfer(buf));

  if (urlData.size > 0) {
    await submit();
  }
  loadingText.classList.add('invisible');
};


// XXX: not debounced because of race conditions...
const _debouncedSynchroniseInputs = ev => synchroniseInputs(false, ev.target);
any([opcodeInput, bytesInput, asmInput]).on('input', _debouncedSynchroniseInputs);
any([opcodeInput, bytesInput, asmInput]).on('change', _debouncedSynchroniseInputs);

me(form).on('submit', ev => { halt(ev); submit(ev); });

me(shareButton).on('click', shareLink);
me(clearButton).on('click', clearOutput);


init();
