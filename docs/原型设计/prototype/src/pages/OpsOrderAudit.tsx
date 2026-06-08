import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Tag, Select, DatePicker, Space, Modal, Descriptions, Alert,
  InputNumber, Input, Typography, message, Popconfirm, Checkbox, Row, Col,
  Progress, Collapse, Badge, Tooltip, Divider, Statistic, theme, Empty, Dropdown, Spin, Upload
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, SendOutlined, MinusCircleOutlined,
  StopOutlined, DownloadOutlined, SearchOutlined, ReloadOutlined,
  SwapOutlined, ThunderboltOutlined, WarningOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, BranchesOutlined, FilterOutlined, UploadOutlined, PaperClipOutlined, DeleteOutlined,
  BookOutlined
} from '@ant-design/icons';
import { suppliers, templates } from '../data/mock';
import { useOrders } from '../data/OrderContext';
import type { Order, Supplier } from '../data/mock';
import TemplateThumbnail from '../components/TemplatePreviews';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusMap: Record<string, { color: string; text: string }> = {
  '待审核': { color: 'gold', text: '待审核' },
  '已审核': { color: 'blue', text: '已审核' },
  '已驳回': { color: 'error', text: '已驳回' },
  '已拆分': { color: 'geekblue', text: '已拆分' },
  '待接单': { color: 'orange', text: '待接单' },
  '已接单': { color: 'cyan', text: '已接单' },
  '生产中': { color: 'processing', text: '生产中' },
  '生产完成': { color: 'green', text: '生产完成' },
  '部分发货': { color: 'lime', text: '部分发货' },
  '已发货': { color: 'purple', text: '已发货' },
  '已签收': { color: 'success', text: '已签收' },
  '已取消': { color: 'default', text: '已取消' },
};

/** 状态优先级，用于判断是否已进入生产环节 */
const STATUS_ORDER: Record<string, number> = {
  '待接单': 0, '已接单': 1, '生产中': 2, '生产完成': 3,
  '部分发货': 4, '已发货': 5, '已签收': 6,
};

/** 不可取消/砍单的子订单状态 */
const UNCANCELLABLE_SUB = ['生产中', '生产完成', '部分发货', '已发货', '已签收'];

/** 驳回原因预设选项 */
const REJECT_PRESETS = [
  '模板信息与图稿不一致',
  'SKU 数量超出模板限制',
  '收货信息不完整或有误',
  '品牌方/工厂信息错误',
  '标签类型选择有误',
  '订单数量超出产能',
  '缺少品牌方确认文件',
  '图稿分辨率不达标',
];

// ── 审核核对清单 ──
const BASE_CHECKLIST = [
  { key: 'brandInfo', label: '品牌方/工厂信息正确' },
  { key: 'skuQty',   label: 'SKU 与数量匹配' },
  { key: 'template', label: '模板内容无缺失/错误' },
  { key: 'artwork',  label: '图稿与模板一致' },
  { key: 'shipping', label: '收货信息完整' },
];

const FREE_CHECKLIST = [
  { key: 'freeAuth', label: '品牌方书面确认记录已归档' },
  { key: 'freeLimit', label: '免费单数量在合理损耗范围内（≤ 5% 总量）' },
];

const URGENT_CHECKLIST = [
  { key: 'urgentAuth', label: '品牌方加急确认已获得' },
  { key: 'capacity', label: '供应商产能可满足加急交期' },
];

function getSupplierWorkload(sid: number, orders: Order[]) {
  let activeOrders = 0, pendingQty = 0;
  orders.forEach(o => {
    o.subOrders.forEach(so => {
      if (so.supplierName === suppliers.find(s => s.id === sid)?.name && ['待接单','已接单','生产中','生产完成'].includes(so.status)) {
        activeOrders++; pendingQty += (so.quantity - (so.shippedQuantity || 0));
      }
    });
  });
  return { activeOrders, pendingQty };
}

/** 判断父订单是否可以取消（平台运营人员自行与品牌方/供应商沟通确认） */
function canCancelOrder(order: Order): boolean {
  if (order.status === '已取消' || order.status === '已驳回') return false;
  // 除已取消外，所有状态均可由运营人员决定取消
  return true;
}

/** 获取子订单摘要信息 */
function getSubOrderSummary(order: Order): { count: number; suppliers: string; hasActive: boolean } {
  const subs = order.subOrders || [];
  if (subs.length === 0) return { count: 0, suppliers: '—', hasActive: false };
  const names = [...new Set(subs.map(s => s.supplierName).filter(Boolean))];
  const hasActive = subs.some(s => !['已取消', '已签收'].includes(s.status));
  return {
    count: subs.length,
    suppliers: names.slice(0, 2).join('、') + (names.length > 2 ? ` 等${names.length}家` : ''),
    hasActive,
  };
}

/** 追加驳回原因预设 */
function appendRejectPreset(current: string, preset: string): string {
  if (current.includes(preset)) return current; // 不重复添加
  return current ? current + '；' + preset : preset;
}

