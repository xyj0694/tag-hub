import { useState } from 'react';
import {
  Card, Typography, Radio, Upload, Button, Table, InputNumber, Input,
  Space, message, Alert, Tag, Divider, Row, Col, Statistic, theme, Descriptions
} from 'antd';
import {
  InboxOutlined, FileExcelOutlined, FileTextOutlined,
  DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  UploadOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { Dragger } = Upload;

type ImportMode = 'file' | 'range';

// Mock preview data for file upload
const MOCK_PREVIEW = [
  { key: 1, epc: '3034ABC000000001', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', valid: true },
  { key: 2, epc: '3034ABC000000002', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', valid: true },
  { key: 3, epc: '3034ABC000000003', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', valid: true },
  { key: 4, epc: 'XYZ001000000001', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', valid: false },
  { key: 5, epc: '3034ABC000000005', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', valid: true },
];

export default function BrandDataImport() {
  const { token } = theme.useToken();
  const [mode, setMode] = useState<ImportMode>('file');
  const [uploaded, setUploaded] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Range mode state
  const [prefix, setPrefix] = useState('');
  const [seqStart, setSeqStart] = useState<number | null>(1);
  const [seqEnd, setSeqEnd] = useState<number | null>(100);

  const handleFileUpload: UploadProps['beforeUpload'] = (file) => {
    const isAccepted = file.name.endsWith('.xlsx') || file.name.endsWith('.csv')
      || file.name.endsWith('.txt') || file.name.endsWith('.pdf');
    if (!isAccepted) {
      message.error('仅支持 .xlsx / .csv / .txt / .pdf 格式');
      return false;
    }
    const isLt200M = file.size / 1024 / 1024 < 200;
    if (!isLt200M) {
      message.error('文件不能超过 200MB');
      return false;
    }
    setUploaded(true);
    setPreview(MOCK_PREVIEW);
    message.success(`已读取 ${MOCK_PREVIEW.length} 条唯一码数据（模拟）`);
    return false;
  };

  const handleRangeGenerate = () => {
    if (!prefix || seqStart == null || seqEnd == null || seqEnd < seqStart) {
      message.error('请填写有效的前缀和起止序号');
      return;
    }
    const count = seqEnd - seqStart + 1;
    const generated = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      key: i + 1,
      epc: `${prefix}${String(seqStart + i).padStart(String(seqEnd).length, '0')}`,
      valid: true,
    }));
    setPreview(generated);
    setUploaded(true);
    message.success(`已生成 ${count.toLocaleString()} 条唯一码前缀（预览前 10 条）`);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    message.success(`${preview.length} 条唯一码数据已提交，等待平台审核后转发给供应商。`);
  };

  const handleReset = () => {
    setUploaded(false);
    setPreview([]);
    setSubmitted(false);
    setPrefix('');
    setSeqStart(1);
    setSeqEnd(100);
  };

  const validCount = preview.filter(p => p.valid).length;
  const invalidCount = preview.filter(p => !p.valid).length;

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>唯一码数据导入</Title>

      {!submitted && (
        <>
          {/* 模式选择 */}
          <Card style={{ borderRadius: 8, marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>数据来源方式</Text>
            <Radio.Group value={mode} onChange={e => { setMode(e.target.value); setUploaded(false); setPreview([]); }}>
              <Radio.Button value="file">
                <Space><FileExcelOutlined /> 文件导入（完整编码）</Space>
              </Radio.Button>
              <Radio.Button value="range">
                <Space><ThunderboltOutlined /> 前缀+流水号段</Space>
              </Radio.Button>
            </Radio.Group>
          </Card>

          {/* 方式一：文件拖拽 */}
          {mode === 'file' && !uploaded && (
            <Card style={{ borderRadius: 8, marginBottom: 16 }}>
              <Dragger
                accept=".xlsx,.csv,.txt,.pdf"
                showUploadList={false}
                beforeUpload={handleFileUpload}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽唯一码数据文件到此区域</p>
                <p className="ant-upload-hint">
                  支持 .xlsx / .csv / .txt / .pdf 格式，单文件 ≤ 200MB
                  <br />系统将自动解析编码列并预览
                </p>
              </Dragger>
            </Card>
          )}

          {/* 方式二：前缀+流水号 */}
          {mode === 'range' && !uploaded && (
            <Card style={{ borderRadius: 8, marginBottom: 16 }} title="流水号段配置">
              <Alert
                type="info" showIcon
                title="输入固定前缀和起止流水号，系统将按规则生成全部唯一码。适用于存量标签补货等不需要完整编码的场景。"
                style={{ marginBottom: 16 }}
              />
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>编码前缀</Text>
                  <Input
                    placeholder="如 BSD、XZF 等品牌前缀"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value)}
                    style={{ width: 300 }}
                    prefix={<Text type="secondary">前缀</Text>}
                  />
                </div>
                <Space>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>起始序号</Text>
                    <InputNumber min={1} value={seqStart} onChange={v => setSeqStart(v)} style={{ width: 150 }} />
                  </div>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>终止序号</Text>
                    <InputNumber min={1} value={seqEnd} onChange={v => setSeqEnd(v)} style={{ width: 150 }} />
                  </div>
                  <div style={{ paddingTop: 24 }}>
                    <Button type="primary" onClick={handleRangeGenerate} icon={<ThunderboltOutlined />}>
                      生成预览
                    </Button>
                  </div>
                </Space>
              </Space>
            </Card>
          )}

          {/* 预览表格 */}
          {uploaded && preview.length > 0 && (
            <Card style={{ borderRadius: 8, marginBottom: 16 }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}><Statistic title="总条数" value={preview.length} suffix="条" /></Col>
                <Col span={8}><Statistic title="有效" value={validCount} styles={{ content: {color: '#52c41a'} }} prefix={<CheckCircleOutlined />} /></Col>
                <Col span={8}><Statistic title="异常" value={invalidCount} styles={{ content: {color: invalidCount > 0 ? '#ff4d4f' : undefined} }} prefix={<CloseCircleOutlined />} /></Col>
              </Row>

              {mode === 'range' && (
                <Alert type="info" showIcon style={{ marginBottom: 12 }}
                  title={`预览前 ${Math.min(preview.length, 10)} 条，共 ${(seqEnd || 0) - (seqStart || 0) + 1} 条待生成`} />
              )}

              <Table
                dataSource={preview}
                rowKey="key"
                size="small"
                pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
                columns={[
                  { title: '#', dataIndex: 'key', width: 50 },
                  {
                    title: '唯一码', dataIndex: 'epc', width: 220,
                    render: (v: string, r: any) => (
                      <Text code style={{ fontSize: 11, color: r.valid ? undefined : '#ff4d4f' }}>{v}</Text>
                    ),
                  },
                  { title: '关联 SKU', dataIndex: 'sku', width: 160, render: (t: string) => t ? <Text code style={{ fontSize: 11 }}>{t}</Text> : <Text type="secondary">—</Text> },
                  { title: '品名', dataIndex: 'productName', width: 150, ellipsis: true },
                  {
                    title: '校验', dataIndex: 'valid', width: 70,
                    render: (v: boolean) => v
                      ? <Tag color="success" icon={<CheckCircleOutlined />}>有效</Tag>
                      : <Tag color="error" icon={<CloseCircleOutlined />}>格式异常</Tag>,
                  },
                ]}
              />

              <Divider />

              <Space>
                <Button type="primary" size="large" icon={<UploadOutlined />} onClick={handleSubmit}>
                  提交数据
                </Button>
                <Button size="large" onClick={handleReset}>重新选择</Button>
              </Space>
            </Card>
          )}
        </>
      )}

      {/* 提交成功 */}
      {submitted && (
        <Card style={{ borderRadius: 8 }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a', marginBottom: 16 }} />
            <br />
            <Title level={4} style={{ marginTop: 0 }}>数据已提交</Title>
            <Text type="secondary">
              {preview.length} 条唯一码数据已进入平台审核队列，<br />
              审核通过后将自动转发给对应供应商。
            </Text>
            <br /><br />
            <Button type="primary" size="large" onClick={handleReset}>继续导入</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
