import { Card, Table, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DownloadOutlined , ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

const labelTypes = [
  { type: '小包贴', content: 'SKU、款号、颜色、尺码、数量', usage: '每个小包装袋' },
  { type: '中包贴', content: 'SKU、款号、总数', usage: '多个小包集合' },
  { type: '箱贴', content: 'SKU、款号、总数量、箱号', usage: '外箱标识' },
];

export default function SupplierLabels() {
  const navigate = useNavigate();
  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>包装贴下载</Title>
      <Card style={{ maxWidth: 700 }}>
        <Table dataSource={labelTypes} rowKey="type" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          columns={[
            { title: '类型', dataIndex: 'type', render: (t: string) => <span style={{ fontWeight: 600 }}>{t}</span> },
            { title: '包含内容', dataIndex: 'content' },
            { title: '使用场景', dataIndex: 'usage' },
            { title: '操作', render: () => <Button icon={<DownloadOutlined />}>下载 PDF</Button> },
          ]}
        />
      </Card>
    </div>
  );
}
