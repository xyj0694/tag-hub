import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, DatePicker, Space, Typography, message, Select, Modal, Popconfirm, Popover, Alert, theme, Segmented } from 'antd';
import { DownloadOutlined, EyeOutlined, FilePdfOutlined, FileImageOutlined, PaperClipOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { brandBillings as mockBillings, purchaserAccounts } from '../data/mock';
import { useBrandContext } from '../data/BrandContext';
import type { BillingItem, BillingDetailItem } from '../data/mock';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusMap: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
  '待确认': { color: 'orange', text: '待确认', icon: <ClockCircleOutlined /> },
  '已确认': { color: 'blue', text: '已确认', icon: <CheckCircleOutlined /> },
  '已付款': { color: 'green', text: '已付款', icon: <CheckCircleOutlined /> },
  '超期未付': { color: 'red', text: '超期未付', icon: <ExclamationCircleOutlined /> },
};

export default function BrandBillings() {
  const { token } = theme.useToken();
  const { currentBrandId, currentBrandName } = useBrandContext();

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [settlementModeFilter, setSettlementModeFilter] = useState<string>('all');
  const [billings, setBillings] = useState<BillingItem[]>(mockBillings);
  const [detailOpen, setDetailOpen] = useState<BillingItem | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<'grouped' | 'tree'>('grouped');
  const [previewFile, setPreviewFile] = useState<{ signedDocNo: string; batchNo: string; shippedAt: string; signedAt: string; supTrackingNo: string; platformTrackingNo: string; } | null>(null);
  const [waybillPreview, setWaybillPreview] = useState<{ trackingNo: string; batchNo: string; shippedAt: string; } | null>(null);
  const [simulatedUser, setSimulatedUser] = useState<string>('admin');
  const currentPurchaser = simulatedUser === 'admin' ? null : purchaserAccounts.find(p => p.name === simulatedUser);
  const hasBillingAccess = simulatedUser === 'admin' || (currentPurchaser?.allowBilling ?? false);

  // 过滤
  const filteredBillings = useMemo(() => {
    let list = [...billings];

    // 品牌方筛选（来自全局顶栏切换器）
    if (currentBrandId !== 0) {
      list = list.filter(b => b.brandName === currentBrandName);
    }

    if (statusFilter !== 'all') {
      list = list.filter(b => b.status === statusFilter);
    }

    // 结算周期筛选
    if (settlementModeFilter !== 'all') {
      list = list.filter(b => (b.settlementMode || 'monthly') === settlementModeFilter);
    }

    // 日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const from = dateRange[0].format('YYYY-MM-DD');
      const to = dateRange[1].format('YYYY-MM-DD');
      list = list.filter(b => {
        const pEnd = b.period.split('~')[1]?.trim() || '';
        const pStart = b.period.split('~')[0]?.trim() || '';
        // 账期与筛选区间有交集即保留
        return pEnd >= from && pStart <= to;
      });
    }

    // 按账期结束时间倒序（越新越前）
    list.sort((a, b) => {
      const aEnd = a.period.split('~')[1]?.trim() || '';
      const bEnd = b.period.split('~')[1]?.trim() || '';
      return bEnd.localeCompare(aEnd);
    });

    return list;
  }, [billings, currentBrandId, currentBrandName, statusFilter, dateRange, settlementModeFilter]);

  // 统计
  const totalAmount = filteredBillings.reduce((s, b) => s + b.totalAmount, 0);
  const overdueAmount = filteredBillings.filter(b => b.overdue).reduce((s, b) => s + b.totalAmount, 0);
  const pendingCount = filteredBillings.filter(b => b.status === '待确认').length;
  const overdueCount = filteredBillings.filter(b => b.overdue).length;

  const handleExport = () => {
    if (filteredBillings.length === 0) {
      message.warning('无符合条件的对账单可导出');
      return;
    }
    message.success(`已导出 ${filteredBillings.length} 条对账单（模拟）
导出字段：对账单号、账期、维度、总金额、状态、到期日
格式：.xlsx 含表头样式和金额格式（¥#,##0.00）`);
  };

  const handleConfirm = (billing: BillingItem) => {
    setBillings(prev => prev.map(b => b.key === billing.key ? { ...b, status: '已确认' } : b));
    message.success(`对账单 ${billing.billingNo} 已确认`);
  };

  // ─── 对账明细：按采购订单+SKU 归并 ───
  const groupedDetailData = useMemo(() => {
    if (!detailOpen) return [];
    const items = detailOpen.items || [];
    const orderMap = new Map<string, Map<string, { sku: string; productName: string; unitPrice: number; quantity: number; amount: number; batches: any[] }>>();
    for (const item of items) {
      const po = item.parentOrderNo;
      const sku = item.sku;
      if (!orderMap.has(po)) orderMap.set(po, new Map());
      const skuMap = orderMap.get(po)!;
      if (!skuMap.has(sku)) {
        skuMap.set(sku, { sku, productName: item.productName, unitPrice: item.unitPrice, quantity: 0, amount: 0, batches: [] });
      }
      const agg = skuMap.get(sku)!;
      agg.quantity += item.quantity;
      agg.amount += item.amount;
      agg.batches.push(...(item.batches || []));
    }
    const rows: any[] = [];
    for (const [po, skuMap] of orderMap) {
      const count = skuMap.size;
      let first = true;
      for (const [, agg] of skuMap) {
        rows.push({ ...agg, parentOrderNo: po, _orderFirst: first, _orderRowCount: count, key: `${po}-${agg.sku}` });
        first = false;
      }
    }
    return rows;
  }, [detailOpen]);

  // ─── 对账明细：树形数据(方案B) ───
  const treeDetailData = useMemo(() => {
    if (!detailOpen) return [];
    const items = detailOpen.items || [];
    const orderMap = new Map<string, Map<string, any[]>>();
    for (const item of items) {
      const po = item.parentOrderNo;
      const sku = item.sku;
      if (!orderMap.has(po)) orderMap.set(po, new Map());
      const skuMap = orderMap.get(po)!;
      if (!skuMap.has(sku)) skuMap.set(sku, []);
      skuMap.get(sku)!.push(item);
    }
    const treeRows: any[] = [];
    for (const [po, skuMap] of orderMap) {
      const orderKey = `tree-${po}`;
      const children: any[] = [];
      let orderQty = 0, orderAmt = 0;
      for (const [sku, skuItems] of skuMap) {
        const skuKey = `${orderKey}-${sku}`;
        let skuQty = 0, skuAmt = 0, skuPrice = skuItems[0].unitPrice;
        const skuName = skuItems[0].productName;
        const batchChildren: any[] = [];
        let batchIdx = 0;
        for (const item of skuItems) {
          for (const b of (item.batches || [])) {
            batchIdx++;
            batchChildren.push({
              key: `${skuKey}-b${batchIdx}`,
              _type: 'batch',
              batchNo: b.batchNo,
              quantity: b.quantity,
              shippedAt: b.shippedAt,
              trackingNo: b.platformTrackingNo,
              supTrackingNo: b.supTrackingNo,
              signedAt: b.signedAt,
              signedDocNo: b.signedDocNo,
            });
          }
        }
        for (const item of skuItems) { skuQty += item.quantity; skuAmt += item.amount; }
        orderQty += skuQty; orderAmt += skuAmt;
        children.push({
          key: skuKey,
          _type: 'sku',
          parentOrderNo: po,
          sku, productName: skuName, unitPrice: skuPrice,
          quantity: skuQty, amount: skuAmt,
          children: batchChildren.length > 0 ? batchChildren : undefined,
        });
      }
      treeRows.push({
        key: orderKey,
        _type: 'order',
        parentOrderNo: po,
        quantity: orderQty, amount: orderAmt,
        children,
      });
    }
    return treeRows;
  }, [detailOpen]);

  // 发货批次迷你表格(方案A展开内容)
  const BatchTable = ({ batches, setPreviewFile }: { batches: any[]; setPreviewFile: (f: { signedDocNo: string; batchNo: string; shippedAt: string; signedAt: string; supTrackingNo: string; platformTrackingNo: string }) => void }) => (
    <Table
      dataSource={batches}
      rowKey={(r, i) => `b-${i}`}
      size="small"
      pagination={false}
      columns={[
        { title: '批次', dataIndex: 'batchNo', width: 130, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
        { title: '数量', dataIndex: 'quantity', width: 80, render: (v: number) => v.toLocaleString() },
        { title: '发货时间', dataIndex: 'shippedAt', width: 100 },
        { title: '快递单号', dataIndex: 'platformTrackingNo', width: 260, render: (t: string, r: any) => t ? (<Space size={4}><Text code style={{ fontSize: 11 }}>{t}</Text><Button size="small" type="link" style={{ fontSize: 10, padding: 0 }} onClick={() => setWaybillPreview({ trackingNo: t, batchNo: r.batchNo, shippedAt: r.shippedAt })}>查看</Button><Button size="small" type="link" style={{ fontSize: 10, padding: 0 }} onClick={() => message.success(`已下载面单 ${t}（模拟）`)}>下载</Button></Space>) : <Text type="secondary" style={{ fontSize: 11 }}>—</Text> },
        { title: '签收时间', dataIndex: 'signedAt', width: 100 },
        {
          title: '签收单', width: 100,
          render: (_: any, r: any) => r.signedDocNo ? (
            <Space size={4}>
              <Button size="small" type="link" style={{ fontSize: 11 }} onClick={() => setPreviewFile({ signedDocNo: r.signedDocNo, batchNo: r.batchNo, shippedAt: r.shippedAt, signedAt: r.signedAt, supTrackingNo: r.supTrackingNo || '', platformTrackingNo: r.platformTrackingNo || '' })}>查看</Button>
              <Button size="small" type="link" style={{ fontSize: 11 }} onClick={() => message.success(`已下载 ${r.signedDocNo}.pdf（模拟）`)}>下载</Button>
            </Space>
          ) : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
        },
      ]}
    />
  );

  // 公用列：SKU / 品名 / 数量 / 单价 / 金额
  const skuCols = [
    { title: 'SKU', dataIndex: 'sku', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
    { title: '品名', dataIndex: 'productName', width: 140, ellipsis: true },
    { title: '数量', dataIndex: 'quantity', width: 80, render: (v: number) => v.toLocaleString() },
    { title: '单价', dataIndex: 'unitPrice', width: 70, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => <Text strong>¥{v.toLocaleString()}.00</Text> },
  ];

  // 方案A 列
  const groupedColumns = [
    {
      title: '采购订单号', dataIndex: 'parentOrderNo', width: 160,
      render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text>,
    },
    ...skuCols,
    {
      title: '发货批次', width: 80,
      render: (_: any, r: any) => {
        if (!r.batches || r.batches.length === 0) return <Text type="secondary">—</Text>;
        const total = r.batches.reduce((s: number, b: any) => s + b.quantity, 0);
        return <a style={{ fontSize: 12 }}>{r.batches.length} 批 · {total.toLocaleString()} 张</a>;
      },
    },
  ];

  // 方案B 列
  const treeColumns = [
    {
      title: '采购订单号', dataIndex: 'parentOrderNo', width: 160,
      render: (t: string, r: any) => {
        if (r._type === 'order') return <Text code style={{ fontSize: 12, fontWeight: 600 }}>{t}</Text>;
        if (r._type === 'sku') return null;
        if (r._type === 'batch') return null;
        return <Text code style={{ fontSize: 11 }}>{t}</Text>;
      },
    },
    { title: 'SKU / 批次', dataIndex: 'sku', width: 150, render: (t: string, r: any) => {
      if (r._type === 'batch') return <Text type="secondary" style={{ fontSize: 11 }}>{r.batchNo}</Text>;
      return t ? <Text code style={{ fontSize: 11 }}>{t}</Text> : null;
    }},
    { title: '品名', dataIndex: 'productName', width: 140, ellipsis: true, render: (t: string, r: any) => r._type === 'batch' ? null : t },
    { title: '数量', dataIndex: 'quantity', width: 80, render: (v: number) => v.toLocaleString() },
    { title: '单价', dataIndex: 'unitPrice', width: 70, render: (v: any, r: any) => r._type === 'batch' ? null : (v ? `¥${Number(v).toFixed(2)}` : '—') },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: any, r: any) => r._type === 'order' ? <Text strong>¥{Number(v).toLocaleString()}.00</Text> : (v ? <Text strong>¥{Number(v).toLocaleString()}.00</Text> : null) },
    { title: '物流', width: 240, render: (_: any, r: any) => {
      if (r._type === 'batch') return (<div style={{ fontSize: 11, lineHeight: '17px' }}><div><Text type="secondary">发：{r.shippedAt}</Text></div><div><Space size={2}><Text code style={{ fontSize: 10 }}>{r.trackingNo || '—'}</Text><Button size="small" type="link" style={{ fontSize: 9, padding: 0 }} onClick={() => setWaybillPreview({ trackingNo: r.trackingNo, batchNo: r.batchNo, shippedAt: r.shippedAt })}>查看面单</Button><Button size="small" type="link" style={{ fontSize: 9, padding: 0 }} onClick={() => message.success(`已下载面单 ${r.trackingNo}（模拟）`)}>下载</Button></Space></div></div>);
      if (r._type === 'sku' && r.children && r.children.length > 0) { const totalShipped = r.children.reduce((s: number, c: any) => s + c.quantity, 0); return <Text type="secondary" style={{ fontSize: 11 }}>{r.children.length} 批 · {totalShipped.toLocaleString()} 张</Text>; }
      return null;
    }},
    { title: '签收', width: 140, render: (_: any, r: any) => {
      if (r._type === 'batch') return (<div style={{ fontSize: 11, lineHeight: '17px' }}><div><Text type="secondary">签：{r.signedAt || '—'}</Text></div>{r.signedDocNo ? (<Space size={2}><Button size="small" type="link" style={{ fontSize: 9, padding: 0 }} onClick={() => setPreviewFile({ signedDocNo: r.signedDocNo, batchNo: r.batchNo, shippedAt: r.shippedAt, signedAt: r.signedAt, supTrackingNo: r.supTrackingNo || '', platformTrackingNo: r.trackingNo || '' })}>查看签收单</Button><Button size="small" type="link" style={{ fontSize: 9, padding: 0 }} onClick={() => message.success(`已下载 ${r.signedDocNo}.pdf（模拟）`)}>下载</Button></Space>) : <Text type="secondary" style={{ fontSize: 10 }}>—</Text>}</div>);
      return null;
    }},
  ];

  // 方案A 汇总行
  const GroupedSummary = () => (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={5}><Text strong>合计</Text></Table.Summary.Cell>
      <Table.Summary.Cell index={5}>—</Table.Summary.Cell>
      <Table.Summary.Cell index={6}><Text strong style={{ color: token.colorPrimary }}>¥{detailOpen?.totalAmount.toLocaleString()}.00</Text></Table.Summary.Cell>
      <Table.Summary.Cell index={7} />
    </Table.Summary.Row>
  );


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>对账管理</Title>
        <Space size="middle">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>对账账号</Text>
            <Select
              size="small"
              style={{ width: 180 }}
              value={simulatedUser}
              onChange={setSimulatedUser}
              options={[
                { value: 'admin', label: '主账号（查看全部）' },
                ...purchaserAccounts.map(p => ({
                  value: p.name,
                  label: `${p.name}${p.allowBilling ? '' : '（无对账权限）'}`,
                })),
              ]}
            />
          </span>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 Excel</Button>
        </Space>
      </div>

      {!hasBillingAccess ? (
        <Card style={{ borderRadius: 8 }}>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <ExclamationCircleOutlined style={{ fontSize: 56, color: '#fa8c16', marginBottom: 16 }} />
            <br />
            <Title level={4} style={{ marginTop: 0 }}>无对账访问权限</Title>
            <Text type="secondary">
              您当前的模拟身份为「{simulatedUser}」，该采购账号未被授权访问对账页。<br />
              如需对账权限，请联系主账号管理员在「组织管理 → 采购账号」中开启。
            </Text>
          </div>
        </Card>
      ) : (<>
      <Card style={{ borderRadius: 8 }}>
        {/* 筛选栏 */}
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
          <Select
            placeholder="结算周期"
            style={{ width: 120 }}
            value={settlementModeFilter}
            onChange={setSettlementModeFilter}
            options={[
              { value: 'all', label: '全部周期' },
              { value: 'monthly', label: '月结' },
              { value: 'quarterly', label: '季结' },
              { value: 'custom', label: '自定义' },
            ]}
          />
          <RangePicker placeholder={['账期 从', '到']} value={dateRange} onChange={v => setDateRange(v as any)} />
          <Button onClick={() => { setStatusFilter('all'); setDateRange(null); setSettlementModeFilter('all'); }}>
            重置筛选
          </Button>
        </Space>

        {/* 汇总卡片 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, background: token.colorFillQuaternary, borderRadius: 8, padding: '12px 16px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>对账单总额</Text>
            <br />
            <Text strong style={{ fontSize: 20, color: token.colorPrimary }}>
              ¥{totalAmount.toLocaleString()}.00
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{filteredBillings.length} 条</Text>
          </div>
          {overdueAmount > 0 && (
            <div style={{ flex: 1, minWidth: 180, background: '#fff1f0', borderRadius: 8, padding: '12px 16px', border: '1px solid #ffccc7' }}>
              <Text type="secondary" style={{ fontSize: 12, color: '#cf1322' }}>超期未付 ⚠️</Text>
              <br />
              <Text strong style={{ fontSize: 20, color: '#cf1322' }}>
                ¥{overdueAmount.toLocaleString()}.00
              </Text>
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8, color: '#cf1322' }}>{overdueCount} 条</Text>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 180, background: token.colorFillQuaternary, borderRadius: 8, padding: '12px 16px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>待确认</Text>
            <br />
            <Text strong style={{ fontSize: 20, color: token.colorWarning }}>
              {pendingCount} 条
            </Text>
          </div>
        </div>

        {/* 超期拦截提示 */}
        {overdueCount > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            title={`您有 ${overdueCount} 条超期未付对账单，金额合计 ¥${overdueAmount.toLocaleString()}.00`}
            description="超期未付将影响新订单创建，请尽快完成付款或联系平台运营协商。"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 表格 */}
        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
          共 {filteredBillings.length} 条对账单
        </Text>
        <Table
          dataSource={filteredBillings}
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
            { title: '品牌方', dataIndex: 'brandName', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
            { title: '账期', dataIndex: 'period', width: 200 },
            {
              title: '结算周期', dataIndex: 'settlementMode', width: 90,
              render: (m: string | undefined) => {
                const map: Record<string, { color: string; text: string }> = { monthly: { color: 'blue', text: '月结' }, quarterly: { color: 'purple', text: '季结' }, custom: { color: 'orange', text: '自定义' } };
                const info = map[m || 'monthly'] || { color: 'default', text: m || '月结' };
                return <Tag color={info.color}>{info.text}</Tag>;
              },
            },
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
              render: (d: string, r: BillingItem) => {
                if (d === '—') return <Text type="secondary">—</Text>;
                return <Text type={r.overdue ? 'danger' : 'secondary'}>{d}</Text>;
              },
            },
              
            {
              title: '发票', dataIndex: 'invoiceUploaded', width: 70,
              render: (v: boolean) => v
                ? <FilePdfOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                : <Text type="secondary">—</Text>,
            },
            {
              title: '操作', key: 'actions', width: 200,
              render: (_: any, r: BillingItem) => (
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
                  {r.invoiceUploaded && (r.status === '已确认' || r.status === '已付款' || r.status === '超期未付') && (
                    <Button size="small" type="link" icon={<FilePdfOutlined />}
                      onClick={() => message.info(`正在下载 ${r.billingNo} 发票（模拟）`)}
                    >发票</Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* 明细弹窗 */}
      <Modal
        title={`对账单明细 — ${detailOpen?.billingNo || ''}`}
        open={!!detailOpen}
        onCancel={() => setDetailOpen(null)}
        width={1100}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => message.info('正在准备打印对账单（模拟浏览器打印）')}>
            打印
          </Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => { message.success('明细已导出（模拟）'); }}>
            导出明细 Excel
          </Button>,
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
          detailOpen?.invoiceUploaded && (detailOpen.status === '已确认' || detailOpen.status === '已付款' || detailOpen.status === '超期未付') && (
            <Button key="invoice" icon={<FilePdfOutlined />} onClick={() => message.info(`正在下载 ${detailOpen.billingNo} 发票（模拟）`)}>
              下载发票
            </Button>
          ),
          <Button key="close" onClick={() => setDetailOpen(null)}>关闭</Button>,
        ].filter(Boolean)}
      >
        {detailOpen && (
          <>
            {/* 核对汇总 — 品牌方可验证明细与总额是否一致 */}
            {(() => {
              const itemsSum = detailOpen.items.reduce((s, i) => s + i.amount, 0);
              const diff = detailOpen.totalAmount - itemsSum;
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>品牌方</Text>
                      <br />
                      <Tag color="blue">{detailOpen.brandName}</Tag>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>账期</Text>
                      <br />
                      <Text strong>{detailOpen.period}</Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>生成时间</Text>
                      <br />
                      <Text>{detailOpen.generatedAt || '—'}</Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>结算方式</Text>
                      <br />
                      <Tag color={{ monthly: 'blue', quarterly: 'purple', custom: 'orange' }[detailOpen.settlementMode || 'monthly'] || 'default'}>
                        {{ monthly: '月结', quarterly: '季结', custom: '自定义' }[detailOpen.settlementMode || 'monthly'] || detailOpen.settlementMode}
                      </Tag>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                      <br />
                      <Tag color={statusMap[detailOpen.status]?.color}>{statusMap[detailOpen.status]?.text}</Tag>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>发票</Text>
                      <br />
                      {detailOpen.invoiceUploaded
                        ? <Text type="success"><FilePdfOutlined /> 已上传</Text>
                        : <Text type="secondary">未上传</Text>}
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>总金额</Text>
                      <br />
                      <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                        ¥{detailOpen.totalAmount.toLocaleString()}.00
                      </Text>
                    </div>
                    {detailOpen.paymentDueDate !== '—' && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>付款到期日</Text>
                        <br />
                        <Text strong type={detailOpen.overdue ? 'danger' : undefined}>{detailOpen.paymentDueDate}</Text>
                      </div>
                    )}
                  </div>
                  {/* 金额交叉校验 */}
                  <div style={{ display: 'flex', gap: 24, fontSize: 12, color: token.colorTextSecondary }}>
                    <span>明细合计：<Text strong>¥{itemsSum.toLocaleString()}.00</Text></span>
                    <span>对账单总额：<Text strong>¥{detailOpen.totalAmount.toLocaleString()}.00</Text></span>
                    {diff !== 0 ? (
                      <Text type="danger" strong>⚠ 差异 ¥{Math.abs(diff).toLocaleString()}.00，请联系平台核实</Text>
                    ) : (
                      <Text type="success">✓ 金额一致</Text>
                    )}
                  </div>
                </div>
              );
            })()}
            {detailOpen.overdue && (
              <Alert type="error" showIcon title="此对账单已超期未付，请尽快处理以免影响新订单创建。" style={{ marginBottom: 12 }} />
            )}
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Segmented
                size="small"
                value={detailViewMode}
                onChange={(v) => setDetailViewMode(v as 'grouped' | 'tree')}
                options={[
                  { value: 'grouped', label: '按订单分组' },
                  { value: 'tree', label: '树形展开' },
                ]}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>共 {detailOpen.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} 张</Text>
            </div>
            {detailViewMode === 'grouped' ? (
              <Table
                dataSource={groupedDetailData}
                rowKey="key"
                size="small"
                pagination={false}
                columns={groupedColumns}
                expandable={{
                  expandedRowRender: (r: any) => <BatchTable batches={r.batches} setPreviewFile={setPreviewFile} />,
                  rowExpandable: (r: any) => r.batches && r.batches.length > 0,
                }}
                summary={() => <GroupedSummary />}
              />
            ) : (
              <Table
                dataSource={treeDetailData}
                rowKey="key"
                size="small"
                pagination={false}
                columns={treeColumns}
                defaultExpandAllRows
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}><Text strong>合计</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={5}><Text strong style={{ color: token.colorPrimary }}>¥{detailOpen?.totalAmount.toLocaleString()}.00</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} />
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                )}
              />
            )}
          </>
        )}
      </Modal>

      {/* 签收单预览弹窗 */}
      <Modal
        title={`签收单预览 — ${previewFile?.signedDocNo || ''}`}
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        width={720}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => { message.success(`已下载签收单 ${previewFile?.signedDocNo}（模拟）`); }}>
            下载签收单
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewFile(null)}>关闭</Button>,
        ]}
      >
        {previewFile && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: token.colorFillQuaternary }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 32px', fontSize: 13 }}>
                <div><Text type="secondary">签收单号</Text><br /><Text code>{previewFile.signedDocNo}</Text></div>
                <div><Text type="secondary">批次号</Text><br /><Text code>{previewFile.batchNo}</Text></div>
                <div><Text type="secondary">签收时间</Text><br /><Text>{previewFile.signedAt || '—'}</Text></div>
                <div><Text type="secondary">发货时间</Text><br /><Text>{previewFile.shippedAt || '—'}</Text></div>
                <div><Text type="secondary">快递单号</Text><br /><Text code style={{ fontSize: 12 }}>{previewFile.platformTrackingNo || '—'}</Text></div>
              </div>
            </Card>
            {/* 回执单样式预览 */}
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '32px 40px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1677ff', paddingBottom: 16, marginBottom: 24 }}>
                <Text strong style={{ fontSize: 18, color: '#1677ff' }}>货品签收回执单</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>编号：{previewFile.signedDocNo}</Text>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 40px', fontSize: 13, lineHeight: '24px' }}>
                <div><Text type="secondary">发货批次：</Text><Text strong>{previewFile.batchNo}</Text></div>
                <div><Text type="secondary">发货时间：</Text><Text>{previewFile.shippedAt}</Text></div>
                <div><Text type="secondary">签收时间：</Text><Text strong style={{ color: '#52c41a' }}>{previewFile.signedAt || '—'}</Text></div>
                <div style={{ gridColumn: '1 / -1' }}><Text type="secondary">快递单号：</Text><Text code style={{ fontSize: 11 }}>{previewFile.platformTrackingNo || '—'}</Text></div>
              </div>
              <div style={{ borderTop: '1px dashed #d9d9d9', margin: '20px 0' }} />
              <div style={{ display: 'flex', gap: 48, fontSize: 13 }}>
                <div style={{ textAlign: 'center' }}><Text type="secondary">发货方签章</Text><div style={{ marginTop: 8, width: 120, height: 44, border: '1px solid #d9d9d9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}><Text type="secondary" style={{ fontSize: 11 }}>供应商签章区</Text></div></div>
                <div style={{ textAlign: 'center' }}><Text type="secondary">收货方签章</Text><div style={{ marginTop: 8, width: 120, height: 44, border: '1px solid #d9d9d9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}><Text type="secondary" style={{ fontSize: 11 }}>品牌方签章区</Text></div></div>
                <div style={{ textAlign: 'center' }}><Text type="secondary">平台方签章</Text><div style={{ marginTop: 8, width: 120, height: 44, border: '1px solid #d9d9d9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}><Text type="secondary" style={{ fontSize: 11 }}>平台签章区</Text></div></div>
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>本回执单为电子凭证，与纸质签收单具有同等效力</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* 快递面单预览弹窗 */}
      <Modal
        title={`快递面单 — ${waybillPreview?.trackingNo || ''}`}
        open={!!waybillPreview}
        onCancel={() => setWaybillPreview(null)}
        width={600}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => { message.success(`已下载面单 ${waybillPreview?.trackingNo}（模拟）`); }}>
            下载面单
          </Button>,
          <Button key="close" type="primary" onClick={() => setWaybillPreview(null)}>关闭</Button>,
        ]}
      >
        {waybillPreview && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: token.colorFillQuaternary }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px', fontSize: 13 }}>
                <div><Text type="secondary">快递单号</Text><br /><Text code style={{ fontSize: 14 }}>{waybillPreview.trackingNo}</Text></div>
                <div><Text type="secondary">批次号</Text><br /><Text code>{waybillPreview.batchNo}</Text></div>
                <div style={{ gridColumn: '1 / -1' }}><Text type="secondary">发货时间</Text><br /><Text>{waybillPreview.shippedAt}</Text></div>
              </div>
            </Card>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '24px 32px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #fa8c16', paddingBottom: 12, marginBottom: 20 }}>
                <Text strong style={{ fontSize: 16, color: '#fa8c16' }}>快递面单</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>单号：{waybillPreview.trackingNo}</Text>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 24px', fontSize: 13, marginBottom: 20 }}>
                <Text type="secondary">寄件方：</Text><Text>供应商（通过平台转发）</Text>
                <Text type="secondary">收件方：</Text><Text>品牌方收货地址</Text>
                <Text type="secondary">发货批次：</Text><Text strong>{waybillPreview.batchNo}</Text>
                <Text type="secondary">发货时间：</Text><Text>{waybillPreview.shippedAt}</Text>
              </div>
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: 4, padding: 16, background: '#fafafa', textAlign: 'center' }}>
                <Text strong style={{ fontSize: 18, fontFamily: 'monospace', letterSpacing: 2 }}>{waybillPreview.trackingNo}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'inline-block' }}>扫码或登录快递官网输入单号即可追踪物流</Text>
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>此面单为电子凭证，请妥善保管</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>


      </>
      )}

      {/* 超期行高亮样式 */}
      <style>{`
        .ant-table-row-overdue { background-color: #fff1f0 !important; }
        .ant-table-row-overdue:hover > td { background-color: #ffe7e5 !important; }
      `}</style>
    </div>
  );
}
