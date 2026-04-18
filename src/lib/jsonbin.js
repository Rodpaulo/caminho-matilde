const BIN_ID = import.meta.env.VITE_BIN_ID;
const MASTER_KEY = import.meta.env.VITE_MASTER_KEY;
const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY;

console.log('BIN_ID:', BIN_ID);
console.log('MASTER_KEY first 10 chars:', MASTER_KEY?.substring(0, 10));
console.log('MASTER_KEY length:', MASTER_KEY?.length);

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Full read/write access — only Matilde's app uses this
export async function readBin() {
  const res = await fetch(`${BASE_URL}/latest`, {
    headers: { 'X-Master-Key': MASTER_KEY },
  });
  if (!res.ok) throw new Error(`Read failed: ${res.status}`);
  const json = await res.json();
  return json.record;
}

export async function writeBin(data) {
  const res = await fetch(BASE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('JSONBin write error body:', errorText);
    console.error('Key being sent ends with:', `"${MASTER_KEY?.slice(-5)}"`);
console.error('Key length:', MASTER_KEY?.length);
    throw new Error(`Write failed: ${res.status} — ${errorText}`);
  }
  return res.json();
}

// Read-only access for the follow page — ACCESS KEY, not master key
export async function readBinReadOnly() {
  const res = await fetch(`${BASE_URL}/latest`, {
    headers: { 'X-Access-Key': ACCESS_KEY },
  });
  if (!res.ok) throw new Error(`Read failed: ${res.status}`);
  const json = await res.json();
  return json.record;
}