import { Card, Statistic, Row, Col, Table, Tag, Typography, Timeline, theme } from 'antd';
import {
  ShoppingCartOutlined, SyncOutlined, SendOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orders } from '../data/mock';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  '待接单': { color: 'orange', text: '待接单' },
  '已接单': { color: 'cyan', text: '已接单' },
  '生产中': { color: 'processing', text: '生产中' },
  '生产完成': { color: 'green', text: '生产完成' },
  '部分发货': { color: 'lime', text: '部分发货' },
  '已发货': { color: 'purple', text: '已发货' },
  '已签收': { color: 'success', text: '已签收' },
};

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const subOrders = orders.flatMap(o => o.subOrders).filter(so => so.supplierName === '杭州信达标签印刷有限公司');
  const pendingAccept = subOrders.filter(so => so.status === '待接单').length;
  const inProduction = subOrders.filter(so => so.status === '生产中').length;
  const pendingShip = subOrders.filter(so => so.status === '生产完成').length;
  const shipped = subOrders.filter(so => so.status === '已发货' || so.status === '已签收').length;
  const totalVolume = subOrders.reduce((s, so) => s + so.quantity, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">数据更新时间：2026-06-06 14:30</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/supplier/orders')} style={{ borderRadius: 8 }}>
            <Statistic title="待接单" value={pendingAccept} prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16', fontSize: 26 }} />
            <div style={{ marginTop: 8, fontSize: 12 }}><Text type="secondary">需尽快确认</Text></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/supplier/orders')} style={{ borderRadius: 8 }}>
            <Statistic title="生产中" value={inProduction} prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#1677ff', fontSize: 26 }} />
            <div style={{ marginTop: 8, fontSize: 12 }}><Text type="secondary">累计生产 {totalVolume.toLocaleString()} 张</Text></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/supplier/shipment')} style={{ borderRadius: 8 }}>
            <Statistic title="待发货" value={pendingShip} prefix={<SendOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: 26 }} />
            <div style={{ marginTop: 8, fontSize: 12 }}><Text type="secondary">已完成生产待发出</Text></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/supplier/billings')} style={{ borderRadius: 8 }}>
            <Statistic title="本月已完成" value={shipped} prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 26 }} />
            <div style={{ marginTop: 8, fontSize: 12 }}><Text type="secondary">已发货 / 已签收</Text></div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="进行中的订单" style={{ borderRadius: 8 }}>
            <Table
              dataSource={subOrders}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
              onRow={(r) => ({ onClick: () => navigate('/supplier/detail'), style: { cursor: 'pointer' } })}
              columns={[
                { title: '子订单号', dataIndex: 'orderNo', width: 190, render: (t: string) => <a style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</a> },
                { title: 'SKU', dataIndex: 'sku', width: 160, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
                { title: '数量', dataIndex: 'quantity', width: 100, render: (v: number) => v.toLocaleString() },
                { title: '状态', dataIndex: 'status', width: 100, render: (s: string) => {
                  const m = statusMap[s] || { color: 'default', text: s };
                  return <Tag color={m.color}>{m.text}</Tag>;
                }},
                {
                  title: '已发货', dataIndex: 'shippedQuantity', width: 100,
                  render: (v: number) => v > 0 ? <Text style={{ color: token.colorPrimary }}>{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最近通知" style={{ borderRadius: 8 }}>
            <Timeline items={[
              { color: 'orange', dot: <ClockCircleOutlined />, children: <div><Text style={{ fontSize: 13 }}>新订单待接单</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>TH20260605-003-2 · 5万张</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>6月5日 16:15</Text></div> },
              { color: 'blue', dot: <SyncOutlined />, children: <div><Text style={{ fontSize: 13 }}>EPC数据上传完成</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>TH20260604-002-1 · 校验通过</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>6月5日 09:30</Text></div> },
              { color: 'purple', dot: <SendOutlined />, children: <div><Text style={{ fontSize: 13 }}>已发货</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>TH20260604-002-1 · 10万张 · 圆通速递</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>6月4日 16:00</Text></div> },
              { color: 'green', dot: <CheckCircleOutlined />, children: <div><Text style={{ fontSize: 13 }}>订单已签收</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>TH20260531-001-1 · 8万张</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>6月4日 14:00</Text></div> },
            ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
