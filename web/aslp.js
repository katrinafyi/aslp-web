/**
 * Supporting code to enable ASLp-in-JS. Handles input/output.
 */

const get = query => {
  const result = document.querySelector(query);
  console.assert(result, "query returned null: " + query);
  return result;
};

// XXX: cannot use worker due to worker stack size being too small
// const worker = new Worker('worker.js');

const form = get('#form');
const input = get('#op');
const output = get('#output');
const loading = get('#loading');
const download = get('#dl');
const clear = get('#clear');
const share = get('#share');


const OPCODE = 'opcode';
const BYTES = 'bytes';
let mode = OPCODE;

const flipEndian = s => {
  const chunked = s.match(/.{1,2}/g); // chunks of 2
  chunked.reverse();
  return chunked.join('');
};

// always returns BIG-endian string
const getOpcode = () => {
  const val = input.value.trim().replace(/^0x/, '').replace(/\s/g, '').padStart(8, '0');

  if (val.length > 8) throw Error('opcode too long. expected at most 8 hex chars but got ' + val.length);
  if (mode == OPCODE) return val;
  return flipEndian(val);
}

const setOpcodeMode = newMode => {
  if (mode != newMode) {
    const op = getOpcode();
    mode = newMode;

    if (mode == OPCODE) {
      input.value = '0x' + op.toLowerCase();
    } else {
      input.value = flipEndian(op).toUpperCase().match(/.{1,2}/g).join(' ');
    }
  }
};

const onChangeDebug = el => {
  libASL_web.setDebugLevel(parseInt(el.value, 10));
};

const outputData = [];
let previousOpcode = null;

const clearOutput = () => {
  outputData.length = 0;
  previousOpcode = null;
  output.innerHTML = '';
  dl.disabled = true;
  clear.disabled = true;
  share.disabled = true;
};

const downloadOutput = () => {
  const file = new Blob(outputData);

  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.setAttribute('download', `aslp_output_${previousOpcode}.txt`);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const shareLink = () => {
  const data = new FormData(form);
};

const submit = () => {
  clearOutput();
  loading.classList.remove('invisible');
  // defer computation so loading indicator shows.
  setTimeout(() => {
    try {
      previousOpcode = '0x' + getOpcode();
      libASL_web.dis(previousOpcode);
    } catch (e) {
      write(true)(e.toString());
    } finally {
      loading.classList.add('invisible');
      dl.disabled = false;
      clear.disabled = false;
      share.disabled = false;
    }
  }, 30);
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

const init = async () => {
  libASL_web.init(write(false), write(true));
  libASL_web.setDebugLevel(0);

  try {
    const resp = await fetch('aslp.heap');
    if (!resp.ok) throw new Error('fetch failure');
    const buf = await resp.arrayBuffer();
    const arr = new Uint8Array(buf);
    libASL_web.unmarshal(arr);
    console.log(`heap loaded: ${arr.length} bytes`);
  } catch (e) {
    console.warn('failed to fetch heap');
    console.warn(e);
  }
};

init();

