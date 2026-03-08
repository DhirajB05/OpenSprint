import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Loading from './pages/Loading';
import Results from './pages/Results';
import MemeEditor from './pages/MemeEditor';
import RoastCard from './pages/RoastCard';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/results" element={<Results />} />
        <Route path="/meme" element={<MemeEditor />} />
        <Route path="/card" element={<RoastCard />} />
      </Routes>
    </BrowserRouter>
  );
}
