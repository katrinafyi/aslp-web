importScripts('js.bc.js', 'pako.min.js', 'cache.js');

const init = (async () => {
  libASL_web.init(
    s => postMessage(['out', s]),
    s => postMessage(['err', s]));
})();

let resolveCached;
const cached = new Promise((resolve) => {
  resolveCached = () => {
    resolve();
    postMessage(['rdy', 'x']);
  };
});

onmessage = async (message) => {
  try {
    console.log('worker:', message.data);

    await init;
    const [cmd, arg] = message.data;

    if (cmd === 'unmarshal') {
      unmarshal(arg);
      resolveCached();
    } else if (cmd === 'dis') {
      await cached;
      const {opcode, debug} = arg;
      libASL_web.setDebugLevel(debug);
      libASL_web.dis(opcode);
    } else {
      throw new Error('unrecognised worker command: ' + message.cmd, message.data);
    }
    
  } catch (e) {
    const s = (e instanceof Error)
      ? e.toString()
      : libASL_web.printException(e);
    postMessage(['err', s]);

    if (e instanceof Error) {
      throw e;
    }
  } finally {
    if (message.data[0] === 'dis') postMessage(['fin', 'x']);
  }
}
