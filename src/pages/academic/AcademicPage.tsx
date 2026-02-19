import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  SearchOutlined, TrophyOutlined, PlusOutlined,
  ScheduleOutlined, IdcardOutlined, MinusCircleOutlined,
  BookOutlined, FileTextOutlined, CheckCircleOutlined, WarningOutlined,
  EditOutlined, DeleteOutlined, UserOutlined, TagOutlined,
  CalendarOutlined, SettingOutlined, ClockCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  Tabs, Form, Input, InputNumber, Button, Table, Card, Typography,
  Space, Select, DatePicker, message, Empty, Tag, Alert, Modal, Tooltip, TimePicker, Popconfirm, Row, Col,
} from 'antd';
import { academicApi, coursesApi, enrollmentsApi, usersApi, studentsApi } from '../../api/endpoints';
import type { ReportCardEntry, GradeInput, AttendanceInput, Course, Enrollment, CreateCourseRequest, CreateEnrollmentRequest, User, Student } from '../../types';

const { Title, Text } = Typography;

interface Teacher { id: string; full_name: string; email: string }

/* ─── Courses Tab ─── */
const CoursesTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const schedule_json: Record<string, unknown> = {};
      if (values.schedule_list) {
        values.schedule_list.forEach((item: any) => {
          if (item?.day && item?.time) {
            const start = item.time[0].format('HH:mm');
            const end = item.time[1].format('HH:mm');
            schedule_json[item.day] = `${start}-${end}`;
          }
        });
      }
      const payload = { name: values.name, teacher_id: values.teacher_id, schedule_json };

      if (editing) {
        await coursesApi.update(editing.id, payload);
        message.success('Curso actualizado');
      } else {
        await coursesApi.create(payload);
        message.success('Curso creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      loadCourses();
    } catch {
      message.error('Error al guardar curso');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await coursesApi.delete(id);
      message.success('Curso eliminado');
      loadCourses();
    } catch { message.error('Error al eliminar'); }
  };

  const openEdit = (record: Course) => {
    setEditing(record);
    const schedule_list = record.schedule_json ? Object.entries(record.schedule_json).map(([day, range]) => {
      const [start, end] = (range as string).split('-');
      return { day, time: [dayjs(start, 'HH:mm'), dayjs(end, 'HH:mm')] };
    }) : [];

    form.setFieldsValue({
      name: record.name,
      teacher_id: record.teacher_id,
      schedule_list
    });
    setModalOpen(true);
  };

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]));

  const columns = [
    {
      title: <span><BookOutlined style={{ color: '#5c2d91' }} /> Nombre</span>,
      dataIndex: 'name',
      key: 'name',
      render: (v: string | null) => <Text strong>{v || '—'}</Text>
    },
    {
      title: <span><UserOutlined style={{ color: '#5c2d91' }} /> Profesor</span>,
      dataIndex: 'teacher_id',
      key: 'teacher_id',
      render: (v: string) => {
        const t = teacherMap[v];
        return t ? (
          <Space>
            <UserOutlined style={{ color: '#999' }} />
            <Text>{t.full_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>({t.email})</Text>
          </Space>
        ) : <Tag>{v.substring(0, 8)}...</Tag>;
      }
    },
    {
      title: <span><ClockCircleOutlined style={{ color: '#5c2d91' }} /> Horario</span>,
      dataIndex: 'schedule_json',
      key: 'schedule_json',
      render: (v: Record<string, unknown> | null) => (
        v ? (
          <Space direction="vertical" size={2}>
            {Object.entries(v).map(([day, time]) => (
              <Tag key={day} color="blue" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                <Text strong>{day}:</Text> {time as string}
              </Tag>
            ))}
          </Space>
        ) : <Text type="secondary">Sin horario</Text>
      )
    },
    {
      title: <span><SettingOutlined style={{ color: '#5c2d91' }} /> Acciones</span>,
      key: 'actions',
      width: 100,
      render: (_: unknown, r: Course) => (
        <Space>
          <Tooltip title="Editar curso">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} style={{ color: '#0078d4' }} />
          </Tooltip>
          <Popconfirm title="¿Eliminar curso?" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
            <Tooltip title="Eliminar curso">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ background: '#5c2d91', borderRadius: 4 }}>
          Nuevo Curso
        </Button>
      </div>
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={courses} rowKey="id" loading={loading} pagination={false} size="middle" />
      </Card>

      <Modal
        title={<span><BookOutlined style={{ marginRight: 8, color: '#5c2d91' }} />{editing ? 'Editar Curso' : 'Nuevo Curso'}</span>}
        open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        okText={editing ? 'Guardar' : 'Crear'} cancelText="Cancelar"
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
          <Form.List name="schedule_list">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'day']}
                      rules={[{ required: true, message: 'Día requerido' }]}
                    >
                      <Select placeholder="Día" style={{ width: 120 }}>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                          <Select.Option key={d} value={d}>{d}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'time']}
                      rules={[{ required: true, message: 'Horario requerido' }]}
                    >
                      <TimePicker.RangePicker format="HH:mm" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#999' }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Agregar Horario
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Enrollments Tab ─── */
const EnrollmentsTab: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, eRes] = await Promise.all([studentsApi.getAll(), coursesApi.getAll(), enrollmentsApi.getAll()]);
      setStudents(Array.isArray(sRes.data.data) ? sRes.data.data : []);
      setCourses(Array.isArray(cRes.data.data) ? cRes.data.data : []);
      setEnrollments(Array.isArray(eRes.data.data) ? eRes.data.data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredEnrollments = enrollments.filter(e => {
    if (!searchText) return true;
    const s = students.find(st => st.id === e.student_id);
    const search = searchText.toLowerCase();
    const fullName = `${s?.first_name} ${s?.last_name}`.toLowerCase();
    const dni = s?.document_number?.toLowerCase() || '';
    return fullName.includes(search) || dni.includes(search);
  });

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

  const handleDelete = async (id: string) => {
    try {
      await enrollmentsApi.delete(id);
      message.success('Matrícula eliminada');
      loadData();
    } catch { message.error('Error al eliminar'); }
  };

  const getStudentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name} (${s.document_number || 'S/D'})` : id.substring(0, 8) + '...';
  };

  const getCourseName = (id: string) => {
    const c = courses.find(co => co.id === id);
    return c ? c.name : id.substring(0, 8) + '...';
  };

  const columns = [
    {
      title: <span><UserOutlined style={{ color: '#5c2d91' }} /> Estudiante</span>,
      dataIndex: 'student_id',
      key: 'student_id',
      render: (v: string) => {
        const s = students.find(st => st.id === v);
        return s ? (
          <Space>
            <UserOutlined style={{ color: '#999' }} />
            <Text strong>{s.first_name} {s.last_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>({s.document_number || 'S/D'})</Text>
          </Space>
        ) : <Text type="secondary">ID: {v.substring(0, 8)}...</Text>;
      }
    },
    {
      title: <span><BookOutlined style={{ color: '#5c2d91' }} /> Curso</span>,
      dataIndex: 'course_id',
      key: 'course_id',
      render: (v: string) => <Tag color="purple">{getCourseName(v)}</Tag>
    },
    {
      title: <span><CalendarOutlined style={{ color: '#5c2d91' }} /> Año</span>,
      dataIndex: 'year',
      key: 'year',
      render: (v: number) => <Tag color="blue">{v}</Tag>
    },
    {
      title: <span><SettingOutlined style={{ color: '#5c2d91' }} /> Acciones</span>,
      key: 'actions',
      render: (_: unknown, r: Enrollment) => (
        <Popconfirm title="¿Eliminar matrícula?" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
          <Tooltip title="Eliminar matrícula">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Tooltip>
        </Popconfirm>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Filtrar por nombre o DNI..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: 4 }}
            prefix={<SearchOutlined style={{ color: '#999' }} />}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ background: '#5c2d91', borderRadius: 4 }}>
          Nueva Matrícula
        </Button>
      </div>
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={filteredEnrollments} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} locale={{ emptyText: <Empty description="No hay matrículas registradas" /> }} size="middle" />
      </Card>

      <Modal
        title={<span><IdcardOutlined style={{ marginRight: 8, color: '#5c2d91' }} />Nueva Matrícula</span>}
        open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}
        okText="Matricular" cancelText="Cancelar"
        okButtonProps={{ style: { background: '#5c2d91', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="student_id" label="Estudiante" rules={[{ required: true, message: 'Requerido' }]}>
            <Select placeholder="Seleccionar estudiante" showSearch optionFilterProp="label"
              options={students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.document_number || 'S/D'})` }))}
            />
          </Form.Item>
          <Form.Item name="course_id" label="Curso" rules={[{ required: true, message: 'Requerido' }]}>
            <Select placeholder="Seleccionar curso" showSearch optionFilterProp="label"
              options={courses.map(c => ({ value: c.id, label: c.name || 'Sin nombre' }))}
            />
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
  const [students, setStudents] = useState<Student[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]); // To map course_id to name
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Load students and courses on mount
  useEffect(() => {
    Promise.all([studentsApi.getAll(), coursesApi.getAll()]).then(([sRes, cRes]) => {
      setStudents(sRes.data.data || []);
      setCourses(cRes.data.data || []);
    }).catch(() => { });
  }, []);

  // When student is selected, load their enrollments
  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    form.setFieldValue('enrollment_id', null); // Reset enrollment selection
    try {
      const res = await enrollmentsApi.getByStudent(studentId);
      const data = res.data.data;
      setStudentEnrollments(Array.isArray(data) ? data : []);
    } catch {
      message.error('Error al cargar matrículas del estudiante');
      setStudentEnrollments([]);
    }
  };

  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || 'Curso desconocido';

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

    <div style={{ maxWidth: 800 }}>
      <Card
        bordered={false}
        style={{ marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderRadius: 8 }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<Space><UserOutlined style={{ color: '#5c2d91' }} /> Estudiante</Space>}
                // name="student_id" - Handled by onChange
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select
                  placeholder="Buscar estudiante"
                  showSearch
                  optionFilterProp="label"
                  onChange={handleStudentChange}
                  options={students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))}
                  style={{ borderRadius: 4 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enrollment_id"
                label={<Space><BookOutlined style={{ color: '#5c2d91' }} /> Curso Matriculado</Space>}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select
                  placeholder="Seleccionar curso"
                  disabled={!selectedStudentId}
                  options={studentEnrollments.map(e => ({ value: e.id, label: `${getCourseName(e.course_id)} (${e.year})` }))}
                  style={{ borderRadius: 4 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="unit"
                label={<Space><TagOutlined style={{ color: '#5c2d91' }} /> Unidad / Bimestre</Space>}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Input placeholder="Ej: Bimestre 1" style={{ borderRadius: 4 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="score"
                label={<Space><TrophyOutlined style={{ color: '#5c2d91' }} /> Calificación</Space>}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <InputNumber min={0} max={20} step={0.5} style={{ width: '100%', borderRadius: 4 }} placeholder="0 - 20" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="comments"
                label={<Space><FileTextOutlined style={{ color: '#5c2d91' }} /> Comentarios</Space>}
              >
                <Input.TextArea rows={1} placeholder="Observaciones" style={{ borderRadius: 4 }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifySelf: 'flex-end' }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />} style={{ background: '#0078d4', borderRadius: 4, height: 40, paddingLeft: 24, paddingRight: 24 }}>
              Registrar Calificación
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );

};

/* ─── Report Card Tab ─── */
const ReportCardTab: React.FC = () => {
  const [entries, setEntries] = useState<ReportCardEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ReportCardEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    studentsApi.getAll().then(res => setStudents(res.data.data || [])).catch(() => { });
  }, []);

  const search = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoading(true);
    try {
      const res = await academicApi.getReportCard(studentId);
      const data = res.data.data as any;

      if (data && Array.isArray(data.courses)) {
        const flatEntries: ReportCardEntry[] = [];
        data.courses.forEach((c: any) => {
          if (Array.isArray(c.grades)) {
            c.grades.forEach((g: any) => {
              flatEntries.push({
                grade_id: g.grade_id || g.id || `temp-${Math.random()}`, // Fallback if ID is missing
                course_id: c.course_id,
                course_name: c.course_name,
                unit: g.unit,
                score: g.score,
                comments: g.comments,
              });
            });
          }
        });
        setEntries(flatEntries);
      } else {
        setEntries([]);
      }
    } catch { message.error('Error al buscar boleta'); setEntries([]); }
    finally { setLoading(false); }
  };

  const avgScore = entries.length > 0 ? (entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(1) : '0';

  const handleDelete = async (gradeId: string) => {
    try {
      await academicApi.deleteGrade(gradeId);
      message.success('Calificación eliminada');
      if (selectedStudentId) search(selectedStudentId);
    } catch { message.error('Error al eliminar'); }
  };

  const openEdit = (record: ReportCardEntry) => {
    setEditing(record);
    form.setFieldsValue({
      unit: record.unit,
      score: record.score,
      comments: record.comments,
    });
    setModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await academicApi.updateGrade(editing.grade_id, values);
        message.success('Calificación actualizada');
        setModalOpen(false);
        setEditing(null);
        if (selectedStudentId) search(selectedStudentId);
      }
    } catch { message.error('Error al actualizar'); }
  };

  const columns = [
    {
      title: <span><BookOutlined style={{ color: '#5c2d91' }} /> Curso</span>,
      dataIndex: 'course_name',
      key: 'course_name',
      render: (v: string | null) => v ? <Text strong>{v}</Text> : <Text type="secondary">Curso desconocido</Text>
    },
    {
      title: <span><TagOutlined style={{ color: '#5c2d91' }} /> Unidad</span>,
      dataIndex: 'unit',
      key: 'unit',
      render: (v: string | null) => <Tag color="geekblue">{v || '—'}</Tag>
    },
    {
      title: <span><TrophyOutlined style={{ color: '#5c2d91' }} /> Calificación</span>,
      dataIndex: 'score',
      key: 'score',
      render: (v: number) => {
        const color = v >= 14 ? '#107c10' : v >= 11 ? '#d83b01' : '#a80000';
        return (
          <Space>
            {v >= 14 ? <CheckCircleOutlined style={{ color }} /> : <WarningOutlined style={{ color }} />}
            <Text strong style={{ color, fontSize: 16 }}>{Number(v).toFixed(2)}</Text>
          </Space>
        );
      }
    },
    {
      title: <span><FileTextOutlined style={{ color: '#5c2d91' }} /> Comentarios</span>,
      dataIndex: 'comments',
      key: 'comments',
      render: (v: string | null) => v ? <span><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 4 }} />{v}</span> : <Text type="secondary">—</Text>
    },
    {
      title: <span><SettingOutlined style={{ color: '#5c2d91' }} /> Acciones</span>,
      key: 'actions',
      render: (_: unknown, r: ReportCardEntry) => (
        <Space>
          <Tooltip title="Editar nota">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} size="small" style={{ color: '#0078d4' }} />
          </Tooltip>
          <Popconfirm title="¿Eliminar calificación?" onConfirm={() => handleDelete(r.grade_id)} okText="Sí" cancelText="No">
            <Tooltip title="Eliminar nota">
              <Button type="text" icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: '12px 16px' } }}>
        <Space>
          <Text strong>Estudiante:</Text>
          <Select
            placeholder="Seleccionar estudiante para ver boleta"
            showSearch
            optionFilterProp="label"
            style={{ width: 350 }}
            onChange={search}
            options={students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.document_number || 'S/D'})` }))}
          />
        </Space>
      </Card>
      {entries.length > 0 && <Alert message={`Promedio general: ${avgScore}`} type={Number(avgScore) >= 14 ? 'success' : Number(avgScore) >= 11 ? 'warning' : 'error'} showIcon style={{ marginBottom: 16, borderRadius: 4 }} />}
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={entries} rowKey="grade_id" loading={loading} pagination={false} locale={{ emptyText: <Empty description="Selecciona un estudiante para ver su boleta" /> }} size="middle" />
      </Card>

      <Modal
        title={<span><EditOutlined style={{ marginRight: 8, color: '#5c2d91' }} />Editar Calificación</span>}
        open={modalOpen} onOk={handleUpdate} onCancel={() => { setModalOpen(false); setEditing(null); }}
        okText="Guardar" cancelText="Cancelar"
        okButtonProps={{ style: { background: '#5c2d91', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="unit" label="Unidad" rules={[{ required: true, message: 'Requerido' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="score" label="Calificación" rules={[{ required: true, message: 'Requerido' }]}>
            <InputNumber min={0} max={20} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="comments" label="Comentarios">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Attendance Tab ─── */
const AttendanceTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([studentsApi.getAll(), coursesApi.getAll()]).then(([sRes, cRes]) => {
      setStudents(sRes.data.data || []);
      setCourses(cRes.data.data || []);
    }).catch(() => { });
  }, []);

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    form.setFieldValue('enrollment_id', null);
    try {
      const res = await enrollmentsApi.getByStudent(studentId);
      const data = res.data.data;
      setStudentEnrollments(Array.isArray(data) ? data : []);
    } catch {
      message.error('Error al cargar matrículas');
      setStudentEnrollments([]);
    }
  };

  const handleEnrollmentChange = async (enrollmentId: string) => {
    setSelectedEnrollmentId(enrollmentId);
    try {
      const res = await academicApi.getAttendance(enrollmentId);
      const data = res.data.data;
      setAttendanceList(Array.isArray(data) ? data : []);
    } catch { setAttendanceList([]); }
  };

  const handleDelete = async (id: string) => {
    try {
      await academicApi.deleteAttendance(id);
      message.success('Asistencia eliminada');
      if (selectedEnrollmentId) handleEnrollmentChange(selectedEnrollmentId);
    } catch { message.error('Error al eliminar'); }
  };

  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || 'Curso desconocido';

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
      if (values.enrollment_id) handleEnrollmentChange(values.enrollment_id);
    } catch { message.error('Error al registrar asistencia'); }
    finally { setLoading(false); }
  };

  const columns = [
    {
      title: <span><CalendarOutlined style={{ color: '#5c2d91' }} /> Fecha</span>,
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => <Text>{dayjs(v).format('DD/MM/YYYY')}</Text>
    },
    {
      title: <span><InfoCircleOutlined style={{ color: '#5c2d91' }} /> Estado</span>,
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const map: Record<string, any> = { PRESENT: ['#52c41a', 'Presente'], ABSENT: ['#f5222d', 'Ausente'], LATE: ['#faad14', 'Tardanza'], EXCUSED: ['#1890ff', 'Justificado'] };
        const [color, text] = map[v] || ['default', v];
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: <span><SettingOutlined style={{ color: '#5c2d91' }} /> Acciones</span>,
      key: 'actions',
      render: (_: unknown, r: any) => (
        <Popconfirm title="¿Eliminar asistencia?" onConfirm={() => handleDelete(r.id)} okText="Sí" cancelText="No">
          <Tooltip title="Eliminar registro">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Tooltip>
        </Popconfirm>
      )
    },
  ];

  return (

    <div style={{ maxWidth: 800 }}>
      <Card
        bordered={false}
        style={{ marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderRadius: 8 }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<Space><UserOutlined style={{ color: '#5c2d91' }} /> Estudiante</Space>}
                name="student_id_val" // Dummy name, handled by onChange
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select
                  placeholder="Buscar estudiante"
                  showSearch
                  optionFilterProp="label"
                  onChange={handleStudentChange}
                  options={students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))}
                  style={{ borderRadius: 4 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enrollment_id"
                label={<Space><BookOutlined style={{ color: '#5c2d91' }} /> Curso Matriculado</Space>}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select
                  placeholder="Seleccionar curso"
                  disabled={!selectedStudentId}
                  onChange={handleEnrollmentChange}
                  options={studentEnrollments.map(e => ({ value: e.id, label: `${getCourseName(e.course_id)} (${e.year})` }))}
                  style={{ borderRadius: 4 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label={<Space><CalendarOutlined style={{ color: '#5c2d91' }} /> Fecha</Space>}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <DatePicker style={{ width: '100%', borderRadius: 4 }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={<Space><InfoCircleOutlined style={{ color: '#5c2d91' }} /> Estado</Space>}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <Select placeholder="Seleccionar estado" style={{ borderRadius: 4 }}>
                  <Select.Option value="PRESENT">Presente ✅</Select.Option>
                  <Select.Option value="ABSENT">Ausente ❌</Select.Option>
                  <Select.Option value="LATE">Tardanza ⏰</Select.Option>
                  <Select.Option value="EXCUSED">Justificado 📋</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifySelf: 'flex-end' }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />} style={{ background: '#0078d4', borderRadius: 4, height: 40, paddingLeft: 24, paddingRight: 24 }}>
              Registrar Asistencia
            </Button>
          </div>
        </Form>
      </Card>

      {selectedEnrollmentId && (
        <Card bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={attendanceList}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No hay registros" /> }}
          />
        </Card>
      )}
    </div>
  );
};

/* ─── Main Academic Page ─── */
const AcademicPage: React.FC = () => (
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <div style={{ marginBottom: 24, padding: '0 8px' }}>
      <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1a1a1a' }}>
        <BookOutlined style={{ marginRight: 12, color: '#5c2d91' }} />
        Módulo Académico
      </Title>
      <Text type="secondary" style={{ marginLeft: 36 }}>Gestión de cursos, matrículas y calificaciones</Text>
    </div>

    <div style={{ background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
      <Tabs
        defaultActiveKey="courses"
        size="large"
        tabBarStyle={{ marginBottom: 24 }}
        items={[
          { key: 'courses', label: <span style={{ padding: '0 8px' }}><ScheduleOutlined /> Cursos</span>, children: <CoursesTab /> },
          { key: 'enrollments', label: <span style={{ padding: '0 8px' }}><IdcardOutlined /> Matrículas</span>, children: <EnrollmentsTab /> },
          { key: 'grades', label: <span style={{ padding: '0 8px' }}><TrophyOutlined /> Registrar Nota</span>, children: <GradesTab /> },
          { key: 'report', label: <span style={{ padding: '0 8px' }}><FileTextOutlined /> Boleta</span>, children: <ReportCardTab /> },
          { key: 'attendance', label: <span style={{ padding: '0 8px' }}><CheckCircleOutlined /> Asistencia</span>, children: <AttendanceTab /> },
        ]}
      />
    </div>
  </div>
);

export default AcademicPage;
