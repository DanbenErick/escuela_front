import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs, Form, Input, InputNumber, Button, Table, Card, Typography,
  Space, Select, DatePicker, message, Empty, Tag, Alert, Modal, Tooltip,
} from 'antd';
import {
  BookOutlined, FileTextOutlined, CheckCircleOutlined,
  SearchOutlined, TrophyOutlined, PlusOutlined,
  ScheduleOutlined, IdcardOutlined,
} from '@ant-design/icons';
import { academicApi, coursesApi, enrollmentsApi, usersApi } from '../../api/endpoints';
import type { ReportCardEntry, GradeInput, AttendanceInput, Course, Enrollment, CreateCourseRequest, CreateEnrollmentRequest, User } from '../../types';

const { Title, Text } = Typography;

interface Teacher { id: string; full_name: string; email: string }

/* ─── Courses Tab ─── */
const CoursesTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesApi.getAll();
      setCourses(res.data.data || []);
    } catch {
      message.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = useCallback(async () => {
    try {
      const res = await usersApi.getAll();
      const users = (res.data.data || []) as unknown as User[];
      setTeachers(users.filter(u => u.role_id === 2).map(u => ({ id: u.id, full_name: u.full_name || '', email: u.email })));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCourses(); loadTeachers(); }, [loadTeachers]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      let schedule_json: Record<string, unknown> | undefined;
      if (values.schedule_raw) {
        try { schedule_json = JSON.parse(values.schedule_raw); } catch { message.error('JSON de horario inválido'); return; }
      }
      const payload: CreateCourseRequest = { name: values.name, teacher_id: values.teacher_id, schedule_json };
      await coursesApi.create(payload);
      message.success('Curso creado');
      setModalOpen(false);
      form.resetFields();
      loadCourses();
    } catch {
      message.error('Error al crear curso');
    }
  };

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]));

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name', render: (v: string | null) => <Text strong>{v || '—'}</Text> },
    {
      title: 'Profesor', dataIndex: 'teacher_id', key: 'teacher_id', render: (v: string) => {
        const t = teacherMap[v];
        return t ? <Text>{t.full_name} <Text type="secondary">({t.email})</Text></Text> : <Tag>{v.substring(0, 8)}...</Tag>;
      }
    },
    { title: 'Horario', dataIndex: 'schedule_json', key: 'schedule_json', render: (v: Record<string, unknown> | null) => v ? <Text code style={{ fontSize: 11 }}>{JSON.stringify(v)}</Text> : '—' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ background: '#5c2d91', borderRadius: 4 }}>
          Nuevo Curso
        </Button>
      </div>
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={courses} rowKey="id" loading={loading} pagination={false} size="middle" />
      </Card>

      <Modal
        title={<span><BookOutlined style={{ marginRight: 8, color: '#5c2d91' }} />Nuevo Curso</span>}
        open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}
        okText="Crear" cancelText="Cancelar"
        okButtonProps={{ style: { background: '#5c2d91', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nombre del Curso" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ej: Matemáticas 1º Grado" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="teacher_id" label="Profesor" rules={[{ required: true, message: 'Requerido' }]}>
            {teachers.length > 0 ? (
              <Select placeholder="Seleccionar profesor" style={{ borderRadius: 4 }} showSearch optionFilterProp="label"
                options={teachers.map(t => ({ value: t.id, label: `${t.full_name} — ${t.email}` }))}
              />
            ) : (
              <Input placeholder="UUID del profesor (registra profesores primero)" style={{ borderRadius: 4 }} />
            )}
          </Form.Item>
          <Form.Item name="schedule_raw" label="Horario (JSON)" extra='Ej: {"lunes":"08:00-09:30","miercoles":"08:00-09:30"}'>
            <Input.TextArea rows={3} placeholder='{"lunes":"08:00-09:30"}' style={{ borderRadius: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Enrollments Tab ─── */
const EnrollmentsTab: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [form] = Form.useForm();

  const search = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    try {
      const res = await enrollmentsApi.getByStudent(searchId.trim());
      setEnrollments(res.data.data || []);
    } catch {
      message.error('Error al buscar matrículas');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateEnrollmentRequest = { student_id: values.student_id, course_id: values.course_id, year: values.year };
      const res = await enrollmentsApi.create(payload);
      message.success('Matrícula creada');
      if (res.data.data) setEnrollments(prev => [...prev, res.data.data!]);
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Error al crear matrícula');
    }
  };

  const columns = [
    { title: 'Estudiante', dataIndex: 'student_id', key: 'student_id', render: (v: string) => <Tag>{v.substring(0, 8)}...</Tag> },
    { title: 'Curso', dataIndex: 'course_id', key: 'course_id', render: (v: string) => <Tag color="purple">{v.substring(0, 8)}...</Tag> },
    { title: 'Año', dataIndex: 'year', key: 'year' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Input placeholder="ID del Estudiante" value={searchId} onChange={(e) => setSearchId(e.target.value)} onPressEnter={search} style={{ width: 300, borderRadius: 4 }} prefix={<SearchOutlined style={{ color: '#999' }} />} />
          <Button onClick={search} style={{ borderRadius: 4 }}>Buscar Matrículas</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ background: '#5c2d91', borderRadius: 4 }}>
          Nueva Matrícula
        </Button>
      </div>
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={enrollments} rowKey="id" loading={loading} pagination={false} locale={{ emptyText: <Empty description="Busca matrículas por ID de estudiante" /> }} size="middle" />
      </Card>

      <Modal
        title={<span><IdcardOutlined style={{ marginRight: 8, color: '#5c2d91' }} />Nueva Matrícula</span>}
        open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}
        okText="Matricular" cancelText="Cancelar"
        okButtonProps={{ style: { background: '#5c2d91', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="student_id" label="ID del Estudiante" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="UUID del estudiante" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="course_id" label="ID del Curso" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="UUID del curso" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="year" label="Año" rules={[{ required: true, message: 'Requerido' }]} initialValue={2026}>
            <InputNumber min={2020} max={2030} style={{ width: '100%', borderRadius: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Input Grades Tab ─── */
const GradesTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: GradeInput) => {
    setLoading(true);
    try {
      await academicApi.inputGrades(values);
      message.success('Calificación registrada');
      form.resetFields();
    } catch { message.error('Error al registrar calificación'); }
    finally { setLoading(false); }
  };

  return (
    <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8', maxWidth: 600 }}>
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="enrollment_id" label="ID de Matrícula" rules={[{ required: true, message: 'Requerido' }]}>
          <Input placeholder="UUID de la matrícula" style={{ borderRadius: 4 }} />
        </Form.Item>
        <Form.Item name="unit" label="Unidad / Bimestre" rules={[{ required: true, message: 'Requerido' }]}>
          <Input placeholder="Ej: Bimestre 1" style={{ borderRadius: 4 }} />
        </Form.Item>
        <Form.Item name="score" label="Calificación" rules={[{ required: true, message: 'Requerido' }]}>
          <InputNumber min={0} max={20} step={0.5} style={{ width: '100%', borderRadius: 4 }} placeholder="0 - 20" />
        </Form.Item>
        <Form.Item name="comments" label="Comentarios">
          <Input.TextArea rows={3} placeholder="Observaciones (opcional)" style={{ borderRadius: 4 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<TrophyOutlined />} style={{ background: '#5c2d91', borderRadius: 4 }}>
          Registrar Calificación
        </Button>
      </Form>
    </Card>
  );
};

/* ─── Report Card Tab ─── */
const ReportCardTab: React.FC = () => {
  const [entries, setEntries] = useState<ReportCardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');

  const search = async () => {
    if (!studentId.trim()) return;
    setLoading(true);
    try {
      const res = await academicApi.getReportCard(studentId.trim());
      setEntries(res.data.data || []);
    } catch { message.error('Error al buscar boleta'); setEntries([]); }
    finally { setLoading(false); }
  };

  const avgScore = entries.length > 0 ? (entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(1) : '0';

  const columns = [
    { title: 'Curso', dataIndex: 'course_name', key: 'course_name' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit', render: (v: string | null) => <Tag color="purple">{v || '—'}</Tag> },
    { title: 'Calificación', dataIndex: 'score', key: 'score', render: (v: number) => { const color = v >= 14 ? '#107c10' : v >= 11 ? '#d83b01' : '#a80000'; return <Text strong style={{ color }}>{v}</Text>; } },
    { title: 'Comentarios', dataIndex: 'comments', key: 'comments', render: (v: string | null) => v || '—' },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: '12px 16px' } }}>
        <Space>
          <Input placeholder="ID del Estudiante" value={studentId} onChange={(e) => setStudentId(e.target.value)} onPressEnter={search} style={{ width: 300, borderRadius: 4 }} prefix={<SearchOutlined style={{ color: '#999' }} />} />
          <Button onClick={search} style={{ borderRadius: 4 }}>Ver Boleta</Button>
        </Space>
      </Card>
      {entries.length > 0 && <Alert message={`Promedio general: ${avgScore}`} type={Number(avgScore) >= 14 ? 'success' : Number(avgScore) >= 11 ? 'warning' : 'error'} showIcon style={{ marginBottom: 16, borderRadius: 4 }} />}
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={entries} rowKey={(r) => `${r.course_id}-${r.unit}`} loading={loading} pagination={false} locale={{ emptyText: <Empty description="Busca la boleta por ID de estudiante" /> }} size="middle" />
      </Card>
    </div>
  );
};

/* ─── Attendance Tab ─── */
const AttendanceTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { enrollment_id: string; date: unknown; status: string }) => {
    setLoading(true);
    try {
      const payload: AttendanceInput = {
        enrollment_id: values.enrollment_id,
        date: (values.date as { format: (s: string) => string }).format('YYYY-MM-DD'),
        status: values.status,
      };
      await academicApi.markAttendance(payload);
      message.success('Asistencia registrada');
      form.resetFields();
    } catch { message.error('Error al registrar asistencia'); }
    finally { setLoading(false); }
  };

  return (
    <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8', maxWidth: 600 }}>
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="enrollment_id" label="ID de Matrícula" rules={[{ required: true, message: 'Requerido' }]}>
          <Input placeholder="UUID de la matrícula" style={{ borderRadius: 4 }} />
        </Form.Item>
        <Form.Item name="date" label="Fecha" rules={[{ required: true, message: 'Requerido' }]}>
          <DatePicker style={{ width: '100%', borderRadius: 4 }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="status" label="Estado" rules={[{ required: true, message: 'Requerido' }]}>
          <Select placeholder="Seleccionar estado" style={{ borderRadius: 4 }}>
            <Select.Option value="PRESENT">Presente ✅</Select.Option>
            <Select.Option value="ABSENT">Ausente ❌</Select.Option>
            <Select.Option value="LATE">Tardanza ⏰</Select.Option>
            <Select.Option value="EXCUSED">Justificado 📋</Select.Option>
          </Select>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />} style={{ background: '#5c2d91', borderRadius: 4 }}>
          Registrar Asistencia
        </Button>
      </Form>
    </Card>
  );
};

/* ─── Main Academic Page ─── */
const AcademicPage: React.FC = () => (
  <div>
    <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>
      <BookOutlined style={{ marginRight: 8, color: '#5c2d91' }} />
      Módulo Académico
    </Title>
    <Tabs defaultActiveKey="courses" type="card" items={[
      { key: 'courses', label: <span><ScheduleOutlined /> Cursos</span>, children: <CoursesTab /> },
      { key: 'enrollments', label: <span><IdcardOutlined /> Matrículas</span>, children: <EnrollmentsTab /> },
      { key: 'grades', label: <span><TrophyOutlined /> Registrar Nota</span>, children: <GradesTab /> },
      { key: 'report', label: <span><FileTextOutlined /> Boleta</span>, children: <ReportCardTab /> },
      { key: 'attendance', label: <span><CheckCircleOutlined /> Asistencia</span>, children: <AttendanceTab /> },
    ]} />
  </div>
);

export default AcademicPage;
