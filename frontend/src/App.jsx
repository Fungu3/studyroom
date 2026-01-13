import { Navigate, Route, Routes } from "react-router-dom";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rooms" replace />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
      <Route path="*" element={<Navigate to="/rooms" replace />} />
    </Routes>
  );
}
