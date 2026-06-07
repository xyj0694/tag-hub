import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, Select, Space, Typography, Input, DatePicker, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { brands, customerCompanies } from '../data/mock';
import type { Brand } from '../data/mock';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function OpsBrands() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBrandId = searchParams.get('brandId');
  const [searchText, setSearchText] = useState('');
  const [companyFilter, setCompanyFilter] = useState<number | 'all'>(
    initialBrandId ? (brands.find(b => b.id === Number(initialBrandId))?.customerCompanyId ?? 'all') : 'all'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const brandsWithCompany = useMemo(() =>
    brands.map(b => ({
      ...b,
      companyName: customerCompanies.find(c => c.id === b.customerCompanyId)?.name || '—',
    }))
  , []);

  const [brandList, setBrandList] = useState(brandsWithCompany);

  const filtered = useMemo(() => {
    let list = [...brandList];
    if (companyFilter !== 'all') list = list.filter(b => b.customerCompanyId === companyFilter);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.contact.includes(q) || b.phone.includes(q));
    }
    return list;
  }, [brandList, companyFilter, searchText]);

  const handleAdd = () => {
    form.validateFields().then((v: any) => {
      const company = customerCompanies.find(c => c.id === v.customerCompanyId);
      const newId = Math.max(...brandList.map(b => b.id), 0) + 1;
      setBrandList(prev => [...prev, {
        id: newId,
        customerCompanyId: v.customerCompanyId,
        name: v.name,
        contact: v.contact,
        phone: v.phone,
        factoryCount: 0,
        companyName: company?.name || '—',
        epcRules: [],
      }]);
      message.success(`品牌「${v.name}」已添加，系统已生成管理员初始密码并通知联系人`);
      setModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>客户品牌</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>添加品牌方</Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索品牌名称或联系人"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="全部客户公司"
            style={{ width: 220 }}
            value={companyFilter}
            onChange={setCompanyFilter}
            options={[
              { value: 'all', label: '全部客户公司' },
              ...customerCompanies.filter(c => c.status === 'ACTIVE').map(c => ({ value: c.id, label: c.name })),
            ]}
          />
          <RangePicker placeholder={['创建时间 从', '到']} />
          <Button onClick={() => { setCompanyFilter('all'); setSearchText(''); }}>重置筛选</Button>
        </Space>

        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>共 {filtered.length} 个品牌</Text>

        <Table
          dataSource={filtered}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 15, showTotal: t => `共 ${t} 个品牌`, showSizeChanger: true, pageSizeOptions: ['10', '15', '20', '50'] }}
          columns={[
            { title: '品牌名称', dataIndex: 'name', render: (t: string) => <Text strong>{t}</Text> },
            {
              title: '所属客户公司', dataIndex: 'companyName', width: 200, ellipsis: true,
              render: (t: string) => <Tag color="blue">{t}</Tag>,
            },
            { title: '联系人', dataIndex: 'contact', width: 80 },
            { title: '手机号', dataIndex: 'phone', width: 110 },
            { title: '下属工厂', dataIndex: 'factoryCount', width: 90, render: (v: number, r: Brand) => v > 0 ? <a onClick={() => navigate(`/ops/factories?brandId=${r.id}`)}>{v} 个</a> : <Text type="secondary">0 个</Text> },
            { title: 'EPC 规则', dataIndex: 'epcRules', width: 90, render: (rules: any[]) => `${rules.length} 条` },
            {
              title: '操作',
              render: () => (
                <Space>
                  <Button size="small" type="link" onClick={() => navigate('/ops/epc-rules')}>EPC规则</Button>
                  <Button size="small" type="link" danger>停用</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="添加品牌方"
        open={modalOpen}
        onOk={handleAdd}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="添加"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="所属客户公司" name="customerCompanyId" rules={[{ required: true, message: '请选择客户公司' }]}>
            <Select
              placeholder="选择客户公司"
              options={customerCompanies.filter(c => c.status === 'ACTIVE').map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="品牌名称" name="name" rules={[{ required: true, message: '请输入品牌名称' }]}>
            <Input placeholder="品牌名称" />
          </Form.Item>
          <Form.Item label="联系人" name="contact" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="手机号（系统将发送初始密码）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
