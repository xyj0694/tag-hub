import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Space, Modal, Select, Typography, message, Alert, Timeline, theme, Popover, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, CloseCircleOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { orders as mockOrders, templates as mockTemplates } from '../data/mock';
import TemplateThumbnail from '../components/TemplatePreviews';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  '待审核': { color: 'gold', text: '待审核' },
  '已审核': { color: 'blue', text: '已审核' },
  '已拆分': { color: 'geekblue', text: '已拆分' },
  '待接单': { color: 'orange', text: '待接单' },
  '已接单': { color: 'cyan', text: '已接单' },
  '生产中': { color: 'processing', text: '生产中' },
  '生产完成': { color: 'green', text: '生产完成' },
  '部分发货': { color: 'lime', text: '部分发货' },
  '已发货': { color: 'purple', text: '已发货' },
  '已签收': { color: 'success', text: '已签收' },
  '已取消': { color: 'default', text: '已取消' },
  '已驳回': { color: 'error', text: '已驳回' },
};

// 品牌方可见的进度节点（隐藏平台方内部操作：已拆分/待接单/已接单）
const brandTimelineSteps = [
  { title: '提交审核', statuses: ['待审核'] },
  { title: '审核通过', statuses: ['已审核'] },
  { title: '生产制作', statuses: ['生产中'] },
  { title: '生产完成', statuses: ['生产完成'] },
  { title: '发货运送', statuses: ['部分发货', '已发货'] },
  { title: '签收确认', statuses: ['已签收'] },
];

// 将系统状态映射到品牌方可见的步骤索引
const brandStepIndex: Record<string, number> = {};
brandTimelineSteps.forEach((step, i) => {
  step.statuses.forEach(s => { brandStepIndex[s] = i; });
});
// 已拆分/待接单/已接单 对品牌方来说都视为「审核通过」之后、「生产制作」之前
['已拆分', '待接单', '已接单'].forEach(s => { brandStepIndex[s] = brandStepIndex['已审核']; });

