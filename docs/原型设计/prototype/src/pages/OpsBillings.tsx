import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, DatePicker, Space, Typography, Select, Segmented, Modal, Descriptions, Empty, theme } from 'antd';
import { DownloadOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { supplierBillings } from '../data/mock';
import type { BillingItem } from '../data/mock';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusMap: Record<string, { color: string; text: string }> = {
  '待确认': { color: 'orange', text: '待确认' },
  '已确认': { color: 'blue', text: '已确认' },
  '已付款': { color: 'green', text: '已付款' },
};

export default function OpsBillings() {
  const { token } = theme.useToken();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState<BillingItem | null>(null);
  const [dimension, setDimension] = useState<string>('factory');

  const filtered = useMemo(() => {
    let list = [...supplierBillings];
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
  }, [statusFilter, dateRange]);

  const totalAmount = filtered.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div>
      <Title level={4} style={{ margin: 0, marginBottom: 16 }}>供应商对账</Title>

      <Card style={{ borderRadius: 8 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Segmented
            value={dimension}
            onChange={setDimension}
            options={[
              { value: 'factory', label: '按工厂' },
              { value: 'brand', label: '按品牌' },
              { value: 'company', label: '按客户公司' },
            ]}
          />
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

        {/* Summary */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, background: token.colorFillQuaternary, borderRadius: 8, padding: '12px 16px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>对账单总额</Text>
            <br /><Text strong style={{ fontSize: 20, color: token.colorPrimary }}>¥{totalAmount.toLocaleString()}.00</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{filtered.length} 条</Text>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#fff7e6', borderRadius: 8, padding: '12px 16px', border: '1px solid #ffd591' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#fa8c16' }}>待确认</Text>
            <br /><Text strong style={{ fontSize: 20, color: '#fa8c16' }}>{filtered.filter(b => b.status === '待确认').length} 条</Text>
          </div>
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>共 {filtered.length} 条对账单</Text>

        {filtered.length === 0 ? (
          <Empty description="暂无对账单数据" />
        ) : (
          <Table
            dataSource={filtered}
            rowKey="key"
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            columns={[
              { title: '对账单号', dataIndex: 'billingNo', width: 180, render: (t: string, r: BillingItem) => (
                <a onClick={() => setDetailOpen(r)} style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</a>
              )},
              { title: '品牌方', dataIndex: 'brandName', width: 120, render: (t: string) => <Tag color="blue">{t}</Tag> },
              { title: '账期', dataIndex: 'period', width: 200 },
              { title: '总金额', dataIndex: 'totalAmount', width: 120, render: (v: number) => <Text strong>¥{v.toLocaleString()}.00</Text> },
              { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => {
                const m = statusMap[s] || { color: 'default', text: s };
                return <Tag color={m.color}>{m.text}</Tag>;
              }},
              { title: '操作', width: 180, render: (_: any, r: any) => (
                <Space>
                  <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setDetailOpen(r)}>明细</Button>
                  <Button size="small" type="link" icon={<DownloadOutlined />}>导出</Button>
                  {r.status === '待确认' && <Button size="small" type="primary">确认付款</Button>}
                </Space>
              )},
            ]}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`对账单明细 — ${detailOpen?.billingNo || ''}`}
        open={!!detailOpen}
        onCancel={() => setDetailOpen(null)}
        width={960}
        footer={[
          <Button key="export" icon={<DownloadOutlined />}>导出明细 Excel</Button>,
          detailOpen?.status === '待确认' && <Button key="confirm" type="primary">确认付款</Button>,
          <Button key="close" onClick={() => setDetailOpen(null)}>关闭</Button>,
        ].filter(Boolean)}
      >
        {detailOpen && (() => {
          const itemsSum = (detailOpen.items as any[] || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
          const diff = detailOpen.totalAmount - itemsSum;
          return (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>品牌方</Text>
                    <br /><Tag color="blue">{detailOpen.brandName}</Tag>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>账期</Text>
                    <br /><Text strong>{detailOpen.period}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>维度</Text>
                    <br /><Text>{dimension === 'factory' ? '按工厂' : dimension === 'brand' ? '按品牌' : '按客户公司'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>总金额</Text>
                    <br /><Text strong style={{ fontSize: 16, color: token.colorPrimary }}>¥{detailOpen.totalAmount.toLocaleString()}.00</Text>
                  </div>
                </div>
                {/* Cross-validation */}
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <Text type="secondary">明细合计：<Text strong>¥{itemsSum.toLocaleString()}.00</Text></Text>
                  <Text type="secondary">对账单总额：<Text strong>¥{detailOpen.totalAmount.toLocaleString()}.00</Text></Text>
                  {diff !== 0 ? (
                    <Text type="danger" strong><ExclamationCircleOutlined /> 差异 ¥{Math.abs(diff).toLocaleString()}.00，请联系核实</Text>
                  ) : (
                    <Text type="success">✓ 金额一致</Text>
                  )}
                </div>
              </div>
              <Table
                dataSource={detailOpen.items || []}
                rowKey="sku"
                size="small"
                pagination={false}
                columns={[
                  { title: 'SKU', dataIndex: 'sku', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
                  { title: '品名', dataIndex: 'productName', width: 140, ellipsis: true },
                  { title: '数量', dataIndex: 'quantity', width: 80, render: (v: number) => (v || 0).toLocaleString() },
                  { title: '单价', dataIndex: 'unitPrice', width: 70, render: (v: number) => `¥${(v || 0).toFixed(2)}` },
                  { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => <Text strong>¥{(v || 0).toLocaleString()}.00</Text> },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}><Text strong>合计</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong>{(detailOpen.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0).toLocaleString()}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>—</Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong style={{ color: token.colorPrimary }}>¥{detailOpen.totalAmount.toLocaleString()}.00</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
