import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { ThemeProvider } from './services/ThemeContext';
import { AuthProvider } from './services/AuthContext';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';
import { Home } from './pages/Home/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { UserProfile } from './pages/Profile/UserProfile';
import { CharactersMenu } from './pages/Characters/CharactersMenu';
import { Characters } from './pages/Characters/Characters';
import { CharacterSheet } from './pages/Characters/CharacterSheet';
import { CharacterCreate } from './pages/Characters/CharacterCreate';
import { CharactersList } from './pages/Characters/CharactersList';
import { ScrollToTop } from './components/ScrollToTop/ScrollToTop';
import { JoinGame } from './pages/JoinGame/JoinGame';
import { CreateCampaign } from './pages/CreateCampaign/CreateCampaign';
import { Subscription } from './pages/Subscription/Subscription';
import { StoryMode } from './pages/StoryMode/StoryMode';
import { Mision } from './pages/Mision/Mision';
import './App.css';

function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    let title = "Ravenloft Castle";
    const path = location.pathname;

    if (path === '/home' || path === '/') {
      title = "Ravenloft Castle: Inicia tu aventura";
    } else if (path === '/login') {
      title = "Ravenloft Castle - Iniciar sesión";
    } else if (path === '/register') {
      title = "Ravenloft Castle - Registro";
    } else if (path === '/subscription') {
      title = "Ravenloft Castle - Suscripciones";
    } else if (path === '/profile' || path === '/profile/edit') {
      title = "Ravenloft Castle - Tu Perfil";
    } else if (path.startsWith('/characters')) {
      title = "Ravenloft Castle - Personajes";
    } else if (path === '/join') {
      title = "Ravenloft Castle - Unirse a Partida";
    } else if (path === '/create') {
      title = "Ravenloft Castle - Crear Campaña";
    } else if (path.startsWith('/story-mode')) {
      title = "Ravenloft Castle - Modo Historia";
    }

    document.title = title;
  }, [location.pathname]);

  return (
    <>
      {!isAuthPage && <Header />}
      <main className="main-content">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/subscription" element={<Subscription />} />

          {/* Privadas — requieren login */}
          <Route path="/profile" element={
            <PrivateRoute><UserProfile /></PrivateRoute>
          } />
          <Route path="/profile/edit" element={
            <PrivateRoute><UserProfile /></PrivateRoute>
          } />
          <Route path="/characters" element={
            <PrivateRoute><CharactersList /></PrivateRoute>
          } />
          <Route path="/characters/menu" element={
            <PrivateRoute><CharactersMenu /></PrivateRoute>
          } />
          <Route path="/characters/new" element={
            <PrivateRoute><CharacterCreate /></PrivateRoute>
          } />
          <Route path="/characters/avatar" element={
            <PrivateRoute><Characters /></PrivateRoute>
          } />
          <Route path="/characters/list" element={
            <PrivateRoute><CharactersList /></PrivateRoute>
          } />
          <Route path="/characters/:id" element={
            <PrivateRoute><CharacterSheet /></PrivateRoute>
          } />
          <Route path="/join" element={
            <PrivateRoute><JoinGame /></PrivateRoute>
          } />
          <Route path="/story-mode/:id" element={
            <PrivateRoute><StoryMode /></PrivateRoute>
          } />
          <Route path="/story-mode/:id/:misionId" element={
            <PrivateRoute><Mision /></PrivateRoute>
          } />
          <Route path="/create" element={
          <PrivateRoute><CreateCampaign /></PrivateRoute>
        } />

        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
            <ScrollToTop />
          <Layout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;