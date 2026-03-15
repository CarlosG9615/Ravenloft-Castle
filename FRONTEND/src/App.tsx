import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './services/ThemeContext';
import { Header } from './components/Header/Header';
import { Home } from './pages/Home/Home';
import './App.css';
import { Footer } from './components/Footer/Footer';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { CharacterSheet } from './pages/Characters/CharacterSheet';

function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'; 


  return (
     <>
      {!isAuthPage && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/characters" element={<CharacterSheet />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;