import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Space, Typography, message, Cascader, Alert, Popconfirm, Select, Switch, theme } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, KeyOutlined, MailOutlined, PhoneOutlined, InfoCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { factories, brands } from '../data/mock';
import type { Factory } from '../data/mock';
import { regionData, findRegionPath } from '../data/regions';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

const factoryStatusMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  '启用': { color: 'green', text: '已激活', icon: <CheckCircleOutlined /> },
  '未激活': { color: 'orange', text: '未激活', icon: <ClockCircleOutlined /> },
  '停用': { color: 'default', text: '已停用', icon: <StopOutlined /> },
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

export default function OpsFactories() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBrandId = searchParams.get('brandId');
  const [factoryList, setFactoryList] = useState<Factory[]>(factories);
  const [factoryModalOpen, setFactoryModalOpen] = useState(false);
  const [editFactory, setEditFactory] = useState<Factory | null>(null);
  const [factoryForm] = Form.useForm();
  const [factorySearch, setFactorySearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<number | 'ALL'>(
    initialBrandId ? (initialBrandId === 'null' ? -1 : Number(initialBrandId)) : 'ALL'
  );
  const [regionPath, setRegionPath] = useState<string[]>([]);
  const [addressDetail, setAddressDetail] = useState('');
  const [independent, setIndependent] = useState(false);

  const filteredFactories = useMemo(() => {
    let list = [...factoryList];
    if (brandFilter !== 'ALL') {
      if (brandFilter === -1) {
        list = list.filter(f => f.brandId === null);
      } else {
        list = list.filter(f => f.brandId === brandFilter);
      }
    }
    if (factorySearch) {
      const q = factorySearch.toLowerCase();
      list = list.filter(f => f.name.includes(q) || f.contact.includes(q) || f.phone.includes(q));
    }
    return list;
  }, [factoryList, factorySearch, brandFilter]);

  const fTotal = filteredFactories.length;
  const fActive = filteredFactories.filter(f => f.status === '启用').length;
  const fPending = filteredFactories.filter(f => f.status === '未激活').length;
  const fDisabled = filteredFactories.filter(f => f.status === '停用').length;

  const openAddFactory = () => {
    setEditFactory(null);
    factoryForm.resetFields();
    setRegionPath([]);
    setAddressDetail('');
    setIndependent(false);
    setFactoryModalOpen(true);
  };

  const openEditFactory = (f: Factory) => {
    setEditFactory(f);
    const isIndep = f.brandId === null;
    setIndependent(isIndep);
    factoryForm.setFieldsValue({
      name: f.name, contact: f.contact, phone: f.phone, email: f.email,
      brandId: isIndep ? undefined : f.brandId,
    });
    const { regionPath: rp, detail } = parseAddressToRegion(f.address);
    setRegionPath(rp || []);
    setAddressDetail(detail);
    setFactoryModalOpen(true);
  };

  const buildFullAddress = (): string => {
    const regionParts: string[] = [];
    let nodes = regionData;
    for (const val of regionPath) {
      const node = nodes.find((n: any) => n.value === val);
      if (node) {
        regionParts.push(node.label);
        nodes = node.children || [];
      }
    }
    return regionParts.join('') + addressDetail;
  };

  const handleSaveFactory = () => {
    factoryForm.validateFields().then((v: any) => {
      if (regionPath.length === 0) {
        message.error('请选择省/市/区');
        return;
      }
      const fullAddress = buildFullAddress();
      let brandId: number | null = null;
      let brandName = '—';
      if (!independent && v.brandId) {
        brandId = v.brandId;
        const brand = brands.find(b => b.id === v.brandId);
        brandName = brand?.name || '';
      }

      if (editFactory) {
        setFactoryList(prev => prev.map(f => f.id === editFactory.id
          ? { ...f, name: v.name, contact: v.contact, phone: v.phone, email: v.email, address: fullAddress, brandId, brandName }
          : f));
        message.success('工厂信息已更新');
      } else {
        const newId = Math.max(...factoryList.map(f => f.id), 0) + 1;
        setFactoryList(prev => [...prev, {
          id: newId, name: v.name, contact: v.contact, phone: v.phone, email: v.email,
          address: fullAddress, status: '未激活', orderCount: 0, lastLoginAt: '—',
          brandName, brandId,
        }]);
        message.success('工厂已添加。系统已自动生成初始密码并通过短信/邮件通知联系人，首次登录需修改密码。');
      }
      setFactoryModalOpen(false);
    });
  };

  const toggleFactoryStatus = (f: Factory) => {
    const newStatus = f.status === '启用' ? '停用' : '启用';
    setFactoryList(prev => prev.map(x => x.id === f.id ? { ...x, status: newStatus } : x));
    message.success(f.name + ' 已' + (newStatus === '启用' ? '启用' : '停用'));
  };

  const handleResetPassword = (f: Factory) => {
    message.success('已为「' + f.name + '」重置密码，新密码将发送至 ' + f.phone + ' / ' + f.email);
  };

  const handleResendActivation = (f: Factory) => {
    message.success('已重新发送激活通知至「' + f.name + '」的联系人手机及邮箱');
  };

  const goToBrand = (brandId: number | null) => {
    if (brandId != null) {
      navigate(`/ops/brands?brandId=${brandId}`);
    }
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>工厂客户</Title>

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>工厂总数</Text>
            <br /><Text strong style={{ fontSize: 18 }}>{fTotal}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>已激活</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{fActive}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#fff7e6', borderRadius: 8, padding: '10px 14px', border: '1px solid #ffd591' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#fa8c16' }}>未激活</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#fa8c16' }}>{fPending}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#fff1f0', borderRadius: 8, padding: '10px 14px', border: '1px solid #ffccc7' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#cf1322' }}>已停用</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#cf1322' }}>{fDisabled}</Text>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Input.Search placeholder="搜索工厂名称、联系人或手机号" style={{ width: 300 }} value={factorySearch} onChange={e => setFactorySearch(e.target.value)} allowClear />
            <Select
              value={brandFilter}
              onChange={v => setBrandFilter(v)}
              style={{ width: 160 }}
              placeholder="筛选品牌"
              allowClear
              onClear={() => setBrandFilter('ALL')}
            >
              <Select.Option value="ALL">全部品牌</Select.Option>
              <Select.Option value={-1}>独立工厂</Select.Option>
              {brands.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddFactory}>添加工厂客户</Button>
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>共 {filteredFactories.length} 个工厂</Text>

        <Table
          dataSource={filteredFactories}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: t => '共 ' + t + ' 条', showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          columns={[
            { title: '工厂名称', dataIndex: 'name', width: 150, ellipsis: true },
            {
              title: '挂靠品牌', dataIndex: 'brandName', width: 170, ellipsis: true,
              render: (t: string, r: Factory) => {
                if (r.brandId === null) return <Tag color="purple">独立工厂</Tag>;
                return (
                  <a onClick={() => goToBrand(r.brandId)} style={{ cursor: 'pointer' }}>
                    <Tag color="blue">{t}</Tag>
                  </a>
                );
              },
            },
            {
              title: '状态', dataIndex: 'status', width: 90,
              render: (s: string) => {
                const m = factoryStatusMap[s] || { color: 'default', text: s };
                return <Tag color={m.color} icon={m.icon}>{m.text}</Tag>;
              },
            },
            { title: '联系人', dataIndex: 'contact', width: 80 },
            { title: '手机号', dataIndex: 'phone', width: 110 },
            { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
            { title: '地址', dataIndex: 'address', ellipsis: true, width: 200 },
            {
              title: '订单数', dataIndex: 'orderCount', width: 70, align: 'right' as const,
              render: (v: number) => v > 0 ? <Text strong>{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
              sorter: (a: Factory, b: Factory) => a.orderCount - b.orderCount,
            },
            {
              title: '最近登录', dataIndex: 'lastLoginAt', width: 130,
              render: (t: string) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>,
            },
            {
              title: '操作', width: 280,
              render: (_: any, r: Factory) => (
                <Space size={0}>
                  <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditFactory(r)}>编辑</Button>
                  {r.status === '未激活' && (
                    <Popconfirm
                      title="重新发送激活通知？"
                      description={`将向「${r.name}」的联系人重新发送激活短信及邮件。`}
                      onConfirm={() => handleResendActivation(r)}
                      okText="确认发送"
                      cancelText="取消"
                    >
                      <Button size="small" type="link" icon={<ReloadOutlined />}>重发激活</Button>
                    </Popconfirm>
                  )}
                  {r.status === '启用' && (
                    <Popconfirm
                      title="重置密码"
                      description={'将为「' + r.name + '」生成新密码并通知联系人，确认重置？'}
                      onConfirm={() => handleResetPassword(r)}
                      okText="确认重置"
                      cancelText="取消"
                    >
                      <Button size="small" type="link" icon={<KeyOutlined />}>重置密码</Button>
                    </Popconfirm>
                  )}
                  <Popconfirm
                    title={r.status === '启用' ? '确认停用？' : '确认启用？'}
                    description={r.status === '启用'
                      ? `停用后「${r.name}」将无法登录系统，已有订单不受影响。`
                      : `启用后「${r.name}」可正常登录系统。`}
                    onConfirm={() => toggleFactoryStatus(r)}
                    okText={r.status === '启用' ? '确认停用' : '确认启用'}
                    cancelText="取消"
                  >
                    <Button size="small" type="link" danger={r.status === '启用'} icon={<StopOutlined />}>
                      {r.status === '启用' ? '停用' : '启用'}
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editFactory ? '编辑工厂客户' : '添加工厂客户'}
        open={factoryModalOpen}
        onOk={handleSaveFactory}
        onCancel={() => setFactoryModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={540}
      >
        {!editFactory && (
          <Alert
            message="账号激活说明"
            description="提交后系统将自动生成初始密码，通过短信和邮件发送至联系人。工厂首次登录须修改密码。若 7 天内未激活，可在此页面重新发送激活通知。"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16, borderRadius: 6 }}
          />
        )}

        <Form form={factoryForm} layout="vertical" style={{ marginTop: editFactory ? 16 : 0 }}>
          <Form.Item label="工厂名称" name="name" rules={[{ required: true, message: '请输入工厂名称' }]}>
            <Input placeholder="工厂名称" />
          </Form.Item>

          <Form.Item label="挂靠品牌">
            <Space align="center" style={{ marginBottom: 8 }}>
              <Switch
                checked={!independent}
                onChange={v => {
                  setIndependent(!v);
                  if (!v) factoryForm.setFieldValue('brandId', undefined);
                }}
                checkedChildren="挂靠品牌"
                unCheckedChildren="独立工厂"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {independent ? '不挂靠任何品牌，由平台方直接合作' : '选择工厂所属的品牌方客户'}
              </Text>
            </Space>
            {!independent && (
              <Form.Item name="brandId" noStyle rules={[{ required: true, message: '请选择品牌方' }]}>
                <Select
                  placeholder="选择品牌方"
                  options={brands.map(b => ({ label: b.name, value: b.id }))}
                />
              </Form.Item>
            )}
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
