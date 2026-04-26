import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './services/ThemeContext';
import { AuthProvider } from './services/AuthContext';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';
import { Home } from './pages/Home/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ActivateAccount } from './pages/Auth/ActivateAccount';
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
import { Tablero } from './pages/Tablero/Tablero';
import { TableroStoryMode } from './pages/TableroStoryMode/TableroStoryMode';
import { RoleSelect } from './pages/RoleSelect/Rolselect';
import { Community } from './pages/Community/Community';
import { StoryMode } from './pages/StoryMode/StoryMode';
import Mission from './pages/Mission/Mission.jsx';

import './App.css';

const JOIN_GAME_VISTA_KEY = 'ravenloft.joinGame.vistaActual';

function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isTablero = location.pathname === '/tablero' || location.pathname === '/tablero-story-mode';

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

  useEffect(() => {
    const path = location.pathname;
    const esRutaRelacionadaConJoin = path === '/join' || path.startsWith('/story-mode');

    if (!esRutaRelacionadaConJoin) {
      sessionStorage.removeItem(JOIN_GAME_VISTA_KEY);
    }
  }, [location.pathname]);

  return (
    <>
   
      {!isAuthPage && !isTablero && <Header />}
      <main className="main-content">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/activate" element={<ActivateAccount />} />
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
            <PrivateRoute><Mission /></PrivateRoute>
          } />

          <Route path="/create" element={
          <PrivateRoute><CreateCampaign /></PrivateRoute>
        } />
                <Route path="/tablero" element={
          <PrivateRoute><Tablero /></PrivateRoute>
        } />
        <Route path="/tablero-story-mode" element={
          <PrivateRoute><TableroStoryMode /></PrivateRoute>
        } />
        <Route path="/role-select" element={
          <PrivateRoute><RoleSelect /></PrivateRoute>
        } />
        <Route path="/community" element={
          <PrivateRoute><Community /></PrivateRoute>
        } />

        </Routes>
      </main>
      {!isAuthPage && !isTablero && <Footer />}
  
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