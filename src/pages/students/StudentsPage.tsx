import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, Space, Popconfirm,
  Typography, Card, message, Divider, Tag, Tooltip, Tabs, Select,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  UserOutlined, TeamOutlined, HomeOutlined,
} from '@ant-design/icons';
import { studentsApi, familiesApi, authApi, usersApi } from '../../api/endpoints';
import type { Student, CreateStudentRequest, UpdateStudentRequest, Family, User } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/* ─── Families Tab ─── */
const FamiliesTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [form] = Form.useForm();

  const searchFamily = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    try {
      const res = await familiesApi.getById(searchId.trim());
      setFamily(res.data.data || null);
    } catch {
      message.error('Familia no encontrada');
      setFamily(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await familiesApi.create(values);
      message.success('Familia creada');
      setFamily(res.data.data || null);
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Error al crear familia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="ID de Familia"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onPressEnter={searchFamily}
            style={{ width: 300, borderRadius: 4 }}
            prefix={<SearchOutlined style={{ color: '#999' }} />}
          />
          <Button onClick={searchFamily} style={{ borderRadius: 4 }}>Buscar</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ background: '#0078d4', borderRadius: 4 }}>
          Nueva Familia
        </Button>
      </div>

      {family && (
        <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }}>
          <Space direction="vertical">
            <Text><strong>ID:</strong> <Tag color="blue">{family.id}</Tag></Text>
            <Text><strong>Código:</strong> {family.family_code}</Text>
            <Text><strong>Tutor Principal:</strong> <Tag>{family.main_guardian_id}</Tag></Text>
          </Space>
        </Card>
      )}

      <Modal
        title={<span><HomeOutlined style={{ marginRight: 8, color: '#0078d4' }} />Nueva Familia</span>}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ style: { background: '#0078d4', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="family_code" label="Código de Familia" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ej: FAM-001" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="main_guardian_id" label="ID del Tutor Principal" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="UUID del padre/tutor" style={{ borderRadius: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Students Tab ─── */
const StudentsTab: React.FC<{ families: CreatedFamily[] }> = ({ families }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [searchId, setSearchId] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [form] = Form.useForm();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsApi.getAll();
      setStudents(res.data.data || []);
    } catch { /* ignore on first load */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const searchByStudent = async () => {
    if (!searchId.trim()) { loadAll(); return; }
    setLoading(true);
    try {
      const res = await studentsApi.getById(searchId.trim());
      setStudents(res.data.data ? [res.data.data] : []);
    } catch {
      message.error('Estudiante no encontrado');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByFamily = async () => {
    if (!familyId.trim()) { loadAll(); return; }
    setLoading(true);
    try {
      const res = await studentsApi.getByFamily(familyId.trim());
      setStudents(res.data.data || []);
    } catch {
      message.error('Error al buscar familia');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };

  const openEdit = (record: Student) => {
    setEditing(record);
    form.setFieldsValue({ ...record, birth_date: record.birth_date ? dayjs(record.birth_date) : null });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await studentsApi.delete(id);
      message.success('Estudiante eliminado');
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch { message.error('Error al eliminar'); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : undefined };
      if (editing) {
        const { family_id, ...updateData } = payload;
        await studentsApi.update(editing.id, updateData as UpdateStudentRequest);
        message.success('Estudiante actualizado');
        setStudents((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...updateData } : s)));
      } else {
        const res = await studentsApi.create(payload as CreateStudentRequest);
        message.success('Estudiante creado');
        if (res.data.data) setStudents((prev) => [...prev, res.data.data!]);
      }
      setModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const columns = [
    {
      title: 'Nombre', key: 'name',
      render: (_: unknown, r: Student) => (
        <Space><UserOutlined style={{ color: '#0078d4' }} /><Text strong>{r.first_name} {r.last_name}</Text></Space>
      ),
    },
    { title: 'Documento', dataIndex: 'document_number', key: 'document_number', render: (v: string | null) => v || <Text type="secondary">—</Text> },
    { title: 'Fecha Nac.', dataIndex: 'birth_date', key: 'birth_date', render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : <Text type="secondary">—</Text> },
    { title: 'Familia', key: 'family', render: (_: unknown, r: any) => <Text>{r.family_code || r.family_id?.substring(0, 8) + '...'}</Text> },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: unknown, record: Student) => (
        <Space>
          <Tooltip title="Editar"><Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} size="small" /></Tooltip>
          <Popconfirm title="¿Eliminar este estudiante?" onConfirm={() => handleDelete(record.id)} okText="Sí" cancelText="No">
            <Tooltip title="Eliminar"><Button type="text" danger icon={<DeleteOutlined />} size="small" /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space wrap>
          <Input placeholder="ID del estudiante" value={searchId} onChange={(e) => setSearchId(e.target.value)} onPressEnter={searchByStudent} style={{ width: 220, borderRadius: 4 }} prefix={<SearchOutlined style={{ color: '#999' }} />} />
          <Button onClick={searchByStudent} style={{ borderRadius: 4 }}>Buscar por ID</Button>
          <Divider orientation="vertical" />
          <Input placeholder="ID de familia" value={familyId} onChange={(e) => setFamilyId(e.target.value)} onPressEnter={searchByFamily} style={{ width: 220, borderRadius: 4 }} prefix={<TeamOutlined style={{ color: '#999' }} />} />
          <Button onClick={searchByFamily} style={{ borderRadius: 4 }}>Buscar por Familia</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ background: '#0078d4', borderRadius: 4 }}>
          Nuevo Estudiante
        </Button>
      </div>

      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={students} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} locale={{ emptyText: 'Busca estudiantes por ID o Familia' }} size="middle" />
      </Card>

      <Modal
        title={<span><UserOutlined style={{ marginRight: 8, color: '#0078d4' }} />{editing ? 'Editar Estudiante' : 'Nuevo Estudiante'}</span>}
        open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}
        okText={editing ? 'Guardar' : 'Crear'} cancelText="Cancelar"
        okButtonProps={{ style: { background: '#0078d4', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          {!editing && <Form.Item name="family_id" label="Familia" rules={[{ required: true, message: 'Requerido' }]}>
            <Select placeholder="Seleccionar familia" style={{ borderRadius: 4 }} showSearch optionFilterProp="label"
              options={families.map(f => ({ value: f.id, label: `${f.family_code}${f.guardian_name ? ' — ' + f.guardian_name : ''}` }))}
            />
          </Form.Item>}
          <Form.Item name="first_name" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}><Input placeholder="Nombre" style={{ borderRadius: 4 }} /></Form.Item>
          <Form.Item name="last_name" label="Apellido" rules={[{ required: true, message: 'Requerido' }]}><Input placeholder="Apellido" style={{ borderRadius: 4 }} /></Form.Item>
          <Form.Item name="birth_date" label="Fecha de Nacimiento"><DatePicker style={{ width: '100%', borderRadius: 4 }} format="DD/MM/YYYY" /></Form.Item>
          <Form.Item name="document_number" label="Número de Documento"><Input placeholder="DNI" style={{ borderRadius: 4 }} /></Form.Item>
          <Form.Item name="medical_info" label="Info Médica"><Input.TextArea rows={3} placeholder="Información médica" style={{ borderRadius: 4 }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Shared types ─── */
interface RegisteredUser { id: string; email: string; full_name: string; role_id: number }
interface CreatedFamily { id: string; family_code: string; guardian_name?: string }

/* ─── Register Users Tab ─── */
const UsersTab: React.FC<{ users: RegisteredUser[]; onAdd: (u: RegisteredUser) => void; onReload: () => void }> = ({ users, onAdd, onReload }) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RegisteredUser | null>(null);
  const [form] = Form.useForm();

  const roleLabels: Record<number, string> = { 1: 'Admin', 2: 'Profesor', 3: 'Padre/Tutor' };
  const roleColors: Record<number, string> = { 1: 'blue', 2: 'purple', 3: 'green' };

  const onFinish = async (values: { email: string; password: string; role_id: number; full_name: string }) => {
    setLoading(true);
    try {
      const res = await authApi.register(values);
      const created = (res.data as any).data || res.data;
      const userId = created?.id || created?.user?.id || '';
      onAdd({ id: userId, email: values.email, full_name: values.full_name, role_id: values.role_id });
      message.success('Usuario registrado correctamente');
      form.resetFields();
      setModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: RegisteredUser) => {
    setEditing(u);
    form.setFieldsValue({ full_name: u.full_name, role_id: u.role_id });
    setModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      const values = await form.validateFields();
      await usersApi.update(editing.id, { full_name: values.full_name, role_id: values.role_id });
      message.success('Usuario actualizado');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      onReload();
    } catch {
      message.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await usersApi.delete(id);
      message.success('Usuario eliminado');
      onReload();
    } catch {
      message.error('Error al eliminar usuario');
    }
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'full_name', key: 'full_name', render: (v: string) => <Text strong>{v || '—'}</Text> },
    { title: 'Correo', dataIndex: 'email', key: 'email' },
    { title: 'Rol', dataIndex: 'role_id', key: 'role_id', render: (v: number) => <Tag color={roleColors[v] || 'default'}>{roleLabels[v] || v}</Tag> },
    {
      title: 'Acciones', key: 'actions', width: 120, render: (_: unknown, r: RegisteredUser) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="¿Eliminar usuario?" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ background: '#0078d4', borderRadius: 4 }}>
          Nuevo Usuario
        </Button>
      </div>

      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={users} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} size="middle" locale={{ emptyText: 'No hay usuarios registrados' }} />
      </Card>

      <Modal
        title={<span><UserOutlined style={{ marginRight: 8, color: '#0078d4' }} />{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</span>}
        open={modalOpen} onOk={editing ? handleEditSave : () => form.submit()} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        okText={editing ? 'Guardar' : 'Registrar'} cancelText="Cancelar" confirmLoading={loading}
        okButtonProps={{ style: { background: '#0078d4', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="full_name" label="Nombre Completo" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Nombre del usuario" style={{ borderRadius: 4 }} />
          </Form.Item>
          {!editing && (
            <>
              <Form.Item name="email" label="Correo" rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}>
                <Input placeholder="correo@escuela.com" style={{ borderRadius: 4 }} />
              </Form.Item>
              <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Requerido' }]}>
                <Input.Password placeholder="Contraseña" style={{ borderRadius: 4 }} />
              </Form.Item>
            </>
          )}
          <Form.Item name="role_id" label="Rol" rules={[{ required: true, message: 'Requerido' }]}>
            <Select placeholder="Seleccionar rol" style={{ borderRadius: 4 }}>
              <Select.Option value={1}>Admin</Select.Option>
              <Select.Option value={2}>Profesor</Select.Option>
              <Select.Option value={3}>Padre / Tutor</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Families Tab (with tutor dropdown) ─── */
const FamiliesTabWithUsers: React.FC<{ tutors: RegisteredUser[]; families: CreatedFamily[]; onAddFamily: (f: CreatedFamily) => void; onReload: () => void }> = ({ tutors, families, onAddFamily, onReload }) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreatedFamily | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await familiesApi.create(values);
      const created = res.data.data;
      if (created) {
        onAddFamily({ id: created.id, family_code: created.family_code || values.family_code });
      }
      message.success('Familia creada');
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Error al crear familia');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (f: CreatedFamily) => {
    setEditing(f);
    form.setFieldsValue({ family_code: f.family_code });
    setModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      const values = await form.validateFields();
      await familiesApi.update(editing.id, { family_code: values.family_code, main_guardian_id: values.main_guardian_id });
      message.success('Familia actualizada');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      onReload();
    } catch {
      message.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await familiesApi.delete(id);
      message.success('Familia eliminada');
      onReload();
    } catch {
      message.error('Error al eliminar (puede tener estudiantes asociados)');
    }
  };

  const columns = [
    { title: 'Código', dataIndex: 'family_code', key: 'family_code', render: (v: string) => <Text strong>{v || '—'}</Text> },
    { title: 'Tutor Principal', dataIndex: 'guardian_name', key: 'guardian_name', render: (v: string | null) => v || <Text type="secondary">—</Text> },
    {
      title: 'Acciones', key: 'actions', width: 120, render: (_: unknown, r: CreatedFamily) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="¿Eliminar familia?" description="Se eliminarán los estudiantes asociados" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ background: '#0078d4', borderRadius: 4 }}>
          Nueva Familia
        </Button>
      </div>

      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={families} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} size="middle" locale={{ emptyText: 'No hay familias registradas' }} />
      </Card>

      <Modal
        title={<span><HomeOutlined style={{ marginRight: 8, color: '#0078d4' }} />{editing ? 'Editar Familia' : 'Nueva Familia'}</span>}
        open={modalOpen} onOk={editing ? handleEditSave : handleCreate} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        okText={editing ? 'Guardar' : 'Crear'} cancelText="Cancelar" confirmLoading={loading}
        okButtonProps={{ style: { background: '#0078d4', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="family_code" label="Código de Familia" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ej: FAM-001" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="main_guardian_id" label="Tutor Principal" rules={editing ? [] : [{ required: true, message: 'Requerido' }]}>
            {tutors.length > 0 ? (
              <Select placeholder="Seleccionar tutor" style={{ borderRadius: 4 }} showSearch optionFilterProp="label" allowClear
                options={tutors.map(t => ({ value: t.id, label: `${t.full_name} — ${t.email}` }))}
              />
            ) : (
              <Input placeholder="UUID del tutor" style={{ borderRadius: 4 }} />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Main Page ─── */
const StudentsPage: React.FC = () => {
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [createdFamilies, setCreatedFamilies] = useState<CreatedFamily[]>([]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await usersApi.getAll();
      const users = (res.data.data || []) as unknown as User[];
      setRegisteredUsers(users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name || '', role_id: u.role_id })));
    } catch { /* silently fail on first load */ }
  }, []);

  const loadFamilies = useCallback(async () => {
    try {
      const res = await familiesApi.getAll();
      const fams = res.data.data || [];
      setCreatedFamilies(fams.map((f: any) => ({ id: f.id, family_code: f.family_code || '', guardian_name: f.guardian_name || '' })));
    } catch { /* silently fail on first load */ }
  }, []);

  useEffect(() => { loadUsers(); loadFamilies(); }, [loadUsers, loadFamilies]);

  const tutors = registeredUsers.filter(u => u.role_id === 3);

  const handleUserAdded = (u: RegisteredUser) => {
    setRegisteredUsers(prev => [...prev, u]);
  };

  const handleFamilyAdded = (f: CreatedFamily) => {
    setCreatedFamilies(prev => [...prev, f]);
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>
        <TeamOutlined style={{ marginRight: 8, color: '#0078d4' }} />
        Gestión de Usuarios, Familias y Estudiantes
      </Title>
      <Tabs
        defaultActiveKey="users"
        type="card"
        items={[
          { key: 'users', label: <span><UserOutlined /> Registrar Usuarios</span>, children: <UsersTab users={registeredUsers} onAdd={handleUserAdded} onReload={loadUsers} /> },
          { key: 'families', label: <span><HomeOutlined /> Familias</span>, children: <FamiliesTabWithUsers tutors={tutors} families={createdFamilies} onAddFamily={handleFamilyAdded} onReload={loadFamilies} /> },
          { key: 'students', label: <span><TeamOutlined /> Estudiantes</span>, children: <StudentsTab families={createdFamilies} /> },
        ]}
      />
    </div>
  );
};

export default StudentsPage;
