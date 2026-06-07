import { Card, Descriptions, Table, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DownloadOutlined, PrinterOutlined , ArrowLeftOutlined } from '@ant-design/icons';
import { orders } from '../data/mock';

const { Title } = Typography;

export default function SupplierDeliveryNote() {
  const navigate = useNavigate();
  const subOrder = orders[1].subOrders[1];

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>送货单</Title>
      <Card style={{ maxWidth: 700 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>送 货 单</Title>
        </div>
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="子订单号">{subOrder.orderNo}</Descriptions.Item>
          <Descriptions.Item label="父订单号">{orders[1].orderNo}</Descriptions.Item>
          <Descriptions.Item label="供应商">供应商乙</Descriptions.Item>
          <Descriptions.Item label="SKU">{subOrder.sku}</Descriptions.Item>
          <Descriptions.Item label="订单数量">{subOrder.quantity.toLocaleString()} 张</Descriptions.Item>
          <Descriptions.Item label="已发数量">50,000 张</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>{orders[1].shippingAddress}</Descriptions.Item>
          <Descriptions.Item label="联系人">{orders[1].contact}</Descriptions.Item>
          <Descriptions.Item label="电话">{orders[1].phone}</Descriptions.Item>
        </Descriptions>
        <Table dataSource={[{ key: '1', batchNo: 'SH20260605-002', qty: 20000, trackingNo: 'SF1234567891' }]}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }} size="small"
          columns={[
            { title: '批次号', dataIndex: 'batchNo' },
            { title: '发货数量', dataIndex: 'qty', render: (v: number) => v.toLocaleString() },
            { title: '快递单号', dataIndex: 'trackingNo' },
          ]}
        />
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button icon={<DownloadOutlined />}>下载 PDF</Button>
          <Button type="primary" icon={<PrinterOutlined />}>打印</Button>
        </div>
      </Card>
    </div>
  );
}
