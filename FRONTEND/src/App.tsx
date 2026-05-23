import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './services/ThemeContext';
import { AuthProvider } from './services/AuthContext';
import { AccessibilityProvider } from './services/AccessibilityContext';
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
import { StoryMode } from './pages/StoryMode/StoryMode';
import { CreateCampaign } from './pages/CreateCampaign/CreateCampaign';
import { Subscription } from './pages/Subscription/Subscription';
import { PagoExitoso } from './pages/Subscription/PagoExitoso';
import { Tablero } from './pages/Tablero/Tablero';
import { TableroStoryMode } from './pages/TableroStoryMode/TableroStoryMode';
import { RoleSelect } from './pages/RoleSelect/Rolselect';
import Mission from './pages/Mission/Mission';
import { CreateMission } from './pages/CreateMission/CreateMission';
import { buildMissionDetailsPath, buildMissionListPath } from './pages/Mission/missionRoutes';

import './styles/accessibility.css';
import './App.css';
import { MisCampanas } from './pages/MisCampanas/MisCampanas';

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
          <Route path="/pago-exitoso" element={<PagoExitoso />} />

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
          <Route path="/join/story-mode" element={
            <PrivateRoute><StoryMode /></PrivateRoute>
          } />
          <Route path="/story-mode/:id" element={
            <PrivateRoute><StoryModeRedirect /></PrivateRoute>
          } />
          <Route path="/story-mode/:id/mission" element={
            <PrivateRoute><Mission /></PrivateRoute>
          } />
          <Route path="/story-mode/:id/:misionId" element={
            <PrivateRoute><MissionDetailsRedirect /></PrivateRoute>
          } />
          <Route path="/story-mode/:id/mission/:misionId/details" element={
            <PrivateRoute><Mission /></PrivateRoute>
          } />
          <Route path="/story-mode/:id/mission/:misionId/create-mission" element={
            <PrivateRoute><CreateMission /></PrivateRoute>
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
        <Route path="/mis-campanas" element={
          <PrivateRoute><MisCampanas /></PrivateRoute>
        } />

        </Routes>
      </main>
      {!isAuthPage && !isTablero && <Footer />}
        
    </>

  );
}

function StoryModeRedirect() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to={buildMissionListPath(id)} replace />;
}

function MissionDetailsRedirect() {
  const { id, misionId } = useParams<{ id: string; misionId: string }>();

  if (!id || !misionId) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to={buildMissionDetailsPath(id, misionId)} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
              <ScrollToTop />
            <Layout />
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;