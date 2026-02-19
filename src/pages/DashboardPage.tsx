import React from 'react';
import { Avatar, Card, Col, Row, Typography, Statistic } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  BookOutlined,
  NotificationOutlined,
  ArrowRightOutlined,
  HeartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const allModules = [
  { key: '/students', title: 'Estudiantes', description: 'Gestión de alumnos y familias', icon: <TeamOutlined />, color: '#0078d4', bg: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)', roles: [1] },
  { key: '/finance', title: 'Finanzas', description: 'Cuotas, deudas y pagos', icon: <DollarOutlined />, color: '#107c10', bg: 'linear-gradient(135deg, #107c10 0%, #0e6e0e 100%)', roles: [1] },
  { key: '/academic', title: 'Académico', description: 'Cursos, calificaciones y asistencia', icon: <BookOutlined />, color: '#5c2d91', bg: 'linear-gradient(135deg, #5c2d91 0%, #7b3fb5 100%)', roles: [1, 2] },
  { key: '/communication', title: 'Comunicación', description: 'Noticias y publicaciones', icon: <NotificationOutlined />, color: '#d83b01', bg: 'linear-gradient(135deg, #d83b01 0%, #ea4300 100%)', roles: [1, 2, 3] },
  { key: '/my-children', title: 'Mis Hijos', description: 'Ver información de mis hijos', icon: <HeartOutlined />, color: '#107c10', bg: 'linear-gradient(135deg, #107c10 0%, #0e6e0e 100%)', roles: [3] },
  { key: '/my-debts', title: 'Mis Deudas', description: 'Consultar estado de pagos', icon: <DollarOutlined />, color: '#d83b01', bg: 'linear-gradient(135deg, #d83b01 0%, #ea4300 100%)', roles: [3] },
];

const roleLabels: Record<number, string> = { 1: 'Administrador', 2: 'Profesor', 3: 'Padre/Tutor' };
const roleGreetings: Record<number, string> = {
  1: 'Panel de Administración del Sistema',
  2: 'Panel del Profesor',
  3: 'Portal de Padres de Familia',
};

const roleBannerBg: Record<number, string> = {
  1: 'linear-gradient(135deg, #0078d4 0%, #1b1b2f 100%)',
  2: 'linear-gradient(135deg, #5c2d91 0%, #2d1450 100%)',
  3: 'linear-gradient(135deg, #107c10 0%, #0a4a0a 100%)',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleId = user?.roleId ?? 1;
  const visibleModules = allModules.filter(m => m.roles.includes(roleId));

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="win-panel"
        style={{
          background: roleBannerBg[roleId] || roleBannerBg[1],
          borderRadius: 8,
          padding: '32px 36px',
          marginBottom: 24,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -50, width: 140, height: 140, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar
            size={72}
            src={user?.photoUrl}
            icon={!user?.photoUrl && <UserOutlined />}
            style={{ backgroundColor: user?.photoUrl ? undefined : 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 }}
          />
          <div>
            <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
              ¡Hola, {user?.fullName || user?.email}!
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, display: 'block', marginTop: 4 }}>
              {roleGreetings[roleId]} · {roleLabels[roleId]}
            </Text>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <Row gutter={[16, 16]}>
        {visibleModules.map((mod) => (
          <Col xs={24} sm={12} lg={6} key={mod.key}>
            <Card
              hoverable
              className="win-card"
              onClick={() => navigate(mod.key)}
              style={{
                borderRadius: 8,
                border: '1px solid #e8e8e8',
                height: '100%',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ height: 4, background: mod.bg }} />
              <div style={{ padding: '20px 20px 16px' }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 8, background: mod.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: '#fff', marginBottom: 14,
                  }}
                >
                  {mod.icon}
                </div>
                <Title level={5} style={{ margin: 0, fontWeight: 600 }}>{mod.title}</Title>
                <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>{mod.description}</Text>
                <div style={{ marginTop: 14, color: mod.color, fontSize: 12, fontWeight: 500 }}>
                  Ir al módulo <ArrowRightOutlined style={{ fontSize: 10 }} />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Stats — only for admin */}
      {roleId === 1 && (
        <div className="win-panel" style={{ marginTop: 24, padding: 24, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
          <Title level={5} style={{ marginBottom: 20, fontWeight: 600, color: '#333' }}>
            Resumen del Sistema
          </Title>
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title="Módulos" value={4} styles={{ content: { color: '#0078d4', fontWeight: 700 } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Endpoints" value={15} styles={{ content: { color: '#107c10', fontWeight: 700 } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="API Status" value="Online" styles={{ content: { color: '#107c10', fontWeight: 700, fontSize: 22 } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Versión" value="1.0.0" styles={{ content: { color: '#5c2d91', fontWeight: 700, fontSize: 22 } }} />
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

