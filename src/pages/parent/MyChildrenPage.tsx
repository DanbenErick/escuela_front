import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Empty, Spin, message } from 'antd';
import { TeamOutlined, UserOutlined, HeartOutlined, IdcardOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import { familiesApi, studentsApi } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import type { Student } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MyChildrenPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyCode, setFamilyCode] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Find families where this user is guardian
        const famRes = await familiesApi.getByGuardian(user.userId);
        const families = famRes.data.data || [];
        if (families.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }
        setFamilyCode(families.map(f => f.family_code).join(', '));
        // Load students for each family
        const allStudents: Student[] = [];
        for (const fam of families) {
          const studRes = await studentsApi.getByFamily(fam.id);
          allStudents.push(...(studRes.data.data || []));
        }
        setStudents(allStudents);
      } catch {
        message.error('Error al cargar información');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const columns = [
    {
      title: <span><UserOutlined /> Nombre</span>, key: 'name',
      render: (_: unknown, r: Student) => (
        <span><UserOutlined style={{ color: '#107c10', marginRight: 8 }} /><Text strong>{r.first_name} {r.last_name}</Text></span>
      ),
    },
    { title: <span><IdcardOutlined /> Documento</span>, dataIndex: 'document_number', key: 'doc', render: (v: string | null) => v || <Text type="secondary">—</Text> },
    { title: <span><CalendarOutlined /> Fecha de Nacimiento</span>, dataIndex: 'birth_date', key: 'birth', render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : <Text type="secondary">—</Text> },
    { title: <span><FileTextOutlined /> Info Médica</span>, dataIndex: 'medical_info', key: 'med', render: (v: string | null) => v || <Text type="secondary">Sin información</Text> },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /><br /><Text type="secondary">Cargando información...</Text></div>;
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4, fontWeight: 600 }}>
        <HeartOutlined style={{ marginRight: 8, color: '#107c10' }} />
        Mis Hijos
      </Title>
      {familyCode && <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>Familia: <Tag color="green">{familyCode}</Tag></Text>}

      <Card style={{ borderRadius: 8, border: '1px solid #e8e8e8', marginTop: 16 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 600 }}
          locale={{ emptyText: <Empty description="No se encontraron hijos asociados a tu cuenta" /> }}
        />
      </Card>
    </div>
  );
};

export default MyChildrenPage;