export default function BrandOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const order = mockOrders.find(o => o.id === id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [waybillOpen, setWaybillOpen] = useState(false);
  const [waybillData, setWaybillData] = useState<any>(null);
  const [signedDocOpen, setSignedDocOpen] = useState(false);
  const [signedDocData, setSignedDocData] = useState<any>(null);

  if (!order) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Text type="secondary" style={{ fontSize: 16 }}>订单不存在</Text>
      <br />
      <Button type="link" onClick={() => navigate('/brand/orders')}>返回订单列表</Button>
    </div>
  );

  const isCancelled = order.status === '已取消' || order.status === '已驳回';
  // 品牌方仅待审核可取消，确认接单后不允许（走线下沟通）
  const canCancel = order.status === '待审核';

  // 品牌方不可见的内部状态（平台拆单/供应商接单等操作不暴露给品牌方）
  const hiddenStatuses = ['已拆分', '待接单', '已接单'];
  const visibleLog = (order.statusLog || []).filter(l => !hiddenStatuses.includes(l.status));

  // 按 SKU 聚合子订单，隐藏平台拆单结构
  const statusOrder = ['待接单', '已接单', '生产中', '生产完成', '部分发货', '已发货', '已签收'];
  const mergedSkuRows = useMemo(() => {
    const map = new Map<string, { quantity: number; shipped: number; statuses: string[]; shipments: any[] }>();
    for (const so of order.subOrders) {
      const existing = map.get(so.sku);
      if (existing) {
        existing.quantity += so.quantity;
        existing.shipped += so.shippedQuantity || 0;
        existing.statuses.push(so.status);
        if (so.shipments) existing.shipments.push(...so.shipments);
      } else {
        map.set(so.sku, { quantity: so.quantity, shipped: so.shippedQuantity || 0, statuses: [so.status], shipments: so.shipments ? [...so.shipments] : [] });
      }
    }
    return Array.from(map.entries()).map(([sku, v]) => {
      // 取最滞后的状态（索引最小的）
      const worstIdx = Math.min(...v.statuses.map(s => statusOrder.indexOf(s)));
      return { key: sku, sku, quantity: v.quantity, shipped: v.shipped, worstStatus: statusOrder[worstIdx], shipments: v.shipments };
    });
  }, [order.subOrders]);
  const getStageTime = (statuses: string[]): string | undefined => {
    const log = order.statusLog.find(l => statuses.includes(l.status));
    return log?.time;
  };

  return (
    <div>
      {/* 面包屑 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/brand/orders')} style={{ padding: '4px 8px', color: '#666' }}>订单列表</Button>
        <Text type="secondary">/</Text>
        <Text strong>{order.orderNo}</Text>
      </div>

      {/* 头部信息 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{order.orderNo}</Title>
            <Space style={{ marginTop: 10 }} size="small">
              <Tag color={statusMap[order.status]?.color} style={{ fontSize: 13, padding: '2px 10px' }}>
                {statusMap[order.status]?.text || order.status}
              </Tag>
              <Tag>{order.type}</Tag>
              <Tag>{order.tagType}</Tag>
              {order.templateName && <Tag color="blue">{order.templateName}</Tag>}
            </Space>
          </div>
          <Space>
            {canCancel && <Button danger onClick={() => setCancelOpen(true)}>取消订单</Button>}
          </Space>
        </div>

        {isCancelled && (
          <Alert
            type={order.status === '已驳回' ? 'warning' : 'info'}
            showIcon
            title={order.status === '已驳回' ? '订单已被驳回' : '订单已取消'}
            description={order.cancelReason || '无'}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* 订单进度 — 品牌方视角：逐阶段累计可视化 */}
      <Card title="订单进度" style={{ marginBottom: 16, borderRadius: 8 }}>
        {isCancelled ? (
          <Timeline items={visibleLog.map(l => {
            const isBad = l.status === '已驳回' || l.status === '已取消';
            return {
              color: isBad ? 'red' : 'gray',
              dot: isBad ? <CloseCircleOutlined /> : <ClockCircleOutlined />,
              content: (
                <div>
                  <Text style={{ fontSize: 13 }}>{l.status} — {l.operator}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{l.time}</Text>
                </div>
              ),
            };
          })} />
        ) : (
          <>
            {/* 阶段1: 提交审核 — 一次性节点 */}
            <div style={{ display: 'flex', marginBottom: 0 }}>
              <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
              </div>
              <div style={{ flex: 1, marginLeft: 8, paddingBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>提交审核</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>
                  {order.createdAt}
                </Text>
              </div>
            </div>

            {/* 阶段2: 审核通过 — 一次性节点 */}
            <div style={{ display: 'flex', marginBottom: 0 }}>
              <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                {order.status === '待审核' || order.status === '已驳回' ? (
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: token.colorBorder, margin: '5px auto' }} />
                ) : (
                  <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
                )}
              </div>
              <div style={{ flex: 1, marginLeft: 8, paddingBottom: 12 }}>
                <Text strong style={{ fontSize: 14, color: order.status === '待审核' ? token.colorTextSecondary : token.colorText }}>
                  审核通过
                </Text>
                {getStageTime(['已审核', '已拆分']) && (
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>{getStageTime(['已审核', '已拆分'])}</Text>
                )}
              </div>
            </div>

            {/* 阶段3: 生产制作 — 持续过程，展示各子订单生产进度 */}
            {order.subOrders.length > 0 && (() => {
              const producedTotal = order.subOrders
                .filter(so => ['生产完成', '部分发货', '已发货', '已签收'].includes(so.status))
                .reduce((s, so) => s + so.quantity, 0);
              const inProduction = brandStepIndex[order.status] >= brandStepIndex['生产中'] ||
                order.subOrders.some(so => !['待接单', '已接单'].includes(so.status));
              const isCurrent = brandStepIndex[order.status] === brandStepIndex['生产中'];
              if (!inProduction) return null;
              return (
                <div style={{ display: 'flex', marginBottom: 0 }}>
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    {producedTotal >= order.totalQuantity ? (
                      <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
                    ) : isCurrent ? (
                      <SyncOutlined spin style={{ color: token.colorPrimary, fontSize: 18 }} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: token.colorBorder, margin: '5px auto' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, marginLeft: 8, paddingBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Text strong style={{ fontSize: 14 }}>生产制作</Text>
                      {getStageTime(['生产中']) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>{getStageTime(['生产中'])}</Text>
                      )}
                      <Text style={{ fontSize: 13, color: token.colorPrimary }}>
                        {producedTotal.toLocaleString()}/{order.totalQuantity.toLocaleString()} 张
                      </Text>
                      <div style={{ flex: 1, maxWidth: 200, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(producedTotal / order.totalQuantity * 100).toFixed(0)}%`, height: '100%', background: token.colorPrimary, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{(producedTotal / order.totalQuantity * 100).toFixed(0)}%</Text>
                    </div>
                    {/* 生产明细 — 每个SKU独立进度条 */}
                    <div style={{ marginTop: 8, background: token.colorFillQuaternary, borderRadius: 6, padding: '10px 14px' }}>
                      {mergedSkuRows.map((row: any) => {
                        const isPending = ['待接单', '已接单'].includes(row.worstStatus);
                        if (isPending) return null;
                        const done = ['生产完成', '部分发货', '已发货', '已签收'].includes(row.worstStatus);
                        const producing = !done && !isPending;
                        const producedQty = done ? row.quantity : (row.shipped || 0);
                        const pct = Math.round(producedQty / row.quantity * 100);
                        return (
                          <div key={row.sku} style={{ padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <Text code style={{ fontSize: 11, flexShrink: 0 }}>{row.sku}</Text>
                              <div style={{ flex: 1, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  width: `${pct}%`, height: '100%',
                                  background: done ? token.colorSuccess : token.colorPrimary,
                                  borderRadius: 3, transition: 'width 0.3s'
                                }} />
                              </div>
                              <Text style={{ fontSize: 11, flexShrink: 0, minWidth: 36, textAlign: 'right', fontWeight: 500, color: done ? token.colorSuccess : token.colorPrimary }}>
                                {pct}%
                              </Text>
                              <Text style={{ fontSize: 11, flexShrink: 0, minWidth: 100, textAlign: 'right' }}>
                                {producedQty.toLocaleString()}/{row.quantity.toLocaleString()} 张
                              </Text>
                              {done ? (
                                <Tag color="success" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>已完成</Tag>
                              ) : (
                                <Tag color="processing" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>生产中</Tag>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 阶段4: 发货运送 — 持续过程，按已发货数量累计 */}
            {order.subOrders.length > 0 && (() => {
              const shippedTotal = order.subOrders.reduce((s, so) => s + (so.shippedQuantity || 0), 0);
              const hasShipment = order.subOrders.some(so => so.shippedQuantity > 0);
              const isCurrent = brandStepIndex[order.status] >= brandStepIndex['部分发货'];
              if (!hasShipment && !isCurrent) return null;
              const allShipped = shippedTotal >= order.totalQuantity;
              // 构建运单号 → SKU 列表映射，用于检测同单发货
              const trackingSkuMap = new Map<string, string[]>();
              for (const so of order.subOrders) {
                if (so.shipments) {
                  for (const sh of so.shipments) {
                    const tn = sh.platformTrackingNo || sh.trackingNo;
                    if (!trackingSkuMap.has(tn)) trackingSkuMap.set(tn, []);
                    if (!trackingSkuMap.get(tn)!.includes(so.sku)) trackingSkuMap.get(tn)!.push(so.sku);
                  }
                }
              }
              return (
                <div style={{ display: 'flex', marginBottom: 0 }}>
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    {allShipped ? (
                      <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
                    ) : hasShipment ? (
                      <SyncOutlined spin style={{ color: token.colorPrimary, fontSize: 18 }} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: token.colorBorder, margin: '5px auto' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, marginLeft: 8, paddingBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Text strong style={{ fontSize: 14 }}>发货运送</Text>
                      {getStageTime(['部分发货', '已发货']) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>{getStageTime(['部分发货', '已发货'])}</Text>
                      )}
                      <Text style={{ fontSize: 13, color: token.colorPrimary }}>
                        {shippedTotal.toLocaleString()}/{order.totalQuantity.toLocaleString()} 张
                      </Text>
                      <div style={{ flex: 1, maxWidth: 200, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(shippedTotal / order.totalQuantity * 100).toFixed(0)}%`, height: '100%', background: token.colorSuccess, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{(shippedTotal / order.totalQuantity * 100).toFixed(0)}%</Text>
                    </div>
                    {/* 发货批次明细 — 按SKU展示，标注同单发货 */}
                    {hasShipment && (
                      <div style={{ marginTop: 8, background: token.colorFillQuaternary, borderRadius: 6, padding: '10px 14px' }}>
                        {mergedSkuRows.filter((r: any) => r.shipped > 0).map((row: any) => {
                          const hasLogistics = row.shipments && row.shipments.length > 0;
                          const remaining = row.quantity - row.shipped;
                          const batchCount = hasLogistics ? row.shipments.length : 0;
                          return (
                            <div key={row.sku} style={{ padding: '6px 0', borderBottom: '1px solid #e8e8e8', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Text code style={{ fontSize: 11 }}>{row.sku}</Text>
                                <div style={{ flex: 1 }} />
                                <Text>已发 {row.shipped.toLocaleString()} 张</Text>
                                {remaining > 0 && (
                                  <Text type="secondary" style={{ fontSize: 10 }}>（剩余 {remaining.toLocaleString()} 张）</Text>
                                )}
                                <Tag color={row.worstStatus === '已签收' ? 'success' : row.shipped >= row.quantity ? 'blue' : 'processing'} style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                                  {row.worstStatus === '已签收' ? '已签收' : row.shipped >= row.quantity ? '已发齐' : '部分发货'}
                                </Tag>
                              </div>
                              {hasLogistics && row.shipments.map((sh: any, si: number) => {
                                const tn = sh.platformTrackingNo || sh.trackingNo;
                                const sharedSkus = (trackingSkuMap.get(tn) || []).filter(s => s !== row.sku);
                                return (
                                <div key={sh.id || si} style={{ marginTop: 4, marginLeft: 4, paddingLeft: 8, borderLeft: '2px solid #d9d9d9', fontSize: 11 }}>
                                  <Space size={8}>
                                    {batchCount > 1 && <Tag style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>第{si + 1}批</Tag>}
                                    <Text>{sh.courier}</Text>
                                    <Text code style={{ fontSize: 10 }}>{tn}</Text>
                                    <Text>{sh.quantity.toLocaleString()}张</Text>
                                    <Button type="link" size="small" style={{ fontSize: 10, padding: 0, height: 'auto' }}
                                      onClick={() => { setWaybillData(sh); setWaybillOpen(true); }}>
                                      查看面单
                                    </Button>
                                    <Text type="secondary" style={{ fontSize: 10 }}>{sh.shippedAt}</Text>
                                    {sh.signed && <Tag color="success" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>已签收</Tag>}
                                    {sh.signedAt && <Text type="secondary" style={{ fontSize: 10 }}>签收: {sh.signedAt}</Text>}
                                  </Space>
                                  {sharedSkus.length > 0 && (
                                    <div style={{ marginTop: 2, fontSize: 10, color: token.colorTextSecondary }}>
                                      📦 同单含：{sharedSkus.map((s: string) => <Text key={s} code style={{ fontSize: 9, marginRight: 4 }}>{s}</Text>)}
                                    </div>
                                  )}
                                </div>
                              );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 阶段5: 签收确认 — 按SKU展示签收详情，含回签单/手工确认两种模式 */}
            {order.subOrders.length > 0 && (() => {
              const signedTotal = order.subOrders
                .filter(so => so.status === '已签收')
                .reduce((s, so) => s + so.shippedQuantity, 0);
              const hasSigned = signedTotal > 0;
              const isCurrent = brandStepIndex[order.status] >= brandStepIndex['已签收'];
              if (!hasSigned && !isCurrent) return null;
              const allSigned = signedTotal >= order.totalQuantity;
              // 构建运单号 → SKU 映射
              const trackingSkuMap = new Map<string, string[]>();
              for (const so of order.subOrders) {
                if (so.shipments) {
                  for (const sh of so.shipments) {
                    const tn = sh.platformTrackingNo || sh.trackingNo;
                    if (!trackingSkuMap.has(tn)) trackingSkuMap.set(tn, []);
                    if (!trackingSkuMap.get(tn)!.includes(so.sku)) trackingSkuMap.get(tn)!.push(so.sku);
                  }
                }
              }
              return (
                <div style={{ display: 'flex', marginBottom: 0 }}>
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    {allSigned ? (
                      <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
                    ) : hasSigned ? (
                      <SyncOutlined spin style={{ color: token.colorPrimary, fontSize: 18 }} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: token.colorBorder, margin: '5px auto' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, marginLeft: 8, paddingBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Text strong style={{ fontSize: 14 }}>签收确认</Text>
                      {getStageTime(['已签收']) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>{getStageTime(['已签收'])}</Text>
                      )}
                      <Text style={{ fontSize: 13, color: allSigned ? token.colorSuccess : token.colorPrimary }}>
                        {signedTotal.toLocaleString()}/{order.totalQuantity.toLocaleString()} 张
                      </Text>
                      <div style={{ flex: 1, maxWidth: 200, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(signedTotal / order.totalQuantity * 100).toFixed(0)}%`, height: '100%', background: allSigned ? token.colorSuccess : token.colorWarning, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{(signedTotal / order.totalQuantity * 100).toFixed(0)}%</Text>
                      {allSigned && <Tag color="success" style={{ margin: 0 }}>已完成</Tag>}
                    </div>
                    {/* 签收明细 — 按SKU逐批展示 */}
                    {hasSigned && (
                      <div style={{ marginTop: 8, background: token.colorFillQuaternary, borderRadius: 6, padding: '10px 14px' }}>
                        {mergedSkuRows.filter((r: any) => r.worstStatus === '已签收').map((row: any) => {
                          const signedShipments = (row.shipments || []).filter((sh: any) => sh.signed);
                          return (
                            <div key={row.sku} style={{ padding: '6px 0', borderBottom: '1px solid #e8e8e8' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Text code style={{ fontSize: 11 }}>{row.sku}</Text>
                                <Tag color="success" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>已签收</Tag>
                                <div style={{ flex: 1 }} />
                                <Text style={{ fontSize: 12 }}>{row.shipped.toLocaleString()} 张</Text>
                              </div>
                              {/* 逐批发货签收明细 */}
                              {signedShipments.length > 0 && signedShipments.map((sh: any, si: number) => {
                                const tn = sh.platformTrackingNo || sh.trackingNo;
                                const sharedSkus = (trackingSkuMap.get(tn) || []).filter((s: string) => s !== row.sku);
                                const hasReceipt = !!(sh.signedDocNo);
                                const isManual = !!(sh.signedManually);
                                return (
                                  <div key={sh.id || si} style={{ marginTop: 4, marginLeft: 4, paddingLeft: 8, borderLeft: '2px solid #b7eb8f', fontSize: 11 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      {signedShipments.length > 1 && <Tag color="green" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>第{si + 1}批</Tag>}
                                      <Text style={{ fontSize: 10 }}>{sh.courier}</Text>
                                      <Text code style={{ fontSize: 10 }}>{tn}</Text>
                                      <Text style={{ fontSize: 10 }}>{sh.quantity.toLocaleString()}张</Text>
                                      {sh.signedAt && <Text type="secondary" style={{ fontSize: 10 }}>签收: {sh.signedAt}</Text>}
                                      {/* 回签单：有回传则可查看/下载 */}
                                      {hasReceipt && (
                                        <>
                                          <Tag color="blue" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>{sh.signedDocType === 'pdf' ? 'PDF' : '图片'}</Tag>
                                          <Button type="link" size="small" style={{ fontSize: 10, padding: 0, height: 'auto' }}
                                            onClick={() => { setSignedDocData(sh); setSignedDocOpen(true); }}>
                                            查看回签单
                                          </Button>
                                          <Button type="link" size="small" style={{ fontSize: 10, padding: 0, height: 'auto' }}
                                            onClick={() => message.success(`回签单 ${sh.signedDocNo} 已开始下载（演示）`)}>
                                            下载
                                          </Button>
                                        </>
                                      )}
                                      {/* 无回签单：平台手工确认 */}
                                      {isManual && !hasReceipt && (
                                        <Tag color="orange" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>线下已完成签收确认</Tag>
                                      )}
                                    </div>
                                    {sharedSkus.length > 0 && (
                                      <div style={{ marginTop: 2, fontSize: 10, color: token.colorTextSecondary }}>
                                        📦 同单含：{sharedSkus.map((s: string) => <Text key={s} code style={{ fontSize: 9, marginRight: 4 }}>{s}</Text>)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            </>)}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Descriptions column={3} size="small" title="基本信息">
          <Descriptions.Item label="品牌方">{order.brandName}</Descriptions.Item>
          <Descriptions.Item label="订单类型">{order.type}</Descriptions.Item>
          <Descriptions.Item label="标签类型">{order.tagType}</Descriptions.Item>
          <Descriptions.Item label="总数量">
            <Text strong style={{ fontSize: 15 }}>{order.totalQuantity.toLocaleString()}</Text> 张
          </Descriptions.Item>
          <Descriptions.Item label="模板">{order.templateName || '—'}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={3}>{order.shippingAddress}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order.contact}</Descriptions.Item>
          <Descriptions.Item label="电话">{order.phone}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{order.createdAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* SKU 明细 — 所有状态下均显示 */}
      <Card title="SKU 明细" style={{ marginBottom: 16, borderRadius: 8 }}>
        {order.subOrders.length > 0 ? (
                    <Table
            dataSource={mergedSkuRows}
            rowKey="sku"
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            columns={[
              { title: 'SKU', dataIndex: 'sku', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              {
                title: '模板', dataIndex: 'sku', width: 160,
                render: () => {
                  const t = order.templateName ? mockTemplates.find(tmpl => order.templateName!.includes(tmpl.name)) : null;
                  if (!t) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
                  return (
                    <Popover trigger="click" placement="right" title={t.name}
                      content={
                        <div style={{ maxWidth: 480 }}>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ flex: '0 0 auto', width: 180 }}>
                              <TemplateThumbnail type={t.type} fields={t.fields} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Descriptions size="small" column={1}>
                                <Descriptions.Item label="版本">v{t.version}</Descriptions.Item>
                                <Descriptions.Item label="类型">{t.type}</Descriptions.Item>
                                <Descriptions.Item label="创建日期">{t.createdAt}</Descriptions.Item>
                              </Descriptions>
                              <Divider style={{ margin: '8px 0' }} />
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>模板字段：</Text>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {t.fields.map((f: any) => (
                                  <Tag key={f.name} color={f.required ? 'red' : 'default'} style={{ margin: 0, fontSize: 10 }}>
                                    {f.required ? '* ' : ''}{f.label}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      }>
                      <Tag color="blue" style={{ cursor: 'pointer', fontSize: 11 }}>
                        <EyeOutlined style={{ marginRight: 4 }} />{t.name}
                      </Tag>
                    </Popover>
                  );
                },
              },
              {
                title: '数据来源', dataIndex: 'sku', width: 100,
                render: () => order.dataSource === 'customer'
                  ? <Tag color="orange" style={{ fontSize: 11 }}>客户自导</Tag>
                  : <Tag color="green" style={{ fontSize: 11 }}>平台生成</Tag>,
              },
              { title: '数量', dataIndex: 'quantity', width: 100, render: (v: number) => v.toLocaleString() },
              {
                title: '状态', dataIndex: 'worstStatus', width: 110,
                render: (s: string) => {
                  const brandVisible: Record<string, string> = {
                    '待接单': '待生产', '已接单': '待生产',
                    '生产中': '生产中', '生产完成': '生产完成',
                    '部分发货': '部分发货', '已发货': '已发货', '已签收': '已签收',
                  };
                  const label = brandVisible[s] || s;
                  const color = ({ '待生产': 'default', '生产中': 'processing', '生产完成': 'green', '部分发货': 'lime', '已发货': 'purple', '已签收': 'success' } as any)[label] || 'default';
                  return <Tag color={color}>{label}</Tag>;
                },
              },
              {
                title: '已发货', dataIndex: 'shipped', width: 240,
                render: (v: number, record: any) => {
                  if (!v) return <Text type="secondary">—</Text>;
                  const shs = record.shipments as any[] | undefined;
                  const qty = record.quantity as number;
                  const remaining = qty - v;
                  return (
                    <div>
                      <Text style={{ color: token.colorPrimary }}>{v.toLocaleString()} 张</Text>
                      {remaining > 0 && <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>（余 {remaining.toLocaleString()}）</Text>}
                      {shs && shs.length > 0 && shs.map((sh: any, i: number) => (
                        <div key={i} style={{ fontSize: 10, color: token.colorTextSecondary, lineHeight: 1.6, marginTop: 1 }}>
                          {shs.length > 1 && <Tag style={{ fontSize: 9, lineHeight: '12px', marginRight: 2 }}>#{i + 1}</Tag>}
                          {sh.courier} {sh.platformTrackingNo || sh.trackingNo}
                          <Button type="link" size="small" style={{ fontSize: 9, padding: 0, height: 'auto' }}
                            onClick={() => { setWaybillData(sh); setWaybillOpen(true); }}>
                            查看面单
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                },
              },
            ]}
          />
        ):(
          <Table
            dataSource={[{ key: 1, sku: order.sku || order.orderNo, name: order.productName || '—', qty: order.totalQuantity }]}
            pagination={false}
            size="middle"
            columns={[
              { title: 'SKU', dataIndex: 'sku', width: 180, render: (t: string) => <Text code style={{ fontSize: 12 }}>{t}</Text> },
              { title: '品名', dataIndex: 'name', width: 160, ellipsis: true, render: (t: string) => <Text>{t}</Text> },
              {
                title: '模板', width: 160,
                render: () => {
                  const t = order.templateName ? mockTemplates.find(tmpl => order.templateName!.includes(tmpl.name)) : null;
                  if (!t) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
                  return (
                    <Popover trigger="click" placement="right" title={t.name}
                      content={
                        <div style={{ maxWidth: 480 }}>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ flex: '0 0 auto', width: 180 }}>
                              <TemplateThumbnail type={t.type} fields={t.fields} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Descriptions size="small" column={1}>
                                <Descriptions.Item label="版本">v{t.version}</Descriptions.Item>
                                <Descriptions.Item label="类型">{t.type}</Descriptions.Item>
                                <Descriptions.Item label="创建日期">{t.createdAt}</Descriptions.Item>
                              </Descriptions>
                              <Divider style={{ margin: '8px 0' }} />
                              <Text type="secondary" style={{ fontSize: 11 }}>模板字段：</Text>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                {t.fields.map((f: any) => (
                                  <Tag key={f.name} color={f.required ? 'red' : 'default'} style={{ margin: 0, fontSize: 10 }}>
                                    {f.required ? '* ' : ''}{f.label}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      }>
                      <Tag color="blue" style={{ cursor: 'pointer', fontSize: 11 }}>
                        <EyeOutlined style={{ marginRight: 4 }} />{t.name}
                      </Tag>
                    </Popover>
                  );
                },
              },
              {
                title: '数据来源', width: 100,
                render: () => order.dataSource === 'customer'
                  ? <Tag color="orange" style={{ fontSize: 11 }}>客户自导</Tag>
                  : <Tag color="green" style={{ fontSize: 11 }}>平台生成</Tag>,
              },
              { title: '数量', dataIndex: 'qty', width: 120, render: (v: number) => <Text strong>{v.toLocaleString()} 张</Text> },
              { title: '说明', render: () => <Text type="secondary" style={{ fontSize: 12 }}>{order.subOrders.length === 0 && order.status === '待审核' ? '待审核' : order.subOrders.length === 0 && order.status === '已驳回' ? '已驳回' : '—'}</Text> },
            ]}
          />
        )}
      </Card>
      </Card>

      {/* 快递面单预览弹窗 */}
      <Modal
        title={<Space>快递面单预览 <Tag>{waybillData?.courier}</Tag></Space>}
        open={waybillOpen}
        onCancel={() => { setWaybillOpen(false); setWaybillData(null); }}
        width={800}
        footer={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('快递面单图片已开始下载（演示）')}>
              下载面单原图
            </Button>
            <Button onClick={() => { setWaybillOpen(false); setWaybillData(null); }}>关闭</Button>
          </Space>
        }
      >
        {waybillData && (
          <div>
            {/* 原始上传件 — 模拟面单照片 */}
            <div style={{
              background: '#f0f0f0', borderRadius: 8, overflow: 'hidden',
              marginBottom: 20, position: 'relative',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
            }}>
              {/* 模拟桌面拍照背景 */}
              <div style={{
                background: 'linear-gradient(135deg, #e8e0d8 0%, #d5cdc5 30%, #e0d8cf 60%, #c8c0b5 100%)',
                padding: '32px 24px 40px', minHeight: 360,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                position: 'relative',
              }}>
                {/* 桌面纹理 */}
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.15,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
                }} />
                {/* 面单纸张 — 模拟拍照效果：略微倾斜 + 阴影 */}
                <div style={{
                  background: '#fffef9', borderRadius: 3,
                  padding: '28px 24px 24px', width: '100%', maxWidth: 600,
                  boxShadow: '2px 4px 16px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
                  transform: 'rotate(-0.5deg)',
                  position: 'relative',
                  border: '1px solid #e0dcd0',
                }}>
                  {/* 面单顶部 — 快递公司 Logo 区 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#c00', letterSpacing: 3, fontFamily: 'serif' }}>
                        {waybillData.courier}
                      </div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>EXPRESS WAYBILL</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <svg width="120" height="36" viewBox="0 0 120 36">
                        <rect x="0" y="0" width="120" height="36" rx="2" fill="white" stroke="#333" strokeWidth="1.5"/>
                        {Array.from({length: 18}).map((_, i) => (
                          <rect key={i} x={4 + i * 6.2} y={6} width={i % 3 === 0 ? 1.5 : 3} height={24} fill="#222" opacity={0.85}/>
                        ))}
                      </svg>
                      <div style={{ fontSize: 8, color: '#999', marginTop: 1 }}>BARCODE</div>
                    </div>
                  </div>

                  {/* 运单号 */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Tracking No.</div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
                      letterSpacing: 3, color: '#111', background: '#f8f8f6',
                      padding: '4px 10px', borderRadius: 2, border: '1px dashed #ccc',
                      textAlign: 'center',
                    }}>
                      {waybillData.platformTrackingNo || waybillData.trackingNo}
                    </div>
                  </div>

                  <Divider style={{ margin: '0 0 12px', borderStyle: 'dashed' }} />

                  {/* 收发信息 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4, letterSpacing: 1 }}>FROM 寄件人</div>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{order.factoryName}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Tel: 0571-88****66</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4, letterSpacing: 1 }}>TO 收件人</div>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{order.brandName}</div>
                      <div style={{ fontSize: 10, color: '#666', lineHeight: 1.5 }}>{order.shippingAddress}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Tel: {order.phone}</div>
                    </div>
                  </div>

                  {/* 货物描述 */}
                  <div style={{ background: '#f9f9f6', borderRadius: 3, padding: '8px 12px', marginBottom: 12, border: '1px solid #eee' }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 4, letterSpacing: 1 }}>CONTENTS 内件品名</div>
                    <div style={{ fontSize: 11 }}>标签印刷品</div>
                  </div>

                  {/* 底部印章 + 日期 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>揽收时间</div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{waybillData.shippedAt}</div>
                    </div>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', border: '2px solid #c00',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(-15deg)', opacity: 0.75,
                    }}>
                      <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                        <div style={{ fontSize: 8, color: '#c00', fontWeight: 700 }}>已揽收</div>
                        <div style={{ fontSize: 7, color: '#c00' }}>RECEIVED</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 识别结果核对 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
              <Card size="small" title={<Space><Tag color="cyan" style={{ fontSize: 10 }}>OCR 识别</Tag>面单自动提取</Space>} style={{ borderRadius: 6 }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="快递公司">{waybillData.courier}</Descriptions.Item>
                  <Descriptions.Item label="快递单号">
                    <Text code>{waybillData.platformTrackingNo || waybillData.trackingNo}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              <Card size="small" title={<Space><Tag color="blue" style={{ fontSize: 10 }}>订单数据</Tag>平台系统关联</Space>} style={{ borderRadius: 6 }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="发货数量">{waybillData.quantity?.toLocaleString()} 张</Descriptions.Item>
                  <Descriptions.Item label="关联订单"><Text code style={{ fontSize: 11 }}>{order.orderNo}</Text></Descriptions.Item>
                  <Descriptions.Item label="上传时间">{waybillData.shippedAt}</Descriptions.Item>
                </Descriptions>
              </Card>
            </div>

            <Alert
              type="info" showIcon
              title="上方为平台方/供应商上传的快递面单原稿照片"
              description="快递公司和单号由系统 OCR 自动识别提取，其余信息来自平台订单数据。如识别有误请联系平台客服。"
              style={{ borderRadius: 6 }}
            />
          </div>
        )}
      </Modal>


      {/* 回签单预览弹窗 */}
      <Modal
        title={<Space>回签单预览 <Tag color="green">{signedDocData?.signedDocNo}</Tag></Space>}
        open={signedDocOpen}
        onCancel={() => { setSignedDocOpen(false); setSignedDocData(null); }}
        width={800}
        footer={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => message.success(`回签单 ${signedDocData?.signedDocNo} 已开始下载（演示）`)}>
              下载回签单
            </Button>
            <Button onClick={() => { setSignedDocOpen(false); setSignedDocData(null); }}>关闭</Button>
          </Space>
        }
      >
        {signedDocData && (
          <div>
            {/* 回签单原稿 — 模拟扫描件效果 */}
            <div style={{
              background: '#d5cdc5', borderRadius: 8, overflow: 'hidden',
              marginBottom: 20, position: 'relative',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #e8e0d8 0%, #d5cdc5 30%, #e0d8cf 60%, #c8c0b5 100%)',
                padding: '32px 24px 40px', minHeight: 400,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                position: 'relative',
              }}>
                {/* 回签单纸张 */}
                <div style={{
                  background: '#fffef9', borderRadius: 3,
                  padding: '32px 28px', width: '100%', maxWidth: 560,
                  boxShadow: '2px 4px 16px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
                  transform: 'rotate(-0.8deg)',
                  position: 'relative',
                  border: '1px solid #e0dcd0',
                }}>
                  {/* 回签单标题 */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', letterSpacing: 6, fontFamily: 'serif' }}>
                      签 收 回 执 单
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>SIGNED RECEIPT CONFIRMATION</div>
                  </div>

                  {/* 回签单号 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Receipt No. 回签单号</div>
                    <div style={{
                      fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
                      letterSpacing: 2, color: '#111', background: '#f8f8f6',
                      padding: '4px 10px', borderRadius: 2, border: '1px dashed #ccc',
                      textAlign: 'center',
                    }}>
                      {signedDocData.signedDocNo}
                    </div>
                  </div>

                  <Divider style={{ margin: '0 0 16px', borderStyle: 'dashed' }} />

                  {/* 基本信息 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>关联订单</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{order.orderNo}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>快递单号</div>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{signedDocData.platformTrackingNo || signedDocData.trackingNo}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>发货数量</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{signedDocData.quantity?.toLocaleString()} 张</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>签收时间</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{signedDocData.signedAt || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>签收方</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{order.brandName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>签收地址</div>
                      <div style={{ fontSize: 11, lineHeight: 1.5 }}>{order.shippingAddress}</div>
                    </div>
                  </div>

                  <Divider style={{ margin: '0 0 16px', borderStyle: 'dashed' }} />

                  {/* 签收确认区 */}
                  <div style={{ background: '#f9f9f6', borderRadius: 3, padding: '12px 16px', marginBottom: 12, border: '1px solid #eee' }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>确认内容</div>
                    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                      本人确认已收到上述订单全部货品，数量核对无误，品质验收合格。
                    </div>
                  </div>

                  {/* 签章区 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>签收人</div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{order.contact}</div>
                      <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{order.phone}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%', border: '2px solid #c00',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-12deg)', opacity: 0.8,
                      }}>
                        <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                          <div style={{ fontSize: 8, color: '#c00', fontWeight: 700 }}>已签收</div>
                          <div style={{ fontSize: 7, color: '#c00' }}>RECEIVED</div>
                        </div>
                      </div>
                      {signedDocData.signedAt && (
                        <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>{signedDocData.signedAt}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 回签单信息核对 */}
            <Card size="small" title={<Space><Tag color="blue" style={{ fontSize: 10 }}>系统关联</Tag>回签单信息</Space>} style={{ borderRadius: 6 }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="回签单号"><Text code>{signedDocData.signedDocNo}</Text></Descriptions.Item>
                <Descriptions.Item label="文件类型">
                  <Tag color={signedDocData.signedDocType === 'pdf' ? 'red' : 'blue'}>{signedDocData.signedDocType === 'pdf' ? 'PDF 文档' : '图片'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="关联订单"><Text code style={{ fontSize: 11 }}>{order.orderNo}</Text></Descriptions.Item>
                <Descriptions.Item label="上传时间">{signedDocData.signedAt || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Alert
              type="info" showIcon
              title="上方为平台方/供应商上传的回签单原稿"
              description="回签单由签收方（品牌方）确认签收后生成，作为收货确认凭证。如需原始电子件请联系平台客服。"
              style={{ borderRadius: 6, marginTop: 12 }}
            />
          </div>
        )}
      </Modal>
      {/* 取消订单弹窗 */}
      <Modal title="取消订单" open={cancelOpen} onCancel={() => setCancelOpen(false)}
        onOk={() => { message.warning('订单已取消（演示）'); setCancelOpen(false); }}
        okText="确认取消" okButtonProps={{ danger: true }}
      >
        <Alert type="warning" showIcon title="此操作将取消整笔订单。如已进入生产环节，请联系平台客服处理。" style={{ marginBottom: 12 }} />
        <Text>取消原因：</Text>
        <Select style={{ width: '100%', marginTop: 8 }} placeholder="请选择取消原因" options={[
          { value: '1', label: '业务变更' },
          { value: '2', label: '款式取消' },
          { value: '3', label: '信息填写错误' },
          { value: '4', label: '其他原因' },
        ]} />
      </Modal>
    </div>
  );
}
