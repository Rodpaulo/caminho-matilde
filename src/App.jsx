import { useState } from 'react';
import { uploadToCloudinary } from './lib/cloudinary';

export default function App() {
  const [url, setUrl] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('uploading');
    setError(null);
    setUrl(null);

    try {
      const secureUrl = await uploadToCloudinary(file);
      setUrl(secureUrl);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Cloudinary upload test</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <p><strong>Status:</strong> {status}</p>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      {url && (
        <>
          <p><strong>Upload succeeded.</strong></p>
          <p><a href={url} target="_blank" rel="noopener">{url}</a></p>
          <img src={url} alt="uploaded" style={{ maxWidth: 400, marginTop: 20, border: '1px solid #ccc' }} />
        </>
      )}
    </div>
  );
}