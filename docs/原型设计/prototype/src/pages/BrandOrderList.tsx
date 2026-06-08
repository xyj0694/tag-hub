import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, Select, DatePicker, Space, Typography, Input, Popconfirm, message } from 'antd';
import { DownloadOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orders as mockOrders, purchaserAccounts } from '../data/mock';
import { useBrandContext } from '../data/BrandContext';
import type { Order } from '../data/mock';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

const typeColors: Record<string, string> = { '大货单': 'blue', '补单': 'orange', '免费单': 'green' };

export default function BrandOrderList() {
  const navigate = useNavigate();
  const { currentBrandId, currentBrandName } = useBrandContext();

  // 本地订单数据（可变更状态）
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [purchaserFilter, setPurchaserFilter] = useState<string>('all');

  // 取消订单
  const handleCancel = (orderId: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: '已取消' } : o));
    message.success('订单已取消');
  };

  // 过滤 + 排序
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // 品牌（来自全局顶栏切换器）
    if (currentBrandId !== 0) {
      list = list.filter(o => o.brandName === currentBrandName);
    }

    // 状态
    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }

    // 类型
    if (typeFilter !== 'all') {
      list = list.filter(o => o.type === typeFilter);
    }

    // 日期范围
    if (dateRange && dateRange[0] && dateRange[1]) {
      const from = dateRange[0].startOf('day').valueOf();
      const to = dateRange[1].endOf('day').valueOf();
      list = list.filter(o => {
        const t = dayjs(o.createdAt).valueOf();
        return t >= from && t <= to;
      });
    }

    // 采购人
    if (purchaserFilter !== 'all') {
      list = list.filter(o => o.createdBy === purchaserFilter);
    }

    // 搜索
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(o =>
        o.orderNo.toLowerCase().includes(q) ||
        o.brandName.toLowerCase().includes(q)
      );
    }

    // 排序：创建时间越近越靠前
    list.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

    return list;
  }, [orders, currentBrandId, currentBrandName, statusFilter, typeFilter, dateRange, searchText, purchaserFilter]);

  const handleExport = () => {
    message.success(`已导出 ${filteredOrders.length} 条订单列表数据（模拟）
导出字段：订单号、品牌、工厂、类型、标签类型、数量、状态、创建时间`);
  };

  const columns = [
    {
      title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180,
      render: (t: string, r: Order) => (
        <a onClick={() => navigate('/brand/orders/' + r.id)} style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</a>
      ),
    },
    { title: '品牌', dataIndex: 'brandName', key: 'brand', width: 150, ellipsis: true },
    { title: '工厂', dataIndex: 'factoryName', key: 'factory', width: 100, ellipsis: true },
    { title: '下单人', dataIndex: 'createdBy', key: 'createdBy', width: 120, ellipsis: true, render: (t: string) => t ? <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text> : <Text type="secondary">—</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 70, render: (t: string) => <Tag color={typeColors[t] || 'default'}>{t}</Tag> },
    { title: '标签类型', dataIndex: 'tagType', key: 'tagType', width: 120 },
    {
      title: '数量', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 100,
      render: (v: number) => <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => {
        const m = statusMap[s] || { color: 'default', text: s };
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, record: Order) => {
        const canCancel = record.status === '待审核';
        return (
          <Space size="small">
            <Button size="small" type="link" onClick={() => navigate('/brand/orders/' + record.id)}>详情</Button>
            {canCancel && (
              <Popconfirm
                title="确认取消订单？"
                description="取消后不可恢复，如有疑问请联系平台运营。"
                onConfirm={() => handleCancel(record.id)}
                okText="确认取消"
                cancelText="再想想"
              >
                <Button size="small" type="link" danger>取消</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>订单列表</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/brand/order-create')}>创建订单</Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索订单号或品牌"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select placeholder="全部状态" style={{ width: 130 }} value={statusFilter} onChange={setStatusFilter}
            options={[
              { value: 'all', label: '全部状态' },
              ...Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text })),
            ]} />
          <Select placeholder="采购人" style={{ width: 160 }} value={purchaserFilter} onChange={setPurchaserFilter}
            options={[
              { value: 'all', label: '全部采购人' },
              ...purchaserAccounts.map(p => ({ value: p.name, label: p.name })),
            ]} />
          <Select placeholder="全部类型" style={{ width: 110 }} value={typeFilter} onChange={setTypeFilter}
            options={[
              { value: 'all', label: '全部类型' },
              { value: '大货单', label: '大货单' },
              { value: '补单', label: '补单' },
            ]} />
          <RangePicker
            placeholder={['创建时间 从', '到']}
            value={dateRange}
            onChange={v => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
          <Button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setPurchaserFilter('all'); setDateRange(null); setSearchText(''); }}>
            重置筛选
          </Button>
        </Space>

        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
          共 {filteredOrders.length} 条订单
        </Text>

        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          size="middle"
          pagination={{
            pageSize: 15,
            showTotal: (t) => `共 ${t} 条订单`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '20', '50'],
          }}
        />
      </Card>
    </div>
  );
}
