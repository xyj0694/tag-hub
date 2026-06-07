import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Checkbox, Space, Modal, Input, Upload, Typography, message } from 'antd';
import { CheckCircleOutlined, WarningOutlined, UploadOutlined , ArrowLeftOutlined } from '@ant-design/icons';
import { orders } from '../data/mock';

const { Title, Text } = Typography;

const checklist = [
  '品名：纯棉T恤 — 正确',
  '执行标准：GB/T 22849-2014 — 正确',
  '字号大小：符合要求',
  '打印位置：正面居中 — 正确',
  '其他备注：无特殊要求',
];

export default function SupplierOrderDetail() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Use the first sub-order assigned to supplier 甲
  const order = orders[0];
  const subOrder = order.subOrders[0];

  const handleConfirm = () => {
    message.success('已确认接单，订单进入生产状态');
  };

  return (
    <div>
      <Title level={4}>订单详情与接单</Title>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="订单基本信息" column={2} bordered size="small">
          <Descriptions.Item label="子订单号">{subOrder.orderNo}</Descriptions.Item>
          <Descriptions.Item label="父订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="标签类型">{order.tagType}</Descriptions.Item>
          <Descriptions.Item label="数量">{subOrder.quantity.toLocaleString()} 张</Descriptions.Item>
          <Descriptions.Item label="SKU">{subOrder.sku}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>{order.shippingAddress}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order.contact}</Descriptions.Item>
          <Descriptions.Item label="电话">{order.phone}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="图稿预览" style={{ marginBottom: 16 }}>
        <div style={{
          border: '2px dashed #d9d9d9', height: 240,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8, color: '#999', background: '#fafafa',
          cursor: 'zoom-in',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
            <div>图稿预览区域</div>
            <Text type="secondary" style={{ fontSize: 12 }}>支持鼠标滚轮缩放、拖拽平移</Text>
          </div>
        </div>
      </Card>

      <Card title="信息核对" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ padding: '6px 0', fontSize: 14 }}>
              <Checkbox defaultChecked style={{ marginRight: 8 }} />
              {item}
            </div>
          ))}
        </div>
        <Space>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
          >
            确认接单
          </Button>
          <Button
            size="large"
            icon={<WarningOutlined />}
            onClick={() => setFeedbackOpen(true)}
          >
            反馈异常
          </Button>
        </Space>
      </Card>

      <Modal
        title="反馈异常"
        open={feedbackOpen}
        onCancel={() => setFeedbackOpen(false)}
        onOk={() => { setFeedbackOpen(false); message.info('异常已反馈，等待运营处理'); }}
        okText="提交反馈"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">请描述发现的问题：</Text>
        </div>
        <Input.TextArea rows={4} placeholder="例如：品名与实际不符、字号偏小、打印位置偏移等" />
        <div style={{ marginTop: 12 }}>
          <Upload>
            <Button icon={<UploadOutlined />}>上传附件（选填）</Button>
          </Upload>
        </div>
      </Modal>
    </div>
  );
}
