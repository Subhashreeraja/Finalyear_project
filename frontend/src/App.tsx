import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import EventsPage from './pages/EventsPage';
import LocationPage from './pages/location/LocationPage';
import LocationDistrictPage from './pages/location/LocationDistrictPage';
import LocationPlacePage from './pages/location/LocationPlacePage';

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
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/live" element={<EventsPage />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/location/district/:districtId" element={<LocationDistrictPage />} />
        <Route path="/location/place/:placeId" element={<LocationPlacePage />} />
      </Routes>
    </Layout>
  );
}
