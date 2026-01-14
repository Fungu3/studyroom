import { Navigate, Route, Routes } from "react-router-dom";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PersonalCenterPage from "./pages/PersonalCenterPage";
import MainLayout from "./components/MainLayout";

// Wrapper for pages with Main Layout
const LayoutWrapper = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/rooms" element={
        <LayoutWrapper>
          <RoomsPage />
        </LayoutWrapper>
      } />
      
      <Route path="/personal" element={
        <LayoutWrapper>
          <PersonalCenterPage />
        </LayoutWrapper>
      } />

      <Route path="/rooms/:id" element={<RoomDetailPage />} />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
