import { useState, useMemo } from 'react';
import {
  Card, Table, Button, Tag, DatePicker, Space, Typography, message, Select, Modal, Popconfirm, Popover, Alert, theme, Tooltip, Upload
} from 'antd';
import {
  DownloadOutlined, EyeOutlined, FilePdfOutlined, FileImageOutlined,
  PaperClipOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, PrinterOutlined, UploadOutlined
} from '@ant-design/icons';
import { supplierBillings } from '../data/mock';
import type { BillingItem, BillingDetailItem } from '../data/mock';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  '待确认': { color: 'orange', text: '待确认', icon: <ClockCircleOutlined /> },
  '已确认': { color: 'blue', text: '已确认', icon: <CheckCircleOutlined /> },
  '已付款': { color: 'green', text: '已付款', icon: <CheckCircleOutlined /> },
  '超期未付': { color: 'red', text: '超期未付', icon: <ExclamationCircleOutlined /> },
};

export default function SupplierBillings() {
  const { token } = theme.useToken();
  const [billings, setBillings] = useState<BillingItem[]>(supplierBillings);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState<BillingItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; type: 'image' | 'pdf' } | null>(null);

  const filtered = useMemo(() => {
    let list = [...billings];
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
    if (dateRange && dateRange[0] && dateRange[1]) {
      const from = dateRange[0].format('YYYY-MM-DD');
      const to = dateRange[1].format('YYYY-MM-DD');
      list = list.filter(b => {
        const pEnd = b.period.split('~')[1]?.trim() || '';
        const pStart = b.period.split('~')[0]?.trim() || '';
        return pEnd >= from && pStart <= to;
      });
    }
    list.sort((a, b) => {
      const aEnd = a.period.split('~')[1]?.trim() || '';
      const bEnd = b.period.split('~')[1]?.trim() || '';
      return bEnd.localeCompare(aEnd);
    });
    return list;
  }, [billings, statusFilter, dateRange]);

  const totalAmount = filtered.reduce((s, b) => s + b.totalAmount, 0);
  const pendingCount = filtered.filter(b => b.status === '待确认').length;
  const paidCount = filtered.filter(b => b.status === '已付款').length;

  const handleExport = () => {
    if (filtered.length === 0) { message.warning('无符合条件的对账单可导出'); return; }
    message.success(`已导出 ${filtered.length} 条对账单（模拟）`);
  };

  const handleConfirm = (billing: BillingItem) => {
    setBillings(prev => prev.map(b =>
      b.key === billing.key ? { ...b, status: '已确认' } : b
    ));
    message.success(`对账单 ${billing.billingNo} 已确认`);
  };

  const handleUploadInvoice = (billing: BillingItem) => {
    setBillings(prev => prev.map(b =>
      b.key === billing.key ? { ...b, invoiceUploaded: true } : b
    ));
    message.success(`已上传 ${billing.billingNo} 发票（模拟）`);
  };

  const detailColumns = [
    { title: '父订单号', dataIndex: 'parentOrderNo', width: 160, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
    { title: '子订单号', dataIndex: 'subOrderNo', width: 170, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
    { title: 'SKU', dataIndex: 'sku', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
    { title: '品名', dataIndex: 'productName', width: 140, ellipsis: true },
    { title: '数量', dataIndex: 'quantity', width: 80, render: (v: number) => v.toLocaleString() },
    { title: '单价', dataIndex: 'unitPrice', width: 70, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => <Text strong>¥{v.toLocaleString()}.00</Text> },
    {
      title: '发货批次', dataIndex: 'batches', width: 120,
      render: (batches: any[]) => {
        if (!batches || batches.length === 0) return <Text type="secondary">—</Text>;
        const shippedTotal = batches.reduce((s: number, b: any) => s + b.quantity, 0);
        const FileCard = ({ icon, name, type, label }: { icon: React.ReactNode; name: string; type: 'image' | 'pdf'; label: string }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, padding: '4px 8px', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{label}</Text>
              <Text ellipsis style={{ fontSize: 12 }}>{name}</Text>
            </div>
            <Button size="small" type="link" style={{ fontSize: 11, padding: '0 4px' }}
              onClick={() => setPreviewFile({ name, type })}>预览</Button>
            <Button size="small" type="link" style={{ fontSize: 11, padding: '0 4px' }}
              onClick={() => message.success(`已下载 ${name}（模拟）`)}>下载</Button>
          </div>
        );
        return (
          <Popover
            title="发货批次明细"
            content={
              <div style={{ maxWidth: 400 }}>
                {batches.map((b: any, i: number) => (
                  <div key={i} style={{ marginBottom: i < batches.length - 1 ? 10 : 0, paddingBottom: i < batches.length - 1 ? 10 : 0, borderBottom: i < batches.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div style={{ marginBottom: 6 }}><Text strong>批次 {b.batchNo}</Text><Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{b.quantity.toLocaleString()} 张</Text></div>
                    <div style={{ fontSize: 12, lineHeight: '22px' }}>
                      <div><Text type="secondary">发货时间：</Text>{b.shippedAt}</div>
                      <div><Text type="secondary">快递单号：</Text>{b.supTrackingNo}</div>
                      {b.signedAt ? (
                        <>
                          <div><Text type="secondary">签收时间：</Text>{b.signedAt}</div>
                          {b.signedDocNo && (
                            <FileCard icon={<FilePdfOutlined style={{ color: '#ff4d4f' }} />} name={`${b.signedDocNo}.pdf`} type="pdf" label="签收单" />
                          )}
                        </>
                      ) : (
                        <div><Text type="secondary">签收时间：</Text><Tag style={{ fontSize: 10 }}>待签</Tag></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            }
            trigger="click"
          >
            <a style={{ fontSize: 12 }}>{batches.length} 批 · 共 {shippedTotal.toLocaleString()} 张</a>
          </Popover>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>对账管理</Title>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 Excel</Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        {/* 筛选 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="全部状态"
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: '全部状态' },
              ...Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text })),
            ]}
          />
          <RangePicker placeholder={['账期 从', '到']} value={dateRange} onChange={v => setDateRange(v as any)} />
          <Button onClick={() => { setStatusFilter('all'); setDateRange(null); }}>重置筛选</Button>
        </Space>

        {/* 汇总卡片 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, background: token.colorFillQuaternary, borderRadius: 8, padding: '12px 16px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>应收总额</Text>
            <br /><Text strong style={{ fontSize: 20, color: token.colorPrimary }}>¥{totalAmount.toLocaleString()}.00</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{filtered.length} 条</Text>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#fff7e6', borderRadius: 8, padding: '12px 16px', border: '1px solid #ffd591' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#fa8c16' }}>待确认</Text>
            <br /><Text strong style={{ fontSize: 20, color: '#fa8c16' }}>{pendingCount} 条</Text>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#f6ffed', borderRadius: 8, padding: '12px 16px', border: '1px solid #b7eb8f' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>已收款</Text>
            <br /><Text strong style={{ fontSize: 20, color: '#52c41a' }}>{paidCount} 条</Text>
          </div>
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>共 {filtered.length} 条对账单</Text>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">暂无对账单数据</Text></div>
        ) : (
          <Table
            dataSource={filtered}
            rowKey="key"
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
            rowClassName={(r) => r.overdue ? 'ant-table-row-overdue' : ''}
            columns={[
              {
                title: '对账单号', dataIndex: 'billingNo', width: 180,
                render: (t: string, r: BillingItem) => (
                  <a onClick={() => setDetailOpen(r)} style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</a>
                ),
              },
              { title: '品牌方', dataIndex: 'brandName', width: 140, render: (t: string) => <Tag color="blue">{t}</Tag> },
              { title: '账期', dataIndex: 'period', width: 220 },
              {
                title: '总金额', dataIndex: 'totalAmount', width: 130,
                render: (v: number) => <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>¥{v.toLocaleString()}.00</Text>,
                sorter: (a: BillingItem, b: BillingItem) => a.totalAmount - b.totalAmount,
              },
              {
                title: '状态', dataIndex: 'status', width: 100,
                render: (s: string) => {
                  const m = statusMap[s] || { color: 'default', text: s };
                  return <Tag color={m.color}>{m.icon}{' '}{m.text}</Tag>;
                },
              },
              {
                title: '付款到期日', dataIndex: 'paymentDueDate', width: 110,
                render: (d: string, r: BillingItem) => (
                  <Text type={r.overdue ? 'danger' : 'secondary'}>{d}</Text>
                ),
              },
              {
                title: '发票', dataIndex: 'invoiceUploaded', width: 70,
                render: (v: boolean) => v
                  ? <FilePdfOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                  : <Text type="secondary">—</Text>,
              },
              {
                title: '操作', width: 220, render: (_: any, r: BillingItem) => (
                  <Space size="small">
                    <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setDetailOpen(r)}>明细</Button>
                    <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => message.info(`正在导出 ${r.billingNo} 明细 Excel（模拟）`)}>导出</Button>
                    {r.status === '待确认' && (
                      <Popconfirm
                        title="确认对账单？"
                        description={`确认后将对账单 ${r.billingNo}（¥${r.totalAmount.toLocaleString()}.00）进行确认，之后不可撤回。`}
                        onConfirm={() => handleConfirm(r)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button size="small" type="primary">确认</Button>
                      </Popconfirm>
                    )}
                    {!r.invoiceUploaded && (r.status === '待确认' || r.status === '已确认') && (
                      <Tooltip title="上传发票">
                        <Button size="small" type="link" icon={<UploadOutlined />}
                          onClick={() => handleUploadInvoice(r)}>发票</Button>
                      </Tooltip>
                    )}
                    {r.invoiceUploaded && (r.status === '已确认' || r.status === '已付款') && (
                      <Button size="small" type="link" icon={<FilePdfOutlined />}
                        onClick={() => message.info(`正在下载 ${r.billingNo} 发票（模拟）`)}>发票</Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* 明细弹窗 */}
      <Modal
        title={`对账单明细 — ${detailOpen?.billingNo || ''}`}
        open={!!detailOpen}
        onCancel={() => setDetailOpen(null)}
        width={1100}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => message.info('正在准备打印对账单（模拟浏览器打印）')}>打印</Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => message.success('明细已导出（模拟）')}>导出明细 Excel</Button>,
          detailOpen?.status === '待确认' && (
            <Popconfirm
              key="confirm"
              title="确认对账单？"
              description={`确认后将对账单 ${detailOpen.billingNo}（¥${detailOpen.totalAmount.toLocaleString()}.00）进行确认。`}
              onConfirm={() => { handleConfirm(detailOpen); setDetailOpen(null); }}
              okText="确认"
              cancelText="取消"
            >
              <Button type="primary">确认对账单</Button>
            </Popconfirm>
          ),
          detailOpen?.invoiceUploaded && (detailOpen.status === '已确认' || detailOpen.status === '已付款') && (
            <Button key="invoice" icon={<FilePdfOutlined />} onClick={() => message.info(`正在下载 ${detailOpen.billingNo} 发票（模拟）`)}>下载发票</Button>
          ),
          <Button key="close" onClick={() => setDetailOpen(null)}>关闭</Button>,
        ].filter(Boolean)}
      >
        {detailOpen && (() => {
          const items = (detailOpen.items || []) as BillingDetailItem[];
          const itemsSum = items.reduce((s, i) => s + (i.amount || 0), 0);
          const diff = detailOpen.totalAmount - itemsSum;
          return (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>品牌方</Text>
                    <br /><Tag color="blue">{detailOpen.brandName}</Tag>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>账期</Text>
                    <br /><Text strong>{detailOpen.period}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                    <br /><Tag color={statusMap[detailOpen.status]?.color}>{statusMap[detailOpen.status]?.text}</Tag>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>发票</Text>
                    <br />{detailOpen.invoiceUploaded
                      ? <Text type="success"><FilePdfOutlined /> 已上传</Text>
                      : <Text type="secondary">未上传</Text>}
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>总金额</Text>
                    <br /><Text strong style={{ fontSize: 16, color: token.colorPrimary }}>¥{detailOpen.totalAmount.toLocaleString()}.00</Text>
                  </div>
                  {detailOpen.paymentDueDate !== '—' && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>付款到期日</Text>
                      <br /><Text strong type={detailOpen.overdue ? 'danger' : undefined}>{detailOpen.paymentDueDate}</Text>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: token.colorTextSecondary }}>
                  <span>明细合计：<Text strong>¥{itemsSum.toLocaleString()}.00</Text></span>
                  <span>对账单总额：<Text strong>¥{detailOpen.totalAmount.toLocaleString()}.00</Text></span>
                  {diff !== 0 ? (
                    <Text type="danger" strong><ExclamationCircleOutlined /> 差异 ¥{Math.abs(diff).toLocaleString()}.00，请联系平台核实</Text>
                  ) : (
                    <Text type="success">✓ 金额一致</Text>
                  )}
                </div>
              </div>
              {detailOpen.overdue && (
                <Alert type="error" showIcon message="此对账单已超期未付，请联系平台方尽快安排付款。" style={{ marginBottom: 12 }} />
              )}
              <Table
                dataSource={items}
                rowKey={(r, i) => `${r.parentOrderNo}-${r.subOrderNo}-${r.sku}-${i}`}
                size="small"
                pagination={false}
                columns={detailColumns}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}><Text strong>合计</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong>{items.reduce((s, i) => s + i.quantity, 0).toLocaleString()}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>—</Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      <Text strong style={{ color: token.colorPrimary }}>¥{detailOpen.totalAmount.toLocaleString()}.00</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                )}
              />
            </>
          );
        })()}
      </Modal>

      {/* 文件预览弹窗 */}
      <Modal
        title={previewFile?.name || '文件预览'}
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        width={700}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => { message.success(`已下载 ${previewFile?.name}（模拟）`); }}>下载文件</Button>,
          <Button key="close" type="primary" onClick={() => setPreviewFile(null)}>关闭</Button>,
        ]}
      >
        {previewFile && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f5f5f5', borderRadius: 8, minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {previewFile.type === 'image' ? (
              <>
                <FileImageOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }} />
                <Text type="secondary">图片文件预览区域</Text>
                <div style={{ marginTop: 16, width: '100%', maxWidth: 480, height: 320, background: '#e8e8e8', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d9d9d9' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>📷 文件：{previewFile.name}</Text>
                </div>
              </>
            ) : (
              <>
                <FilePdfOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
                <Text type="secondary">PDF 文档预览区域</Text>
                <div style={{ marginTop: 16, width: '100%', maxWidth: 480, height: 360, background: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>📄 文件：{previewFile.name}</Text>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 超期行高亮样式 */}
      <style>{`
        .ant-table-row-overdue { background-color: #fff1f0 !important; }
        .ant-table-row-overdue:hover > td { background-color: #ffe7e5 !important; }
      `}</style>
    </div>
  );
}
