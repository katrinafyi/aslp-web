/**
 * Supporting code to enable ASLp-in-JS. Handles input/output.
 */

import ks from "./keystone-aarch64.min.js"

const get = query => {
  const result = document.querySelector(query);
  console.assert(result, "query returned null: " + query);
  return result;
};


const assembler = new ks.Keystone(ks.ARCH_ARM64, ks.MODE_LITTLE_ENDIAN);

const assembly = (assembly) => {
  return assembler.asm(assembly, 0)
};


const worker = new Worker('worker.js');
// worker.postMessage('a');
worker.onmessage = e => {
  // console.log(e.data);
  const [stream, message] = e.data;
  // if (stream === 'exn') throw message;
  if (stream === 'rdy') {
    console.log('ready:', e.data);
    loading.classList.add('invisible');
  } else if (stream === 'fin') {
    console.log('finish:', e.data);
    dl.disabled = false;
    clear.disabled = false;
    share.disabled = false;
  } else if (stream === 'err' || stream === 'out') {
    requestAnimationFrame(() => write(stream === 'err')(message));
  } else {
    console.error('unknown:', e.data);
  }
};

const form = get('#form');
const input = get('#op');
const debug = get('#debug');
const output = get('#output');
const loading = get('#loading');
const download = get('#dl');
const clear = get('#clear');
const share = get('#share');
const copyarea = get('#copy');

import MKeystone from "./keystone-aarch64.min.js"

const OPCODE = 'opcode';
const BYTES = 'bytes';
const ASMINTEL = 'asm';
let mode = OPCODE;
//assembler.option(ks.OPT_SYNTAX, ks.OPT_SYNTAX_INTEL);

const flipEndian = s => {
  const chunked = s.match(/.{1,2}/g); // chunks of 2
  chunked.reverse();
  return chunked.join('');
};

// always returns BIG-endian string
const getOpcode = () => {
  if (mode == OPCODE || mode == BYTES) {
    const val = input.value.trim().replace(/^0x/, '').replace(/\s/g, '').padStart(8, '0');

    if (val.length > 8) throw Error('opcode too long. expected at most 8 hex chars but got ' + val.length);
    if (mode == OPCODE) return val;
    document.getElementById("dispopcode").innerText = ""
    return flipEndian(val);
  } else {
    try {
      const res = assembly(input.value.trim())
      console.log("Assembly: ", res)
      if (res.failed) {
        var msg  = MKeystone.strerror(assembler.errno())
        throw ("Assembly failed (error " + assembler.errno() + ") " + msg)
      } 
      const opcode = Array.from(res.mc.reverse()).map(x => x.toString(16).padStart(2, '0')).join("");
      document.getElementById("dispopcode").innerText = "0x" + opcode
      return opcode;
    } catch (e) {
      document.getElementById("dispopcode").innerText = e
      return "00000000";
    }
  }
}


const setOpcodeMode = newMode => {
  const op = getOpcode();
  if (mode != newMode) {
    mode = newMode;

    if (mode == OPCODE) {
      input.value = op.toLowerCase();
    } else if (mode == BYTES) {
      input.value = flipEndian(op).toUpperCase().match(/.{1,2}/g).join(' ');
    } else {
      input.value = "";
    }
  }
};

const outputData = [];
let previousOpcode = null;
let formData = null;

export const clearOutput = () => {
  outputData.length = 0;
  previousOpcode = null;
  formData = null;
  output.innerHTML = '';
  dl.disabled = true;
  clear.disabled = true;
  share.disabled = true;
  copyarea.value = '';
};

export const downloadOutput = () => {
  const file = new Blob(outputData);

  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.setAttribute('download', `aslp_output_${previousOpcode}.txt`);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const shareLink = () => {
  if (copyarea.value.trim() != '') {
    history.pushState({}, null, copyarea.value);

    copyarea.focus();
    copyarea.select();
    document.execCommand('copy');
  }
};

export const submit = () => {
  clearOutput();

  try {
    previousOpcode = '0x' + getOpcode();
    formData = new FormData(form);

    const params = new URLSearchParams(formData).toString();
    const url = new URL(window.location.href);
    url.search = '?' + params;

    copyarea.value = url.toString();

    const arg = {opcode: previousOpcode, debug: parseInt(debug.value)};
    worker.postMessage(['dis', arg]);

  } catch (e) {
    if (e instanceof Error) {
      write(true)(e.toString());
    } else {
      throw e;
    }
  } finally { }
};

const write = (isError) => s => {
  const span = document.createElement('span');
  const data = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    data[i] = s.charCodeAt(i);
  }
  outputData.push(data);
  span.textContent = new TextDecoder('utf-8').decode(data);
  if (isError)
    span.classList.add('stderr');
  output.appendChild(span);
  return 0;
};


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
  window.setOpcodeMode = setOpcodeMode
  window.clearOutput = clearOutput 
  window.shareLink = shareLink 
  window.downloadOutput= downloadOutput

  const resp = await fetchHeap();
  if (!resp.ok) throw new Error('fetch failure');
  const buf = await resp.arrayBuffer();
  worker.postMessage(['unmarshal', buf]);

  try {
    const urlData = new URLSearchParams(window.location.search);
    if (urlData.get('mode') != null) get(`input[name="mode"][value="${urlData.get('mode')}"]`).checked = true;
    if (urlData.get('mode') != null) setOpcodeMode(urlData.get('mode'))
    if (urlData.get('op') != null) op.value = urlData.get('op');
    if (urlData.get('debug') != null) debug.value = urlData.get('debug');
    if (urlData.size > 0) {
      submit();
    }
  } finally { }

};

init();

