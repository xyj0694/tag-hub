import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 480 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ padding: '4px 0', marginBottom: 16, color: '#666' }}
      >
        返回
      </Button>

      <Title level={4} style={{ marginTop: 0 }}>修改密码</Title>

      <Card>
        <Form form={form} layout="vertical" onFinish={() => { message.success('密码修改成功（演示）'); form.resetFields(); }}>
          <Form.Item label="当前密码" name="oldPassword" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="当前密码" />
          </Form.Item>
          <Form.Item label="新密码" name="newPassword" rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不少于6位' },
          ]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="新密码（不少于6位）" />
          </Form.Item>
          <Form.Item label="确认新密码" name="confirmPassword" dependencies={['newPassword']} rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="再次输入新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large">保存修改</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
