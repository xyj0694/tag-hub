import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card, Table, Button, Tag, DatePicker, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supplierBillings } from '../data/mock';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function SupplierBillings() {
  const navigate = useNavigate();
  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>对账管理</Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker placeholder={['账期 从', '到']} />
        </Space>
        <Table dataSource={supplierBillings} rowKey="key" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          columns={[
            { title: '对账单号', dataIndex: 'billingNo', render: (t: string) => <a>{t}</a> },
            { title: '账期', dataIndex: 'period' },
            { title: '总金额', dataIndex: 'totalAmount', render: (v: number) => `¥ ${v.toLocaleString()}.00` },
            { title: '状态', dataIndex: 'status', render: (s: string) => {
              const m: Record<string, { color: string; text: string }> = { '待确认': { color: 'orange', text: '待确认' }, '已确认': { color: 'green', text: '已确认' }, '已付款': { color: 'blue', text: '已付款' } };
              return <Tag color={m[s]?.color}>{m[s]?.text || s}</Tag>;
            }},
            { title: '操作', render: (_: any, r: any) => (
              <Space>
                <Button size="small" type="link">查看明细</Button>
                {r.status === '待确认' && <><Button size="small" type="primary">确认</Button><Button size="small">📎 上传发票</Button></>}
              </Space>
            )},
          ]}
        />
      </Card>
    </div>
  );
}
