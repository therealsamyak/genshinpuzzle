import { Routes, Route, Navigate } from "react-router-dom";
import DailyPuzzle from "./components/DailyPuzzle";
import SubmitDummy from "./components/SubmitDummy";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DailyPuzzle />} />
      <Route path="/submit" element={<SubmitDummy />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
