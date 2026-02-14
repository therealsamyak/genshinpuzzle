import { Routes, Route, Navigate } from "react-router-dom";
import DailyPuzzle from "./components/DailyPuzzle";
import SubmitDummy from "./components/SubmitDummy";
import Roadmap from "./components/Roadmap";
import Footer from "./components/Footer";
import OptionsPage from "./components/OptionsPage";


function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<DailyPuzzle />} />
          <Route path="/endless" element={<DailyPuzzle mode="endless" />} />
          <Route path="/options" element={<OptionsPage />} />
          <Route path="/submit" element={<SubmitDummy />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
