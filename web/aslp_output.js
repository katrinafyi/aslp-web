export function makeAslpOutput(label, container, previousOpcode)  {

  const outputArea = container.querySelector('.output');
  const downloadButton = container.querySelector('.dl');
  console.assert(outputArea);
  console.assert(downloadButton);

  const outputData = [];

  const write = isError => s => requestAnimationFrame(() => {
    if (!s) return;
    const span = document.createElement('span');
    const data = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      data[i] = s.charCodeAt(i);
    }
    outputData.push(data);
    span.textContent = new TextDecoder('utf-8').decode(data);
    if (isError)
      span.classList.add('stderr');
    outputArea.appendChild(span);
    // console.log('recv', s);
    return 0;
  });

  const clear = () => {
    outputData.length = 0;
    outputArea.innerHTML = '';
    downloadButton.disabled = true;
  };


  const downloadOutput = () => {
    const file = new Blob(outputData);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.setAttribute('download', `aslp_output_${previousOpcode()}_${label}.txt`);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  downloadButton.addEventListener('click', downloadOutput);

  const enable_download = x => {
    downloadButton.disabled = !x;
  }

  const catch_errors = async f => {
    try {
      return await f();
    } catch (e) {
      if (e instanceof Error) {
        write(true)(e.toString());
      } else {
        throw e;
      }
    }
  };

  return {
    write,
    clear,
    catch_errors,
    enable_download
  };
}
