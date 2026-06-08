import { useState } from 'react';
import { Card, Table, Button, Typography, Tabs, Space, Image, Tag, Alert, message } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileImageOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const labelTypes = [
  { type: '小包贴', content: 'SKU、款号、颜色、尺码、数量', usage: '每个小包装袋' },
  { type: '中包贴', content: 'SKU、款号、总数', usage: '多个小包集合' },
  { type: '箱贴', content: 'SKU、款号、总数量、箱号', usage: '外箱标识' },
];

// 平台箱贴模板
const platformTemplates = [
  { id: 1, name: '标准箱贴模板 A4', format: 'PDF', size: '210×297mm', desc: '通用 A4 箱贴，含 SKU、款号、数量、箱号字段' },
  { id: 2, name: '小包贴模板 50×30', format: '图片', size: '50×30mm（参考）', desc: '不干胶小包贴，含 SKU、颜色、尺码' },
  { id: 3, name: '中包贴模板 80×50', format: '图片', size: '80×50mm（参考）', desc: '不干胶中包贴，含 SKU、款号、总数' },
  { id: 4, name: '塔木尔箱贴参考样例', format: 'PDF', size: '—', desc: '塔木尔客户预生成箱贴样例，固定装箱量 2 万/箱' },
];

export default function SupplierLabels() {
  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>包装贴管理</Title>

      <Tabs defaultActiveKey="download" items={[
        {
          key: 'download',
          label: '我的包装贴',
          children: (
            <Card style={{ maxWidth: 700 }}>
              <Table dataSource={labelTypes} rowKey="type"
                pagination={false}
                columns={[
                  { title: '类型', dataIndex: 'type', render: (t: string) => <span style={{ fontWeight: 600 }}>{t}</span> },
                  { title: '包含内容', dataIndex: 'content' },
                  { title: '使用场景', dataIndex: 'usage' },
                  { title: '操作', render: () => <Button icon={<DownloadOutlined />}>下载 PDF</Button> },
                ]}
              />
            </Card>
          ),
        },
        {
          key: 'platform',
          label: '平台箱贴模板',
          children: (
            <>
              <Alert
                type="info" showIcon style={{ marginBottom: 16 }}
                title="平台统一存储箱贴模板，供应商参考打印。平台不提供在线编辑功能，尺寸标注为参考值，不强制限定，微小偏差不影响使用。"
              />

              <Card>
                <Table dataSource={platformTemplates} rowKey="id" pagination={false}
                  columns={[
                    {
                      title: '模板名称', dataIndex: 'name', width: 220,
                      render: (t: string) => <Space>
                        <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                        <Text strong>{t}</Text>
                      </Space>,
                    },
                    {
                      title: '格式', dataIndex: 'format', width: 70,
                      render: (f: string) => f === 'PDF'
                        ? <Tag color="red">PDF</Tag>
                        : <Tag color="blue">图片</Tag>,
                    },
                    {
                      title: '参考尺寸', dataIndex: 'size', width: 150,
                      render: (s: string) => <Text type="secondary" style={{ fontSize: 12 }}>{s}</Text>,
                    },
                    { title: '说明', dataIndex: 'desc', width: 300, ellipsis: true,
                      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{d}</Text> },
                    {
                      title: '操作', width: 160,
                      render: (_: any, r: any) => (
                        <Space size="small">
                          <Button size="small" icon={<EyeOutlined />} type="link" onClick={() => message.info(`预览 ${r.name}（模拟）`)}>预览</Button>
                          <Button size="small" icon={<DownloadOutlined />} type="link" onClick={() => message.success(`已下载 ${r.name}（模拟）`)}>下载</Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            </>
          ),
        },
      ]} />
    </div>
  );
}
