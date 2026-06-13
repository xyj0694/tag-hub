import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, Select, DatePicker, Space, Typography, Input, Popconfirm, message, Alert, Modal, theme, Upload } from "antd";
import { DownloadOutlined, PlusOutlined, SearchOutlined, BookOutlined, InboxOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  const { token } = theme.useToken();
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [epcModalOpen, setEpcModalOpen] = useState(false);
  const [epcTargetOrder, setEpcTargetOrder] = useState<Order | null>(null);
  const [epcUploaded, setEpcUploaded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [purchaserFilter, setPurchaserFilter] = useState<string>('all');


  const handleEpcUpload = (file: File) => {
    const isAccepted = file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.txt');
    if (!isAccepted) {
      message.error('仅支持 .xlsx / .csv / .txt 格式');
      return false;
    }
    setEpcUploaded(true);
    message.success(`已为订单 ${epcTargetOrder?.orderNo} 上传唯一码数据（模拟）`);
    return false;
  };

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
      title: 'SKU', key: 'skuInfo', width: 160, ellipsis: true,
      render: (_: any, r: Order) => {
        if (r.subOrders && r.subOrders.length > 0) {
          const uniqueSkus = [...new Set(r.subOrders.map(so => so.sku))];
          return (
            <div>
              <Text style={{ fontSize: 12 }}>{uniqueSkus.length} 个SKU</Text>
              {uniqueSkus.length <= 2 ? (
                <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                  {uniqueSkus.map(s => <Text key={s} code style={{ fontSize: 10 }}>{s}</Text>)}
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{uniqueSkus.slice(0, 2).join(', ')}...</Text>
              )}
            </div>
          );
        }
        return r.sku ? <Text code style={{ fontSize: 11 }}>{r.sku}</Text> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: '数据来源', dataIndex: 'dataSource', key: 'dataSource', width: 90,
      render: (v: string) => v === 'customer'
        ? <Tag color="orange">客户自导</Tag>
        : <Tag color="blue">平台生成</Tag>,
    },
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
      title: '操作', key: 'actions', width: 200,
      render: (_: any, record: Order) => {
        const canCancel = record.status === '待审核';
        return (
          <Space size="small">
            <Button size="small" type="link" onClick={() => navigate('/brand/orders/' + record.id)}>详情</Button>
            {record.dataSource === 'customer' && record.status === '待审核' && (
              <Button size="small" type="link" onClick={() => { setEpcTargetOrder(record); setEpcUploaded(false); setEpcModalOpen(true); }}>上传唯一码</Button>
            )}
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
        <Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>订单列表</Title>
        <Space>
          <Button icon={<BookOutlined />} onClick={() => setGuideModalOpen(true)}>使用说明书</Button>
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
      {/* ─── 上传唯一码 Modal ─── */}
      <Modal
        title={<Space><UploadOutlined /> 上传唯一码 — {epcTargetOrder?.orderNo}</Space>}
        open={epcModalOpen}
        onCancel={() => setEpcModalOpen(false)}
        width={640}
        footer={epcUploaded ? (
          <Space>
            <Button onClick={() => setEpcModalOpen(false)}>关闭</Button>
            <Button type="primary" onClick={() => { message.success('唯一码数据已提交'); setEpcModalOpen(false); }}>确认提交</Button>
          </Space>
        ) : (
          <Button onClick={() => setEpcModalOpen(false)}>取消</Button>
        )}
      >
        {!epcUploaded ? (
          <div>
            <Alert
              type="info" showIcon style={{ marginBottom: 16, borderRadius: 6 }}
              title={`即将为订单 ${epcTargetOrder?.orderNo}（${epcTargetOrder?.brandName} / ${epcTargetOrder?.tagType} / ${epcTargetOrder?.totalQuantity?.toLocaleString()} 张）补充唯一码数据`}
            />
            <Upload.Dragger
              accept=".xlsx,.csv,.txt"
              showUploadList={false}
              beforeUpload={handleEpcUpload}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined style={{ fontSize: 40, color: '#1677ff' }} /></p>
              <p className="ant-upload-text">点击或拖拽唯一码数据文件</p>
              <p className="ant-upload-hint">支持 .xlsx / .csv / .txt，单文件 ≤ 200MB</p>
            </Upload.Dragger>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
            <br />
            <Text strong style={{ fontSize: 15 }}>上传成功</Text>
            <br />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              唯一码数据已关联到订单 {epcTargetOrder?.orderNo}，<br />点击「确认提交」完成。
            </Text>
          </div>
        )}
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
            title="本文档面向品牌方采购人员，介绍订单的创建、查看、导出与取消等操作流程。"
            type="info" showIcon style={{ marginBottom: 20, borderRadius: 6 }}
          />
          <Text strong style={{ fontSize: 15 }}>一、页面概览</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>创建订单</Text>
            <p style={{ margin: '4px 0 0' }}>
              点击右上角<Button type="primary" size="small" icon={<PlusOutlined />}>创建订单</Button>按钮，进入下单页面。
              系统支持两种下单路径：<Text code>模板下单</Text>（选择已有模板填写 SKU 和数量）与
              <Text code>即时下单</Text>（直接填写 SKU 和数量，模板后续补齐）。
            </p>
          </div>
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>筛选与搜索</Text>
            <p style={{ margin: '4px 0 0' }}>
              支持按<Text code>订单状态</Text>、<Text code>订单类型</Text>（大货单/补单/免费单）、
              <Text code>创建时间</Text>筛选。搜索框支持订单号、品牌名、工厂名模糊匹配。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>导出 Excel</Text>
            <p style={{ margin: '4px 0 0' }}>
              点击<Button size="small" icon={<DownloadOutlined />}>导出 Excel</Button>可导出当前筛选结果，
              导出字段包括订单号、品牌、工厂、类型、标签类型、数量、状态、创建时间。
            </p>
          </div>
          <Text strong style={{ fontSize: 15 }}>二、订单状态说明</Text>
          <div style={{ overflow: 'auto', margin: '12px 0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>状态</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>含义</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>说明</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['待审核', '已提交，等待平台运营审核', '可查看详情；审核通过前可取消'],
                  ['已审核', '运营已审核通过', '等待运营拆单转单'],
                  ['生产中', '供应商正在生产标签', '可查看子订单生产进度'],
                  ['部分发货', '部分子订单已发货', '可追踪物流信息'],
                  ['已发货', '全部子订单已发货', '等待签收'],
                  ['已签收', '订单已完成签收', '进入对账流程'],
                  ['已驳回', '运营驳回了订单', '查看驳回原因，修改后重新提交'],
                  ['已取消', '订单已取消', '由品牌方或运营方取消'],
                ].map(([s, m, d]) => (
                  <tr key={s}>
                    <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag>{s}</Tag></td>
                    <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>{m}</td>
                    <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Text strong style={{ fontSize: 15 }}>三、操作说明</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>查看详情</Text>
            <p style={{ margin: '4px 0 0' }}>
              点击订单行的<Button size="small" type="link">详情</Button>按钮，可查看订单基本信息、子订单生产进度和状态时间线。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>取消订单</Text>
            <p style={{ margin: '4px 0 0' }}>
              仅在<Text code>待审核</Text>状态下可取消订单。点击<Button size="small" type="link" danger>取消</Button>后确认即可。
              已审核或后续状态的订单需联系平台运营处理。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
