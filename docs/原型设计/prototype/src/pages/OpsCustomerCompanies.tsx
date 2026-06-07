import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Modal, Form, Input, Switch, Space, Typography, message, Popconfirm, Empty, theme } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, BankOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { customerCompanies, brands } from '../data/mock';
import type { CustomerCompany } from '../data/mock';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: '启用' },
  INACTIVE: { color: 'default', text: '停用' },
};

export default function OpsCustomerCompanies() {
  const { token } = theme.useToken();
  const [companies, setCompanies] = useState<CustomerCompany[]>(customerCompanies);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<CustomerCompany | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    if (!searchText.trim()) return companies;
    const q = searchText.trim().toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q) || c.contact.includes(q) || c.phone.includes(q));
  }, [companies, searchText]);

  const openAdd = () => {
    setEditCompany(null);
    form.resetFields();
    form.setFieldsValue({ allowBrandSwitch: false });
    setModalOpen(true);
  };

  const openEdit = (c: CustomerCompany) => {
    setEditCompany(c);
    form.setFieldsValue({ name: c.name, contact: c.contact, phone: c.phone, email: c.email, allowBrandSwitch: c.allowBrandSwitch });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((v: any) => {
      if (editCompany) {
        setCompanies(prev => prev.map(c => c.id === editCompany.id ? { ...c, ...v } : c));
        message.success('客户公司信息已更新');
      } else {
        const newId = Math.max(...companies.map(c => c.id), 0) + 1;
        setCompanies(prev => [...prev, { id: newId, ...v, status: 'ACTIVE' }]);
        message.success('客户公司已添加');
      }
      setModalOpen(false);
    });
  };

  const toggleStatus = (c: CustomerCompany) => {
    const newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x));
    message.success(`${c.name} 已${newStatus === 'ACTIVE' ? '启用' : '停用'}${newStatus === 'INACTIVE' ? '，旗下品牌及工厂同步停用' : ''}`);
  };

  const getBrandsForCompany = (companyId: number) => brands.filter(b => b.customerCompanyId === companyId);

  const activeCount = companies.filter(c => c.status === 'ACTIVE').length;
  const inactiveCount = companies.filter(c => c.status === 'INACTIVE').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>客户公司管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加客户公司</Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        {/* 汇总 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>总计</Text>
            <br /><Text strong style={{ fontSize: 18 }}>{companies.length}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>启用</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{activeCount}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#fff1f0', borderRadius: 8, padding: '10px 14px', border: '1px solid #ffccc7' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#cf1322' }}>已停用</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#cf1322' }}>{inactiveCount}</Text>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder="搜索公司名称、联系人或手机号" style={{ width: 320 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>共 {filtered.length} 家客户公司</Text>

        {filtered.length === 0 ? (
          <Empty description="暂无客户公司" />
        ) : (
          <Table
            dataSource={filtered}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            expandable={{
              expandedRowRender: (record) => {
                const companyBrands = getBrandsForCompany(record.id);
                if (companyBrands.length === 0) return <Text type="secondary">暂无下属品牌</Text>;
                return (
                  <div style={{ margin: '0 0 12px' }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      <BankOutlined /> 下属品牌（{companyBrands.length} 个）
                    </Text>
                    {companyBrands.map(b => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', background: token.colorFillQuaternary, borderRadius: 6, marginBottom: 6 }}>
                        <a onClick={() => navigate(`/ops/brands?brandId=${b.id}`)}><Tag color="blue">{b.name}</Tag></a>
                        <Text type="secondary" style={{ fontSize: 12 }}>联系人：{b.contact} · {b.phone}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>工厂：{b.factoryCount} 个 · EPC规则：{b.epcRules.length} 条</Text>
                        <Button size="small" type="link" onClick={() => navigate(`/ops/factories?brandId=${b.id}`)}>查看工厂</Button>
                      </div>
                    ))}
                  </div>
                );
              },
              rowExpandable: (record) => getBrandsForCompany(record.id).length > 0,
            }}
            columns={[
              { title: '公司名称', dataIndex: 'name', width: 220, ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
              { title: '联系人', dataIndex: 'contact', width: 80 },
              { title: '手机号', dataIndex: 'phone', width: 110 },
              { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
              {
                title: '品牌切换', dataIndex: 'allowBrandSwitch', width: 90,
                render: (v: boolean) => v ? <Tag color="blue">允许</Tag> : <Tag>禁止</Tag>,
              },
              {
                title: '状态', dataIndex: 'status', width: 80,
                render: (s: string) => {
                  const m = statusMap[s] || { color: 'default', text: s };
                  return <Tag color={m.color}>{m.text}</Tag>;
                },
              },
              {
                title: '操作', width: 200,
                render: (_: any, r: CustomerCompany) => (
                  <Space size={0}>
                    <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
                    <Popconfirm
                      title={r.status === 'ACTIVE' ? '确认停用？' : '确认启用？'}
                      description={r.status === 'ACTIVE'
                        ? `停用后「${r.name}」旗下所有品牌及工厂将同步停用。`
                        : `重新启用「${r.name}」后可恢复访问。`}
                      onConfirm={() => toggleStatus(r)}
                      okText={r.status === 'ACTIVE' ? '确认停用' : '确认启用'}
                      cancelText="取消"
                    >
                      <Button size="small" type="link" danger={r.status === 'ACTIVE'} icon={<StopOutlined />}>
                        {r.status === 'ACTIVE' ? '停用' : '启用'}
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title={editCompany ? '编辑客户公司' : '添加客户公司'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="公司名称" name="name" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="公司全称" />
          </Form.Item>
          <Form.Item label="联系人" name="contact" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="手机号" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效邮箱' },
            ]}
          >
            <Input placeholder="联系邮箱" />
          </Form.Item>
          <Form.Item label="允许多品牌切换" name="allowBrandSwitch" valuePropName="checked">
            <Switch checkedChildren="允许" unCheckedChildren="禁止" />
          </Form.Item>
          {!editCompany && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              添加后可在品牌管理中为此公司创建下属品牌。allow_brand_switch 开启后，该公司品牌方用户可在顶栏切换操作品牌。
            </Text>
          )}
        </Form>
      </Modal>
    </div>
  );
}
