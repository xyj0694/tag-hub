import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card, Table, Button, Form, Input, InputNumber, Select, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { shipments, orders } from '../data/mock';

const { Title } = Typography;

export default function SupplierShipment() {
  const navigate = useNavigate();
  const subOrder = orders[1].subOrders[1]; // 供应商乙, 部分发货

  const shipData = shipments['2-2'] || [];
  const totalShipped = shipData.reduce((s, sh) => s + sh.quantity, 0);
  const remaining = subOrder.quantity - totalShipped;

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>发货管理 — {subOrder.orderNo}</Title>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>待发数量：<span style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>{remaining.toLocaleString()}</span> 张</div>
        <Form layout="inline" onFinish={v => message.success(`已发货 ${v.quantity} 张`)}>
          <Form.Item label="发货数量" name="quantity" rules={[{ required: true }]}>
            <InputNumber min={1} max={remaining} placeholder="输入数量" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="快递公司" name="courier" rules={[{ required: true }]}>
            <Select style={{ width: 140 }} options={[{ value: '顺丰', label: '顺丰速运' }, { value: '圆通', label: '圆通速递' }, { value: '中通', label: '中通快递' }]} />
          </Form.Item>
          <Form.Item label="快递单号" name="trackingNo" rules={[{ required: true }]}>
            <Input placeholder="输入快递单号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">确认发货</Button></Form.Item>
        </Form>
      </Card>
      <Card title="发货记录">
        <Table dataSource={shipData} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          columns={[
            { title: '批次号', dataIndex: 'batchNo' },
            { title: '数量', dataIndex: 'quantity', render: (v: number) => v.toLocaleString() },
            { title: '快递单号', dataIndex: 'trackingNo' },
            { title: '快递公司', dataIndex: 'courier' },
            { title: '发货时间', dataIndex: 'shippedAt' },
            { title: '签收状态', dataIndex: 'signed', render: (v: boolean) => v ? <Tag color="green">已签收</Tag> : <Tag color="orange">待签收</Tag> },
          ]}
        />
      </Card>
    </div>
  );
}
