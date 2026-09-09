import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CoursePlayer from "./pages/CoursePlayer";
import LessonPlayer from "./pages/LessonPlayer";
import Mentor from "./pages/Mentor";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Checkout from "./pages/Checkout";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Certificate from "./pages/Certificate";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:slug" element={<CoursePlayer />} />
      <Route path="/courses/:slug/modules/:moduleId" element={<LessonPlayer />} />
      <Route path="/mentor" element={<Mentor />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/checkout/intermediate" element={<Checkout />} />
      <Route path="/checkout/:courseId" element={<Checkout />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/certificate/:track" element={<Certificate />} />
      <Route path="/c/:code" element={<Certificate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}