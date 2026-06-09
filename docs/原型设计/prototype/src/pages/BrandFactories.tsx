import { useState, useMemo } from 'react';
import { Card, Table, Tag, Input, Typography, Tabs, Switch, Space, Badge, Button, Modal, Form, Select, Alert, theme } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, StopOutlined, TeamOutlined, BankOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import { factories, purchaserAccounts } from '../data/mock';
import type { Factory, PurchaserAccount } from '../data/mock';
import { useBrandContext } from '../data/BrandContext';

const { Title, Text } = Typography;

const factoryStatusMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  '启用': { color: 'green', text: '已激活', icon: <CheckCircleOutlined /> },
  '未激活': { color: 'orange', text: '未激活', icon: <ClockCircleOutlined /> },
  '停用': { color: 'default', text: '已停用', icon: <StopOutlined /> },
};

export default function BrandFactories() {
  const { token } = theme.useToken();
  const { currentBrandId, currentBrandName } = useBrandContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('factories');
  const [factoryVisibility, setFactoryVisibility] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    factories.forEach(f => { map[f.id] = f.visibleToBrand; });
    return map;
  });

  // 新增采购账号弹窗
  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();

  // 工厂过滤
  const filteredFactories = useMemo(() => {
    let list: Factory[] = [...factories];
    if (currentBrandId !== 0) {
      list = list.filter(f => f.brandId === currentBrandId || f.brandId === null);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => f.name.includes(q) || f.contact.includes(q) || f.phone.includes(q));
    }
    return list;
  }, [currentBrandId, search]);

  // 采购账号过滤
  const filteredPurchasers = useMemo(() => {
    let list = [...purchaserAccounts];
    if (currentBrandId !== 0) {
      list = list.filter(p => p.brandId === currentBrandId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.includes(q) || p.phone.includes(q));
    }
    return list;
  }, [currentBrandId, search]);

  const handleToggleVisibility = (factoryId: number, checked: boolean) => {
    setFactoryVisibility(prev => ({ ...prev, [factoryId]: checked }));
    // TODO: 实际接入后端 API 后，此处应调用接口保存可见性配置
  };

  const handleAddPurchaser = () => {
    addForm.validateFields().then(values => {
      // TODO: 实际接入后端 API 后，此处应调用接口创建采购账号
      console.log('新增采购账号:', values);
      addForm.resetFields();
      setAddOpen(false);
    });
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>组织管理</Title>

      <Card style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'factories',
              label: <span><BankOutlined /> 工厂管理 <Badge count={filteredFactories.length} size="small" style={{ marginLeft: 8 }} /></span>,
            },
            {
              key: 'purchasers',
              label: <span><TeamOutlined /> 采购账号 <Badge count={filteredPurchasers.length} size="small" style={{ marginLeft: 8 }} /></span>,
            },
          ]}
        />

        <Input.Search placeholder={activeTab === 'factories' ? '搜索工厂名称、联系人或手机号' : '搜索采购姓名或手机号'}
          style={{ width: 300, marginBottom: 16 }} value={search} onChange={e => setSearch(e.target.value)} allowClear />

        {activeTab === 'factories' ? (
          <>
            <Alert type="info" showIcon icon={<EyeOutlined />}
              title="工厂由平台方统一管理"
              description="以下为平台方已授权的成衣工厂。开启后该工厂可在下单时选择，关闭后不在列表中显示。如需新增或修改工厂，请联系平台运营。"
              style={{ marginBottom: 16, borderRadius: 6 }}
            />

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>工厂总数</Text>
                <br /><Text strong style={{ fontSize: 18 }}>{filteredFactories.length}</Text>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
                <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>已激活</Text>
                <br /><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{filteredFactories.filter(f => f.status === '启用').length}</Text>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: '#e6f7ff', borderRadius: 8, padding: '10px 14px', border: '1px solid #91d5ff' }}>
                <Text type="secondary" style={{ fontSize: 12, color: '#1677ff' }}>显示</Text>
                <br /><Text strong style={{ fontSize: 18, color: '#1677ff' }}>{Object.values(factoryVisibility).filter(Boolean).length}</Text>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>隐藏</Text>
                <br /><Text strong style={{ fontSize: 18 }}>{Object.values(factoryVisibility).filter(v => !v).length}</Text>
              </div>
            </div>

            <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>共 {filteredFactories.length} 个工厂</Text>

            <Table
              dataSource={filteredFactories}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
              columns={[
                { title: '工厂名称', dataIndex: 'name', width: 150, ellipsis: true },
                { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => {
                  const m = factoryStatusMap[s] || { color: 'default', text: s };
                  return <Tag color={m.color} icon={m.icon}>{m.text}</Tag>;
                }},
                { title: '联系人', dataIndex: 'contact', width: 80 },
                { title: '手机号', dataIndex: 'phone', width: 110 },
                { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
                { title: '地址', dataIndex: 'address', ellipsis: true, width: 200 },
                { title: '订单数', dataIndex: 'orderCount', width: 70, align: 'right' as const,
                  render: (v: number) => v > 0 ? <Text strong>{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
                },
                {
                  title: '本品牌显示', dataIndex: 'id', width: 100, align: 'center' as const,
                  render: (id: number) => (
                    <Switch
                      checked={factoryVisibility[id] ?? false}
                      onChange={(checked) => handleToggleVisibility(id, checked)}
                      checkedChildren="显示"
                      unCheckedChildren="隐藏"
                      size="small"
                    />
                  ),
                },
              ]}
            />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>品牌方自主管理采购账号，用于授权内部采购员下单、对账等操作</Text>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>新增采购账号</Button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>采购账号总数</Text>
                <br /><Text strong style={{ fontSize: 18 }}>{filteredPurchasers.length}</Text>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
                <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>允许对账</Text>
                <br /><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{filteredPurchasers.filter(p => p.allowBilling).length}</Text>
              </div>
              <div style={{ flex: 1, minWidth: 120, background: '#fff7e6', borderRadius: 8, padding: '10px 14px', border: '1px solid #ffd591' }}>
                <Text type="secondary" style={{ fontSize: 12, color: '#fa8c16' }}>禁止对账</Text>
                <br /><Text strong style={{ fontSize: 18, color: '#fa8c16' }}>{filteredPurchasers.filter(p => !p.allowBilling).length}</Text>
              </div>
            </div>

            <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>共 {filteredPurchasers.length} 个采购账号</Text>

            <Table
              dataSource={filteredPurchasers}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 160, render: (t: string) => <Space><UserOutlined /><Text strong>{t}</Text></Space> },
                { title: '手机号', dataIndex: 'phone', width: 120 },
                {
                  title: '角色', dataIndex: 'role', width: 80,
                  render: (r: string) => r === 'admin' ? <Tag color="blue">主账号</Tag> : <Tag color="cyan">子采购</Tag>,
                },
                {
                  title: '对账权限', dataIndex: 'allowBilling', width: 120,
                  render: (v: boolean) => (
                    <Space>
                      <Switch checked={v} size="small" />
                      <Text type={v ? 'success' : 'secondary'} style={{ fontSize: 12 }}>{v ? '允许' : '禁止'}</Text>
                    </Space>
                  ),
                },
                {
                  title: '说明', width: 300,
                  render: (_: any, r: PurchaserAccount) => (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {r.role === 'admin'
                        ? '可查看全部订单和对账单'
                        : r.allowBilling
                          ? '可查看本人订单 + 访问对账页'
                          : '仅可查看本人订单，无权访问对账页'}
                    </Text>
                  ),
                },
              ]}
            />
          </>
        )}
      </Card>

      {/* 新增采购账号弹窗 */}
      <Modal
        title="新增采购账号"
        open={addOpen}
        onOk={handleAddPurchaser}
        onCancel={() => { setAddOpen(false); addForm.resetFields(); }}
        okText="确认创建"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="采购员姓名" rules={[{ required: true, message: '请输入采购员姓名' }]}>
            <Input placeholder="例如：赵采购" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="例如：138****1234" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="purchaser">
            <Select options={[
              { value: 'purchaser', label: '子采购 — 仅可查看本人订单' },
              { value: 'admin', label: '主账号 — 可查看全部订单和对账单' },
            ]} />
          </Form.Item>
          <Form.Item name="allowBilling" label="对账权限" initialValue={false} valuePropName="checked">
            <Switch checkedChildren="允许" unCheckedChildren="禁止" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
