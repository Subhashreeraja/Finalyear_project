import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import EventsPage from './pages/EventsPage';
import LocationPage from './pages/location/LocationPage';
import LocationDistrictPage from './pages/location/LocationDistrictPage';
import LocationPlacePage from './pages/location/LocationPlacePage';
import AdminRoute from './components/admin/AdminRoute';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCamerasPage from './pages/admin/AdminCamerasPage';
import AdminGateControlPage from './pages/admin/AdminGateControlPage';
import AdminAlertsPage from './pages/admin/AdminAlertsPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-body">
      <Header />
      {children}
      <Footer />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public + user routes */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path="/alerts"
          element={
            <Layout>
              <AlertsPage />
            </Layout>
          }
        />
        <Route
          path="/events"
          element={
            <Layout>
              <EventsPage />
            </Layout>
          }
        />
        <Route
          path="/events/live"
          element={
            <Layout>
              <EventsPage />
            </Layout>
          }
        />
        <Route
          path="/location"
          element={
            <Layout>
              <LocationPage />
            </Layout>
          }
        />
        <Route
          path="/location/district/:districtId"
          element={
            <Layout>
              <LocationDistrictPage />
            </Layout>
          }
        />
        <Route
          path="/location/place/:placeId"
          element={
            <Layout>
              <LocationPlacePage />
            </Layout>
          }
        />

        {/* Admin routes (separate layout with sidebar) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cameras"
          element={
            <AdminRoute>
              <AdminCamerasPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/gate-control"
          element={
            <AdminRoute>
              <AdminGateControlPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <AdminRoute>
              <AdminAlertsPage />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}
