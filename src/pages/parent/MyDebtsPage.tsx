import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Empty, Spin, Alert, message } from 'antd';
import { DollarOutlined, UserOutlined, FileTextOutlined, WarningOutlined, InfoCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { familiesApi, financeApi } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import type { FamilyDebt } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MyDebtsPage: React.FC = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<FamilyDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyCode, setFamilyCode] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const famRes = await familiesApi.getByGuardian(user.userId);
        const families = famRes.data.data || [];
        if (families.length === 0) {
          setDebts([]);
          setLoading(false);
          return;
        }
        setFamilyCode(families.map(f => f.family_code).join(', '));
        const allDebts: FamilyDebt[] = [];
        for (const fam of families) {
          try {
            const debtRes = await financeApi.getFamilyDebt(fam.id);
            const payload = debtRes.data.data as any;
            allDebts.push(...(payload?.items || payload || []));
          } catch { /* family might have no debts */ }
        }
        setDebts(allDebts);
      } catch {
        message.error('Error al cargar deudas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0);

  const columns = [
    { title: <span><UserOutlined /> Estudiante</span>, key: 'student', render: (_: unknown, r: FamilyDebt) => <Text strong>{r.student_first_name} {r.student_last_name}</Text> },
    { title: <span><FileTextOutlined /> Concepto</span>, dataIndex: 'concept_name', key: 'concept' },
    { title: <span><DollarOutlined /> Monto</span>, dataIndex: 'original_amount', key: 'amount', render: (v: number | string) => `S/ ${Number(v).toFixed(2)}` },
    { title: <span><WarningOutlined /> Saldo Pendiente</span>, dataIndex: 'balance', key: 'balance', render: (v: number | string) => <Text strong style={{ color: Number(v) > 0 ? '#d83b01' : '#107c10' }}>S/ {Number(v).toFixed(2)}</Text> },
    { title: <span><InfoCircleOutlined /> Estado</span>, dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'PAID' ? 'green' : v === 'PARTIAL' ? 'orange' : 'geekblue'}>{v === 'PAID' ? 'Pagado' : v === 'PARTIAL' ? 'Parcial' : v === 'OVERDUE' ? 'Vencido' : 'Pendiente'}</Tag> },
    { title: <span><CalendarOutlined /> Vencimiento</span>, dataIndex: 'due_date', key: 'due', render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /><br /><Text type="secondary">Cargando deudas...</Text></div>;
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4, fontWeight: 600 }}>
        <DollarOutlined style={{ marginRight: 8, color: '#d83b01' }} />
        Mis Deudas
      </Title>
      {familyCode && <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Familia: <Tag color="blue">{familyCode}</Tag></Text>}

      {debts.length > 0 && (
        <Alert
          message={`Deuda total: S/ ${totalDebt.toFixed(2)}`}
          type={totalDebt > 0 ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 16, borderRadius: 4 }}
        />
      )}

      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={debts}
          rowKey="fee_id"
          pagination={{ pageSize: 10 }}
          size="middle"
          scroll={{ x: 800 }}
          locale={{ emptyText: <Empty description="¡No tienes deudas pendientes! 🎉" /> }}
        />
      </Card>
    </div>
  );
};

export default MyDebtsPage;
