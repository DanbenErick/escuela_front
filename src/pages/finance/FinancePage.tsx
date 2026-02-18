import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs, Form, Input, InputNumber, Button, Table, Card, Typography,
  Space, Tag, Select, DatePicker, message, Empty, Alert, Modal, Tooltip, Row, Col, Statistic,
} from 'antd';
import {
  DollarOutlined, CreditCardOutlined,
  BankOutlined, FileTextOutlined, PlusOutlined,
  CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { financeApi, conceptsApi, studentsApi, familiesApi } from '../../api/endpoints';
import type { FamilyDebt, FeeConcept, GenerateFeesRequest, RegisterPaymentRequest, CreateConceptRequest, Student, Family } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusLabels: Record<string, string> = { paid: 'Pagado', partial: 'Parcial', pending: 'Pendiente' };
const statusColors: Record<string, string> = { paid: 'green', partial: 'orange', pending: 'red' };

/* ─── Fee Concepts Tab ─── */
const ConceptsTab: React.FC = () => {
  const [concepts, setConcepts] = useState<FeeConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadConcepts = async () => {
    setLoading(true);
    try {
      const res = await conceptsApi.getAll();
      setConcepts(res.data.data || []);
    } catch {
      message.error('Error al cargar conceptos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConcepts(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateConceptRequest = {
        name: values.name,
        amount: values.amount,
        due_date: values.due_date.format('YYYY-MM-DD'),
      };
      await conceptsApi.create(payload);
      message.success('Concepto creado');
      setModalOpen(false);
      form.resetFields();
      loadConcepts();
    } catch {
      message.error('Error al crear concepto');
    }
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name', render: (v: string | null) => <Text strong>{v || '—'}</Text> },
    { title: 'Monto', dataIndex: 'amount', key: 'amount', render: (v: number | string | null) => v != null ? <Tag color="green">S/ {Number(v).toFixed(2)}</Tag> : '—' },
    { title: 'Vencimiento', dataIndex: 'due_date', key: 'due_date', render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ background: '#107c10', borderRadius: 4 }}>
          Nuevo Concepto
        </Button>
      </div>
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={concepts} rowKey="id" loading={loading} pagination={false} size="middle" />
      </Card>

      <Modal
        title={<span><FileTextOutlined style={{ marginRight: 8, color: '#107c10' }} />Nuevo Concepto de Cobro</span>}
        open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}
        okText="Crear" cancelText="Cancelar"
        okButtonProps={{ style: { background: '#107c10', borderRadius: 4 } }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ej: Pensión Marzo 2026" style={{ borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="amount" label="Monto (S/)" rules={[{ required: true, message: 'Requerido' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%', borderRadius: 4 }} placeholder="350.00" />
          </Form.Item>
          <Form.Item name="due_date" label="Fecha de Vencimiento" rules={[{ required: true, message: 'Requerido' }]}>
            <DatePicker style={{ width: '100%', borderRadius: 4 }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Generate Fees Tab ─── */
const GenerateFeesTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<FeeConcept[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form] = Form.useForm();
  const watchedConceptId = Form.useWatch('concept_id', form);

  useEffect(() => {
    conceptsApi.getAll().then(res => setConcepts(res.data.data || [])).catch(() => { });
    studentsApi.getAll().then(res => setStudents(res.data.data || [])).catch(() => { });
  }, []);

  const onFinish = async (values: { concept_id: number; student_ids: string[] }) => {
    setLoading(true);
    try {
      const payload: GenerateFeesRequest = { concept_id: values.concept_id, student_ids: values.student_ids };
      await financeApi.generateFees(payload);
      message.success(`¡${values.student_ids.length} cuota(s) generada(s) correctamente!`);
      form.resetFields();
    } catch {
      message.error('Error al generar cuotas');
    } finally {
      setLoading(false);
    }
  };

  const selectedConcept = concepts.find(c => c.id === watchedConceptId);

  return (
    <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8', maxWidth: 700 }}>
      <Alert
        title="Generación masiva de cuotas"
        description="Selecciona un concepto y los estudiantes. Se creará una deuda individual para cada estudiante seleccionado."
        type="info" showIcon style={{ marginBottom: 20, borderRadius: 4 }}
      />
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="concept_id" label="Concepto de Cobro" rules={[{ required: true, message: 'Selecciona un concepto' }]}>
          <Select placeholder="Seleccionar concepto" style={{ borderRadius: 4 }} showSearch optionFilterProp="label"
            options={concepts.map(c => ({ value: c.id, label: `${c.name} — S/ ${Number(c.amount ?? 0).toFixed(2)}` }))}
          />
        </Form.Item>
        {selectedConcept && (
          <Alert title={`Monto por estudiante: S/ ${Number(selectedConcept.amount ?? 0).toFixed(2)}`} type="success" showIcon style={{ marginBottom: 16, borderRadius: 4 }} />
        )}
        <Form.Item name="student_ids" label={
          <Space>
            <span>Estudiantes</span>
            <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }}
              onClick={() => {
                const allIds = students.map(s => s.id);
                const current = form.getFieldValue('student_ids') || [];
                form.setFieldsValue({ student_ids: current.length === allIds.length ? [] : allIds });
              }}
            >
              {(form.getFieldValue('student_ids') || []).length === students.length ? 'Deseleccionar todos' : `Seleccionar todos (${students.length})`}
            </Button>
          </Space>
        } rules={[{ required: true, message: 'Selecciona al menos un estudiante' }]}>
          <Select mode="multiple" placeholder="Buscar y seleccionar estudiantes..." style={{ borderRadius: 4 }} showSearch optionFilterProp="label"
            maxTagCount={5} maxTagPlaceholder={(omitted) => `+${omitted.length} más`}
            options={students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}${(s as any).family_code ? ' — ' + (s as any).family_code : ''}` }))}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} icon={<FileTextOutlined />} style={{ background: '#107c10', borderRadius: 4 }}>
          Generar Cuotas
        </Button>
      </Form>
    </Card>
  );
};

/* ─── Family Debts Tab ─── */
const FamilyDebtsTab: React.FC = () => {
  const [debts, setDebts] = useState<FamilyDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<(Family & { guardian_name?: string })[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string | undefined>();
  const [payModal, setPayModal] = useState(false);
  const [payingFee, setPayingFee] = useState<FamilyDebt | null>(null);
  const [payForm] = Form.useForm();

  const loadFamilies = useCallback(async () => {
    try {
      const res = await familiesApi.getAll();
      setFamilies((res.data.data || []) as any);
    } catch { }
  }, []);

  useEffect(() => { loadFamilies(); }, [loadFamilies]);

  const search = async (famId?: string) => {
    const id = famId || selectedFamily;
    if (!id) return;
    setLoading(true);
    try {
      const res = await financeApi.getFamilyDebt(id);
      setDebts(res.data.data || []);
    } catch {
      message.error('Error al buscar deudas');
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (record: FamilyDebt) => {
    setPayingFee(record);
    payForm.setFieldsValue({ student_fee_id: record.fee_id, amount: Number(record.balance), payment_method: undefined, transaction_ref: '' });
    setPayModal(true);
  };

  const handlePay = async () => {
    try {
      const values = await payForm.validateFields();
      const payload: RegisterPaymentRequest = {
        student_fee_id: values.student_fee_id,
        amount: values.amount,
        payment_method: values.payment_method,
        transaction_ref: values.transaction_ref || undefined,
      };
      await financeApi.registerPayment(payload);
      message.success('¡Pago registrado correctamente!');
      setPayModal(false);
      payForm.resetFields();
      search(); // Reload debts
    } catch {
      message.error('Error al registrar pago');
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const totalOriginal = debts.reduce((sum, d) => sum + Number(d.original_amount), 0);
  const totalPaid = totalOriginal - totalDebt;

  const columns = [
    { title: 'Estudiante', key: 'student', render: (_: unknown, r: FamilyDebt) => <Text strong>{r.student_first_name} {r.student_last_name}</Text> },
    { title: 'Concepto', dataIndex: 'concept_name', key: 'concept_name' },
    { title: 'Monto Original', dataIndex: 'original_amount', key: 'original_amount', render: (v: number | string) => `S/ ${Number(v).toFixed(2)}` },
    {
      title: 'Saldo Pendiente', dataIndex: 'balance', key: 'balance', render: (v: number | string) => (
        <Text strong style={{ color: Number(v) > 0 ? '#d83b01' : '#107c10', fontSize: 14 }}>S/ {Number(v).toFixed(2)}</Text>
      )
    },
    {
      title: 'Estado', dataIndex: 'status', key: 'status', render: (v: string) => (
        <Tag color={statusColors[v] || 'default'} icon={v === 'paid' ? <CheckCircleOutlined /> : v === 'pending' ? <WarningOutlined /> : undefined}>
          {statusLabels[v] || v}
        </Tag>
      )
    },
    {
      title: 'Vencimiento', dataIndex: 'due_date', key: 'due_date', render: (v: string | null) => {
        if (!v) return '—';
        const isOverdue = dayjs(v).isBefore(dayjs(), 'day');
        return <Text style={isOverdue ? { color: '#a80000', fontWeight: 600 } : {}}>{dayjs(v).format('DD/MM/YYYY')}{isOverdue ? ' ⚠️' : ''}</Text>;
      }
    },
    {
      title: 'Acción', key: 'action', render: (_: unknown, r: FamilyDebt) => {
        if (r.status === 'paid') return <Tag color="green">✅ Pagado</Tag>;
        return (
          <Tooltip title={`Registrar pago de S/ ${Number(r.balance).toFixed(2)}`}>
            <Button type="primary" size="small" icon={<CreditCardOutlined />} onClick={() => openPayModal(r)}
              style={{ background: '#107c10', borderRadius: 4, fontSize: 12 }}>
              Pagar
            </Button>
          </Tooltip>
        );
      }
    },
  ];

  return (
    <div>
      {/* Family Selector */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: '12px 16px' } }}>
        <Space>
          <Select
            placeholder="Seleccionar familia..."
            style={{ width: 350, borderRadius: 4 }}
            showSearch optionFilterProp="label"
            value={selectedFamily}
            onChange={(v: string) => { setSelectedFamily(v); search(v); }}
            options={families.map(f => ({ value: f.id, label: `${f.family_code}${f.guardian_name ? ' — ' + f.guardian_name : ''}` }))}
          />
          <Button onClick={() => search()} style={{ borderRadius: 4 }} disabled={!selectedFamily}>Actualizar</Button>
        </Space>
      </Card>

      {/* Summary Stats */}
      {debts.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={8}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <Statistic title="Total Facturado" value={totalOriginal} precision={2} prefix="S/" styles={{ content: { color: '#0078d4', fontWeight: 700 } }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <Statistic title="Total Pagado" value={totalPaid} precision={2} prefix="S/" styles={{ content: { color: '#107c10', fontWeight: 700 } }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <Statistic title="Deuda Pendiente" value={totalDebt} precision={2} prefix="S/" styles={{ content: { color: totalDebt > 0 ? '#d83b01' : '#107c10', fontWeight: 700 } }} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Debts Table */}
      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={debts} rowKey="fee_id" loading={loading} pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="Selecciona una familia para ver sus deudas" /> }} size="middle" />
      </Card>

      {/* Pay Modal */}
      <Modal
        title={<span><CreditCardOutlined style={{ marginRight: 8, color: '#107c10' }} />Registrar Pago</span>}
        open={payModal} onOk={handlePay} onCancel={() => setPayModal(false)}
        okText="Confirmar Pago" cancelText="Cancelar"
        okButtonProps={{ style: { background: '#107c10', borderRadius: 4 } }}
      >
        {payingFee && (
          <Alert
            message={`${payingFee.student_first_name} ${payingFee.student_last_name} — ${payingFee.concept_name}`}
            description={`Saldo pendiente: S/ ${Number(payingFee.balance).toFixed(2)}`}
            type="info" showIcon style={{ marginBottom: 16, borderRadius: 4 }}
          />
        )}
        <Form form={payForm} layout="vertical" requiredMark={false}>
          <Form.Item name="student_fee_id" hidden><Input /></Form.Item>
          <Form.Item name="amount" label="Monto a Pagar (S/)" rules={[{ required: true, message: 'Requerido' }]}>
            <InputNumber min={0.01} max={payingFee ? Number(payingFee.balance) : undefined} step={0.01} style={{ width: '100%', borderRadius: 4 }} />
          </Form.Item>
          <Form.Item name="payment_method" label="Método de Pago" rules={[{ required: true, message: 'Requerido' }]}>
            <Select placeholder="Seleccionar método" style={{ borderRadius: 4 }}>
              <Select.Option value="cash">💵 Efectivo</Select.Option>
              <Select.Option value="card">💳 Tarjeta</Select.Option>
              <Select.Option value="transfer">🏦 Transferencia</Select.Option>
              <Select.Option value="check">📋 Cheque</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="transaction_ref" label="Referencia (opcional)">
            <Input placeholder="Nro de operación" style={{ borderRadius: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ─── Main Finance Page ─── */
const FinancePage: React.FC = () => (
  <div>
    <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>
      <DollarOutlined style={{ marginRight: 8, color: '#107c10' }} />
      Módulo de Finanzas
    </Title>
    <Tabs defaultActiveKey="concepts" type="card" items={[
      { key: 'concepts', label: <span><FileTextOutlined /> Conceptos</span>, children: <ConceptsTab /> },
      { key: 'generate', label: <span><FileTextOutlined /> Generar Cuotas</span>, children: <GenerateFeesTab /> },
      { key: 'debts', label: <span><BankOutlined /> Deudas</span>, children: <FamilyDebtsTab /> },
    ]} />
  </div>
);

export default FinancePage;
