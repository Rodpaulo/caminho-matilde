import { useParams } from 'react-router-dom';

export default function FollowPage() {
  const { token } = useParams();

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Follow Page</h1>
      <p>Your read-only view will live here.</p>
      <p style={{ color: '#666', fontSize: 14 }}>
        Route: <code>/follow/:token</code>
      </p>
      <p style={{ color: '#666', fontSize: 14 }}>
        Token from URL: <strong>{token}</strong>
      </p>
    </div>
  );
}