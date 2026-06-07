import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Descriptions } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function ProfilePage() {
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

      <Title level={4} style={{ marginTop: 0 }}>个人中心</Title>

      <Card>
        <Descriptions title="账号信息" column={1} size="small" bordered>
          <Descriptions.Item label="账号">brand@demo.com</Descriptions.Item>
          <Descriptions.Item label="角色">品牌方管理员</Descriptions.Item>
          <Descriptions.Item label="绑定手机">138****1234 <Button size="small" type="link">修改</Button></Descriptions.Item>
          <Descriptions.Item label="绑定邮箱">brand@demo.com <Button size="small" type="link">修改</Button></Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
