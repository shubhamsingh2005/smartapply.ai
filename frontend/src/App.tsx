import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import OtpVerify from './pages/OtpVerify';
import Dashboard from './pages/Dashboard';
import OnboardingSelection from './pages/OnboardingSelection';
import OnboardingReview from './pages/OnboardingReview';
import OnboardingManual from './pages/OnboardingManual';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/otp-verify" element={<OtpVerify />} />
        <Route path="/onboarding" element={<OnboardingSelection />} />
        <Route path="/onboarding/review" element={<OnboardingReview />} />
        <Route path="/onboarding/manual" element={<OnboardingManual />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Default route redirects to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
