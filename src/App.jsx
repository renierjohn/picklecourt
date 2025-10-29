import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Courts } from './pages/Courts';
import { BookingSummary } from './pages/BookingSummary';
import { Header } from './components/Header';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/book/:courtId" element={<Courts />} />
            <Route path="/booking-summary/:courtId/:date/:times" element={<BookingSummary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
