async function inspectClientId() {
  const res = await fetch('https://login.anhanguera.com/assets/index-DUChME3K.js');
  const text = await res.text();

  const idxs = [];
  let pos = 0;
  while ((pos = text.indexOf('client_id', pos)) !== -1) {
    idxs.push(pos);
    pos += 9;
  }
  idxs.forEach((idx, i) => {
    console.log(`[${i}]`, text.slice(Math.max(0, idx - 50), idx + 150));
  });
}
inspectClientId();
