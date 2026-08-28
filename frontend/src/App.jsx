import { Navigate, Route, Routes } from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Mentor from "./pages/Mentor";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Checkout from "./pages/Checkout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/mentor" element={<Mentor />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/checkout/:courseId" element={<Checkout />} />
    </Routes>
  );
}