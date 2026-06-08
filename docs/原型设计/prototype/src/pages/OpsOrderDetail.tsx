import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Space, Typography, Alert, Timeline, theme, Popconfirm, Input, Modal, message, Tooltip } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { suppliers, shipments as mockShipments } from '../data/mock';
import { useOrders } from '../data/OrderContext';
import type { Order } from '../data/mock';

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  '待审核': { color: 'gold', text: '待审核' },
  '已审核': { color: 'blue', text: '已审核' },
  '已驳回': { color: 'red', text: '已驳回' },
  '已拆分': { color: 'geekblue', text: '已拆分' },
  '待接单': { color: 'orange', text: '待接单' },
  '已接单': { color: 'cyan', text: '已接单' },
  '生产中': { color: 'processing', text: '生产中' },
  '生产完成': { color: 'green', text: '生产完成' },
  '部分发货': { color: 'lime', text: '部分发货' },
  '已发货': { color: 'purple', text: '已发货' },
  '部分签收': { color: 'magenta', text: '部分签收' },
  '已签收': { color: 'success', text: '已签收' },
  '已取消': { color: 'default', text: '已取消' },
};

/** 根据发货批次计算子订单实际状态 */
function computeSubStatus(so: any, shpts: any[]): string {
  if (!shpts || shpts.length === 0) return so.status;
  const totalShipped = shpts.reduce((s: number, sh: any) => s + sh.quantity, 0);
  const totalSigned = shpts.filter((sh: any) => sh.signed).reduce((s: number, sh: any) => s + sh.quantity, 0);
  // 发货批次驱动的状态
  if (totalSigned >= so.quantity) return '已签收';
  if (totalSigned > 0 && totalShipped >= so.quantity) return '部分签收';
  if (totalShipped >= so.quantity) return '已发货';
  if (totalShipped > 0) return '部分发货';
  // 无发货记录，保留原始生产状态
  return so.status;
}

