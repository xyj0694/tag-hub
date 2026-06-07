import { useState, useMemo } from 'react';
import { Card, Table, Tag, Input, Typography, theme } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { factories } from '../data/mock';
import type { Factory } from '../data/mock';
import { useBrandContext } from '../data/BrandContext';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  '启用': { color: 'green', text: '已激活', icon: <CheckCircleOutlined /> },
  '未激活': { color: 'orange', text: '未激活', icon: <ClockCircleOutlined /> },
  '停用': { color: 'default', text: '已停用', icon: <StopOutlined /> },
};

export default function BrandFactories() {
  const { token } = theme.useToken();
  const { currentBrandId, currentBrandName } = useBrandContext();
  const [search, setSearch] = useState('');

  // 品牌过滤 + 搜索
  const filtered = useMemo(() => {
    let list: Factory[] = [...factories];
    if (currentBrandId !== 0) {
      list = list.filter(f => f.brandName === currentBrandName);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => f.name.includes(q) || f.contact.includes(q) || f.phone.includes(q));
    }
    return list;
  }, [currentBrandId, currentBrandName, search]);

  const totalCount = filtered.length;
  const activeCount = filtered.filter(f => f.status === '启用').length;
  const pendingCount = filtered.filter(f => f.status === '未激活').length;
  const disabledCount = filtered.filter(f => f.status === '停用').length;

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>我的合作工厂</Title>

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>工厂总数</Text>
            <br /><Text strong style={{ fontSize: 18 }}>{totalCount}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>已激活</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{activeCount}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: '#fff7e6', borderRadius: 8, padding: '10px 14px', border: '1px solid #ffd591' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#fa8c16' }}>未激活</Text>
            <br /><Text strong style={{ fontSize: 18, color: '#fa8c16' }}>{pendingCount}</Text>
          </div>
          <div style={{ flex: 1, minWidth: 120, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>已停用</Text>
            <br /><Text strong style={{ fontSize: 18 }}>{disabledCount}</Text>
          </div>
        </div>

        <Input.Search placeholder="搜索工厂名称、联系人或手机号" style={{ width: 300, marginBottom: 16 }} value={search} onChange={e => setSearch(e.target.value)} allowClear />

        <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>共 {filtered.length} 个工厂</Text>

        <Table
          dataSource={filtered}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: t => '共 ' + t + ' 条', showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          columns={[
            { title: '工厂名称', dataIndex: 'name', width: 150, ellipsis: true },
            {
              title: '状态', dataIndex: 'status', width: 90,
              render: (s: string) => {
                const m = statusMap[s] || { color: 'default', text: s };
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
          ]}
        />
      </Card>
    </div>
  );
}
