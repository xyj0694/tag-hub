import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Upload, Alert, Button, Table, Statistic, Row, Col, Tag, Typography, Space, message } from 'antd';
import { InboxOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined , ArrowLeftOutlined } from '@ant-design/icons';
import type { EpcValidationError } from '../data/mock';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const mockErrors: EpcValidationError[] = [
  { row: 1234, epc: '3034ABC000000001234', reason: 'EPC 重复：与历史生产数据（订单 TH20260301-001）冲突' },
  { row: 5678, epc: 'XYZ00100000005678', reason: '格式不匹配：公司前缀应为 3034，当前为 XYZ' },
  { row: 8901, epc: '3034ABC000000008901', reason: 'EPC 重复：与当前批次第 456 行重复' },
  { row: 10234, epc: '3034SHORT', reason: 'EPC 长度异常：应为 24 位，当前 12 位' },
  { row: 15000, epc: '3034ABC000000015000', reason: 'EPC 重复：与历史生产数据（订单 TH20260415-002）冲突' },
];

export default function SupplierEpcUpload() {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{ passed: number; failed: number; errors: EpcValidationError[] } | null>(null);

  const handleUpload = () => {
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      setUploaded(true);
      setResult({
        passed: 24950,
        failed: 150,
        errors: mockErrors,
      });
      message.success('校验完成');
    }, 2000);
  };

  return (
    <div>
      <Title level={4}>EPC 数据上传 — TH20260605-003-1</Title>

      {!uploaded && (
        <Card style={{ marginBottom: 16 }}>
          <Dragger
            accept=".xlsx,.csv"
            showUploadList={false}
            beforeUpload={(file) => {
              handleUpload();
              return false;
            }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽 EPC 数据文件到此区域</p>
            <p className="ant-upload-hint">支持 .xlsx / .csv 格式，单文件 ≤ 200MB | 品牌级全局唯一性校验</p>
          </Dragger>
          {validating && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">正在校验 EPC 数据，请稍候...</Text>
            </div>
          )}
        </Card>
      )}

      {result && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Statistic
                title="校验通过"
                value={result.passed}
                suffix={`/ ${result.passed + result.failed}`}
                valueStyle={{ color: '#52c41a', fontSize: 28 }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="校验异常"
                value={result.failed}
                valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="总计"
                value={result.passed + result.failed}
                valueStyle={{ color: '#1677ff', fontSize: 28 }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {result && result.failed > 0 && (
        <Card title="异常明细" extra={<Button icon={<DownloadOutlined />}>导出异常明细 xlsx</Button>}>
          <Table
            dataSource={result.errors}
            rowKey="row"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
            columns={[
              { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
              {
                title: 'EPC 编码', dataIndex: 'epc', key: 'epc',
                render: (v: string) => <Text code style={{ color: '#ff4d4f' }}>{v}</Text>,
              },
              {
                title: '异常原因', dataIndex: 'reason', key: 'reason',
                render: (r: string) => {
                  const isDuplicate = r.includes('重复');
                  return (
                    <Space>
                      <Tag color={isDuplicate ? 'red' : 'orange'}>{isDuplicate ? '重码' : '错码'}</Tag>
                      {r}
                    </Space>
                  );
                },
              },
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <Alert
              type="error"
              showIcon
              message="检测到 150 条异常数据，请修正后重新上传。EPC 品牌级全局唯一为系统红线，不可跳过。"
            />
            <div style={{ marginTop: 12 }}>
              <Space>
                <Button onClick={() => { setUploaded(false); setResult(null); }}>重新上传</Button>
              </Space>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Need to import Alert