export default function OpsOrderAudit() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { orders, setOrders } = useOrders();

  // ── Filters ──
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const [searchText, setSearchText] = useState('');

  // ── Audit state ──
  const [auditOrder, setAuditOrder] = useState<any>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitRows, setSplitRows] = useState<{ supplierId: number; quantity: number }[]>([]);
  const [keepQty, setKeepQty] = useState<number>(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [markFree, setMarkFree] = useState(false);
  const [markUrgent, setMarkUrgent] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // ── Reduce / Cancel ──
  const [reduceOrder, setReduceOrder] = useState<any>(null);
  const [reduceSubData, setReduceSubData] = useState<Record<string, any>>({});
  const [cancelOrder, setCancelOrder] = useState<any>(null);
  // Per-sub-order cancel state: Map<subOrderId, { selected, costBearers, costBrand, costPlatform, costSupplier, costNote }>
  const [cancelSubSelections, setCancelSubSelections] = useState<Record<string, any>>({});

const COST_BEARERS = [
  { value: '待定', label: '待定（后续协商）' },
  { value: '品牌方承担', label: '品牌方承担' },
  { value: '平台方承担', label: '平台方承担' },
  { value: '供应商承担', label: '供应商承担' },
];

  // ── Batch ──
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');
  const [rejectFiles, setRejectFiles] = useState<{ name: string; size: number }[]>([]);
  const [batchRejectFiles, setBatchRejectFiles] = useState<{ name: string; size: number }[]>([]);

  // ── Transfer Supplier ──
  const [transferOrder, setTransferOrder] = useState<any>(null);
  const [transferSubOrderId, setTransferSubOrderId] = useState<string>('');
  const [transferTargetSupplier, setTransferTargetSupplier] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [artworkZoom, setArtworkZoom] = useState(1);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const allOrders = orders;
  /** Simulate async processing with loading state */
  const processAction = useCallback(async (action: string, fn: () => void) => {
    setProcessing(true);
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 600));
    fn();
    setProcessing(false);
  }, []);


  const brandOptions = useMemo(() => {
    const b = [...new Set(allOrders.map(o => o.brandName))];
    return [{ value: 'all', label: '全部品牌' }, ...b.map(b => ({ value: b, label: b }))];
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    let list = [...allOrders];
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(o => o.type === typeFilter);
    if (brandFilter !== 'all') list = list.filter(o => o.brandName === brandFilter);
    if (dateRange?.[0] && dateRange?.[1]) {
      const from = dateRange[0].startOf('day').valueOf();
      const to = dateRange[1].endOf('day').valueOf();
      list = list.filter(o => { const t = new Date(o.createdAt).getTime(); return t >= from && t <= to; });
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(o => o.orderNo.toLowerCase().includes(q) || o.brandName.toLowerCase().includes(q) || o.factoryName.toLowerCase().includes(q));
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [allOrders, statusFilter, typeFilter, brandFilter, dateRange, searchText]);

  // ── Stats (always count from allOrders, not filtered) ──
  const pendingCount = allOrders.filter(o => o.status === '待审核').length;
  const rejectedCount = allOrders.filter(o => o.status === '已驳回').length;
  const reviewedCount = allOrders.filter(o => o.status === '已审核').length;
  const todayCount = allOrders.filter(o => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  const overdueCount = allOrders.filter(o => {
    if (o.status !== '待审核') return false;
    const h = (Date.now() - new Date(o.createdAt).getTime()) / 3600000;
    return h > 24;
  }).length;

  // ── Dynamic checklist ──
  const currentChecklist = useMemo(() => {
    if (!auditOrder) return BASE_CHECKLIST;
    let items = [...BASE_CHECKLIST];
    if (markFree) items = [...items, ...FREE_CHECKLIST];
    if (auditOrder.isUrgent) items = [...items, ...URGENT_CHECKLIST];
    // 补单：额外检查是否关联原订单
    if (auditOrder.type === '补单') {
      items.push({ key: 'replenishLink', label: '补单已关联原始订单，模板与上次一致' });
    }
    return items;
  }, [auditOrder, markFree]);

  // ── Open modals ──
  const openAudit = (order: any) => {
    setAuditOrder(order);
    setSplitMode(false);
    setSplitRows([{ supplierId: 0, quantity: 0 }]);
    setKeepQty(0);
    setChecklist({});
    setMarkFree(order.type === '免费单');
    setMarkUrgent(order.isUrgent || false);
    setRejectReason('');
    setArtworkZoom(1);
  };

  const openSplit = (order: any) => {
    setAuditOrder(order);
    setSplitMode(true);
    setSplitRows([{ supplierId: 0, quantity: 0 }]);
    setKeepQty(0);
    setChecklist({});
    setMarkFree(order.isFree || false);
    setMarkUrgent(order.isUrgent || false);
  };

  const openReduce = (order: any) => {
    setReduceOrder(order);
    setReduceQty(0);
  };

  const openTransfer = (order: any) => {
    setTransferOrder(order);
    setTransferSubOrderId('');
    setTransferTargetSupplier(null);
  };

  // ── Actions ──
  const handleCancel = () => {
    if (!cancelOrder) return;
    const selectedIds = Object.entries(cancelSubSelections).filter(([_, v]) => v.selected).map(([k]) => k);
    if (selectedIds.length === 0) { message.warning('请至少选择一个要取消的子订单'); return; }
    const allSubs = cancelOrder.subOrders || [];
    const isFullCancel = selectedIds.length >= allSubs.length;
    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setOrders(prev => prev.map(o => o.id === cancelOrder.id ? {
      ...o,
      status: isFullCancel ? '已取消' as any : o.status,
      totalQuantity: isFullCancel ? o.totalQuantity : o.totalQuantity - allSubs.filter(s => selectedIds.includes(s.id)).reduce((sum, s) => sum + s.quantity, 0),
      subOrders: o.subOrders.filter((s: any) => !selectedIds.includes(s.id)).map((s: any) => {
        // Update remaining sub-order quantities
        return s;
      }),
      statusLog: [...(o.statusLog || []), {
        status: isFullCancel ? '已取消' : '部分取消',
        operator: '当前用户',
        time: nowTime,
        detail: `${isFullCancel ? '全部取消' : `取消 ${selectedIds.length}/${allSubs.length} 个子订单`}：${selectedIds.map(id => {
          const sub = allSubs.find(s => s.id === id);
          return sub ? `${sub.supplierName}(${sub.quantity.toLocaleString()}张)` : id;
        }).join('、')}` + (() => { const notes = [...new Set(Object.values(cancelSubSelections).map((v: any) => v.costNote).filter(Boolean))]; return notes.length > 0 ? `。备注：${notes.join('；')}` : ''; })(),
      }],
    } : o));
    const totalCancelled = allSubs.filter(s => selectedIds.includes(s.id)).reduce((sum, s) => sum + s.quantity, 0);
    message.success(`已取消 ${selectedIds.length} 个子订单（${totalCancelled.toLocaleString()} 张）${isFullCancel ? '，订单已完全取消' : ''}`);
    setCancelOrder(null); setCancelSubSelections({});
  };

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选中待审核的订单'); return; }
    const pendingIds = new Set(filteredOrders.filter(o => o.status === '待审核').map(o => o.id));
    const validKeys = selectedRowKeys.filter(k => pendingIds.has(k as string));
    if (validKeys.length === 0) { message.warning('所选订单中无待审核订单'); return; }
    setOrders(prev => prev.map(o => validKeys.includes(o.id) ? { ...o, status: '已审核' as any } : o));
    message.success(`已批量通过 ${validKeys.length} 条订单，可逐一进行拆单操作`);
    setSelectedRowKeys([]);
  };

  const handleBatchReject = () => {
    if (!batchRejectReason.trim()) { message.error('请输入驳回原因'); return; }
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const pendingIds = new Set(filteredOrders.filter(o => o.status === '待审核').map(o => o.id));
    const validKeys = selectedRowKeys.filter(k => pendingIds.has(k as string));
    if (validKeys.length === 0) { message.warning('所选订单中无待审核订单'); return; }
    setOrders(prev => prev.map(o => validKeys.includes(o.id) ? {
      ...o,
      status: '已驳回' as any,
      statusLog: [...(o.statusLog || []), { status: '已驳回', operator: '当前用户', time: now, detail: batchRejectReason }],
    } : o));
    message.success(`已批量驳回 ${validKeys.length} 条订单`);
    setSelectedRowKeys([]);
    setBatchRejectOpen(false);
    setBatchRejectReason('');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { message.error('请输入驳回原因'); return; }
    processAction('驳回', () => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setOrders(prev => prev.map(o => o.id === auditOrder.id ? {
        ...o,
        status: '已驳回' as any,
        statusLog: [...(o.statusLog || []), { status: '已驳回', operator: '当前用户', time: now, detail: rejectReason }],
      } : o));
      message.success(`订单 ${auditOrder.orderNo} 已驳回，品牌方将收到通知并修改后重新提交`);
      setAuditOrder(null); setRejectOpen(false);
    });
  };

  const handleReduce = () => {
    if (!reduceOrder) return;
    const subs = reduceOrder.subOrders || [];
    const hasData = Object.values(reduceSubData).some((v: any) => v.qty > 0);
    if (!hasData) { message.warning('请至少为一个子订单输入削减数量'); return; }
    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    let totalReduced = 0;
    const reducedDetails: string[] = [];
    setOrders(prev => prev.map(o => o.id === reduceOrder.id ? {
      ...o,
      totalQuantity: o.totalQuantity - Object.values(reduceSubData).reduce((sum: number, v: any) => sum + (v.qty || 0), 0),
      subOrders: o.subOrders.map((s: any) => {
        const data = reduceSubData[s.id];
        if (data && data.qty > 0) {
          totalReduced += data.qty;
          const costParts = [];
          if (data.costBrand) costParts.push(`品牌方 ¥${data.costBrand.toLocaleString()}`);
          if (data.costPlatform) costParts.push(`平台方 ¥${data.costPlatform.toLocaleString()}`);
          if (data.costSupplier) costParts.push(`供应商 ¥${data.costSupplier.toLocaleString()}`);
          const costStr = costParts.length > 0 ? `（${costParts.join('，')}）` : '';
          reducedDetails.push(`${s.supplierName}: -${data.qty.toLocaleString()}张${costStr}`);
          return { ...s, quantity: s.quantity - data.qty };
        }
        return s;
      }),
      statusLog: [...(o.statusLog || []), {
        status: '已砍单',
        operator: '当前用户',
        time: nowTime,
        detail: `削减 ${totalReduced.toLocaleString()} 张` + (() => { const notes = [...new Set(Object.values(reduceSubData).map((v: any) => v.costNote).filter(Boolean))]; return notes.length > 0 ? '。备注：' + notes.join('；') : ''; })() + `。明细：${reducedDetails.join('；')}`,
      }],
    } : o));
    message.success(`砍单完成：共削减 ${totalReduced.toLocaleString()} 张（${reducedDetails.length} 个子订单）`);
    setReduceOrder(null); setReduceSubData({});
  };

  const handleTransferSupplier = () => {
    if (!transferOrder || !transferSubOrderId || !transferTargetSupplier) { message.warning('请选择要转出的子订单和目标供应商'); return; }
    const targetSup = suppliers.find(s => s.id === transferTargetSupplier);
    if (!targetSup) return;
    const subOrder = (transferOrder.subOrders || []).find((so: any) => so.id === transferSubOrderId);
    if (!subOrder) { message.error('子订单不存在'); return; }
    setOrders(prev => prev.map(o => o.id === transferOrder.id ? {
      ...o,
      subOrders: (o.subOrders || []).map((so: any) =>
        so.id === transferSubOrderId ? { ...so, supplierName: targetSup.name, supplierId: targetSup.id } : so
      ),
    } : o));
    message.success(`${transferOrder.orderNo} 的子订单 ${subOrder.orderNo || transferSubOrderId} 已转至 ${targetSup.name}`);
    setTransferOrder(null);
    setTransferSubOrderId('');
    setTransferTargetSupplier(null);
  };

  // ── Split helpers ──
  const addSplitRow = () => setSplitRows([...splitRows, { supplierId: 0, quantity: 0 }]);
  const updateSplitRow = (i: number, field: string, val: any) => {
    const rows = [...splitRows]; (rows[i] as any)[field] = val; setSplitRows(rows);
  };
  const removeSplitRow = (i: number) => {
    if (splitRows.length <= 1) return;
    setSplitRows(splitRows.filter((_, idx) => idx !== i));
  };
  const evenSplit = () => {
    const selectedSids = splitRows.filter(r => r.supplierId > 0);
    if (selectedSids.length === 0) { message.warning('请先选择供应商'); return; }
    const total = auditOrder?.totalQuantity || 0;
    const remaining = total - keepQty;
    const each = Math.floor(remaining / selectedSids.length);
    const updated = splitRows.map(r => r.supplierId > 0 ? { ...r, quantity: each } : r);
    const remainder = remaining - each * selectedSids.length;
    if (remainder > 0) updated[updated.findIndex(r => r.supplierId > 0)] = { ...updated.find(r => r.supplierId > 0)!, quantity: (updated.find(r => r.supplierId > 0)?.quantity || 0) + remainder };
    setSplitRows(updated);
  };

  
  const equalSplit2 = () => {
    const total = auditOrder?.totalQuantity || 0;
    const remaining = total - keepQty;
    const each = Math.floor(remaining / 2);
    const updated = splitRows.map((r, i) => i < 2 ? { ...r, quantity: each } : r);
    updated[0] = { ...updated[0], quantity: each + (remaining - each * 2) };
    setSplitRows(updated);
  };
  const equalSplit3 = () => {
    const total = auditOrder?.totalQuantity || 0;
    const remaining = total - keepQty;
    const each = Math.floor(remaining / 3);
    const updated = splitRows.map((r, i) => i < 3 ? { ...r, quantity: each } : r);
    updated[0] = { ...updated[0], quantity: each + (remaining - each * 3) };
    setSplitRows(updated);
  };
  const equalSplit4 = () => {
    const total = auditOrder?.totalQuantity || 0;
    const remaining = total - keepQty;
    const each = Math.floor(remaining / 4);
    const updated = splitRows.map((r, i) => i < 4 ? { ...r, quantity: each } : r);
    updated[0] = { ...updated[0], quantity: each + (remaining - each * 4) };
    setSplitRows(updated);
  };

  const totalAllocated = splitRows.reduce((s, r) => s + r.quantity, 0) + keepQty;
  const allChecklistOk = currentChecklist.every(c => checklist[c.key]);
  /** Resolve matched template and its field values for display */
  const templateView = useMemo(() => {
    if (!auditOrder?.templateName) return null;
    const tName = auditOrder.templateName.replace(/\s+v\d+$/, '');
    const tpl = templates.find(t => t.name === tName);
    if (!tpl) return null;
    const values: Record<string, string> = {
      productName: auditOrder.productName || '—',
      standard: 'GB/T 22849-2014',
      size: auditOrder.styleNo ? 'L (180/100A)' : '—',
      washMethod: '轻柔手洗，不可漂白',
      composition: '100%棉',
      grade: 'B类（直接接触皮肤）',
      color: '白色',
      barcode: auditOrder.sku || '—',
      fillContent: '白鹅绒 90%',
      fillRatio: '90%',
      ageRange: '3岁以上',
    };
    return { tpl, values };
  }, [auditOrder, templates]);

  const isValidSplit = totalAllocated === auditOrder?.totalQuantity && splitRows.every(r => r.supplierId > 0 && r.quantity > 0);

  const handleExport = () => message.success(`已导出 ${filteredOrders.length} 条订单数据（模拟）`);
  const handleExportSelected = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选中订单'); return; }
    message.success(`已导出 ${selectedRowKeys.length} 条选中订单（模拟）`);
  };

  const resetFilters = () => {
    setStatusFilter('all'); setTypeFilter('all'); setBrandFilter('all');
    setDateRange(null); setSearchText('');
  };

  const handleApproveAndSplit = () => {
    if (!allChecklistOk) { message.warning('请完成全部核对清单'); return; }
    setSplitMode(true);
  };

  const handleApproveDirect = () => {
    if (!allChecklistOk) { message.warning('请完成全部核对清单'); return; }
    processAction('审核通过', () => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const tags: string[] = [];
      if (markFree) tags.push('免费单');
      if (markUrgent) tags.push('加急');
      const tagStr = tags.length > 0 ? `（${tags.join('、')}）` : '';
      setOrders(prev => prev.map(o => o.id === auditOrder.id ? {
        ...o,
        isFree: markFree || undefined,
        isUrgent: markUrgent || undefined,
        status: '已审核' as any,
        statusLog: [...(o.statusLog || []), { status: '已审核', operator: '当前用户', time: now, detail: tags.length > 0 ? `标记为${tags.join('、')}，审核通过` : '审核通过' }],
      } : o));
      message.success(`订单 ${auditOrder.orderNo} 已审核通过${tagStr}，可在列表中操作拆单`);
      setAuditOrder(null);
    });
  };

  const handleConfirmSplit = () => {
    processAction('拆单', () => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setOrders(prev => prev.map(o => o.id === auditOrder.id ? {
        ...o,
        isFree: markFree || undefined,
        isUrgent: markUrgent || undefined,
        status: '已拆分' as any,
        statusLog: [...(o.statusLog || []), { status: '已拆分', operator: '当前用户', time: now, detail: `拆分为 ${splitRows.filter(r => r.supplierId > 0 && r.quantity > 0).length} 个子订单${keepQty > 0 ? '，保留 ' + keepQty.toLocaleString() + ' 张' : ''}` }],
        subOrders: splitRows.filter(r => r.supplierId > 0 && r.quantity > 0).map(r => ({
          id: `SO-${auditOrder.id}-${r.supplierId}`,
          orderNo: `${auditOrder.orderNo}-${r.supplierId}`,
          supplierName: suppliers.find(s => s.id === r.supplierId)?.name || '',
          supplierId: r.supplierId,
          sku: auditOrder.sku || '—',
          quantity: r.quantity,
          shippedQuantity: 0,
          status: '待接单',
        })),
      } : o));
      const splitTags: string[] = [];
      if (markFree) splitTags.push('免费单');
      if (markUrgent) splitTags.push('加急');
      const splitTagStr = splitTags.length > 0 ? `（${splitTags.join('、')}）` : '';
      message.success(`已拆分${splitTagStr}并通知供应商${keepQty > 0 ? `，保留 ${keepQty.toLocaleString()} 张待定` : ''}`);
      setAuditOrder(null);
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    getCheckboxProps: (r: any) => ({ disabled: r.status !== '待审核' }),
  };

  const hasFilters = statusFilter !== 'all' || typeFilter !== 'all' || brandFilter !== 'all' || !!dateRange || !!searchText.trim();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>订单管理</Title><Button icon={<BookOutlined />} onClick={() => setGuideModalOpen(true)}>使用说明书</Button></div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div onClick={() => setStatusFilter(statusFilter === '待审核' ? 'all' : '待审核')}
          style={{ flex: 1, minWidth: 110, background: statusFilter === '待审核' ? '#fff7e6' : token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: statusFilter === '待审核' ? '1px solid #ffd591' : '1px solid transparent', transition: 'all .2s' }}>
          <Text type="secondary" style={{ fontSize: 12, color: '#fa8c16' }}>待审核</Text>
          <br /><Text strong style={{ fontSize: 20, color: '#fa8c16' }}>{pendingCount}</Text>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === '已驳回' ? 'all' : '已驳回')}
          style={{ flex: 1, minWidth: 110, background: statusFilter === '已驳回' ? '#fff2f0' : token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: statusFilter === '已驳回' ? '1px solid #ffccc7' : '1px solid transparent', transition: 'all .2s' }}>
          <Text type="secondary" style={{ fontSize: 12, color: '#ff4d4f' }}>已驳回</Text>
          <br /><Text strong style={{ fontSize: 20, color: '#ff4d4f' }}>{rejectedCount}</Text>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === '已审核' ? 'all' : '已审核')}
          style={{ flex: 1, minWidth: 110, background: statusFilter === '已审核' ? '#e6f4ff' : token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: statusFilter === '已审核' ? '1px solid #91caff' : '1px solid transparent', transition: 'all .2s' }}>
          <Text type="secondary" style={{ fontSize: 12, color: '#1677ff' }}>已审核待拆</Text>
          <br /><Text strong style={{ fontSize: 20, color: '#1677ff' }}>{reviewedCount}</Text>
        </div>
        <div style={{ flex: 1, minWidth: 110, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>今日新增</Text>
          <br /><Text strong style={{ fontSize: 20 }}>{todayCount}</Text>
        </div>
        <div onClick={() => { setStatusFilter('待审核'); setSearchText(''); setDateRange(null); }}
          style={{ flex: 1, minWidth: 110, background: overdueCount > 0 ? '#fff2f0' : '#f6ffed', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: overdueCount > 0 ? '1px solid #ffccc7' : '1px solid #b7eb8f', transition: 'all .2s' }}>
          <Text type="secondary" style={{ fontSize: 12, color: overdueCount > 0 ? '#cf1322' : '#52c41a' }}>超24h未审</Text>
          <br /><Text strong style={{ fontSize: 20, color: overdueCount > 0 ? '#cf1322' : '#52c41a' }}>{overdueCount}</Text>
        </div>
        <div style={{ flex: 1, minWidth: 110, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
          <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>订单总量</Text>
          <br /><Text strong style={{ fontSize: 20, color: '#52c41a' }}>{allOrders.length}</Text>
        </div>
      </div>

      <Card style={{ borderRadius: 8 }}>
        {/* ── Filters ── */}
        <Space style={{ marginBottom: 12 }} wrap>
          <Input placeholder="搜索订单号、品牌、工厂" prefix={<SearchOutlined />}
            style={{ width: 220 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear
            onPressEnter={() => {}} />
          <Select style={{ width: 130 }} value={statusFilter} onChange={setStatusFilter}
            options={[{ value: 'all', label: '全部状态' }, ...Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))]} />
          <Select style={{ width: 110 }} value={typeFilter} onChange={setTypeFilter}
            options={[
              { value: 'all', label: '全部类型' },
              { value: '大货单', label: '大货单' },
              { value: '补单', label: '补单' },
              { value: '免费单', label: '免费单' },
            ]} />
          <Select style={{ width: 180 }} value={brandFilter} onChange={setBrandFilter}
            options={brandOptions} showSearch filterOption={(input, option) => (option?.label as string)?.includes(input) ?? false} />
          <RangePicker placeholder={['提交时间 从', '到']} value={dateRange} onChange={v => setDateRange(v as any)} />
          <Button onClick={resetFilters} icon={<ReloadOutlined />} disabled={!hasFilters}>重置</Button>
        </Space>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {filteredOrders.length} 条{hasFilters ? `（筛选自 ${allOrders.length} 条）` : ''}
            </Text>
            {selectedRowKeys.length > 0 && (
              <>
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={handleBatchApprove}>
                  批量通过（{selectedRowKeys.length}）
                </Button>
                <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => setBatchRejectOpen(true)}>
                  批量驳回（{selectedRowKeys.length}）
                </Button>
                <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
              </>
            )}
          </Space>
          <Space>
            <Dropdown menu={{ items: [
              { key: 'all', label: '导出全部筛选结果', icon: <DownloadOutlined />, onClick: handleExport },
              { key: 'selected', label: `导出选中项（${selectedRowKeys.length}）`, icon: <DownloadOutlined />, onClick: handleExportSelected, disabled: selectedRowKeys.length === 0 },
            ]}} trigger={['click']}>
              <Button icon={<DownloadOutlined />} size="small">导出</Button>
            </Dropdown>
          </Space>
        </div>

        {/* ── Table ── */}
        {filteredOrders.length === 0 ? (
          <Empty
            description={hasFilters ? '没有匹配的订单，请调整筛选条件' : '暂无订单数据'}
            style={{ padding: '60px 0' }}
          >
            {hasFilters && <Button onClick={resetFilters}>重置筛选</Button>}
          </Empty>
        ) : (
          <Table
            rowSelection={rowSelection}
            dataSource={filteredOrders}
            rowKey="id"
            size="middle"
            scroll={{ x: 1250 }}
            pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '15', '20', '50'] }}
            columns={[
              { title: '订单号', dataIndex: 'orderNo', width: 170, render: (t: string, r: Order) => {
                const isOverdue = r.status === '待审核' && (Date.now() - new Date(r.createdAt).getTime()) > 86400000;
                return (
                  <Space size={4}>
                    <a onClick={() => navigate(`/ops/orders/${r.id}`)} style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</a>
                    {isOverdue && <Badge status="error" title="超24小时未审核" />}
                  </Space>
                );
              }},
              { title: '品牌方', dataIndex: 'brandName', width: 140, ellipsis: true },
              { title: '工厂', dataIndex: 'factoryName', width: 110, ellipsis: true },
              { title: '类型', dataIndex: 'type', width: 70, render: (t: string) => <Tag color={t === '大货单' ? 'blue' : t === '免费单' ? 'green' : 'orange'}>{t}</Tag> },
              { title: '标签', dataIndex: 'tagType', width: 80 },
              { title: '数量', dataIndex: 'totalQuantity', width: 90, align: 'right' as const, render: (v: number) => v.toLocaleString() },
              { title: '子订单', dataIndex: 'subOrders', width: 140, render: (_: any, r: Order) => {
                const summary = getSubOrderSummary(r);
                if (summary.count === 0) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                return (
                  <Tooltip title={`${summary.count} 个子订单`}>
                    <Space size={4}>
                      <Tag color={summary.hasActive ? 'processing' : 'default'} style={{ fontSize: 11 }}>{summary.count}个</Tag>
                      <Text style={{ fontSize: 11, maxWidth: 80 }} ellipsis>{summary.suppliers}</Text>
                    </Space>
                  </Tooltip>
                );
              }},
              {
                title: '标识', width: 70,
                render: (_: any, r: any) => (
                  <Space size={2}>
                    {r.isFree && <Tag color="green" style={{ fontSize: 10 }}>免费</Tag>}
                    {r.isUrgent && <Tag color="red" style={{ fontSize: 10 }}>加急</Tag>}
                  </Space>
                ),
              },
              { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => {
                const m = statusMap[s] || { color: 'default', text: s };
                return <Tag color={m.color}>{m.text}</Tag>;
              }},
              { title: '提交时间', dataIndex: 'createdAt', width: 140 },
              {
                title: '操作', key: 'actions', width: 320, fixed: 'right' as const,
                render: (_: any, r: any) => {
                  const isPending = r.status === '待审核';
                  const isReviewed = r.status === '已审核';
                  const canReduce = ['已审核', '已拆分', '待接单', '已接单', '生产中', '生产完成', '部分发货', '已签收'].includes(r.status);
                  const canCancel = canCancelOrder(r);
                  return (
                    <Space size={0} wrap>
                      <Button size="small" type="link" onClick={() => navigate(`/ops/orders/${r.id}`)}>详情</Button>
                      {isPending && <Button type="primary" size="small" onClick={() => openAudit(r)}>审核</Button>}
                      {isReviewed && <Button type="primary" size="small" icon={<BranchesOutlined />} onClick={() => openSplit(r)}>拆单</Button>}
                      {r.subOrders && r.subOrders.length > 0 && !['已取消', '已发货', '已签收', '已驳回'].includes(r.status) && (
                      <Tooltip title="将子订单转给其他供应商">
                        <Button size="small" type="link" icon={<SwapOutlined />} onClick={() => openTransfer(r)}>转供应商</Button>
                      </Tooltip>
                      )}
                      {canCancel && (
                        <Button size="small" type="link" danger icon={<StopOutlined />} onClick={() => {
                          setCancelOrder(r); setCancelSubSelections({});
                        }}>取消</Button>
                      )}
                      {canReduce && (
                        <Button size="small" type="link" danger icon={<MinusCircleOutlined />} onClick={() => openReduce(r)}>砍单</Button>
                      )}
                    </Space>
                  );
                },
              },
            ]}
          />
        )}
        <Alert type="info" showIcon style={{ marginTop: 10, fontSize: 12, borderRadius: 6 }}
          title="💡 审核流程：待审核→审核通过（可直接通过或拆单转单）→通知供应商接单。已审核订单可单独拆单。已拆分订单可转供应商。取消/砍单由运营人员自行与品牌方及供应商沟通后操作。" />
      </Card>

      {/* ═══════════ AUDIT MODAL ═══════════ */}
      <Modal title={`审核订单 — ${auditOrder?.orderNo || ''}`} open={!!auditOrder && !rejectOpen} confirmLoading={processing}
        onCancel={() => setAuditOrder(null)} width={880} footer={null}>
        {auditOrder && !splitMode && (
          <>
            {/* Operation history */}
            {auditOrder.statusLog?.length > 0 && (
              <Card size="small" title="操作记录" style={{ marginBottom: 12 }}>
                {auditOrder.statusLog.map((l: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '2px 0', fontSize: 12 }}>
                    <Tag color={l.status === '已驳回' ? 'red' : 'blue'} style={{ fontSize: 10 }}>{l.status}</Tag>
                    <Text type="secondary">{l.operator || '—'}</Text>
                    <Text type="secondary">{l.time}</Text>
                  </div>
                ))}
              </Card>
            )}

            {/* Order info */}
            <Collapse ghost size="small" style={{ marginBottom: 12, background: token.colorFillQuaternary, borderRadius: 6 }}
              defaultActiveKey={['info']}
              items={[{
                key: 'info', label: <Text strong>订单基本信息</Text>,
                children: (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="品牌方">{auditOrder.brandName}</Descriptions.Item>
                    <Descriptions.Item label="工厂">{auditOrder.factoryName}</Descriptions.Item>
                    <Descriptions.Item label="标签类型">{auditOrder.tagType}</Descriptions.Item>
                    <Descriptions.Item label="数量">{auditOrder.totalQuantity.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="订单类型">{auditOrder.type}</Descriptions.Item>
                    <Descriptions.Item label="模板">{auditOrder.templateName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="收货地址" span={2}>{auditOrder.shippingAddress}</Descriptions.Item>
                    <Descriptions.Item label="联系人">{auditOrder.contact}</Descriptions.Item>
                    <Descriptions.Item label="电话">{auditOrder.phone}</Descriptions.Item>
                  </Descriptions>
                ),
              }, {
                key: 'template', label: <Text strong>模板与图稿预览</Text>,
                children: (
                  <div>
                    {/* Template info header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Tag color="blue">{auditOrder.tagType || '吊牌标签'}</Tag>
                      <Text strong style={{ fontSize: 14 }}>{auditOrder.templateName || '未指定模板'}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>v3 · 2026-01-10</Text>
                    </div>
                    <Row gutter={20}>
                      {/* Left: Fields table */}
                      <Col xs={24} md={12}>
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ background: '#fafafa', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                            <Text strong style={{ fontSize: 12 }}>模板字段</Text>
                            {templateView && <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{templateView.tpl.fields.length} 个字段</Text>}
                          </div>
                          <div style={{ padding: 12 }}>
                            {templateView ? (
                              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                <tbody>
                                  {templateView.tpl.fields.map((f, i) => (
                                    <tr key={f.name} style={{ borderBottom: i < templateView.tpl.fields.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                      <td style={{ padding: '5px 8px 5px 0', color: '#888', whiteSpace: 'nowrap', width: 80 }}>
                                        {f.required && <Text type="danger" style={{ fontSize: 10, marginRight: 2 }}>*</Text>}
                                        {f.label}
                                      </td>
                                      <td style={{ padding: '5px 0' }}>
                                        <Text style={{
                                          background: templateView.values[f.name] && templateView.values[f.name] !== '—' ? '#f6ffed' : '#fffbe6',
                                          padding: '1px 6px', borderRadius: 3, fontSize: 11,
                                          color: templateView.values[f.name] && templateView.values[f.name] !== '—' ? '#52c41a' : '#faad14',
                                        }}>
                                          {templateView.values[f.name] || '—'}
                                        </Text>
                                      </td>
                                      <td style={{ padding: '5px 0', width: 50, textAlign: 'right' }}>
                                        <Tag style={{ fontSize: 10, margin: 0 }} color={f.type === 'text' ? 'default' : f.type === 'number' ? 'blue' : 'purple'}>{f.type}</Tag>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div style={{ fontSize: 12, color: '#666' }}>
                                <div style={{ padding: '3px 0' }}>品名：<Text>{auditOrder.productName || '—'}</Text></div>
                                <div style={{ padding: '3px 0' }}>款号：<Text>{auditOrder.styleNo || '—'}</Text></div>
                                <div style={{ padding: '3px 0' }}>SKU：<Text>{auditOrder.sku || '—'}</Text></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                      {/* Right: SVG artwork preview with zoom */}
                      <Col xs={24} md={12}>
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ background: '#fafafa', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 12 }}>图稿预览</Text>
                            <Space size={4}>
                              <Button size="small" type="text" disabled={artworkZoom <= 0.5}
                                onClick={() => setArtworkZoom(z => Math.max(0.5, z - 0.25))}>−</Button>
                              <Text style={{ fontSize: 11, minWidth: 36, textAlign: 'center' }}>{Math.round(artworkZoom * 100)}%</Text>
                              <Button size="small" type="text" disabled={artworkZoom >= 2}
                                onClick={() => setArtworkZoom(z => Math.min(2, z + 0.25))}>+</Button>
                              <Button size="small" type="text" onClick={() => setArtworkZoom(1)}>重置</Button>
                            </Space>
                          </div>
                          <div style={{
                            background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 16px 16px',
                            minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 16, overflow: 'auto',
                          }}>
                            <div style={{ transform: `scale(${artworkZoom})`, transformOrigin: 'center', transition: 'transform .2s' }}>
                              {templateView ? (
                                <TemplateThumbnail type={auditOrder.tagType || '吊牌标签'} fields={templateView.tpl.fields} large />
                              ) : (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                  <div style={{ width: 140, height: 200, border: '2px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>暂无模板</Text>
                                  </div>
                                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>该订单未指定模板</Text>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              }]}
            />

            {/* Audit Tips */}
            <Alert
              type="info"
              showIcon
              icon={<ThunderboltOutlined />}
              title="审核指引"
              description={
                <div style={{ fontSize: 12 }}>
                  <Text>• 确认品牌方/工厂信息与订单一致，特别注意多品牌客户公司下的品牌归属</Text><br />
                  <Text>• 核对 SKU 数量是否在模板允许范围内</Text><br />
                  <Text>• 图稿与模板字段需逐项比对，确保 EPC 编码区域、材质标注、安全类别无误</Text><br />
                  <Text>• 免费单仅限补偿短装/损耗等场景，需有品牌方书面确认记录</Text>
                </div>
              }
              style={{ marginBottom: 12, borderRadius: 6 }}
            />

            {/* Checklist */}
            <Card title="审核核对清单" size="small" style={{ marginBottom: 12 }}>
              {currentChecklist.map(c => (
                <div key={c.key} style={{ padding: '3px 0' }}>
                  <Checkbox checked={!!checklist[c.key]}
                    onChange={e => setChecklist(prev => ({ ...prev, [c.key]: e.target.checked }))}>
                    {c.label}
                  </Checkbox>
                </div>
              ))}
              {!allChecklistOk && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  请逐项核对确认后再审核通过（{Object.values(checklist).filter(Boolean).length}/{currentChecklist.length}）
                </Text>
              )}
            </Card>

            {/* Free tag */}
            <Card size="small" style={{ marginBottom: 12 }}>
              <Checkbox checked={markFree} onChange={e => setMarkFree(e.target.checked)}>
                <Text strong>标记为免费单</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>对账单金额为 0，用于补偿短装损耗等场景</Text>
              </Checkbox>
            </Card>

            {/* Urgent tag */}
            <Card size="small" style={{ marginBottom: 12 }}>
              <Checkbox checked={markUrgent} onChange={e => setMarkUrgent(e.target.checked)}>
                <Text strong style={{ color: '#ff4d4f' }}>标记为加急</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>品牌方线下沟通确认，审核时将追加加急检查项</Text>
              </Checkbox>
            </Card>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectOpen(true)}>驳回</Button>
              <Button icon={<CheckCircleOutlined />} disabled={!allChecklistOk} onClick={handleApproveDirect}>
                直接通过
              </Button>
              <Button type="primary" icon={<SendOutlined />} disabled={!allChecklistOk} onClick={handleApproveAndSplit}>
                审核通过，拆单转单
              </Button>
            </div>
          </>
        )}

        {/* ── Split Mode ── */}
        {auditOrder && splitMode && (
          <>
            <Alert type="info" showIcon
              title={`拆单转单 — 总数量：${auditOrder.totalQuantity.toLocaleString()} 张${[markFree && '免费单', markUrgent && '加急'].filter(Boolean).join('、') ? '（' + [markFree && '免费单', markUrgent && '加急'].filter(Boolean).join('、') + '）' : ''}`}
              style={{ marginBottom: 12 }} />

            {/* Keep quantity */}
            <Card size="small" style={{ marginBottom: 12 }}>
              <Space>
                <Text>保留数量（暂不分配）：</Text>
                <InputNumber min={0} max={auditOrder.totalQuantity - totalAllocated + keepQty}
                  value={keepQty || undefined} onChange={v => setKeepQty(v || 0)} style={{ width: 120 }} />
                <Text type="secondary" style={{ fontSize: 11 }}>留给平台后续调配</Text>
              </Space>
            </Card>

            {/* Split table */}
            <Table
              dataSource={splitRows.map((r, i) => ({ ...r, key: i }))}
              pagination={false}
              size="small"
              columns={[
                {
                  title: '供应商', key: 'supplier', width: 280,
                  render: (_: any, __: any, i: number) => {
                    const sid = splitRows[i].supplierId;
                    const wl = sid > 0 ? getSupplierWorkload(sid, orders) : null;
                    const maxLoad = 150000;
                    const loadPct = wl ? Math.min(100, Math.round((wl.pendingQty / maxLoad) * 100)) : 0;
                    return (
                      <div>
                        <Select placeholder="选择供应商" style={{ width: 220 }} showSearch
                          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false}
                          value={sid || undefined} onChange={v => updateSplitRow(i, 'supplierId', v)}
                          options={suppliers.filter(s => s.status === 'ACTIVE').map(s => {
                            const w = getSupplierWorkload(s.id, orders);
                            return {
                              value: s.id,
                              label: `${s.name}（${w.activeOrders}单·${(w.pendingQty / 10000).toFixed(1)}万待产）`,
                            };
                          })} />
                        {wl && (
                          <div style={{ fontSize: 11, marginTop: 2 }}>
                            <Progress percent={loadPct} size="small" strokeColor={loadPct > 80 ? '#ff4d4f' : loadPct > 50 ? '#faad14' : '#52c41a'}
                              format={() => `${wl.activeOrders}单·${(wl.pendingQty / 10000).toFixed(1)}万`}
                              style={{ marginBottom: 0 }} />
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  title: '分配量', key: 'quantity', width: 140,
                  render: (_: any, __: any, i: number) => (
                    <InputNumber min={0} max={auditOrder.totalQuantity}
                      value={splitRows[i].quantity || undefined}
                      onChange={v => updateSplitRow(i, 'quantity', v || 0)}
                      style={{ width: 110 }} placeholder="数量" />
                  ),
                },
                {
                  title: '占比', key: 'percent', width: 60,
                  render: (_: any, __: any, i: number) =>
                    auditOrder.totalQuantity > 0 ? `${((splitRows[i].quantity / auditOrder.totalQuantity) * 100).toFixed(1)}%` : '0%',
                },
                {
                  title: '', key: 'del', width: 30,
                  render: (_: any, __: any, i: number) => (
                    splitRows.length > 1 ? <Button size="small" type="link" danger onClick={() => removeSplitRow(i)}>✕</Button> : null
                  ),
                },
              ]}
              footer={() => {
                const rowCount = splitRows.length;
                return (
                <Space wrap>
                  <Button type="dashed" onClick={addSplitRow} size="small">+ 添加供应商</Button>
                  <Button size="small" onClick={evenSplit}>均分给已选</Button>
                  <Dropdown menu={{ items: [
                    { key: '2', label: '均分 2 路', onClick: equalSplit2, disabled: rowCount < 2 },
                    { key: '3', label: '均分 3 路', onClick: equalSplit3, disabled: rowCount < 3 },
                    { key: '4', label: '均分 4 路', onClick: equalSplit4, disabled: rowCount < 4 },
                  ]}} trigger={['click']}>
                    <Button size="small">快捷均分 ▾</Button>
                  </Dropdown>
                </Space>
                );
              }}
            />

            {/* Allocation status */}
            <div style={{ marginTop: 12 }}>
              <Space>
                <Text type={totalAllocated === auditOrder.totalQuantity ? 'success' : 'danger'} strong>
                  已分配：{totalAllocated.toLocaleString()} / {auditOrder.totalQuantity.toLocaleString()}
                  （{((totalAllocated / auditOrder.totalQuantity) * 100).toFixed(1)}%）
                </Text>
                {keepQty > 0 && <Tag>保留 {keepQty.toLocaleString()} 张</Tag>}
              </Space>
              {totalAllocated !== auditOrder.totalQuantity && (
                <div style={{ marginTop: 4 }}>
                  <Text type="danger">
                    {totalAllocated < auditOrder.totalQuantity
                      ? `⚠️ 还差 ${(auditOrder.totalQuantity - totalAllocated).toLocaleString()} 张`
                      : `⚠️ 超出 ${(totalAllocated - auditOrder.totalQuantity).toLocaleString()} 张`}
                  </Text>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button onClick={() => setSplitMode(false)}>返回审核</Button>
              <Button type="primary" icon={<SendOutlined />} disabled={!isValidSplit}
                onClick={handleConfirmSplit}>
                确认拆分并通知供应商
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal title="驳回订单" open={rejectOpen}
        onCancel={() => { setRejectOpen(false); setRejectReason(''); setRejectFiles([]); }}
        onOk={handleReject} okText="确认驳回" okButtonProps={{ danger: true, disabled: !rejectReason.trim() }} cancelText="取消">
        <Alert type="warning" showIcon title="驳回后品牌方将收到通知，需修改后重新提交。请务必填写具体原因。" style={{ marginBottom: 12 }} />
        <Text strong style={{ display: 'block', marginBottom: 8 }}>驳回原因（必填）：</Text>
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {REJECT_PRESETS.map(p => (
            <Tag key={p} style={{ cursor: 'pointer', fontSize: 12 }}
              color={rejectReason.includes(p) ? 'blue' : 'default'}
              onClick={() => setRejectReason(appendRejectPreset(rejectReason, p))}>
              {rejectReason.includes(p) && '✓ '}{p}
            </Tag>
          ))}
        </div>
        <Input.TextArea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="点击上方标签快速选择，或手动输入驳回原因…" />
        <Divider style={{ margin: '12px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 8 }}>补充附件（选填）：</Text>
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={(file) => {
            setRejectFiles(prev => [...prev, { name: file.name, size: file.size }]);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} size="small">选择文件</Button>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>支持图片、PDF、文档</Text>
        </Upload>
        {rejectFiles.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 120, overflow: 'auto' }}>
            {rejectFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: '#fafafa', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                <Space size={4}>
                  <PaperClipOutlined style={{ color: '#999' }} />
                  <Text>{f.name}</Text>
                  <Text type="secondary">({(f.size / 1024).toFixed(0)} KB)</Text>
                </Space>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}
                  onClick={() => setRejectFiles(prev => prev.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Batch Reject Modal ── */}
      <Modal title={`批量驳回（${selectedRowKeys.length} 条）`} open={batchRejectOpen}
        onCancel={() => { setBatchRejectOpen(false); setBatchRejectReason(''); setBatchRejectFiles([]); }}
        onOk={handleBatchReject} okText="确认驳回" okButtonProps={{ danger: true, disabled: !batchRejectReason.trim() }} cancelText="取消">
        <Alert type="warning" showIcon title="批量驳回将同时通知所有相关品牌方。请确保驳回原因适用于全部选中订单。" style={{ marginBottom: 12 }} />
        <Text strong style={{ display: 'block', marginBottom: 8 }}>驳回原因（必填）：</Text>
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {REJECT_PRESETS.map(p => (
            <Tag key={p} style={{ cursor: 'pointer', fontSize: 12 }}
              color={batchRejectReason.includes(p) ? 'blue' : 'default'}
              onClick={() => setBatchRejectReason(appendRejectPreset(batchRejectReason, p))}>
              {batchRejectReason.includes(p) && '✓ '}{p}
            </Tag>
          ))}
        </div>
        <Input.TextArea rows={4} value={batchRejectReason} onChange={e => setBatchRejectReason(e.target.value)}
          placeholder="点击上方标签快速选择，或手动输入驳回原因…" />
        <Divider style={{ margin: '12px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 8 }}>补充附件（选填）：</Text>
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={(file) => {
            setBatchRejectFiles(prev => [...prev, { name: file.name, size: file.size }]);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} size="small">选择文件</Button>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>支持图片、PDF、文档</Text>
        </Upload>
        {batchRejectFiles.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 120, overflow: 'auto' }}>
            {batchRejectFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: '#fafafa', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                <Space size={4}>
                  <PaperClipOutlined style={{ color: '#999' }} />
                  <Text>{f.name}</Text>
                  <Text type="secondary">({(f.size / 1024).toFixed(0)} KB)</Text>
                </Space>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}
                  onClick={() => setBatchRejectFiles(prev => prev.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Reduce Modal ── */}
      <Modal title={`砍单 — ${reduceOrder?.orderNo || ''}`} open={!!reduceOrder}
        onCancel={() => { setReduceOrder(null); setReduceSubData({}); }} width={680}
        footer={[
          <Button key="cancel" onClick={() => { setReduceOrder(null); setReduceSubData({}); }}>取消</Button>,
          <Button key="confirm" type="primary" danger onClick={handleReduce}>确认砍单</Button>,
        ]}>
        {reduceOrder && (() => {
          const subs = reduceOrder.subOrders || [];
          return (
            <>
              <Descriptions column={3} size="small" bordered style={{ marginBottom: 12 }}>
                <Descriptions.Item label="品牌方">{reduceOrder.brandName}</Descriptions.Item>
                <Descriptions.Item label="订单总量">{reduceOrder.totalQuantity.toLocaleString()} 张</Descriptions.Item>
                <Descriptions.Item label="子订单数">{subs.length} 个</Descriptions.Item>
              </Descriptions>
              {subs.length > 0 ? (
                <>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>逐个子订单削减：</Text>
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>供应商</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>当前数量</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>已生产</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', width: 150 }}>削减数量</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>砍后</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subs.map((so: any) => {
                          const data = reduceSubData[so.id] || {};
                          const produced = ['待接单', '已接单'].includes(so.status) ? 0 : so.status === '生产中' ? Math.ceil(so.quantity * 0.5) : so.quantity;
                          return (
                            <tr key={so.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                              <td style={{ padding: '6px 10px' }}><Text>{so.supplierName}</Text><Tag style={{ fontSize: 10, marginLeft: 4 }}>{so.status}</Tag></td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{so.quantity.toLocaleString()}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}><Text type="secondary">{produced.toLocaleString()}</Text></td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                <InputNumber size="small" min={0} max={so.quantity} style={{ width: 110 }}
                                  value={data.qty || undefined}
                                  onChange={v => setReduceSubData(prev => ({ ...prev, [so.id]: { ...prev[so.id], qty: v || 0 } }))} />
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                <Text strong>{(so.quantity - (data.qty || 0)).toLocaleString()}</Text>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const total = Object.values(reduceSubData).reduce((s: number, v: any) => s + (v.qty || 0), 0);
                    return total > 0 ? (
                      <Alert type="info" showIcon style={{ marginBottom: 12 }}
                        title={`合计削减 ${total.toLocaleString()} 张（${((total / reduceOrder.totalQuantity) * 100).toFixed(1)}%），剩余 ${(reduceOrder.totalQuantity - total).toLocaleString()} 张`} />
                    ) : null;
                  })()}
                  <Alert type="warning" showIcon title="请与品牌方及供应商线下沟通后执行" style={{ marginBottom: 12 }} />
                  <div style={{ padding: 12, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>💰 成本归因与分摊（按子订单独立配置）</Text>
                    {subs.map((so: any) => {
                      const data = reduceSubData[so.id] || {};
                      if (!data.qty || data.qty <= 0) return null;
                      const bearers: string[] = data.costBearers || [];
                      return (
                        <div key={so.id} style={{ marginBottom: 10, padding: '8px 10px', background: '#fff', borderRadius: 4, border: '1px solid #f0f0f0' }}>
                          <Text strong style={{ fontSize: 12 }}>{so.supplierName}</Text>
                          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>削减 {data.qty.toLocaleString()} 张</Text>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>责任方：</Text>
                            <Checkbox.Group
                              options={['品牌方', '平台方', '供应商']}
                              value={bearers}
                              onChange={(v) => setReduceSubData(prev => ({ ...prev, [so.id]: { ...prev[so.id], costBearers: v }}))}
                            />
                          </div>
                          {bearers.length > 0 && (
                            <Row gutter={6} style={{ marginTop: 6 }}>
                              {bearers.includes('品牌方') && <Col span={8}><InputNumber size="small" style={{ width: '100%' }} min={0} placeholder="品牌方" value={data.costBrand} onChange={v => setReduceSubData(prev => ({ ...prev, [so.id]: { ...prev[so.id], costBrand: v }}))} prefix="¥" /></Col>}
                              {bearers.includes('平台方') && <Col span={8}><InputNumber size="small" style={{ width: '100%' }} min={0} placeholder="平台方" value={data.costPlatform} onChange={v => setReduceSubData(prev => ({ ...prev, [so.id]: { ...prev[so.id], costPlatform: v }}))} prefix="¥" /></Col>}
                              {bearers.includes('供应商') && <Col span={8}><InputNumber size="small" style={{ width: '100%' }} min={0} placeholder="供应商" value={data.costSupplier} onChange={v => setReduceSubData(prev => ({ ...prev, [so.id]: { ...prev[so.id], costSupplier: v }}))} prefix="¥" /></Col>}
                            </Row>
                          )}
                          <Input.TextArea size="small" rows={1} placeholder="备注（选填）" style={{ marginTop: 6 }} value={data.costNote || ''} onChange={e => setReduceSubData(prev => ({ ...prev, [so.id]: { ...prev[so.id], costNote: e.target.value }}))} />
                        </div>
                      );
                    })}
                  </div>

                </>
              ) : (
                <Alert type="warning" showIcon title="该订单未拆分，不支持按子订单削减。建议使用取消操作。" style={{ marginBottom: 12 }} />
              )}
            </>
          );
        })()}
      </Modal>

      {/* ── Cancel Modal ── */}
      <Modal title={`取消订单 — ${cancelOrder?.orderNo || ""}`} open={!!cancelOrder}
        onCancel={() => { setCancelOrder(null); setCancelSubSelections({}); }}
        onOk={handleCancel} okText="确认取消选中子订单" okButtonProps={{ danger: true }}
        width={640}>
        {cancelOrder && (() => {
          const subs = cancelOrder.subOrders || [];
          const selectedIds = Object.entries(cancelSubSelections).filter(([_, v]) => v.selected).map(([k]) => k);
          return (
            <>
              {subs.length === 0 ? (
                <Alert type="info" showIcon title="该订单未拆分，取消将移除整个订单。" style={{ marginBottom: 16 }} />
              ) : (
                <>
                  <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
                    <Descriptions.Item label="订单号"><Text code>{cancelOrder.orderNo}</Text></Descriptions.Item>
                    <Descriptions.Item label="品牌方">{cancelOrder.brandName}</Descriptions.Item>
                  </Descriptions>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>选择要取消的子订单：</Text>
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          <th style={{ padding: '6px 10px', width: 40 }}>选择</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>供应商</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>数量</th>
                          <th style={{ padding: '6px 10px' }}>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subs.map((so: any) => {
                          const sel = cancelSubSelections[so.id];
                          const isNonCancellable = ['已签收', '已取消'].includes(so.status);
                          return (
                            <tr key={so.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                              <td style={{ padding: '6px 10px' }}>
                                <Checkbox checked={sel?.selected || false} disabled={isNonCancellable}
                                  onChange={e => setCancelSubSelections(prev => ({ ...prev, [so.id]: { ...prev[so.id], selected: e.target.checked } }))} />
                              </td>
                              <td style={{ padding: '6px 10px' }}><Text>{so.supplierName}</Text></td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{so.quantity.toLocaleString()} 张</td>
                              <td style={{ padding: '6px 10px' }}><Tag color={statusMap[so.status]?.color} style={{ fontSize: 10 }}>{so.status}</Tag></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selectedIds.length > 0 && (
                    <div style={{ padding: 12, background: '#fff2f0', borderRadius: 6, border: '1px solid #ffccc7', marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 12, color: '#ff4d4f', display: 'block', marginBottom: 4 }}>
                        将取消 {selectedIds.length} 个子订单，合计 {subs.filter(s => selectedIds.includes(s.id)).reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} 张
                      </Text>
                      {selectedIds.length >= subs.length && (
                        <Text type="secondary" style={{ fontSize: 11 }}>（全部子订单将被取消，订单状态变为「已取消」）</Text>
                      )}
                    </div>
                  )}
                  <div style={{ padding: 12, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>💰 成本归因（按子订单独立配置）</Text>
                    {subs.filter((so: any) => selectedIds.includes(so.id)).map((so: any) => {
                      const sel = cancelSubSelections[so.id] || {};
                      const bearers: string[] = sel.costBearers || [];
                      return (
                        <div key={so.id} style={{ marginBottom: 10, padding: '8px 10px', background: '#fff', borderRadius: 4, border: '1px solid #f0f0f0' }}>
                          <Text strong style={{ fontSize: 12 }}>{so.supplierName}</Text>
                          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{so.quantity.toLocaleString()} 张</Text>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>责任方：</Text>
                            <Checkbox.Group
                              options={['品牌方', '平台方', '供应商']}
                              value={bearers}
                              onChange={(v) => setCancelSubSelections(prev => ({ ...prev, [so.id]: { ...prev[so.id], costBearers: v }}))}
                            />
                          </div>
                          {bearers.length > 0 && (
                            <Row gutter={6} style={{ marginTop: 6 }}>
                              {bearers.includes('品牌方') && <Col span={8}><InputNumber size="small" style={{ width: '100%' }} min={0} placeholder="品牌方" value={sel.costBrand} onChange={v => setCancelSubSelections(prev => ({ ...prev, [so.id]: { ...prev[so.id], costBrand: v }}))} prefix="¥" /></Col>}
                              {bearers.includes('平台方') && <Col span={8}><InputNumber size="small" style={{ width: '100%' }} min={0} placeholder="平台方" value={sel.costPlatform} onChange={v => setCancelSubSelections(prev => ({ ...prev, [so.id]: { ...prev[so.id], costPlatform: v }}))} prefix="¥" /></Col>}
                              {bearers.includes('供应商') && <Col span={8}><InputNumber size="small" style={{ width: '100%' }} min={0} placeholder="供应商" value={sel.costSupplier} onChange={v => setCancelSubSelections(prev => ({ ...prev, [so.id]: { ...prev[so.id], costSupplier: v }}))} prefix="¥" /></Col>}
                            </Row>
                          )}
                          <Input.TextArea size="small" rows={1} placeholder="备注（选填）" style={{ marginTop: 6 }} value={sel.costNote || ''} onChange={e => setCancelSubSelections(prev => ({ ...prev, [so.id]: { ...prev[so.id], costNote: e.target.value }}))} />
                        </div>
                      );
                    })}
                    {selectedIds.length === 0 && <Text type="secondary" style={{ fontSize: 11 }}>请先勾选要取消的子订单</Text>}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </Modal>


      <Modal title={`转供应商 — ${transferOrder?.orderNo || ''}`} open={!!transferOrder}
        onCancel={() => { setTransferOrder(null); setTransferSubOrderId(''); setTransferTargetSupplier(null); }} width={560}
        onOk={handleTransferSupplier} okText="确认转出" okButtonProps={{ disabled: !transferSubOrderId || !transferTargetSupplier }}>
        {transferOrder && (() => {
          const subs = transferOrder.subOrders || [];
          const currentSub = subs.find((so: any) => so.id === transferSubOrderId);
          return (
            <>
              <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="品牌方">{transferOrder.brandName}</Descriptions.Item>
                <Descriptions.Item label="订单状态"><Tag color={statusMap[transferOrder.status]?.color}>{transferOrder.status}</Tag></Descriptions.Item>
                <Descriptions.Item label="总量">{transferOrder.totalQuantity.toLocaleString()} 张</Descriptions.Item>
                <Descriptions.Item label="子订单数">{subs.length} 个</Descriptions.Item>
              </Descriptions>

              <Text strong style={{ display: 'block', marginBottom: 8 }}>选择要转出的子订单：</Text>
              <Select
                style={{ width: '100%', marginBottom: 16 }}
                placeholder="选择子订单"
                value={transferSubOrderId || undefined}
                onChange={v => { setTransferSubOrderId(v); setTransferTargetSupplier(null); }}
                options={subs
                  .filter((so: any) => !['已签收', '已取消'].includes(so.status))
                  .map((so: any) => ({
                    value: so.id,
                    label: `${so.orderNo} — ${so.supplierName}（${so.quantity.toLocaleString()}张，${so.status}）`,
                  }))}
              />

              {transferSubOrderId && (
                <>
                  <Alert type="info" showIcon
                    title={`当前供应商：${currentSub?.supplierName}，数量 ${currentSub?.quantity?.toLocaleString()} 张，状态 ${currentSub?.status}`}
                    style={{ marginBottom: 16 }} />
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>目标供应商：</Text>
                  <Select
                    style={{ width: '100%' }} showSearch
                    placeholder="选择目标供应商"
                    value={transferTargetSupplier || undefined}
                    onChange={v => setTransferTargetSupplier(v)}
                    filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false}
                    options={suppliers
                      .filter(s => s.status === 'ACTIVE' && s.id !== currentSub?.supplierId)
                      .map(s => {
                        const w = getSupplierWorkload(s.id, orders);
                        return {
                          value: s.id,
                          label: `${s.name}（${w.activeOrders}单·${(w.pendingQty / 10000).toFixed(1)}万待产）`,
                        };
                      })}
                  />
                </>
              )}
            </>
          );
        })()}
      </Modal>

      {/* ─── 使用说明书 Modal ─── */}
      <Modal
        title={<Space><BookOutlined /> 订单管理使用说明书</Space>}
        open={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        width={800}
        footer={<Button type="primary" onClick={() => setGuideModalOpen(false)}>关闭</Button>}
      >
        <div style={{ fontSize: 13, lineHeight: 1.9, maxHeight: '60vh', overflow: 'auto', paddingRight: 8 }}>
          <Alert
            title="本文档面向平台运营人员，介绍订单管理的完整操作流程，包括审核、拆单、取消、砍单、转供应商及批量操作。"
            type="info" showIcon style={{ marginBottom: 20, borderRadius: 6 }}
          />

          {/* 一、页面概览 */}
          <Text strong style={{ fontSize: 15 }}>一、页面概览</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>统计卡片区</Text>
            <p style={{ margin: '4px 0 0' }}>
              页面顶部提供 6 个统计卡片，快速了解当日审核情况：<Text code>待审核</Text>（可点击筛选）、
              <Text code>已驳回</Text>、<Text code>已审核</Text>、<Text code>今日新增</Text>、
              <Text code style={{ background: '#fff2f0' }}>超24h未审</Text>（红色高亮警告）、<Text code>订单总量</Text>。
            </p>
          </div>
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>筛选与搜索</Text>
            <p style={{ margin: '4px 0 0' }}>
              支持按<Text code>订单状态</Text>、<Text code>订单类型</Text>（大货单/补单/免费单）、<Text code>品牌</Text>、
              <Text code>提交时间范围</Text>筛选。搜索框支持订单号、品牌名、工厂名模糊匹配。点击「重置」可清空所有筛选条件。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>工具栏</Text>
            <p style={{ margin: '4px 0 0' }}>
              <Tag color="blue">批量审核通过</Tag> 将所选待审核订单一键通过。
              <Tag color="red">批量驳回</Tag> 提供 8 种预设驳回原因（如"模板与实物不符""编码格式错误"等），
              支持上传图片/PDF/文档作为附件，驳回理由将记录在订单的时间线中。
            </p>
          </div>

          {/* 二、订单审核流程 */}
          <Text strong style={{ fontSize: 15 }}>二、订单审核流程</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>审核弹窗</Text>
            <p style={{ margin: '4px 0 0' }}>
              点击订单行的<Button type="primary" size="small">审核</Button>按钮，打开审核弹窗。左侧为审核清单，右侧为模板/画稿 SVG 预览（支持 50%-200% 缩放）。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              审核清单包含基础检查项。运营人员可根据品牌方线下沟通情况，勾选<Text strong style={{ color: '#ff4d4f' }}>「标记为加急」</Text>或
              <Text strong>「标记为免费单」</Text>。勾选后系统自动追加对应的检查项（加急：品牌方确认 + 产能检查；免费单：金额为 0 确认）。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              审核通过后，标记信息会写入订单并在时间线中记录。订单列表中将以红色<Text code style={{ color: '#ff4d4f' }}>加急</Text>和绿色<Text code style={{ color: '#52c41a' }}>免费</Text>标签展示。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>拆单操作</Text>
            <p style={{ margin: '4px 0 0' }}>
              审核通过后，订单状态变为<Text code>已审核</Text>。对已审核订单点击<Button size="small" icon={<BranchesOutlined />}>拆单</Button>，
              可将总数量分配到多个供应商。系统提供快捷均分按钮（等分2/3/4），也可手动逐个分配。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              拆单完成后，每个子订单将独立流转：<Tag>待接单</Tag> → <Tag color="blue">已接单</Tag> → <Tag color="orange">生产中</Tag> → <Tag color="green">生产完成</Tag> → 发货签收。
            </p>
          </div>

          {/* 三、订单操作 */}
          <Text strong style={{ fontSize: 15 }}>三、订单操作（取消 / 砍单 / 转供应商）</Text>

          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>取消订单</Text>
            <p style={{ margin: '4px 0 0' }}>
              运营人员可在任意非终态（已取消/已驳回除外）取消订单。对于已拆分的订单，支持<Text strong>选择部分子订单</Text>取消，
              未选中的子订单保持原有状态继续流转。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              <Text strong style={{ color: '#ff4d4f' }}>成本归因</Text>：每个被取消的子订单独立配置责任方（品牌方/平台方/供应商可多选）、
              各方承担金额及备注。选中全部子订单则订单状态变为<Text code>已取消</Text>。
            </p>
          </div>

          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>砍单（削减数量）</Text>
            <p style={{ margin: '4px 0 0' }}>
              适用于订单成立后需要削减部分数量的场景。弹窗中列出所有子订单及其<Text code>当前数量</Text>、<Text code>已生产数量</Text>（生产中按 50% 估算），
              逐个子订单输入削减数量，系统自动计算核减后数量。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              <Text strong style={{ color: '#ff4d4f' }}>成本归因</Text>：每个有削减的子订单独立配置责任方和金额，
              不同于之前的全局统一配置。削减数量不能为 0（请至少为一个子订单输入削减数量）。
            </p>
          </div>

          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>转供应商</Text>
            <p style={{ margin: '4px 0 0' }}>
              将某个子订单从当前供应商转给其他可用供应商。弹窗中选择要转出的子订单（系统自动列出可转出的子订单），
              然后选择目标供应商（仅显示活跃状态且非当前供应商）。确认后子订单的供应商信息更新。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              仅当订单有子订单且不在终态（已取消/已发货/已签收/已驳回）时显示此按钮。
            </p>
          </div>

          {/* 四、订单状态流转 */}
          <Text strong style={{ fontSize: 15 }}>四、订单状态流转</Text>
          <div style={{ overflow: 'auto', margin: '12px 0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>状态</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>含义</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>可操作</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag>待审核</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>品牌方已提交，等待运营审核</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>审核通过 / 驳回</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>超 24h 高亮警告</td>
                </tr>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="red">已驳回</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>审核未通过，需品牌方修改后重新提交</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>—</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>详情页显示驳回原因</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="blue">已审核</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>审核通过，待拆分</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>拆单 / 取消 / 砍单</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>必须拆单后才能进入生产环节</td>
                </tr>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="cyan">已拆分</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>订单已拆分为子订单，等待供应商接单</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>转供应商 / 取消 / 砍单</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>每个子订单独立流转</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="orange">生产中</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>供应商已开始生产</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>取消 / 砍单</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>已生产部分按 50% 估算</td>
                </tr>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="green">已签收</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>全部子订单已签收</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>—</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>终态，不可操作</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="default">已取消</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>订单已被取消</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>—</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>终态，不可操作</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 五、订单详情 */}
          <Text strong style={{ fontSize: 15 }}>五、订单详情页</Text>
          <div style={{ margin: '12px 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <p style={{ margin: '4px 0' }}>点击订单号可进入详情页，查看以下信息：</p>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li><Text strong>加急/免费标签</Text>：标题栏标注订单特殊属性</li>
              <li><Text strong>驳回原因</Text>：已驳回订单以黄色警告条显示驳回原因</li>
              <li><Text strong>状态时间线</Text>：完整记录订单从提交到最终状态的每一步操作（含驳回原因、取消原因等详情）</li>
              <li><Text strong>子订单进度</Text>：每个子订单独立展示 <Text code>生产进度</Text>、<Text code>发货进度</Text>、<Text code>签收进度</Text> 进度条</li>
              <li><Text strong>发货物流</Text>：已发货/已签收的子订单展示物流追踪表，含快递单号、批次号、签收时间、签收单号等，支持下载快递单和签收单</li>
            </ul>
          </div>

          {/* 六、常见问题 */}
          <Text strong style={{ fontSize: 15 }}>六、常见问题</Text>
          <div style={{ margin: '12px 0 16px' }}>
            <Text strong>Q: 取消订单和砍单有什么区别？</Text>
            <p style={{ margin: '4px 0 12px' }}>
              A: <Text strong>取消</Text>是彻底废除子订单（或整个订单），被取消的子订单不继续生产。
              <Text strong>砍单</Text>是削减部分数量，剩余数量继续生产。砍单后订单仍可正常流转。
              两者都支持按子订单独立配置成本归因。
            </p>

            <Text strong>Q: 为什么有些订单没有「转供应商」按钮？</Text>
            <p style={{ margin: '4px 0 12px' }}>
              A: 转供应商仅适用于<Text strong>已拆分且有子订单</Text>的订单，并且订单不能处于终态（已取消/已发货/已签收/已驳回）。
              如果订单未拆分，请先拆单。
            </p>

            <Text strong>Q: 驳回订单时可以上传附件吗？</Text>
            <p style={{ margin: '4px 0 12px' }}>
              A: 可以。单条驳回和批量驳回都支持上传图片、PDF、文档等附件。驳回原因支持 8 种预设标签，点击即可追加到文本框（不重复添加）。
            </p>

            <Text strong>Q: 订单详情页的进度条是如何计算的？</Text>
            <p style={{ margin: '4px 0 12px' }}>
              A: 生产进度 = 已生产 ÷ 子订单总量；发货进度 = 已发货 ÷ 子订单总量；签收进度 = 已签收 ÷ 子订单总量。
              这些数据来源于发货物流记录，未发货的子订单进度为 0。
            </p>

            <Text strong>Q: 批量操作有什么限制？</Text>
            <p style={{ margin: '4px 0 0' }}>
              A: 批量操作仅对<Text strong>当前筛选结果中的待审核订单</Text>生效。先勾选订单行，再点击「批量审核通过」或「批量驳回」。
              如果选中的订单中有非待审核状态的，系统会自动过滤，仅操作符合条件者。
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
}
