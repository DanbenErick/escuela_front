import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  BookOutlined,
  NotificationOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WindowsOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const allMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Inicio', roles: [1, 2, 3] },
  { key: '/students', icon: <TeamOutlined />, label: 'Estudiantes', roles: [1] },
  { key: '/finance', icon: <DollarOutlined />, label: 'Finanzas', roles: [1] },
  { key: '/academic', icon: <BookOutlined />, label: 'Académico', roles: [1, 2] },
  { key: '/communication', icon: <NotificationOutlined />, label: 'Comunicación', roles: [1, 2, 3] },
  { key: '/my-children', icon: <TeamOutlined />, label: 'Mis Hijos', roles: [3] },
  { key: '/my-debts', icon: <DollarOutlined />, label: 'Mis Deudas', roles: [3] },
];

const roleLabels: Record<number, string> = { 1: 'Administrador', 2: 'Profesor', 3: 'Padre/Tutor' };
const roleColors: Record<number, string> = { 1: '#0078d4', 2: '#5c2d91', 3: '#107c10' };

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token: themeToken } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'email',
      label: <Text style={{ color: themeToken.colorTextSecondary }}>{user?.email}</Text>,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar sesión',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ─── Windows-style Sidebar ─── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={64}
        style={{
          background: 'linear-gradient(180deg, #1b1b2f 0%, #162447 50%, #1f4068 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            gap: 10,
          }}
        >
          <WindowsOutlined style={{ fontSize: 24, color: '#0078d4' }} />
          {!collapsed && (
            <span
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
              }}
            >
              School ERP
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={allMenuItems.filter(i => i.roles.includes(user?.roleId ?? 0))}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: 8,
          }}
          theme="dark"
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 64 : 260, transition: 'margin-left 0.2s' }}>
        {/* ─── Windows-style Header (Title Bar) ─── */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e8e8e8',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 48,
            minHeight: 48,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{
                cursor: 'pointer',
                fontSize: 16,
                color: '#333',
                padding: '4px 8px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              className="win-btn"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Text strong style={{ fontSize: 13, color: '#333', letterSpacing: 0.3 }}>
              Sistema de Gestión Escolar
            </Text>
          </div>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 4,
              }}
              className="win-btn"
            >
              <Avatar size={28} src={user?.photoUrl} icon={!user?.photoUrl && <UserOutlined />} style={{ backgroundColor: user?.photoUrl ? undefined : roleColors[user?.roleId ?? 1] }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Text style={{ fontSize: 12, color: '#333' }}>{user?.fullName || user?.email}</Text>
                <Tag color={roleColors[user?.roleId ?? 1]} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 3 }}>{roleLabels[user?.roleId ?? 1]}</Tag>
              </div>
            </div>
          </Dropdown>
        </Header>

        {/* ─── Content ─── */}
        <Content
          style={{
            margin: 16,
            padding: 20,
            background: '#f3f3f3',
            minHeight: 'calc(100vh - 80px)',
            borderRadius: 4,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
