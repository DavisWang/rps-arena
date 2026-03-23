import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BracketPage } from './pages/BracketPage';
import { HomePage } from './pages/HomePage';
import { QuickMatchPage } from './pages/QuickMatchPage';
import { QuickMatchRunPage } from './pages/QuickMatchRunPage';
import { ResultsPage } from './pages/ResultsPage';
import { TournamentMatchPage } from './pages/TournamentMatchPage';
import { TournamentSetupPage } from './pages/TournamentSetupPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/quick-match" element={<QuickMatchPage />} />
          <Route path="/matchups/quick/:sessionId" element={<QuickMatchRunPage />} />
          <Route path="/tournaments/new" element={<TournamentSetupPage />} />
          <Route path="/tournaments/:tournamentId" element={<BracketPage />} />
          <Route path="/tournaments/:tournamentId/matches/:matchId" element={<TournamentMatchPage />} />
          <Route path="/tournaments/:tournamentId/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