export default function OpsOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const { orders } = useOrders();
  const order = id ? orders.find(o => o.id === id) : undefined;

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary" style={{ fontSize: 16 }}>订单不存在（id={id}）</Text>
        <br />
        <Button type="link" onClick={() => navigate('/ops/audit')}>返回审核列表</Button>
      </div>
    );
  }

  const isCancelled = order.status === '已取消';
  const subOrders = order.subOrders || [];
  const getSubShipments = (so: any) => (so as any).shipments || mockShipments[so.id] || [];
  const producedTotal = subOrders
    .filter(so => !['待接单', '已接单'].includes(so.status))
    .reduce((s, so) => s + so.quantity, 0);
  const shippedTotal = subOrders.reduce((s, so) => {
    const shpts = getSubShipments(so);
    return s + (shpts.length > 0 ? shpts.reduce((ss: number, sh: any) => ss + sh.quantity, 0) : (so.shippedQuantity || 0));
  }, 0);
  const signedTotal = subOrders.reduce((s, so) => {
    const shpts = getSubShipments(so);
    return s + shpts.filter((sh: any) => sh.signed).reduce((ss: number, sh: any) => ss + sh.quantity, 0);
  }, 0);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/ops/audit')}>订单管理</Button>
        <Text type="secondary">/</Text>
        <Text strong>{order.orderNo}</Text>
      </div>

      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{order.orderNo}</Title>
            <Space style={{ marginTop: 10 }} size="small">
              <Tag color={statusMap[order.status]?.color || 'default'}>{statusMap[order.status]?.text || order.status}</Tag>
              <Tag>{order.type}</Tag>
              <Tag>{order.tagType}</Tag>
              {order.templateName && <Tag color="blue">{order.templateName}</Tag>}
              {(order as any).isFree && <Tag color="green">免费单</Tag>}
              {(order as any).isUrgent && <Tag color="red">加急</Tag>}
            </Space>
          </div>
        </div>
        {isCancelled && (
          <Alert type="info" showIcon title="此订单已取消" description={order.cancelReason ? `原因：${order.cancelReason}` : undefined} style={{ marginTop: 12 }} />
        )}
        {order.status === '已驳回' && (
          <Alert type="warning" showIcon title="此订单已驳回"
            description={(order.statusLog || []).find((l: any) => l.status === '已驳回')?.detail || '请查看操作记录了解驳回原因'}
            style={{ marginTop: 12 }} />
        )}
      </Card>

      {subOrders.length > 0 && !isCancelled && (
        <Card title="子订单进度总览" style={{ marginBottom: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>生产进度</Text>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, margin: '8px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${order.totalQuantity > 0 ? Math.round(producedTotal / order.totalQuantity * 100) : 0}%`, background: token.colorPrimary, borderRadius: 4 }} />
              </div>
              <Text style={{ fontSize: 12 }}>{producedTotal.toLocaleString()} / {order.totalQuantity.toLocaleString()} 张</Text>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>发货进度</Text>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, margin: '8px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${order.totalQuantity > 0 ? Math.round(shippedTotal / order.totalQuantity * 100) : 0}%`, background: token.colorSuccess, borderRadius: 4 }} />
              </div>
              <Text style={{ fontSize: 12 }}>{shippedTotal.toLocaleString()} / {order.totalQuantity.toLocaleString()} 张</Text>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>签收进度</Text>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, margin: '8px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${order.totalQuantity > 0 ? Math.round(signedTotal / order.totalQuantity * 100) : 0}%`, background: '#722ed1', borderRadius: 4 }} />
              </div>
              <Text style={{ fontSize: 12 }}>{signedTotal.toLocaleString()} / {order.totalQuantity.toLocaleString()} 张</Text>
            </div>
          </div>
        </Card>
      )}

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Descriptions column={3} size="small" title="基本信息">
          <Descriptions.Item label="品牌方">{order.brandName}</Descriptions.Item>
          <Descriptions.Item label="工厂">{order.factoryName}</Descriptions.Item>
          <Descriptions.Item label="订单类型">{order.type}</Descriptions.Item>
          <Descriptions.Item label="标签类型">{order.tagType}</Descriptions.Item>
          <Descriptions.Item label="总数量"><Text strong>{order.totalQuantity.toLocaleString()}</Text> 张</Descriptions.Item>
          <Descriptions.Item label="模板">{order.templateName || '—'}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={3}>{order.shippingAddress}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order.contact}</Descriptions.Item>
          <Descriptions.Item label="电话">{order.phone}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{order.createdAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      {subOrders.length > 0 && (
        <Card title={`子订单（${subOrders.length} 个）`} style={{ marginBottom: 16, borderRadius: 8 }}>
          {subOrders.map(so => {
            const pct = order.totalQuantity > 0 ? Math.round(so.quantity / order.totalQuantity * 100) : 0;
            const shpts = (so as any).shipments || mockShipments[so.id] || [];
            const totalShipped = shpts.reduce((s: number, sh: any) => s + sh.quantity, 0);
            const totalSigned = shpts.filter((sh: any) => sh.signed).reduce((s: number, sh: any) => s + sh.quantity, 0);
            return (
              <Card
                key={so.id}
                size="small"
                style={{ marginBottom: 12, borderRadius: 8 }}
                title={
                  <Space>
                    <Text code style={{ fontSize: 12 }}>{so.orderNo}</Text>
                    <Tag color="blue">{so.supplierName}</Tag>
                    {(() => {
                      const cmptStatus = computeSubStatus(so, shpts);
                      return <Tag color={statusMap[cmptStatus]?.color}>{statusMap[cmptStatus]?.text || cmptStatus}</Tag>;
                    })()}
                  </Space>
                }
              >
                {/* Sub-order progress bars */}
                {(() => {
                  const cmptStatus = computeSubStatus(so, shpts);
                  const prodPct = ['待接单', '已接单'].includes(cmptStatus) ? 0
                    : cmptStatus === '生产中' ? 50
                    : 100;
                  const shipPct = so.quantity > 0 ? Math.round(totalShipped / so.quantity * 100) : 0;
                  const signPct = so.quantity > 0 ? Math.round(totalSigned / so.quantity * 100) : 0;
                  return (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>生产</Text>
                          <Text style={{ fontSize: 11 }}>{prodPct}%</Text>
                        </div>
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${prodPct}%`, background: token.colorPrimary, borderRadius: 3, transition: 'width .3s' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>发货</Text>
                          <Text style={{ fontSize: 11 }}>{totalShipped.toLocaleString()}/{so.quantity.toLocaleString()}</Text>
                        </div>
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${shipPct}%`, background: token.colorSuccess, borderRadius: 3, transition: 'width .3s' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>签收</Text>
                          <Text style={{ fontSize: 11 }}>{signPct}%</Text>
                        </div>
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${signPct}%`, background: '#722ed1', borderRadius: 3, transition: 'width .3s' }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="SKU">{so.sku}</Descriptions.Item>
                  <Descriptions.Item label="数量">{so.quantity.toLocaleString()} 张</Descriptions.Item>
                  <Descriptions.Item label="占比">{pct}%</Descriptions.Item>
                  <Descriptions.Item label="已发货">{totalShipped > 0 ? totalShipped.toLocaleString() : '—'}</Descriptions.Item>
                </Descriptions>

                {/* Shipment history */}
                {shpts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      发货记录（{shpts.length} 批次，累计 {totalShipped.toLocaleString()} 张）
                    </Text>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>批次</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>快递</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>单号</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>数量</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>发货时间</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>签收</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 500, color: '#888', borderBottom: '1px solid #f0f0f0' }}>下载</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shpts.map((sh: any, i: number) => (
                            <tr key={sh.id || i} style={{ borderBottom: i < shpts.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                              <td style={{ padding: '6px 10px' }}>
                                <Text code style={{ fontSize: 11 }}>{sh.batchNo}</Text>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <Tag style={{ fontSize: 10, margin: 0 }}>{sh.courier}</Tag>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{sh.trackingNo || sh.platformTrackingNo || '—'}</Text>
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                <Text style={{ fontSize: 11 }}>{sh.quantity.toLocaleString()}</Text>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <Text style={{ fontSize: 11 }}>{sh.shippedAt}</Text>
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                {sh.signed ? (
                                  <Space size={2}>
                                    <Tag color="success" style={{ fontSize: 10, margin: 0 }}>已签</Tag>
                                    <Text type="secondary" style={{ fontSize: 10 }}>{sh.signedAt?.slice(5) || ''}</Text>
                                  </Space>
                                ) : (
                                  <Tag style={{ fontSize: 10, margin: 0 }}>待签</Tag>
                                )}
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <Space size={2}>
                                  <Tooltip title="下载快递面单">
                                    <Button size="small" type="link" icon={<DownloadOutlined />}
                                      onClick={() => message.success(`模拟下载：${sh.batchNo} 快递面单.pdf`)} />
                                  </Tooltip>
                                  {sh.signed && sh.signedDocNo && (
                                    <Tooltip title={`下载回签单（${sh.signedDocNo}）`}>
                                      <Button size="small" type="link" icon={<DownloadOutlined />} style={{ color: '#722ed1' }}
                                        onClick={() => message.success(`模拟下载：${sh.signedDocNo} 回签单.pdf`)} />
                                    </Tooltip>
                                  )}
                                </Space>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </Card>
      )}

      {order.statusLog && order.statusLog.length > 0 && (
        <Card title="操作记录" style={{ marginBottom: 16, borderRadius: 8 }}>
          <Timeline
            items={order.statusLog.map(l => ({
              color: l.status === '已驳回' || l.status === '已取消' ? 'red' : 'gray',
              content: (
                <div>
                  <Text style={{ fontSize: 13 }}>{l.status}</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{l.operator}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{l.time}</Text>
                  {(l as any).detail && (
                    <div style={{ marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{(l as any).detail}</Text>
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      )}
    </div>
  );
}
