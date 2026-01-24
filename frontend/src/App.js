import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees";
import Shifts from "./pages/Shifts.jsx";
import Profile from "./pages/Profile.jsx"
import Reports from "./pages/Reports.jsx";
import Departments from "./pages/Departments.jsx";
import Logout from "./pages/Logout.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeDetail from "./components/EmployeeDetail";
import Settings from "./pages/Settings.jsx";
import CreateReport from "./pages/CreateReport";
import ApproveReports from "./pages/ApproveReports";
import ReportDetail from "./pages/ReportDetail";
import Attendance from "./pages/Attendance";

function AttendanceDetail() {
  return null;
}

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


        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/reports/new" element={<CreateReport />} />
        <Route path="/reports/approve" element={<ApproveReports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />


         <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />

        <Route path="/attendance" element={<Attendance />} />
        <Route path="/attendance/:id" element={<AttendanceDetail />} />


        {/* logout route (optional but clean) */}
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



