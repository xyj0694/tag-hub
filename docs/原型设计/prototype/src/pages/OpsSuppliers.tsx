import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Space, Typography, message, Cascader, Select, Popconfirm, theme } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, MailOutlined, PhoneOutlined, InfoCircleOutlined, CheckCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { suppliers } from '../data/mock';
import type { Supplier } from '../data/mock';
import { regionData, findRegionPath } from '../data/regions';

const { Title, Text } = Typography;
const { Option } = Select;

const statusMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  ACTIVE: { color: 'green', text: '启用', icon: <CheckCircleOutlined /> },
  INACTIVE: { color: 'default', text: '停用', icon: <MinusCircleOutlined /> },
};

function parseAddressToRegion(address: string): { regionPath: string[] | null; detail: string } {
  if (!address) return { regionPath: null, detail: '' };
  const match = address.match(
    /^(北京|上海|天津|重庆|浙江|江苏|广东|福建|山东|河南|湖北|四川|安徽|湖南|江西|陕西)(?:省|市)?(北京市|上海市|天津市|重庆市|[一-鿿]+?(?:市|自治州|地区|盟))?([一-鿿]+?(?:区|县|市|镇|街道))?(.*)$/
  );
  if (match) {
    const province = match[1];
    const city = match[2] || '';
    const district = match[3] || '';
    const detail = match[4] || '';
    const names = [province, city, district].filter(Boolean);
    const regionPath = findRegionPath(names);
    return { regionPath, detail };
  }
  return { regionPath: null, detail: address };
}

