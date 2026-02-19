import React from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined, WindowsOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/endpoints';
import type { LoginRequest } from '../types';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const payload = res.data.data;
      const token = payload.token;
      const rawUser = payload.user as Record<string, string | number>;
      login(token, {
        userId: String(rawUser.id || rawUser.userId),
        email: String(rawUser.email),
        roleId: Number(rawUser.role_id ?? rawUser.roleId),
        fullName: String(rawUser.full_name || rawUser.fullName || ''),
        photoUrl: rawUser.photo_url ? String(rawUser.photo_url) : undefined,
      });
      message.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Windows-style background */}
      <div className="login-bg" />

      <Card
        className="login-card"
        bordered={false}
        style={{
          width: 400,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Windows accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: '#0078d4',
            borderRadius: '8px 8px 0 0',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: 32, marginTop: 8 }}>
          <WindowsOutlined style={{ fontSize: 48, color: '#0078d4', marginBottom: 12 }} />
          <Title level={3} style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>
            School ERP
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Inicia sesión para continuar
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Ingresa tu email' },
              { type: 'email', message: 'Email no válido' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="Correo electrónico"
              style={{ borderRadius: 4, height: 42 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="Contraseña"
              style={{ borderRadius: 4, height: 42 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 42,
                borderRadius: 4,
                fontWeight: 600,
                background: '#0078d4',
                border: 'none',
                fontSize: 14,
              }}
            >
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
