import { useState } from 'react';
import { Card, Upload, Alert, Button, Table, Statistic, Row, Col, Tag, Typography, Space, message, Tabs, Descriptions, Divider } from 'antd';
import { InboxOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, SwapOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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

// Mock return data
const MOCK_RETURN_RESULT = {
  orderQuantity: 25000,
  wasteAllowance: 500,  // 2%
  totalIssued: 25500,
  actualUsed: 25320,
  voidCount: 180,
};

export default function SupplierEpcUpload() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [uploaded, setUploaded] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{ passed: number; failed: number; errors: EpcValidationError[] } | null>(null);
  const [returnUploaded, setReturnUploaded] = useState(false);
  const [returnResult, setReturnResult] = useState<typeof MOCK_RETURN_RESULT | null>(null);

  const handleUpload = () => {
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      setUploaded(true);
      setResult({ passed: 24950, failed: 150, errors: mockErrors });
      message.success('校验完成');
    }, 2000);
  };

  const handleReturnUpload = () => {
    setReturnUploaded(true);
    setReturnResult(MOCK_RETURN_RESULT);
    message.success('最终回传数据已接收，系统已自动计算作废数量');
  };

  return (
    <div>
      <Title level={4}>EPC 数据管理 — TH20260605-003-1</Title>

      {/* 用量概览 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic title="订单需求量" value={25000} suffix="条" valueStyle={{ fontSize: 22 }} />
          </Col>
          <Col span={6}>
            <Statistic title="+预留（2%）" value={500} suffix="条" valueStyle={{ color: '#fa8c16', fontSize: 22 }} />
          </Col>
          <Col span={6}>
            <Statistic title="下发给供应商总量" value={25500} suffix="条" valueStyle={{ color: '#1677ff', fontSize: 22 }} />
          </Col>
          <Col span={6}>
            <Statistic title="预留比例" value={2} suffix="%（可配置）" valueStyle={{ fontSize: 22 }} />
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'upload', label: '初始上传',
          children: (
            <>
              {!uploaded && (
                <Card style={{ marginBottom: 16 }}>
                  <Dragger accept=".xlsx,.csv" showUploadList={false}
                    beforeUpload={(file) => { handleUpload(); return false; }}>
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
                <>
                  <Card style={{ marginBottom: 16 }}>
                    <Row gutter={24}>
                      <Col span={8}><Statistic title="校验通过" value={result.passed} suffix={`/ ${result.passed + result.failed}`} valueStyle={{ color: '#52c41a', fontSize: 28 }} prefix={<CheckCircleOutlined />} /></Col>
                      <Col span={8}><Statistic title="校验异常" value={result.failed} valueStyle={{ color: '#ff4d4f', fontSize: 28 }} prefix={<CloseCircleOutlined />} /></Col>
                      <Col span={8}><Statistic title="总计" value={result.passed + result.failed} valueStyle={{ color: '#1677ff', fontSize: 28 }} /></Col>
                    </Row>
                  </Card>

                  {result.failed > 0 && (
                    <Card title="异常明细" extra={<Button icon={<DownloadOutlined />}>导出异常明细 xlsx</Button>}>
                      <Table dataSource={result.errors} rowKey="row"
                        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                        columns={[
                          { title: '行号', dataIndex: 'row', width: 80 },
                          { title: 'EPC 编码', dataIndex: 'epc', render: (v: string) => <Text code style={{ color: '#ff4d4f' }}>{v}</Text> },
                          { title: '异常原因', dataIndex: 'reason', render: (r: string) => {
                            const isDup = r.includes('重复');
                            return <Space><Tag color={isDup ? 'red' : 'orange'}>{isDup ? '重码' : '错码'}</Tag>{r}</Space>;
                          }},
                        ]}
                      />
                      <div style={{ marginTop: 16 }}>
                        <Alert type="error" showIcon message="检测到异常数据，请修正后重新上传。EPC 品牌级全局唯一为系统红线，不可跳过。" />
                        <div style={{ marginTop: 12 }}><Space><Button onClick={() => { setUploaded(false); setResult(null); }}>重新上传</Button></Space></div>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </>
          ),
        },
        {
          key: 'return', label: '最终回传',
          children: (
            <>
              <Alert type="info" showIcon style={{ marginBottom: 16 }}
                message="生产完成后，请上传实际使用的 EPC 清单。系统将自动对比下发总量，计算作废数量。" />

              {!returnUploaded ? (
                <Card>
                  <Dragger accept=".xlsx,.csv" showUploadList={false}
                    beforeUpload={(file) => { handleReturnUpload(); return false; }}>
                    <p className="ant-upload-drag-icon"><SwapOutlined style={{ fontSize: 48 }} /></p>
                    <p className="ant-upload-text">点击或拖拽实际使用的 EPC 数据文件</p>
                    <p className="ant-upload-hint">上传后系统自动计算作废量，多余标签数据将被作废</p>
                  </Dragger>
                </Card>
              ) : returnResult && (
                <Card title="回传结果">
                  <Row gutter={24} style={{ marginBottom: 16 }}>
                    <Col span={6}><Statistic title="下发总量" value={returnResult.totalIssued} suffix="条" valueStyle={{ fontSize: 22 }} /></Col>
                    <Col span={6}><Statistic title="实际使用" value={returnResult.actualUsed} suffix="条" valueStyle={{ color: '#52c41a', fontSize: 22 }} prefix={<CheckCircleOutlined />} /></Col>
                    <Col span={6}><Statistic title="已作废" value={returnResult.voidCount} suffix="条" valueStyle={{ color: '#ff4d4f', fontSize: 22 }} prefix={<CloseCircleOutlined />} /></Col>
                    <Col span={6}><Statistic title="作废率" value={(returnResult.voidCount / returnResult.totalIssued * 100).toFixed(1)} suffix="%" valueStyle={{ fontSize: 22 }} /></Col>
                  </Row>

                  <Divider />

                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="订单需求量">{returnResult.orderQuantity.toLocaleString()} 条</Descriptions.Item>
                    <Descriptions.Item label="废标预留（2%）">+{returnResult.wasteAllowance.toLocaleString()} 条</Descriptions.Item>
                    <Descriptions.Item label="下发给供应商">{returnResult.totalIssued.toLocaleString()} 条</Descriptions.Item>
                    <Descriptions.Item label="实际生产使用">{returnResult.actualUsed.toLocaleString()} 条</Descriptions.Item>
                    <Descriptions.Item label="多余作废"><Text type="danger">{returnResult.voidCount.toLocaleString()} 条</Text></Descriptions.Item>
                    <Descriptions.Item label="废标率">{returnResult.voidCount / returnResult.totalIssued * 100 < 2 ? <Text type="success">{(returnResult.voidCount / returnResult.totalIssued * 100).toFixed(1)}%（正常范围内）</Text> : <Text type="warning">{(returnResult.voidCount / returnResult.totalIssued * 100).toFixed(1)}%（略高于预留）</Text>}</Descriptions.Item>
                  </Descriptions>

                  <Alert type="success" showIcon style={{ marginTop: 16 }}
                    message={`${returnResult.voidCount.toLocaleString()} 条多余标签数据已作废，不会流入市场。`} />

                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <Button icon={<DownloadOutlined />}>导出作废清单</Button>
                      <Button onClick={() => { setReturnUploaded(false); setReturnResult(null); }}>重新上传</Button>
                    </Space>
                  </div>
                </Card>
              )}
            </>
          ),
        },
      ]} />
    </div>
  );
}
