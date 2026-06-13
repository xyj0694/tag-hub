import { Card, Typography, Form, Input, Switch, Button, Space, message, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OpsSystemConfig() {
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then(() => {
      message.success('系统配置已保存');
    });
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>系统配置</Title>
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>基础参数</Text>
        <Form form={form} layout="vertical" initialValues={{
          siteName: '标签接单协作平台',
          maxFileSize: 200,
          sessionTimeout: 480,
          enableSms: true,
          enableEmail: true,
        }}>
          <Form.Item label="平台名称" name="siteName">
            <Input style={{ maxWidth: 400 }} />
          </Form.Item>
          <Form.Item label="最大上传文件（MB）" name="maxFileSize">
            <Input type="number" style={{ maxWidth: 200 }} />
          </Form.Item>
          <Form.Item label="登录超时（分钟）" name="sessionTimeout">
            <Input type="number" style={{ maxWidth: 200 }} />
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>通知设置</Text>
        <Form.Item label="短信通知" name="enableSms" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="关闭" />
        </Form.Item>
        <Form.Item label="邮件通知" name="enableEmail" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="关闭" />
        </Form.Item>
      </Card>

      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
    </div>
  );
}
