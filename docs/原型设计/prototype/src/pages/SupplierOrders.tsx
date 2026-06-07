import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card, Table, Button, Tag, Select, DatePicker, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orders, suppliers } from '../data/mock';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusMap: Record<string, { color: string; text: string }> = {
  '待接单': { color: 'orange', text: '待接单' },
  '已接单': { color: 'cyan', text: '已接单' },
  '生产中': { color: 'processing', text: '生产中' },
  '生产完成': { color: 'green', text: '生产完成' },
  '部分发货': { color: 'lime', text: '部分发货' },
  '已发货': { color: 'purple', text: '已发货' },
  '已签收': { color: 'success', text: '已签收' },
};

export default function SupplierOrders() {
  const navigate = useNavigate();

  // 收集所有子订单（供应商甲视角）
  const subOrders = orders.flatMap(o => o.subOrders).filter(so =>
    so.supplierName === '杭州信达标签印刷有限公司'
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      </div>
      <Title level={4} style={{ marginTop: 0 }}>订单列表</Title>
      <Card style={{ borderRadius: 8 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select placeholder="全部状态" style={{ width: 130 }} defaultValue="all" options={[
            { value: 'all', label: '全部状态' },
            ...Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text })),
          ]} />
          <RangePicker placeholder={['转单时间 从', '到']} />
        </Space>
        <Table
          dataSource={subOrders}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '15', '20'] }}
          columns={[
            { title: '子订单号', dataIndex: 'orderNo', width: 190, render: (t: string) => <a onClick={() => navigate('/supplier/detail')} style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</a> },
            { title: 'SKU', dataIndex: 'sku', width: 160, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
            { title: '数量', dataIndex: 'quantity', width: 100, render: (v: number) => <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toLocaleString()}</Text> },
            { title: '状态', dataIndex: 'status', width: 100, render: (s: string) => {
              const m = statusMap[s] || { color: 'default', text: s };
              return <Tag color={m.color}>{m.text}</Tag>;
            }},
            { title: '已发货', dataIndex: 'shippedQuantity', width: 100, render: (v: number) => v > 0 ? v.toLocaleString() : '—' },
            { title: '操作', width: 80, render: () => <Button size="small" type="link" onClick={() => navigate('/supplier/detail')}>详情</Button> },
          ]}
        />
      </Card>
    </div>
  );
}
