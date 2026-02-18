import React, { useState, useEffect } from 'react';
import {
  Card, Button, Modal, Form, Input, Select, Typography, Space,
  Tag, message, Empty, Spin, Avatar, List,
} from 'antd';
import {
  NotificationOutlined, PlusOutlined, UserOutlined,
  ClockCircleOutlined, PushpinOutlined,
} from '@ant-design/icons';
import { communicationApi } from '../../api/endpoints';
import type { Communication, CreatePostRequest } from '../../types';

const { Title, Text, Paragraph } = Typography;

const typeColors: Record<string, string> = {
  announcement: '#0078d4',
  news: '#107c10',
  event: '#5c2d91',
  alert: '#d83b01',
};

const typeLabels: Record<string, string> = {
  announcement: 'Anuncio',
  news: 'Noticia',
  event: 'Evento',
  alert: 'Alerta',
};

const CommunicationPage: React.FC = () => {
  const [posts, setPosts] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await communicationApi.getFeed();
      setPosts(res.data.data || []);
    } catch {
      message.error('Error al cargar el feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      const payload: CreatePostRequest = {
        title: values.title,
        body: values.body,
        type: values.type,
        target_role: values.target_role || undefined,
      };
      await communicationApi.createPost(payload);
      message.success('Publicación creada');
      setModalOpen(false);
      form.resetFields();
      loadFeed();
    } catch {
      /* validation */
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
          <NotificationOutlined style={{ marginRight: 8, color: '#d83b01' }} />
          Comunicación
        </Title>
        <Space>
          <Button onClick={loadFeed} style={{ borderRadius: 4 }}>Actualizar</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{ background: '#d83b01', borderRadius: 4 }}
          >
            Nueva Publicación
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : posts.length === 0 ? (
        <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8', textAlign: 'center', padding: 40 }}>
          <Empty description="No hay publicaciones aún" />
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          dataSource={posts}
          renderItem={(post) => (
            <List.Item>
              <Card
                className="win-card"
                style={{
                  borderRadius: 8,
                  border: '1px solid #e8e8e8',
                  overflow: 'hidden',
                  height: '100%',
                }}
                styles={{ body: { padding: 0 } }}
              >
                {/* Type accent bar */}
                <div style={{ height: 4, background: typeColors[post.type || 'news'] || '#999' }} />
                <div style={{ padding: '16px 20px' }}>
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color={typeColors[post.type || 'news'] || 'default'}>
                      {typeLabels[post.type || 'news'] || post.type}
                    </Tag>
                    {post.target_role && (
                      <Tag color="default">Rol: {post.target_role}</Tag>
                    )}
                  </Space>

                  <Title level={5} style={{ margin: '8px 0 4px', fontWeight: 600 }}>
                    <PushpinOutlined style={{ marginRight: 6, color: '#999', fontSize: 13 }} />
                    {post.title}
                  </Title>

                  <Paragraph
                    style={{ color: '#555', fontSize: 13, marginBottom: 12 }}
                    ellipsis={{ rows: 3, expandable: true, symbol: 'Ver más' }}
                  >
                    {post.body}
                  </Paragraph>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                    <Avatar size={22} icon={<UserOutlined />} style={{ backgroundColor: '#0078d4' }} />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {post.sender_name || post.sender_id.substring(0, 8)}
                    </Text>
                    <div style={{ flex: 1 }} />
                    <ClockCircleOutlined style={{ color: '#bbb', fontSize: 11 }} />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(post.created_at).toLocaleDateString('es-PE')}
                    </Text>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Create Post Modal */}
      <Modal
        title={
          <span>
            <NotificationOutlined style={{ marginRight: 8, color: '#d83b01' }} />
            Nueva Publicación
          </span>
        }
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={creating}
        okText="Publicar"
        cancelText="Cancelar"
        okButtonProps={{ style: { background: '#d83b01', borderRadius: 4 } }}
        cancelButtonProps={{ style: { borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Título de la publicación" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="body" label="Contenido" rules={[{ required: true, message: 'Requerido' }]}>
            <Input.TextArea rows={5} placeholder="Escribe el contenido..." style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="type" label="Tipo" rules={[{ required: true, message: 'Requerido' }]}>
            <Select placeholder="Seleccionar tipo" style={{ borderRadius: 4 }}>
              <Select.Option value="announcement">Anuncio</Select.Option>
              <Select.Option value="news">Noticia</Select.Option>
              <Select.Option value="event">Evento</Select.Option>
              <Select.Option value="alert">Alerta</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="target_role" label="Rol Destino (opcional)">
            <Select placeholder="Todos los roles" allowClear style={{ borderRadius: 4 }}>
              <Select.Option value={1}>Admin</Select.Option>
              <Select.Option value={2}>Profesor</Select.Option>
              <Select.Option value={3}>Padre/Tutor</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommunicationPage;
