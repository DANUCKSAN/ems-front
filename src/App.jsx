// Application route composition.
import React, { lazy, Suspense, useEffect } from 'react';
import { Layout, message, Spin, theme } from 'antd';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as path from './components/configs/routePath';

import Header from './components/header/header';
import Footer from './components/footer/footer';
import './dark-theme.css';
import {
  clearAuthSession,
  getActiveRole,
  getAuthSessionTimeRemaining,
  hasActiveLogin,
  hasRole,
} from './utils/authSession';
const { Content } = Layout;

const LogIn = lazy(() => import('./components/pages/login/logIn'));
const Presentation = lazy(() => import('./components/pages/presentation/presentation'));
const Register = lazy(() => import('./components/pages/registration/register'));
const UpdateAccount = lazy(() => import('./components/pages/updateAccount/updateAccount'));
const HostLogin = lazy(() => import('./components/pages/hostLogin/hostLogin'));
const HostRegister = lazy(() => import('./components/pages/hostRegister/hostRegister'));
const HostUpdateAccount = lazy(() => import('./components/pages/hostUpdateAccount/hostUpdateAccount'));
const EventDetails = lazy(() => import('./components/pages/event-details/eventdetails'));
const MyEvents = lazy(() => import('./components/pages/my-events/MyEvents'));
const BookingConfirmation = lazy(() => import('./components/pages/booking-confirmation/BookingConfirmation'));
const HostDashboard = lazy(() => import('./components/pages/host-dashboard/HostDashboard'));
const AdminLogin = lazy(() => import('./components/pages/admin-login/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/pages/admin-dashboard/AdminDashboard'));
const Terms = lazy(() => import('./components/pages/legal/Terms'));

const ProtectedRoute = ({ role, children }) => {
  const location = useLocation();
  if (hasRole(role)) {
    return children;
  }

  const loginPath = role === 'host' ? '/host-login' : role === 'admin' ? '/admin-login' : '/login';
  return <Navigate to={loginPath} replace state={{ redirectTo: location.pathname + location.search }} />;
};

const AuthSessionGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const expireSession = () => {
      if (!hasActiveLogin()) {
        return;
      }

      const role = getActiveRole();
      clearAuthSession();
      window.dispatchEvent(new Event('storage'));
      message.info('Your session has expired. Please log in again.');
      navigate(role === 'host' ? '/host-login' : role === 'admin' ? '/admin-login' : '/login', { replace: true });
    };

    const handleUnauthorized = (event) => {
      const role = event.detail?.role;
      message.info('Your session is no longer valid. Please log in again.');
      navigate(role === 'host' ? '/host-login' : role === 'admin' ? '/admin-login' : '/login', { replace: true });
    };

    const scheduleLogout = () => {
      window.clearTimeout(timeoutId);

      if (!hasActiveLogin()) {
        return;
      }

      let remaining = getAuthSessionTimeRemaining();

      if (remaining === null) {
        expireSession();
        return;
      }

      if (remaining <= 0) {
        expireSession();
        return;
      }

      timeoutId = window.setTimeout(expireSession, remaining);
    };

    scheduleLogout();
    window.addEventListener('storage', scheduleLogout);
    window.addEventListener('focus', scheduleLogout);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('storage', scheduleLogout);
      window.removeEventListener('focus', scheduleLogout);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  return null;
};

const App = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <Router>
      <AuthSessionGuard />
      <Layout className="ems-app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        />
        <Content
          style={{
            flex: 1,
            margin: 0,
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <Suspense fallback={<div style={{ display: 'grid', minHeight: 320, placeItems: 'center' }}><Spin size="large" /></div>}>
          <Routes>
            <Route path={path.loginPath} element={<LogIn />} />
            <Route path={path.presentationPath} element={<Presentation />} />
            <Route path={path.registerPath} element={<Register />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/update-account" element={<ProtectedRoute role="user"><UpdateAccount /></ProtectedRoute>} />
            <Route path="/host-login" element={<HostLogin />} />
            <Route path="/host-register" element={<HostRegister />} />
            <Route path="/host-update" element={<ProtectedRoute role="host"><HostUpdateAccount /></ProtectedRoute>} />
            <Route path={path.adminLoginPath} element={<AdminLogin />} />
            <Route path={path.adminDashboardPath} element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
             <Route path="/event/:id" element={<EventDetails />} />
             <Route path="/my-events" element={<ProtectedRoute role="user"><MyEvents /></ProtectedRoute>} />
             <Route path={path.bookingConfirmationPath} element={<ProtectedRoute role="user"><BookingConfirmation /></ProtectedRoute>} />
             <Route path={path.dashboardPath} element={<ProtectedRoute role="host"><HostDashboard /></ProtectedRoute>} />
             <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Content>
        <Footer />
      </Layout>
    </Router>
  );
};

export default App;
  
