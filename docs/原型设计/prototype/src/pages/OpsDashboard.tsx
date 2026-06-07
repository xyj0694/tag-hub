import { useMemo } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, Typography, Timeline, Space, theme } from 'antd';
import {
  AuditOutlined, SendOutlined, WarningOutlined, TeamOutlined,
  RiseOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orders } from '../data/mock';

const { Title, Text } = Typography;

// Only platform-relevant statuses
const platformStatuses = ['待审核', '已审核', '已驳回', '已拆分'];

function getRecentActivity() {
  const allLogs = orders
    .flatMap(o =>
      o.statusLog
        .filter(l => platformStatuses.includes(l.status))
        .map(l => ({ ...l, orderNo: o.orderNo, brandName: o.brandName, tagType: o.tagType, totalQuantity: o.totalQuantity }))
    )
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 4);

  return allLogs.map(l => {
    const isReject = l.status === '已驳回';
    const isSplit = l.status === '已拆分';
    const isApprove = l.status === '已审核';
    const color = isReject ? 'red' : isSplit ? 'blue' : isApprove ? 'green' : 'orange';
    const dot = isReject ? <ExclamationCircleOutlined />
      : isSplit ? <SendOutlined />
      : isApprove ? <CheckCircleOutlined />
      : <ClockCircleOutlined />;
    return {
      color, dot,
      children: (
        <div>
          <Text style={{ fontSize: 12 }}>{l.orderNo} · {l.status}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {l.brandName} · {l.totalQuantity.toLocaleString()} 张
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{l.operator} · {l.time}</Text>
        </div>
      ),
    };
  });
}

export default function OpsDashboard() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const pendingAudit = orders.filter(o => o.status === '待审核').length;
  const rejected = orders.filter(o => o.status === '已驳回').length;
  const todaySplit = 8;
  const abnormal = orders.filter(o => o.status === '已驳回' || o.status === '已取消').length;
  const activeSuppliers = 7;

  const weekStats = [
    { day: '周一', n: 3 }, { day: '周二', n: 5 }, { day: '周三', n: 8 },
    { day: '周四', n: 6 }, { day: '周五', n: 4 }, { day: '周六', n: 7 },
  ];
  const maxN = Math.max(...weekStats.map(w => w.n), 1);

  const activityItems = useMemo(() => getRecentActivity(), []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">数据更新时间：2026-06-06 14:30</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/ops/audit')} style={{ borderRadius: 8 }}>
            <Statistic
              title="待审核订单" value={pendingAudit}
              prefix={<AuditOutlined />} valueStyle={{ color: '#ff4d4f', fontSize: 26 }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <RiseOutlined style={{ color: '#ff4d4f' }} />
              <Text type="secondary" style={{ marginLeft: 4 }}>较昨日 +3</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/ops/audit')} style={{ borderRadius: 8 }}>
            <Statistic
              title="今日转单" value={todaySplit}
              prefix={<SendOutlined />} valueStyle={{ color: '#1677ff', fontSize: 26 }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">共拆分为 21 个子订单</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/ops/audit')} style={{ borderRadius: 8 }}>
            <Statistic
              title="异常订单" value={abnormal}
              prefix={<WarningOutlined />} valueStyle={{ color: '#fa8c16', fontSize: 26 }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">含 {rejected} 条驳回 {abnormal - rejected} 条取消</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/ops/suppliers')} style={{ borderRadius: 8 }}>
            <Statistic
              title="活跃供应商" value={activeSuppliers}
              prefix={<TeamOutlined />} valueStyle={{ color: '#52c41a', fontSize: 26 }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">共 8 家供应商，1 家已停用</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="本周新增待审订单趋势" style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 160, padding: '0 12px' }}>
              {weekStats.map((w, i) => (
                <div key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>{w.n}单</Text>
                  <div style={{
                    width: '100%', maxWidth: 40,
                    height: `${Math.max((w.n / maxN) * 120, 8)}px`,
                    background: i === weekStats.length - 1
                      ? `linear-gradient(180deg, ${token.colorPrimary}, ${token.colorPrimaryBg})`
                      : `linear-gradient(180deg, #d9d9d9, #f0f0f0)`,
                    borderRadius: '4px 4px 0 0',
                  }} />
                  <Text style={{ fontSize: 12, color: i === weekStats.length - 1 ? token.colorPrimary : '#999', fontWeight: i === weekStats.length - 1 ? 600 : 400 }}>
                    {w.day}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="全平台动态"
            style={{ borderRadius: 8 }}
            bodyStyle={{ maxHeight: 217, overflowY: 'auto', padding: '12px 24px' }}
          >
            <Timeline items={activityItems} />
          </Card>
        </Col>
      </Row>

      <Card title="最新待审核订单" style={{ marginTop: 16, borderRadius: 8 }}>
        <Table
          dataSource={orders.filter(o => o.status === '待审核')}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          onRow={(r) => ({ onClick: () => navigate('/ops/audit'), style: { cursor: 'pointer' } })}
          columns={[
            { title: '订单号', dataIndex: 'orderNo', width: 180, render: (t: string) => <a style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</a> },
            { title: '品牌方', dataIndex: 'brandName', width: 180, ellipsis: true },
            { title: '工厂', dataIndex: 'factoryName', width: 160, ellipsis: true },
            { title: '标签类型', dataIndex: 'tagType', width: 130 },
            { title: '数量', dataIndex: 'totalQuantity', width: 110, render: (v: number) => <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toLocaleString()}</Text> },
            { title: '提交时间', dataIndex: 'createdAt', width: 150 },
          ]}
        />
      </Card>
    </div>
  );
}
