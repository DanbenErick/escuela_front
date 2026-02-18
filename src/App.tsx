import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import esES from 'antd/locale/es_ES';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import FinancePage from './pages/finance/FinancePage';
import AcademicPage from './pages/academic/AcademicPage';
import CommunicationPage from './pages/communication/CommunicationPage';
import MyChildrenPage from './pages/parent/MyChildrenPage';
import MyDebtsPage from './pages/parent/MyDebtsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="finance" element={<FinancePage />} />
      <Route path="academic" element={<AcademicPage />} />
      <Route path="communication" element={<CommunicationPage />} />
      <Route path="my-children" element={<MyChildrenPage />} />
      <Route path="my-debts" element={<MyDebtsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <ConfigProvider
    locale={esES}
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#0078d4',
        borderRadius: 4,
        fontFamily: "'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 13,
        colorBgContainer: '#ffffff',
        colorBgLayout: '#f3f3f3',
        controlHeight: 36,
      },
      components: {
        Menu: {
          darkItemBg: 'transparent',
          darkSubMenuItemBg: 'transparent',
          darkItemSelectedBg: 'rgba(0, 120, 212, 0.3)',
          darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
          darkItemSelectedColor: '#fff',
          itemBorderRadius: 4,
          itemMarginInline: 8,
          iconMarginInlineEnd: 10,
        },
        Card: {
          paddingLG: 20,
        },
        Table: {
          headerBg: '#fafafa',
          headerColor: '#333',
          headerSortActiveBg: '#f0f0f0',
          rowHoverBg: '#f5f8fc',
        },
        Tabs: {
          cardBg: '#fafafa',
        },
        Button: {
          primaryShadow: 'none',
          defaultShadow: 'none',
        },
      },
    }}
  >
    <AntApp>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AntApp>
  </ConfigProvider>
);

export default App;
