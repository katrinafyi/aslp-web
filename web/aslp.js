/**
 * Supporting code to enable ASLp-in-JS. Handles input/output.
 */

import * as Comlink from "./lib/comlink.mjs";

/** Queries for a single matching element, asserting that at least one exists. */
const get = query => {
  const result = document.querySelector(query);
  console.assert(result, "query returned null: " + query);
  return result;
};


const form = get('#form');

const opcodeInput = get('#opcode');
const bytesInput = get('#bytes');
const asmInput = get('#asm');
const inputError = get('#inputerror');

const goButton = get('#go');

const debugInput = get('#debug');
const vectorCheckbox = get('#vectors');
const outputArea = get('#output');
const offlineOutputArea = get('#offlineoutput');
const loadingText = get('#loading');
const downloadButton = get('#dl');
const offlineDownloadButton = get('#dloff');
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


const _write = (isError, outputArea, isoffline) => s => requestAnimationFrame(() => {
  if (!s) return;
  const span = document.createElement('span');
  const data = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    data[i] = s.charCodeAt(i);
  }
  if (isoffline) {
    outputDataOffline.push(data);
  } else {
    outputData.push(data);
  }
  span.textContent = new TextDecoder('utf-8').decode(data);
  if (isError)
    span.classList.add('stderr');
  outputArea.appendChild(span);
  // console.log('recv', s);
  return 0;
});

const worker = Comlink.wrap(new Worker('worker.js'));
const stoneworker = Comlink.wrap(new Worker('worker-stone.js', { type: 'module' }));

await worker.boop(Comlink.proxy(console.log));


console.log('ready');


/**
 * OUTPUT INTERACTION (CLEAR, DOWNLOAD, SHARE)
 */

const outputData = [];
const outputDataOffline = [];
let previousOpcode = null;
let formData = null;

export const clearOutput = () => {
  outputData.length = 0;
  outputDataOffline.length = 0;
  previousOpcode = null;
  formData = null;
  outputArea.innerHTML = '';
  offlineOutputArea.innerHTML = '';
  dl.disabled = true;
  dloff.disabled = true;
  clearButton.disabled = true;
  shareButton.disabled = true;
  copyArea.value = '';
  goButton.disabled = false;
};

export const downloadOutput = (offline) => {return () => {
  const file = offline ? new Blob(outputDataOffline) : new Blob(outputData);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  const fname = offline ? "offline" : "online";
  a.setAttribute('download', `aslp_output_${previousOpcode}_${fname}.txt`);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}};

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
  clearOutput();

  try {
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

    await worker.init(
      Comlink.proxy((iserr, s) => _write(iserr, outputArea, false)(s))
    );
    await worker.dis(arg);
    await worker.init(
      Comlink.proxy((iserr, s) => _write(iserr, offlineOutputArea, true)(s))
    );
    await worker.offline(arg);

  } catch (e) {
    if (e instanceof Error) {
      _write(true, outputArea, false)(e.toString());
    } else {
      throw e;
    }
  } finally {
    dl.disabled = false;
    dloff.disabled = false;
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
  window.downloadOutput = downloadOutput

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
me(downloadButton).on('click', downloadOutput(false));
me(offlineDownloadButton).on('click', downloadOutput(true));
me(clearButton).on('click', clearOutput);


init();
