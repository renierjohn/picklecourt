import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import UsersManagement from './pages/UsersManagement';
import { Courts } from './pages/Courts';
import { BookingSummary } from './pages/BookingSummary';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import DatabaseTest from './pages/DatabaseTest';
import Unauthorized from './pages/Unauthorized.jsx';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Bookings } from './pages/Bookings';
import { Footer } from './components/Footer';
import MessengerChat from './components/MessengerChat';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="/book/:userId" element={<Courts />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/booking-summary/:courtId/:date/:times" element={<BookingSummary />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route
                path="/database-test"
                element={
                  <ProtectedRoute>
                    <DatabaseTest />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
          <MessengerChat />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
