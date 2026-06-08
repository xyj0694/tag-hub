import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Select, Divider, message, Space, Tag, Modal, theme } from 'antd';
import { UserOutlined, LockOutlined, QrcodeOutlined, WechatOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const demoAccounts = {
  brand: { username: 'brand@bosideng.com', password: '123456', label: '品牌方 — 波司登' },
  ops: { username: 'ops@invengo.com', password: '123456', label: '平台运营中心' },
  supplier: { username: 'supplier@hzsb.com', password: '123456', label: '供应商 — 杭州信达' },
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const onFinish = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const roleMap: Record<string, string> = { brand: '/brand', ops: '/ops', supplier: '/supplier' };
      navigate(roleMap[values.role] || '/brand');
    }, 800);
  };

  const quickLogin = (role: string) => {
    const acct = demoAccounts[role as keyof typeof demoAccounts];
    form.setFieldsValue({ role, username: acct.username, password: acct.password });
    onFinish({ role, username: acct.username, password: acct.password });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#f0f2f5',
    }}>
      {/* 左侧品牌展示区 */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        background: `linear-gradient(160deg, #004D52 0%, #006670 25%, #008089 50%, #1BB4BC 100%)`,
        padding: 60, position: 'relative', overflow: 'hidden',
      }}>
        {/* 装饰性背景图案 */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'relative', zIndex: 1, maxWidth: 460, textAlign: 'center',
        }}>
          <div style={{ marginBottom: 32 }}>
            <img src="/logo.png" alt="Invengo" style={{ height: 56, filter: 'brightness(10)' }} />
          </div>
          <Title level={2} style={{ color: '#fff', marginBottom: 12, fontWeight: 500 }}>
            标签接单协作平台
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.8 }}>
            连接品牌方、平台运营与供应商<br />
            实现标签下单、审核、生产、发货全链路数字化管理
          </Text>

          {/* 特性列表 */}
          <div style={{ marginTop: 48, display: 'flex', gap: 40, justifyContent: 'center' }}>
            {[
              { icon: '📋', label: '智能模板匹配', desc: 'SKU自动识别，秒级匹配模板' },
              { icon: '🔀', label: '灵活拆单转单', desc: '多供应商拆分，自动通知' },
              { icon: '📦', label: '全程跟踪', desc: '从下单到签收，状态实时可见' },
            ].map((f, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
                <Text strong style={{ color: '#fff', fontSize: 13, display: 'block' }}>{f.label}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{f.desc}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div style={{
        width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 60, background: '#fff',
      }}>
        <div style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 40 }}>
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>欢迎回来</Title>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>请选择角色并登录您的账号</Text>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ role: 'brand' }} size="large">
            <Form.Item label="登录身份" name="role" rules={[{ required: true }]}>
              <Select options={[
                { value: 'brand', label: '品牌方' },
                { value: 'ops', label: '平台运营' },
                { value: 'supplier', label: '供应商' },
              ]} />
            </Form.Item>
            <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}>
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="手机号或邮箱" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="输入密码" />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -8, marginBottom: 16 }}>
              <a onClick={() => setForgotOpen(true)} style={{ fontSize: 13 }}>忘记密码？</a>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ height: 44 }}>
                登 录
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ fontSize: 12, color: '#bbb' }}>其他登录方式</Divider>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Button shape="circle" size="large" icon={<WechatOutlined style={{ color: '#07C160' }} />} disabled />
            <Button shape="circle" size="large" icon={<QrcodeOutlined />} disabled />
          </div>

          {/* 演示账号（更低调的展示） */}
          <div style={{
            marginTop: 32, padding: '16px 20px',
            background: token.colorFillSecondary, borderRadius: 8,
          }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
              💡 演示环境 · 点击快速登录
            </Text>
            <Space orientation="vertical" style={{ width: '100%' }} size={6}>
              {Object.entries(demoAccounts).map(([role, acct]) => (
                <Button
                  key={role}
                  block size="small"
                  type="text"
                  onClick={() => quickLogin(role)}
                  style={{ textAlign: 'left', height: 32, padding: '0 8px', justifyContent: 'flex-start' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 500, width: 140 }}>{acct.label}</Text>
                  <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{acct.username} / {acct.password}</Text>
                </Button>
              ))}
            </Space>
          </div>
        </div>
      </div>

      {/* 忘记密码弹窗 */}
      <Modal
        title="重置密码"
        open={forgotOpen}
        onCancel={() => setForgotOpen(false)}
        onOk={() => { setForgotOpen(false); message.success('重置密码指引已发送至注册邮箱/手机号（演示）'); }}
        okText="发送重置指引"
      >
        <div style={{ marginBottom: 12 }}>请输入注册时使用的手机号或邮箱，系统将发送密码重置指引。</div>
        <Input size="large" placeholder="手机号或邮箱" />
      </Modal>
    </div>
  );
}
