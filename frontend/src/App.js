import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees";
import Shifts from "./pages/Shifts.jsx";
import CreateShift from "./pages/CreateShift.jsx";
import Profile from "./pages/Profile.jsx"
import Reports from "./pages/Reports.jsx";
import {Departments} from "./pages/Departments.jsx";
import Logout from "./pages/Logout.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeDetail from "./components/EmployeeDetail";
import Settings from "./pages/Settings.jsx";
import Attendance from "./pages/AttendancePage";
import ApproveReports from './pages/ApproveReports';
import Analytics from './pages/Analytics';



function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route: "/" to "/login" */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/employee/:id" element={<Profile />} />

          <Route path="/settings" element={<Settings />} />


        <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
        <Route path="/create-shift" element={<CreateShift />} />

        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/reports/:id/approve" element={<ApproveReports />} />
        <Route path="/analytics" element={<Analytics />} />

        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

        {/* logout route (optional but clean) */}
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



