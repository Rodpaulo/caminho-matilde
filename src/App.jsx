import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PilgrimApp from './pages/PilgrimApp';
import FollowPage from './pages/FollowPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PilgrimApp />} />
        <Route path="/follow/:token" element={<FollowPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Página não encontrada</h1>
      <p>Esta página não existe.</p>
    </div>
  );
}