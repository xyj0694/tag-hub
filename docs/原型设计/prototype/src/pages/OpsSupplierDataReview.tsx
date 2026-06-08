import { useState, useMemo } from 'react';
import {
  Card, Table, Button, Tag, Typography, Modal, Input, Space, message,
  Tabs, Statistic, Row, Col, Popconfirm, Alert, Badge, Descriptions, theme, Tooltip
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, SwapOutlined,
  ExclamationCircleOutlined, ClockCircleOutlined, WarningOutlined,
  ReloadOutlined, FilterOutlined, FileTextOutlined, SendOutlined
} from '@ant-design/icons';
import { supplierReviewQueue } from '../data/mock';
import type { SupplierReviewItem } from '../data/mock';

const { Title, Text } = Typography;

interface Props {}

export default function OpsSupplierDataReview(_props: Props) {
  const { token } = theme.useToken();
  const [queue, setQueue] = useState<SupplierReviewItem[]>(supplierReviewQueue);
  const [activeTab, setActiveTab] = useState<string>('epc');
  const [detailOpen, setDetailOpen] = useState<SupplierReviewItem | null>(null);
  const [rejectOpen, setRejectOpen] = useState<SupplierReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = useMemo(() => {
    return queue.filter(i => i.type === activeTab && i.status === 'pending');
  }, [queue, activeTab]);

  const epcPending = queue.filter(i => i.type === 'epc' && i.status === 'pending').length;
  const shipmentPending = queue.filter(i => i.type === 'shipment' && i.status === 'pending').length;
  const approvedTotal = queue.filter(i => i.status === 'approved').length;
  const rejectedTotal = queue.filter(i => i.status === 'rejected').length;

  const handleApprove = (item: SupplierReviewItem) => {
    setQueue(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'approved' as const } : i
    ));
    const label = item.type === 'epc' ? 'EPC 数据' : '发货数据';
    message.success(`${item.supplierName} 的${label}已审核通过，品牌方可查看。`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { message.error('请输入驳回原因'); return; }
    if (!rejectOpen) return;
    setQueue(prev => prev.map(i =>
      i.id === rejectOpen.id ? { ...i, status: 'rejected' as const, rejectReason } : i
    ));
    const label = rejectOpen.type === 'epc' ? 'EPC 数据' : '发货数据';
    message.success(`已驳回 ${rejectOpen.supplierName} 的${label}，供应商将收到通知并修正后重新提交。`);
    setRejectOpen(null);
    setRejectReason('');
  };

  const handleBatchApprove = () => {
    if (filtered.length === 0) { message.warning('无待审核项'); return; }
    setQueue(prev => prev.map(i =>
      i.type === activeTab && i.status === 'pending' ? { ...i, status: 'approved' as const } : i
    ));
    const label = activeTab === 'epc' ? 'EPC 数据' : '发货数据';
    message.success(`已批量通过 ${filtered.length} 条${label}`);
  };

  const approveCount = useMemo(() => {
    const approved = queue.filter(i => i.status === 'approved');
    return approved.length;
  }, [queue]);

  const rejectedCount = useMemo(() => {
    const rejected = queue.filter(i => i.status === 'rejected');
    return rejected.length;
  }, [queue]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>供应商数据审核</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setQueue(supplierReviewQueue)}>重置数据</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleBatchApprove} disabled={filtered.length === 0}>
            批量通过（{filtered.length}）
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: token.colorFillQuaternary }}>
            <Statistic title="待审 EPC" value={epcPending}
              prefix={<FileTextOutlined />} valueStyle={{ color: '#fa8c16', fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: token.colorFillQuaternary }}>
            <Statistic title="待审发货" value={shipmentPending}
              prefix={<SendOutlined />} valueStyle={{ color: '#1677ff', fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: '#f6ffed' }}>
            <Statistic title="已通过" value={approvedTotal}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a', fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: rejectedTotal > 0 ? '#fff2f0' : token.colorFillQuaternary }}>
            <Statistic title="已驳回" value={rejectedTotal}
              prefix={<CloseCircleOutlined />} valueStyle={{ color: rejectedTotal > 0 ? '#ff4d4f' : undefined, fontSize: 22 }} />
          </Card>
        </Col>
      </Row>

      {/* 说明 Alert */}
      <Alert
        type="info"
        showIcon
        message="供应商提交的 EPC 数据和发货数据需经平台方审核后，品牌方才能查看。请仔细核对后再通过。"
        style={{ marginBottom: 16 }}
      />

      {/* 标签页 */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'epc',
              label: <span><FileTextOutlined /> EPC 数据审核 <Badge count={epcPending} size="small" style={{ marginLeft: 8 }} /></span>,
            },
            {
              key: 'epc_return',
              label: <span><SwapOutlined /> EPC 回传审核 <Badge count={queue.filter(i => i.type === 'epc_return' && i.status === 'pending').length} size="small" style={{ marginLeft: 8 }} /></span>,
            },
            {
              key: 'shipment',
              label: <span><SendOutlined /> 发货数据审核 <Badge count={shipmentPending} size="small" style={{ marginLeft: 8 }} /></span>,
            },
          ]}
        />

        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
          共 {filtered.length} 条待审核{activeTab === 'epc' ? 'EPC 数据' : '发货记录'}
        </Text>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <br /><br />
            <Text type="secondary">当前无待审核的{activeTab === 'epc' ? 'EPC 数据' : '发货记录'}</Text>
          </div>
        ) : (
          <Table
            dataSource={filtered}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }}
            columns={activeTab === 'epc' ? [
              {
                title: '供应商', dataIndex: 'supplierName', width: 200, ellipsis: true,
                render: (t: string) => <Text strong>{t}</Text>,
              },
              {
                title: '品牌方', dataIndex: 'brandName', width: 150,
                render: (t: string) => <Tag color="blue">{t}</Tag>,
              },
              { title: '父订单号', dataIndex: 'parentOrderNo', width: 140, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              { title: '子订单号', dataIndex: 'subOrderNo', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              { title: '提交时间', dataIndex: 'submittedAt', width: 150 },
              {
                title: '校验结果', width: 200,
                render: (_: any, r: SupplierReviewItem) => {
                  const pct = r.epcTotal ? Math.round((r.epcPassed || 0) / r.epcTotal * 100) : 0;
                  const hasErrors = (r.epcFailed || 0) > 0;
                  return (
                    <Space>
                      <Text strong>{r.epcTotal?.toLocaleString()} 条</Text>
                      <Text type="success">通过 {r.epcPassed?.toLocaleString()}</Text>
                      {hasErrors ? (
                        <Tooltip title="点击查看明细了解异常详情">
                          <Text type="danger" strong><WarningOutlined /> {r.epcFailed}</Text>
                        </Tooltip>
                      ) : (
                        <Text type="success">✓ 全部通过</Text>
                      )}
                    </Space>
                  );
                },
              },
              {
                title: '操作', width: 180,
                render: (_: any, r: SupplierReviewItem) => (
                  <Space size="small">
                    <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setDetailOpen(r)}>明细</Button>
                    <Popconfirm
                      title="确认审核通过？"
                      description={`通过后，${r.supplierName} 的 EPC 数据将对品牌方可⻅。`}
                      onConfirm={() => handleApprove(r)}
                      okText="通过"
                      cancelText="取消"
                    >
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />}>通过</Button>
                    </Popconfirm>
                    <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setRejectOpen(r); setRejectReason(''); }}>驳回</Button>
                  </Space>
                ),
              },
            ] : activeTab === 'epc_return' ? [
              {
                title: '供应商', dataIndex: 'supplierName', width: 180, ellipsis: true,
                render: (t: string) => <Text strong>{t}</Text>,
              },
              { title: '品牌方', dataIndex: 'brandName', width: 140, render: (t: string) => <Tag color="blue">{t}</Tag> },
              { title: '子订单号', dataIndex: 'subOrderNo', width: 140, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              { title: '提交时间', dataIndex: 'submittedAt', width: 140 },
              { title: '操作', width: 180, render: (_: any, r: SupplierReviewItem) => (
                  <Space size="small">
                    <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setDetailOpen(r)}>明细</Button>
                    <Popconfirm title="确认审核通过？" description="通过后作废数据将被确认。" onConfirm={() => handleApprove(r)} okText="通过" cancelText="取消">
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />}>通过</Button>
                    </Popconfirm>
                    <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setRejectOpen(r); setRejectReason(''); }}>驳回</Button>
                  </Space>
                ),
              },
            ] : [
              {
                title: '供应商', dataIndex: 'supplierName', width: 200, ellipsis: true,
                render: (t: string) => <Text strong>{t}</Text>,
              },
              {
                title: '品牌方', dataIndex: 'brandName', width: 150,
                render: (t: string) => <Tag color="blue">{t}</Tag>,
              },
              { title: '父订单号', dataIndex: 'parentOrderNo', width: 140, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              { title: '子订单号', dataIndex: 'subOrderNo', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              {
                title: '发货信息', width: 280,
                render: (_: any, r: SupplierReviewItem) => (
                  <Space>
                    <Text code style={{ fontSize: 11 }}>{r.shipmentBatchNo}</Text>
                    <Tag>{r.shipmentCourier}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.shipmentTrackingNo}</Text>
                  </Space>
                ),
              },
              {
                title: '数量', dataIndex: 'shipmentQuantity', width: 90,
                render: (v: number) => <Text strong>{v?.toLocaleString()}</Text>,
              },
              { title: '提交时间', dataIndex: 'submittedAt', width: 150 },
              {
                title: '操作', width: 180,
                render: (_: any, r: SupplierReviewItem) => (
                  <Space size="small">
                    <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setDetailOpen(r)}>明细</Button>
                    <Popconfirm
                      title="确认审核通过？"
                      description={`通过后，${r.supplierName} 的发货记录将对品牌方可⻅。`}
                      onConfirm={() => handleApprove(r)}
                      okText="通过"
                      cancelText="取消"
                    >
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />}>通过</Button>
                    </Popconfirm>
                    <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setRejectOpen(r); setRejectReason(''); }}>驳回</Button>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* 明细弹窗 */}
      <Modal
        title={`${detailOpen?.type === 'epc' ? 'EPC 数据' : '发货数据'}审核明细`}
        open={!!detailOpen}
        onCancel={() => setDetailOpen(null)}
        width={detailOpen?.type === 'epc' ? 900 : 600}
        footer={[
          detailOpen?.status === 'pending' && (
            <Popconfirm
              key="approve"
              title="确认审核通过？"
              onConfirm={() => { handleApprove(detailOpen!); setDetailOpen(null); }}
              okText="通过"
              cancelText="取消"
            >
              <Button type="primary" icon={<CheckCircleOutlined />}>审核通过</Button>
            </Popconfirm>
          ),
          detailOpen?.status === 'pending' && (
            <Button key="reject" danger icon={<CloseCircleOutlined />}
              onClick={() => { setRejectOpen(detailOpen); setDetailOpen(null); }}>驳回</Button>
          ),
          <Button key="close" onClick={() => setDetailOpen(null)}>关闭</Button>,
        ].filter(Boolean)}
      >
        {detailOpen && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="供应商">{detailOpen.supplierName}</Descriptions.Item>
              <Descriptions.Item label="品牌方">{detailOpen.brandName}</Descriptions.Item>
              <Descriptions.Item label="父订单号"><Text code style={{ fontSize: 11 }}>{detailOpen.parentOrderNo}</Text></Descriptions.Item>
              <Descriptions.Item label="子订单号"><Text code style={{ fontSize: 11 }}>{detailOpen.subOrderNo}</Text></Descriptions.Item>
              <Descriptions.Item label="提交时间">{detailOpen.submittedAt}</Descriptions.Item>
              <Descriptions.Item label="审核状态">
                {detailOpen.status === 'pending' && <Tag color="orange">待审核</Tag>}
                {detailOpen.status === 'approved' && <Tag color="green">已通过</Tag>}
                {detailOpen.status === 'rejected' && <Tag color="red">已驳回</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {detailOpen.type === 'epc' && (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><Statistic title="总数" value={detailOpen.epcTotal} suffix="条" /></Col>
                  <Col span={8}><Statistic title="通过" value={detailOpen.epcPassed} suffix="条" valueStyle={{ color: '#52c41a' }} /></Col>
                  <Col span={8}><Statistic title="异常" value={detailOpen.epcFailed} suffix="条" valueStyle={{ color: detailOpen.epcFailed ? '#ff4d4f' : undefined }} /></Col>
                </Row>
                {detailOpen.epcErrors && detailOpen.epcErrors.length > 0 ? (
                  <>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>异常明细：</Text>
                    <Table
                      dataSource={detailOpen.epcErrors}
                      rowKey="row"
                      size="small"
                      pagination={false}
                      columns={[
                        { title: '行号', dataIndex: 'row', width: 70 },
                        { title: 'EPC 编码', dataIndex: 'epc', render: (v: string) => <Text code style={{ color: '#ff4d4f', fontSize: 11 }}>{v}</Text> },
                        { title: '异常原因', dataIndex: 'reason', render: (r: string) => {
                          const isDup = r.includes('重复');
                          return <Space><Tag color={isDup ? 'red' : 'orange'}>{isDup ? '重码' : '错码'}</Tag>{r}</Space>;
                        }},
                      ]}
                    />
                  </>
                ) : (
                  <Alert type="success" showIcon message="全部 EPC 数据校验通过，无异常。" />
                )}
              </>
            )}

            {detailOpen.type === 'shipment' && (
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="发货批次号"><Text code>{detailOpen.shipmentBatchNo}</Text></Descriptions.Item>
                <Descriptions.Item label="发货数量"><Text strong>{detailOpen.shipmentQuantity?.toLocaleString()} 张</Text></Descriptions.Item>
                <Descriptions.Item label="快递公司">{detailOpen.shipmentCourier}</Descriptions.Item>
                <Descriptions.Item label="快递单号"><Text code style={{ fontSize: 11 }}>{detailOpen.shipmentTrackingNo}</Text></Descriptions.Item>
              </Descriptions>
            )}

            {detailOpen.rejectReason && (
              <Alert type="error" showIcon message="驳回原因" description={detailOpen.rejectReason} style={{ marginTop: 16 }} />
            )}
          </>
        )}
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="驳回数据"
        open={!!rejectOpen}
        onOk={handleReject}
        onCancel={() => { setRejectOpen(null); setRejectReason(''); }}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        {rejectOpen && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="供应商">{rejectOpen.supplierName}</Descriptions.Item>
              <Descriptions.Item label="类型">{rejectOpen.type === 'epc' ? 'EPC 数据' : '发货数据'}</Descriptions.Item>
              <Descriptions.Item label="子订单号" span={2}><Text code style={{ fontSize: 11 }}>{rejectOpen.subOrderNo}</Text></Descriptions.Item>
            </Descriptions>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>驳回原因（必填）：</Text>
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="请详细描述驳回原因，供应商将收到此说明并修正后重新提交..."
            />
          </>
        )}
      </Modal>
    </div>
  );
}
