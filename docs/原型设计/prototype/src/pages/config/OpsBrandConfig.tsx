import { useState } from 'react';
import { Card, Typography, Table, Tag, Switch, Space, Input, Button, message, Modal, Divider } from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { brands } from '../../data/mock';
import { useBrandConfig } from '../../data/BrandConfigContext';

const { Title, Text } = Typography;

export default function OpsBrandConfig() {
  const [search, setSearch] = useState('');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<typeof brands[0] | null>(null);
  const { getConfig, updateConfig } = useBrandConfig();

  const filtered = brands.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const openConfig = (brand: typeof brands[0]) => {
    setSelectedBrand(brand);
    setConfigModalOpen(true);
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>品牌方配置</Title>

      <Card style={{ borderRadius: 8 }}>
        <Input.Search
          placeholder="搜索品牌名称"
          style={{ width: 300, marginBottom: 16 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
        />

        <Table
          dataSource={filtered}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个品牌` }}
          columns={[
            { title: '品牌名称', dataIndex: 'name', width: 220, ellipsis: true },
            { title: '联系人', dataIndex: 'contact', width: 80 },
            {
              title: '状态', dataIndex: 'status', width: 80,
              render: (s: string) => s === 'ACTIVE' ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
            },
            {
              title: '组织管理 — 可见Tab', width: 200,
              render: (_: any, r: typeof brands[0]) => {
                const cfg = getConfig(r.id);
                const tabs = [];
                if (cfg.showPurchaserTab) tabs.push('采购账号');
                if (cfg.showFactoryTab) tabs.push('工厂管理');
                return (
                  <Space size={4}>
                    {tabs.length > 0 ? tabs.map(t => <Tag key={t} color="blue" style={{ fontSize: 11 }}>{t}</Tag>) : <Text type="secondary">—</Text>}
                  </Space>
                );
              },
            },
            {
              title: '组织管理 — 创建权限', width: 180,
              render: (_: any, r: typeof brands[0]) => {
                const cfg = getConfig(r.id);
                const perms = [];
                if (cfg.allowCreatePurchaser) perms.push('采购账号');
                if (cfg.allowCreateFactory) perms.push('工厂');
                return (
                  <Space size={4}>
                    {perms.length > 0 ? perms.map(p => <Tag key={p} color="green" style={{ fontSize: 11 }}>{p}</Tag>) : <Text type="secondary">无</Text>}
                  </Space>
                );
              },
            },
            {
              title: '操作', width: 80,
              render: (_: any, r: typeof brands[0]) => (
                <Button size="small" type="link" icon={<SettingOutlined />} onClick={() => openConfig(r)}>配置</Button>
              ),
            },
          ]}
        />
      </Card>

      {/* 配置弹窗 */}
      <Modal
        title={<Space><SettingOutlined /> 品牌方配置 — {selectedBrand?.name}</Space>}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        width={560}
        footer={null}
      >
        {selectedBrand && (() => {
          const cfg = getConfig(selectedBrand.id);
          return (
            <div>
              <Text strong style={{ fontSize: 14 }}>组织管理 — Tab 可见性</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
                控制品牌方在「组织管理」页面中可以看到哪些 Tab
              </Text>
              <div style={{ background: '#fafafa', borderRadius: 6, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <div>
                    <Text strong>采购账号</Text>
                    <br /><Text type="secondary" style={{ fontSize: 12 }}>品牌方可在组织管理中查看和管理采购账号</Text>
                  </div>
                  <Switch
                    checked={cfg.showPurchaserTab}
                    onChange={v => updateConfig(selectedBrand.id, { showPurchaserTab: v })}
                  />
                </div>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <div>
                    <Text strong>工厂管理</Text>
                    <br /><Text type="secondary" style={{ fontSize: 12 }}>品牌方可在组织管理中查看工厂列表</Text>
                  </div>
                  <Switch
                    checked={cfg.showFactoryTab}
                    onChange={v => updateConfig(selectedBrand.id, { showFactoryTab: v })}
                  />
                </div>
              </div>

              <Text strong style={{ fontSize: 14 }}>组织管理 — 创建权限</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
                控制品牌方是否可以在组织管理中创建新的账号
              </Text>
              <div style={{ background: '#fafafa', borderRadius: 6, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <div>
                    <Text strong>允许创建子采购账号</Text>
                    <br /><Text type="secondary" style={{ fontSize: 12 }}>开启后品牌方可新增采购人员账号</Text>
                  </div>
                  <Switch
                    checked={cfg.allowCreatePurchaser}
                    onChange={v => updateConfig(selectedBrand.id, { allowCreatePurchaser: v })}
                  />
                </div>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <div>
                    <Text strong>允许创建工厂账号</Text>
                    <br /><Text type="secondary" style={{ fontSize: 12 }}>开启后品牌方可自主新增工厂</Text>
                  </div>
                  <Switch
                    checked={cfg.allowCreateFactory}
                    onChange={v => updateConfig(selectedBrand.id, { allowCreateFactory: v })}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
