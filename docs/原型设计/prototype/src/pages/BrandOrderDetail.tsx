import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Space, Modal, Select, Typography, message, Alert, Timeline, theme } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { orders as mockOrders } from '../data/mock';

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
              </div>
            </div>

            {/* 阶段3: 生产制作 — 持续过程，展示各子订单生产进度 */}
            {order.subOrders.length > 0 && (() => {
              const producedTotal = order.subOrders
                .filter(so => !['待接单', '已接单'].includes(so.status))
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
                      <Text style={{ fontSize: 13, color: token.colorPrimary }}>
                        {producedTotal.toLocaleString()}/{order.totalQuantity.toLocaleString()} 张
                      </Text>
                      <div style={{ flex: 1, maxWidth: 200, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(producedTotal / order.totalQuantity * 100).toFixed(0)}%`, height: '100%', background: token.colorPrimary, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{(producedTotal / order.totalQuantity * 100).toFixed(0)}%</Text>
                    </div>
                    {/* 子订单生产明细 */}
                    <div style={{ marginTop: 8, background: token.colorFillQuaternary, borderRadius: 6, padding: '8px 12px' }}>
                      {order.subOrders.map(so => {
                        const isProducing = !['待接单', '已接单'].includes(so.status);
                        const done = so.status === '生产完成' || so.status === '部分发货' || so.status === '已发货' || so.status === '已签收';
                        return (
                          <div key={so.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                            <Text code style={{ fontSize: 11 }}>{so.orderNo.split('-').slice(0, 3).join('-')}</Text>
                            <Text type="secondary">{so.sku}</Text>
                            <div style={{ flex: 1 }} />
                            {isProducing ? (
                              <>
                                <Text>{so.quantity.toLocaleString()}/{so.quantity.toLocaleString()} 张</Text>
                                {done ? <Tag color="success" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>✓</Tag> : <Tag color="processing" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>生产中</Tag>}
                              </>
                            ) : (
                              <Text type="secondary">0/{so.quantity.toLocaleString()} 张</Text>
                            )}
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
                      <Text style={{ fontSize: 13, color: token.colorPrimary }}>
                        {shippedTotal.toLocaleString()}/{order.totalQuantity.toLocaleString()} 张
                      </Text>
                      <div style={{ flex: 1, maxWidth: 200, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(shippedTotal / order.totalQuantity * 100).toFixed(0)}%`, height: '100%', background: token.colorSuccess, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{(shippedTotal / order.totalQuantity * 100).toFixed(0)}%</Text>
                    </div>
                    {/* 发货批次明细 */}
                    {hasShipment && (
                      <div style={{ marginTop: 8, background: token.colorFillQuaternary, borderRadius: 6, padding: '8px 12px' }}>
                        {order.subOrders.filter(so => so.shippedQuantity > 0).map(so => (
                          <div key={so.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                            <Text code style={{ fontSize: 11 }}>{so.orderNo.split('-').slice(0, 3).join('-')}</Text>
                            <Text type="secondary">{so.sku}</Text>
                            <div style={{ flex: 1 }} />
                            <Text>已发 {so.shippedQuantity.toLocaleString()} 张</Text>
                            <Tag color={so.status === '已签收' ? 'success' : so.shippedQuantity >= so.quantity ? 'blue' : 'processing'} style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                              {so.status === '已签收' ? '已签收' : so.shippedQuantity >= so.quantity ? '已发齐' : '部分发货'}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 阶段5: 签收确认 — 持续过程，按已签收数量累计 */}
            {order.subOrders.length > 0 && (() => {
              const signedTotal = order.subOrders
                .filter(so => so.status === '已签收')
                .reduce((s, so) => s + so.shippedQuantity, 0);
              const hasSigned = signedTotal > 0;
              const isCurrent = brandStepIndex[order.status] >= brandStepIndex['已签收'];
              if (!hasSigned && !isCurrent) return null;
              const allSigned = signedTotal >= order.totalQuantity;
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
                      <Text style={{ fontSize: 13, color: allSigned ? token.colorSuccess : token.colorPrimary }}>
                        {signedTotal.toLocaleString()}/{order.totalQuantity.toLocaleString()} 张
                      </Text>
                      <div style={{ flex: 1, maxWidth: 200, height: 6, background: token.colorFillSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(signedTotal / order.totalQuantity * 100).toFixed(0)}%`, height: '100%', background: allSigned ? token.colorSuccess : token.colorWarning, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{(signedTotal / order.totalQuantity * 100).toFixed(0)}%</Text>
                      {allSigned && <Tag color="success" style={{ margin: 0 }}>已完成</Tag>}
                    </div>
                    {/* 签收批次明细 */}
                    {hasSigned && (
                      <div style={{ marginTop: 8, background: token.colorFillQuaternary, borderRadius: 6, padding: '8px 12px' }}>
                        {order.subOrders.filter(so => so.status === '已签收').map(so => (
                          <div key={so.sku} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                            <Text code style={{ fontSize: 11 }}>{so.sku}</Text>
                            <div style={{ flex: 1 }} />
                            <Text>签收 {so.shippedQuantity.toLocaleString()} 张</Text>
                            <Tag color="success" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>✓</Tag>
                          </div>
                        ))}
                        {/* 回签单 */}
                        {(() => {
                          const signedShipments = order.subOrders
                            .filter(so => so.status === '已签收')
                            .flatMap((so: any) => (so.shipments || []))
                            .filter((sh: any) => sh.signedDocNo);
                          if (signedShipments.length === 0) return null;
                          return (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${token.colorBorderSecondary}` }}>
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>回签单</Text>
                              {signedShipments.map((sh: any, idx: number) => (
                                <div key={sh.signedDocNo || idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0', fontSize: 11 }}>
                                  <Text code style={{ fontSize: 10 }}>{sh.signedDocNo}</Text>
                                  <Text type="secondary" style={{ fontSize: 10 }}>{sh.signedDocType === 'pdf' ? 'PDF' : '图片'}</Text>
                                  <Button type="link" size="small" style={{ fontSize: 10, padding: 0, height: 'auto' }}
                                    onClick={() => { setSignedDocData(sh); setSignedDocOpen(true); }}>
                                    查看回签单
                                  </Button>
                                  <Button type="link" size="small" style={{ fontSize: 10, padding: 0, height: 'auto' }}
                                    onClick={() => message.success(`回签单 ${sh.signedDocNo} 已开始下载（演示）`)}>
                                    下载
                                  </Button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* 操作记录 — 仅显示品牌方可感知的状态 */}
        <div style={{ marginTop: 20 }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>操作记录</Text>
          {visibleLog.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '6px 0', borderBottom: i < visibleLog.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none' }}>
              <div style={{
                width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0,
                background: l.status === '已驳回' || l.status === '已取消' ? token.colorError : token.colorPrimary,
              }} />
              <div>
                <Text style={{ fontSize: 13 }}>{l.status}</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{l.operator}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>{l.time}</Text>
              </div>
            </div>
          ))}
        </div>
      </Card>      {/* 订单详情 */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Descriptions column={3} size="small" title="基本信息">
          <Descriptions.Item label="品牌方">{order.brandName}</Descriptions.Item>
          <Descriptions.Item label="工厂">{order.factoryName}</Descriptions.Item>
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

      {/* 子订单生产进度 */}
      {order.subOrders.length > 0 && (
        <Card title="生产进度" style={{ marginBottom: 16, borderRadius: 8 }}>
          <Table
            dataSource={order.subOrders}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            columns={[
              { title: '子订单号', dataIndex: 'orderNo', width: 190, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              { title: 'SKU', dataIndex: 'sku', width: 150, render: (t: string) => <Text code style={{ fontSize: 11 }}>{t}</Text> },
              { title: '数量', dataIndex: 'quantity', width: 100, render: (v: number) => v.toLocaleString() },
              {
                title: '生产状态', dataIndex: 'status', width: 110,
                render: (s: string) => {
                  // 品牌方视角下，隐藏内部状态的具体名称
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
                title: '已发货', dataIndex: 'shippedQuantity', width: 100,
                render: (v: number) => v > 0 ? <Text style={{ color: token.colorPrimary }}>{v.toLocaleString()}</Text> : <Text type="secondary">—</Text>,
              },
            ]}
          />
        </Card>
      )}

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
                <div style={{
                  background: '#fffef9', borderRadius: 3,
                  padding: '32px 28px', width: '100%', maxWidth: 560,
                  boxShadow: '2px 4px 16px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
                  transform: 'rotate(-0.8deg)',
                  position: 'relative',
                  border: '1px solid #e0dcd0',
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', letterSpacing: 6, fontFamily: 'serif' }}>
                      签 收 回 执 单
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>SIGNED RECEIPT CONFIRMATION</div>
                  </div>
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
                  <div style={{ background: '#f9f9f6', borderRadius: 3, padding: '12px 16px', marginBottom: 12, border: '1px solid #eee' }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>确认内容</div>
                    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                      本人确认已收到上述订单全部货品，数量核对无误，品质验收合格。
                    </div>
                  </div>
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
        <Alert type="warning" showIcon title="此操作将取消整笔订单，已通知的供应商将收到取消通知。已生产部分将按实际结算。" style={{ marginBottom: 12 }} />
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
