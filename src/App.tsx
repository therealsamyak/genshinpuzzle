import { Routes, Route, Navigate } from "react-router-dom";
import DailyPuzzle from "./components/DailyPuzzle";
import SubmitDummy from "./components/SubmitDummy";
import Roadmap from "./components/Roadmap";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DailyPuzzle />} />
      <Route path="/submit" element={<SubmitDummy />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
