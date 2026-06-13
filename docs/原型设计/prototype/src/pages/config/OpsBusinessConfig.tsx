import { Card, Typography, Form, Select, InputNumber, Switch, Button, Space, message, Table, Tag } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OpsBusinessConfig() {
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then(() => {
      message.success('业务配置已保存');
    });
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>业务配置</Title>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>订单规则</Text>
        <Form form={form} layout="vertical" initialValues={{
          defaultOrderType: '大货单',
          autoAudit: false,
          maxSkuPerOrder: 50,
          urgentThreshold: 3,
        }}>
          <Form.Item label="默认订单类型" name="defaultOrderType">
            <Select style={{ maxWidth: 300 }} options={[
              { value: '大货单', label: '大货单' },
              { value: '补单', label: '补单' },
            ]} />
          </Form.Item>
          <Form.Item label="单次最大 SKU 数" name="maxSkuPerOrder">
            <InputNumber min={1} max={500} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label="加急阈值（天）" name="urgentThreshold">
            <InputNumber min={1} max={30} style={{ width: 200 }} addonAfter="天内自动标记加急" />
          </Form.Item>
          <Form.Item label="自动审核" name="autoAudit" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="关闭" />
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>标签类型管理</Text>
        <Table
          dataSource={[
            { key: 1, name: '吊牌标签', status: '启用', size: '40×90mm' },
            { key: 2, name: '不干胶贴纸标签', status: '启用', size: '55×75mm' },
            { key: 3, name: '洗麦标签', status: '启用', size: '30×65mm' },
          ]}
          pagination={false}
          size="middle"
          columns={[
            { title: '类型名称', dataIndex: 'name' },
            { title: '默认尺寸', dataIndex: 'size' },
            { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color="green">{s}</Tag> },
          ]}
        />
      </Card>

      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
    </div>
  );
}
