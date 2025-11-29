import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Activities from "./pages/Activities";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/employees" element={
          <ProtectedRoute><Employees /></ProtectedRoute>
        } />

        <Route path="/activities" element={
          <ProtectedRoute><Activities /></ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}
