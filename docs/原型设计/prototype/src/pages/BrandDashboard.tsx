import { Card, Statistic, Row, Col, Table, Tag, Typography, Timeline, theme } from 'antd';
import {
  SyncOutlined, SendOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, TruckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orders } from '../data/mock';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  '待审核': { color: 'gold', text: '待审核' },
  '生产中': { color: 'processing', text: '生产中' },
  '部分发货': { color: 'lime', text: '部分发货' },
  '已发货': { color: 'purple', text: '已发货' },
  '已签收': { color: 'success', text: '已签收' },
  '已驳回': { color: 'error', text: '已驳回' },
  '已取消': { color: 'default', text: '已取消' },
};

export default function BrandDashboard() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const pendingAudit = orders.filter(o => o.status === '待审核').length;
  const inProduction = orders.filter(o => o.status === '生产中').length;
  const shipping = orders.filter(o => o.status === '部分发货' || o.status === '已发货').length;
  const partialShipping = orders.filter(o => o.status === '部分发货').length;
  const signed = orders.filter(o => o.status === '已签收').length;
  const rejected = orders.filter(o => o.status === '已驳回').length;

  const thisMonth = orders.filter(o => o.createdAt >= '2026-06-01');
  const totalThisMonth = thisMonth.reduce((s, o) => s + o.totalQuantity, 0);

  const monthlyStats = [
    { month: '1月', qty: 380000 }, { month: '2月', qty: 210000 },
    { month: '3月', qty: 520000 }, { month: '4月', qty: 410000 },
    { month: '5月', qty: 630000 }, { month: '6月', qty: totalThisMonth },
  ];
  const maxQty = Math.max(...monthlyStats.map(m => m.qty), 1);

  const recentActivity = orders
    .flatMap(o => o.statusLog.map(l => ({ ...l, orderNo: o.orderNo, type: o.tagType, qty: o.totalQuantity, brand: o.brandName })))
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

  const activityIcon = (status: string) => {
    if (status.includes('签收')) return <CheckCircleOutlined style={{ color: token.colorSuccess }} />;
    if (status.includes('发货')) return <TruckOutlined style={{ color: token.colorPrimary }} />;
    if (status.includes('生产')) return <SyncOutlined style={{ color: token.colorInfo }} />;
    if (status.includes('审核')) return <ClockCircleOutlined style={{ color: token.colorWarning }} />;
    if (status.includes('驳回') || status.includes('取消')) return <ExclamationCircleOutlined style={{ color: token.colorError }} />;
    return <FileTextOutlined />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">数据更新时间：2026-06-06 14:30</Text>
      </div>

      {/* 统计卡片 — 4列 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/brand/orders')} style={{ borderRadius: 8 }}>
            <Statistic
              title="待审核"
              value={pendingAudit}
              prefix={<ClockCircleOutlined />}
              styles={{ content: {color: '#faad14', fontSize: 26} }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">含 {rejected} 条已驳回需重提</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/brand/orders')} style={{ borderRadius: 8 }}>
            <Statistic
              title="生产中"
              value={inProduction}
              prefix={<SyncOutlined spin />}
              styles={{ content: {color: '#1677ff', fontSize: 26} }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">{inProduction} 家供应商生产中</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/brand/orders')} style={{ borderRadius: 8 }}>
            <Statistic
              title="运输中"
              value={shipping}
              prefix={<SendOutlined />}
              styles={{ content: {color: '#722ed1', fontSize: 26} }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">部分发货 {partialShipping} 条</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/brand/billings')} style={{ borderRadius: 8 }}>
            <Statistic
              title="待对账"
              value={signed}
              prefix={<FileTextOutlined />}
              styles={{ content: {color: '#52c41a', fontSize: 26} }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">本月 {signed} 条已签收待对账</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 下单趋势 — 独占一行 */}
      <Card title="近6月标签下单量趋势" style={{ borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 160, padding: '0 8px' }}>
          {monthlyStats.map((m, i) => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, color: '#999' }}>{(m.qty / 10000).toFixed(1)}万</Text>
              <div style={{
                width: '100%', maxWidth: 56,
                height: `${Math.max((m.qty / maxQty) * 120, 8)}px`,
                background: i === monthlyStats.length - 1
                  ? `linear-gradient(180deg, ${token.colorPrimary}, ${token.colorPrimaryBg})`
                  : `linear-gradient(180deg, #d9d9d9, #f0f0f0)`,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s',
              }} />
              <Text style={{ fontSize: 12, color: i === monthlyStats.length - 1 ? token.colorPrimary : '#999', fontWeight: i === monthlyStats.length - 1 ? 600 : 400 }}>
                {m.month}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近订单 + 近期动态 — 并排 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="最近订单" style={{ borderRadius: 8 }}>
            <Table
              dataSource={orders.slice(0, 5)}
              rowKey="id"
              size="small"
              pagination={false}
              onRow={(r) => ({ onClick: () => navigate(`/brand/orders/${r.id}`), style: { cursor: 'pointer' } })}
              columns={[
                { title: '订单号', dataIndex: 'orderNo', width: 170, render: (t: string) => <a style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</a> },
                { title: '品牌', dataIndex: 'brandName', width: 130, ellipsis: true, render: (t: string) => <Text style={{ fontSize: 12 }}>{t}</Text> },
                { title: '标签类型', dataIndex: 'tagType', width: 110, render: (t: string) => <Text style={{ fontSize: 12 }}>{t}</Text> },
                { title: '数量', dataIndex: 'totalQuantity', width: 90, render: (v: number) => <Text style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{v.toLocaleString()}</Text> },
                {
                  title: '状态', dataIndex: 'status', width: 80,
                  render: (s: string) => {
                    const m = statusMap[s] || { color: 'default', text: s };
                    return <Tag color={m.color} style={{ fontSize: 11 }}>{m.text}</Tag>;
                  },
                },
                { title: '创建时间', dataIndex: 'createdAt', width: 130, render: (t: string) => <Text style={{ fontSize: 11 }} type="secondary">{t}</Text> },
              ]}
            />
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <a onClick={() => navigate('/brand/orders')}>查看全部订单 →</a>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="近期动态" style={{ borderRadius: 8 }}>
            <Timeline
              items={recentActivity.map(a => ({
                color: a.status.includes('驳回') || a.status.includes('取消') ? 'red'
                  : a.status.includes('签收') ? 'green'
                  : a.status.includes('审核') ? 'orange'
                  : 'blue',
                icon: activityIcon(a.status),
                content: (
                  <div>
                    <Text style={{ fontSize: 12 }}>{a.orderNo}</Text>
                    <Text style={{ fontSize: 12, marginLeft: 6 }}>{a.status}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {a.operator} · {a.time}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
