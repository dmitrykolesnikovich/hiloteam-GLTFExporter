export function lengthPad4(num: number) {
  if (num % 4 !== 0) {
    return num + 4 - (num % 4);
  }

  return num;
}

export function dataPad4(data: Uint8Array, padData = 0) {
  if (data.byteLength % 4 === 0) {
    return data;
  } else {
    let n = 4 - (data.length % 4);
    const res = new Uint8Array(data.length + n);
    res.set(data, 0);
    while (n) {
      n--;
      res[data.length + n] = padData;
    }
    return res;
  }
}
