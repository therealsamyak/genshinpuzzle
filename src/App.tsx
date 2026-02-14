import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";

const DailyPuzzle = lazy(() => import("./components/DailyPuzzle"));
const SubmitDummy = lazy(() => import("./components/SubmitDummy"));
const Roadmap = lazy(() => import("./components/Roadmap"));

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<DailyPuzzle />} />
            <Route path="/endless" element={<DailyPuzzle mode="endless" />} />
            <Route path="/submit" element={<SubmitDummy />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

export default App;
