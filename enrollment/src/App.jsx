import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard.jsx";
import StudentList from "./pages/StudentList.jsx";
import Curriculum from "./pages/Curriculum.jsx";
import SectionList from "./pages/SectionList.jsx";


function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/section" element={<SectionList />} />
        <Route path="/curriculum" element={<Curriculum />} />
      </Routes>
    </>
  );
}

export default App