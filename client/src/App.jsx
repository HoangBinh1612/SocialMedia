import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import SearchPage from './pages/SearchPage';

import MediaPage from './pages/MediaPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Toaster position="top-right" toastOptions={{
              duration: 3000,
              style: { fontFamily: 'Poppins, sans-serif', fontSize: '14px' }
            }} />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