export default function OpsSuppliers() {
  const { token } = theme.useToken();
  const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regionPath, setRegionPath] = useState<string[]>([]);
  const [addressDetail, setAddressDetail] = useState('');

  const filtered = useMemo(() => {
    let list = [...supplierList];
    if (statusFilter !== 'ALL') {
      list = list.filter(s => s.status === statusFilter);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(s =>
        s.name.includes(q) || s.contact.includes(q) || s.phone.includes(q) || s.email.includes(q)
      );
    }
    return list;
  }, [supplierList, searchText, statusFilter]);

  const total = filtered.length;
  const activeCount = filtered.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = filtered.filter(s => s.status === 'INACTIVE').length;

  const openAdd = () => {
    setEditTarget(null);
    form.resetFields();
    setRegionPath([]);
    setAddressDetail('');
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditTarget(s);
    form.setFieldsValue({
      name: s.name, contact: s.contact, phone: s.phone, email: s.email, specialty: s.specialty,
    });
    const { regionPath: rp, detail } = parseAddressToRegion(s.address);
    setRegionPath(rp || []);
    setAddressDetail(detail);
    setModalOpen(true);
  };

  const buildFullAddress = (): string => {
    const parts: string[] = [];
    let nodes = regionData;
    for (const val of regionPath) {
      const node = nodes.find((n: any) => n.value === val);
      if (node) {
        parts.push(node.label);
        nodes = node.children || [];
      }
    }
    return parts.join('') + addressDetail;
  };

  const handleSave = () => {
    form.validateFields().then((v: any) => {
      if (regionPath.length === 0) {
        message.error('请选择省/市/区');
        return;
      }
      const fullAddress = buildFullAddress();

      if (editTarget) {
        setSupplierList(prev => prev.map(s =>
          s.id === editTarget.id
            ? { ...s, name: v.name, contact: v.contact, phone: v.phone, email: v.email, address: fullAddress, specialty: v.specialty }
            : s
        ));
        message.success('供应商信息已更新');
      } else {
        const newId = Math.max(...supplierList.map(s => s.id), 0) + 1;
        const today = new Date().toISOString().slice(0, 10);
        setSupplierList(prev => [...prev, {
          id: newId, name: v.name, contact: v.contact, phone: v.phone, email: v.email,
          address: fullAddress, specialty: v.specialty, orderCount: 0, status: 'ACTIVE',
          createdAt: today,
        }]);
        message.success('供应商已添加，系统已通知联系人。');
      }
      setModalOpen(false);
    });
  };

  const toggleStatus = (s: Supplier) => {
    const newStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSupplierList(prev => prev.map(x => x.id === s.id ? { ...x, status: newStatus } : x));
    message.success(s.name + ' 已' + (newStatus === 'ACTIVE' ? '启用' : '停用'));
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>标签供应商管理</Title>

      <Card style={{ borderRadius: 8 }}>
        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div
            onClick={() => setStatusFilter('ALL')}
            style={{ flex: 1, minWidth: 120, background: statusFilter === 'ALL' ? token.colorFillSecondary : token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: statusFilter === 'ALL' ? `1px solid ${token.colorPrimary}` : '1px solid transparent' }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>供应商总数</Text>
            <br /><Text strong style={{ fontSize: 18 }}>{total}</Text>
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
            style={{ flex: 1, minWidth: 120, background: statusFilter === 'ACTIVE' ? '#e6fffb' : '#f6ffed', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: statusFilter === 'ACTIVE' ? '1px solid #36cfc9' : '1px solid #b7eb8f' }}
          >
            <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>启用</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{activeCount}</Text>
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE')}
            style={{ flex: 1, minWidth: 120, background: statusFilter === 'INACTIVE' ? '#fff2f0' : '#fff1f0', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: statusFilter === 'INACTIVE' ? '1px solid #ff4d4f' : '1px solid #ffccc7' }}
          >
            <Text type="secondary" style={{ fontSize: 12, color: '#cf1322' }}>已停用</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#cf1322' }}>{inactiveCount}</Text>
          </div>
        </div>

        {/* 工具栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Input.Search placeholder="搜索供应商名称、联系人、手机号或邮箱" style={{ width: 340 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
            <Select value={statusFilter} onChange={v => setStatusFilter(v)} style={{ width: 110 }}>
              <Option value="ALL">全部状态</Option>
              <Option value="ACTIVE">启用</Option>
              <Option value="INACTIVE">停用</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加供应商</Button>
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>共 {filtered.length} 个供应商</Text>

        {/* 表格 */}
        <Table
          dataSource={filtered}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          columns={[
            { title: '供应商名称', dataIndex: 'name', width: 220, ellipsis: true },
            {
              title: '状态', dataIndex: 'status', width: 80,
              render: (s: string) => {
                const m = statusMap[s] || { color: 'default', text: s };
                return <Tag color={m.color} icon={m.icon}>{m.text}</Tag>;
              },
            },
            { title: '专长', dataIndex: 'specialty', width: 160, ellipsis: true, render: (t: string) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text> },
            { title: '联系人', dataIndex: 'contact', width: 90 },
            { title: '手机号', dataIndex: 'phone', width: 120 },
            { title: '邮箱', dataIndex: 'email', width: 200, ellipsis: true },
            { title: '地址', dataIndex: 'address', ellipsis: true, width: 200 },
            {
              title: '订单数', dataIndex: 'orderCount', width: 80, align: 'right' as const,
              render: (v: number) => v > 0 ? <Text strong>{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
              sorter: (a: Supplier, b: Supplier) => a.orderCount - b.orderCount,
            },
            {
              title: '入驻日期', dataIndex: 'createdAt', width: 110,
              render: (t: string) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>,
            },
            {
              title: '操作', width: 160,
              render: (_: any, r: Supplier) => (
                <Space size={0}>
                  <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
                  <Popconfirm
                    title={r.status === 'ACTIVE' ? '确认停用？' : '确认启用？'}
                    description={r.status === 'ACTIVE'
                      ? `停用后「${r.name}」将不再接收新订单分配，已有订单不受影响。`
                      : `启用后「${r.name}」可正常接收订单。`}
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
      </Card>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editTarget ? '编辑供应商' : '添加供应商'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={540}
      >
        {!editTarget && (
          <div style={{ background: token.colorFillQuaternary, borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <Space><InfoCircleOutlined style={{ color: token.colorPrimary }} /><Text type="secondary" style={{ fontSize: 13 }}>提交后系统将通知供应商联系人，供应商可登录系统接收订单。</Text></Space>
          </div>
        )}

        <Form form={form} layout="vertical" style={{ marginTop: editTarget ? 16 : 0 }}>
          <Form.Item label="供应商名称" name="name" rules={[{ required: true, message: '请输入供应商名称' }]}>
            <Input placeholder="供应商公司全称" />
          </Form.Item>
          <Form.Item label="专长" name="specialty" rules={[{ required: true, message: '请输入供应商专长' }]}>
            <Input placeholder="如：织唛、吊牌、不干胶标签" />
          </Form.Item>
          <Form.Item label="联系人" name="contact" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="手机号" prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="邮箱地址" prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item label="所在地区" required>
            <Cascader
              options={regionData}
              value={regionPath}
              onChange={(val) => setRegionPath(val as string[])}
              placeholder="请选择省/市/区"
              style={{ width: '100%' }}
              changeOnSelect
            />
          </Form.Item>
          <Form.Item label="详细地址">
            <Input.TextArea rows={2} placeholder="街道、楼栋、门牌号等" value={addressDetail} onChange={e => setAddressDetail(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
