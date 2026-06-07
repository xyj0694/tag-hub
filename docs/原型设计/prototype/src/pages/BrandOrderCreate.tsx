import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Steps, Select, Button, Table, Input, InputNumber, Alert, Form, Typography, Space, message,
  Cascader, Tag, Radio, AutoComplete, Popover, Descriptions, Divider, Modal,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ArrowLeftOutlined, FileExcelOutlined,
  FileTextOutlined, ThunderboltOutlined, InfoCircleOutlined, DownloadOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { templates, orders, productCatalog } from '../data/mock';
import { regionData } from '../data/regions';
import TemplateThumbnail from '../components/TemplatePreviews';

const { Title, Text } = Typography;

type OrderType = 'NORMAL' | 'REPLENISH';
type CreatePath = 'template' | 'instant' | null;
type SkuRow = { sku: string; quantity: number };

const orderTypeLabels: Record<OrderType, string> = { NORMAL: '大货单', REPLENISH: '补单' };

function matchTemplateForSku(sku: string, tagType: string) {
  let bestOrderTime = '';
  let bestTemplateName = '';
  for (const o of orders) {
    for (const so of o.subOrders) {
      if (so.sku === sku && o.templateName && o.createdAt > bestOrderTime) {
        bestOrderTime = o.createdAt;
        bestTemplateName = o.templateName.replace(/ v\d+$/, '');
      }
    }
  }
  if (bestTemplateName) {
    const t = templates.find(t => t.name === bestTemplateName && t.type === tagType && t.active !== false);
    if (t) return t;
  }
  return templates.find(t => t.type === tagType && t.active !== false) || null;
}

const findProduct = (sku: string) => productCatalog.find(p => p.sku === sku);

const skuOptions = productCatalog.map(p => ({
  value: p.sku,
  searchText: [p.sku, p.name, p.color, p.size, p.styleNo, p.category, p.spec].join(' ').toLowerCase(),
  label: (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <Text code style={{ fontSize: 12 }}>{p.sku}</Text>
      <Text style={{ fontSize: 12 }}>{p.name}</Text>
      <Text type="secondary" style={{ fontSize: 11 }}>{p.color} / {p.size} / {p.styleNo}</Text>
    </div>
  ),
}));

// ====== SkuInputCell: 完全自管理，不依赖父组件 state 更新 ======
const SkuInputCell = memo(function SkuInputCell({
  rowIndex, initialSku, version, onSkuChange,
}: {
  rowIndex: number; initialSku: string; version: number;
  onSkuChange: (index: number, val: string) => void;
}) {
  const [text, setText] = useState(initialSku);
  const prevVersion = useRef(version);

  useEffect(() => {
    if (prevVersion.current !== version) {
      prevVersion.current = version;
      setText(initialSku);
    }
  }, [version, initialSku]);

  const product = findProduct(text);

  return (
    <AutoComplete
      value={text}
      options={skuOptions}
      onChange={(val) => {
        setText(val);
        onSkuChange(rowIndex, val);
      }}
      style={{ width: '100%' }}
      variant="borderless"
      placeholder="输入或搜索 SKU"
      filterOption={(inputValue, option) => {
        if (!inputValue) return true;
        const q = inputValue.toLowerCase();
        return (option as any).searchText.includes(q);
      }}
    >
      <Input
        suffix={product ? (
          <Popover trigger="hover" placement="right" title="商品信息"
            content={
              <Descriptions size="small" column={1} style={{ marginTop: 4 }}>
                <Descriptions.Item label="品名">{product.name}</Descriptions.Item>
                <Descriptions.Item label="规格">{product.spec}</Descriptions.Item>
                <Descriptions.Item label="尺码">{product.size}</Descriptions.Item>
                <Descriptions.Item label="颜色">{product.color}</Descriptions.Item>
                <Descriptions.Item label="款号">{product.styleNo}</Descriptions.Item>
                <Descriptions.Item label="品类">{product.category}</Descriptions.Item>
              </Descriptions>
            }>
            <InfoCircleOutlined style={{ color: '#1677ff', cursor: 'help' }} />
          </Popover>
        ) : (text ? <Text type="secondary" style={{ fontSize: 11 }}>未匹配</Text> : null)}
      />
    </AutoComplete>
  );
});

// ====== TemplateMatchCell ======
const TemplateMatchCell = memo(function TemplateMatchCell({
  sku, templateId, isManualOverride, availableTemplates, rowIndex, onSwitchTemplate,
}: {
  sku: string; templateId: number | null; isManualOverride: boolean;
  availableTemplates: any[]; rowIndex: number;
  onSwitchTemplate: (rowIndex: number, templateId: number) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  if (!sku) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  const t = templateId ? availableTemplates.find(t => t.id === templateId) : null;
  if (!t) return <Tag color="red">无可用模板</Tag>;


  const openModal = () => {
    setPopoverOpen(false);
    setPreviewOpen(true);
  };
  return (
    <Space size={4}>
      <Popover trigger="click" placement="bottom" open={popoverOpen} onOpenChange={setPopoverOpen}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{t.name}</Text>
            <Tag>v{t.version}</Tag>
          </div>
        }
        content={
          <div style={{ width: 420 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 auto', width: 170 }}>
                <TemplateThumbnail type={t.type} fields={t.fields} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <Descriptions size="small" column={1} style={{ marginTop: 4 }}>
                  <Descriptions.Item label="创建日期">{t.createdAt}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={t.active ? 'green' : 'default'}>{t.active ? '启用' : '停用'}</Tag>
                  </Descriptions.Item>
                </Descriptions>
                <Divider style={{ margin: '8px 0' }} />
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>模板字段：</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {t.fields.map((f: any) => (
                    <Tag key={f.name} color={f.required ? 'red' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                      {f.required ? '* ' : ''}{f.label}
                    </Tag>
                  ))}
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <Button size="small" type="primary" block onClick={openModal}>
                  放大预览图稿
                </Button>
              </div>
            </div>
          </div>
        }>
        <Tag color={isManualOverride ? 'blue' : 'green'} style={{ margin: 0, cursor: 'pointer' }}>
          {t.name} v{t.version}
        </Tag>
      </Popover>

      {/* 放大预览 Modal */}
      <Modal
        title={<Space>{t.name} <Tag>v{t.version}</Tag></Space>}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={960}
        centered
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '16px 0' }}>
          <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
            <TemplateThumbnail type={t.type} fields={t.fields} large />
          </div>
          <div style={{ flex: 1 }}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="模板名称">{t.name}</Descriptions.Item>
              <Descriptions.Item label="版本">v{t.version}</Descriptions.Item>
              <Descriptions.Item label="创建日期">{t.createdAt}</Descriptions.Item>
              <Descriptions.Item label="标签类型"><Tag>{t.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={t.active ? 'green' : 'default'}>{t.active ? '启用' : '停用'}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>模板字段</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {t.fields.map((f: any) => (
                <Tag key={f.name} color={f.required ? 'red' : 'default'}>
                  {f.required ? '* ' : ''}{f.label} <Text type="secondary" style={{ fontSize: 11 }}>({f.type})</Text>
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {availableTemplates.length > 1 && (
        <Select size="small" value={undefined}
          style={{ width: 32 }} dropdownMatchSelectWidth={false}
          placeholder={<span style={{ fontSize: 12 }}>切换</span>}
          onChange={(val) => onSwitchTemplate(rowIndex, val)}
          options={availableTemplates.map((t: any) => ({ value: t.id, label: `${t.name} v${t.version}` }))} />
      )}
    </Space>
  );
});

// ====== 主组件 ======
export default function BrandOrderCreate() {
  const navigate = useNavigate();

  const [createPath, setCreatePath] = useState<CreatePath>(null);
  const [current, setCurrent] = useState(0);
  const [tagType, setTagType] = useState<string | undefined>();
  const [orderType, setOrderType] = useState<OrderType>('NORMAL');

  // skuRows state 仅用于校验和提交，不在输入过程中更新
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);
  const skuRowsRef = useRef<SkuRow[]>([]);
  const [importVersion, setImportVersion] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [manualOverrides, setManualOverrides] = useState<Record<number, number>>({});

  const [regionPath, setRegionPath] = useState<string[]>([]);
  const [addressDetail, setAddressDetail] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // sync ref → state for validation
  const syncRows = useCallback(() => {
    setSkuRows([...skuRowsRef.current]);
  }, []);

  const skuTemplateMap = useMemo(() => {
    if (!tagType) return {};
    const map: Record<number, number | null> = {};
    skuRows.forEach((r, i) => {
      const t = matchTemplateForSku(r.sku, tagType!);
      map[i] = t ? t.id : null;
    });
    return map;
  }, [skuRows, tagType]);

  const availableForType = useMemo(
    () => templates.filter(t => t.type === tagType && t.active !== false),
    [tagType]
  );

  const effectiveTemplate = useCallback((rowIdx: number) => {
    const tid = manualOverrides[rowIdx] ?? skuTemplateMap[rowIdx];
    return tid ? templates.find(t => t.id === tid) : null;
  }, [manualOverrides, skuTemplateMap]);

  // 输入时只写 ref，不触发 state 更新 → 不失焦
  const handleSkuChange = useCallback((index: number, val: string) => {
    skuRowsRef.current[index] = { ...skuRowsRef.current[index], sku: val };
    // 不调用 setSkuRows！只在 blur/下一步时同步
  }, []);

  const handleQtyChange = useCallback((index: number, val: number) => {
    skuRowsRef.current[index] = { ...skuRowsRef.current[index], quantity: val || 0 };
  }, []);

  const handleSkuBlur = useCallback(() => {
    syncRows();
  }, [syncRows]);

  const handleSwitchTemplate = useCallback((rowIndex: number, templateId: number) => {
    setManualOverrides(prev => ({ ...prev, [rowIndex]: templateId }));
  }, []);

  const addRow = () => {
    skuRowsRef.current = [...skuRowsRef.current, { sku: '', quantity: 0 }];
    syncRows();
  };

  const removeRow = (i: number) => {
    skuRowsRef.current = skuRowsRef.current.filter((_, idx) => idx !== i);
    syncRows();
    setManualOverrides(prev => {
      const shifted: Record<number, number> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = Number(k);
        if (ki > i) shifted[ki - 1] = v;
        else if (ki < i) shifted[ki] = v;
      });
      return shifted;
    });
  };

  const path1Steps = [{ title: '选择类型' }, { title: '填写 SKU 与数量' }, { title: '收货信息与确认' }];
  const path2Steps = [{ title: '填写 SKU 与数量' }, { title: '收货信息与提交' }];
  const steps = createPath === 'template' ? path1Steps : path2Steps;

  const next = () => {
    syncRows(); // 切换步骤前同步
    setCurrent(current + 1);
  };
  const prev = () => setCurrent(current - 1);

  const resetAndBack = () => {
    setCreatePath(null); setCurrent(0); setTagType(undefined); setOrderType('NORMAL');
    skuRowsRef.current = []; setSkuRows([]); setManualOverrides({});
    setRegionPath([]); setAddressDetail(''); setContactName(''); setContactPhone('');
    setImportedCount(0); setImportVersion(v => v + 1);
  };

  const handleSubmit = () => {
    message.success(
      createPath === 'template'
        ? '订单已提交！状态：待审核，平台运营将尽快处理。'
        : '订单已提交！状态：待补模板，请通知打单员为 SKU 创建标签模板。'
    );
    setTimeout(() => navigate('/brand/orders'), 1500);
  };

  const mockImport = () => {
    const rows: SkuRow[] = [
      { sku: 'BSD-SS25-TEE-001', quantity: 80000 },
      { sku: 'BSD-SS25-TEE-002', quantity: 60000 },
      { sku: 'BSD-SS25-JKT-003', quantity: 45000 },
      { sku: 'BSD-SS25-POL-004', quantity: 30000 },
    ];
    skuRowsRef.current = rows;
    setSkuRows([...rows]);
    setImportedCount(4);
    setImportVersion(v => v + 1);
    message.success('已导入 4 行 SKU 数据');
  };

  // ========== 入口页 ==========
  if (!createPath) {
    return (
      <div style={{ maxWidth: 720 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
          style={{ padding: '4px 0', marginBottom: 24, color: '#666' }}>返回</Button>
        <Title level={4} style={{ marginBottom: 8 }}>创建订单</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>请选择下单方式</Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card hoverable style={{ borderRadius: 8, cursor: 'pointer', border: '1px solid #e8e8e8' }}
            onClick={() => setCreatePath('template')}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <FileTextOutlined style={{ fontSize: 40, color: '#1677ff', marginBottom: 16 }} />
              <Title level={5} style={{ marginBottom: 8 }}>模板下单</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>填写 SKU 后系统自动匹配模板<br />可逐行查看和切换模板</Text>
              <div style={{ marginTop: 16 }}><Tag color="blue">推荐</Tag></div>
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>适用场景：已有模板的常规下单</Text>
            </div>
          </Card>
          <Card hoverable style={{ borderRadius: 8, cursor: 'pointer', border: '1px solid #e8e8e8' }}
            onClick={() => setCreatePath('instant')}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <ThunderboltOutlined style={{ fontSize: 40, color: '#fa8c16', marginBottom: 16 }} />
              <Title level={5} style={{ marginBottom: 8 }}>即时下单</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>仅提供 SKU 和数量即可提交<br />打单员后续补全标签模板</Text>
              <div style={{ marginTop: 16 }}><Tag color="orange">无需模板</Tag></div>
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>适用场景：新品牌接入、临时新增 SKU</Text>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ========== Step content ==========
  const stepContent = () => {
    if (createPath === 'template' && current === 0) {
      return (
        <div style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>标签类型</Text>
            <Select placeholder="选择标签类型" style={{ width: '100%' }} size="large"
              value={tagType} onChange={v => { setTagType(v); setManualOverrides({}); }}
              options={[
                { value: '吊牌标签', label: '吊牌标签' },
                { value: '不干胶贴纸标签', label: '不干胶贴纸标签' },
                { value: '洗麦标签', label: '洗麦标签' },
              ]} />
            {tagType && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                该类型共 {templates.filter(t => t.type === tagType && t.active !== false).length} 个可用模板，系统将根据 SKU 自动匹配
              </Text>
            )}
          </div>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>订单类型</Text>
            <Radio.Group value={orderType} onChange={e => setOrderType(e.target.value)} optionType="button" buttonStyle="solid">
              <Radio.Button value="NORMAL">大货单</Radio.Button>
              <Radio.Button value="REPLENISH">补单</Radio.Button>
            </Radio.Group>
          </div>
          {!tagType && <Alert type="info" showIcon message="请先选择标签类型，下一步填写 SKU 时系统将自动匹配模板" style={{ borderRadius: 6 }} />}
        </div>
      );
    }

    if ((createPath === 'template' && current === 1) || (createPath === 'instant' && current === 0)) {
      const showTemplateCol = createPath === 'template';
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Space>
              <Text strong>SKU 与数量</Text>
              {createPath === 'instant' && <Tag color="orange">提交后打单员将补全模板</Tag>}
              {createPath === 'template' && tagType && <Tag color="blue">系统自动匹配 {tagType} 模板</Tag>}
            </Space>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => setTemplateModalOpen(true)}>下载模板</Button>
              <Button icon={<FileExcelOutlined />} onClick={mockImport}>导入 Excel</Button>
            </Space>
          </div>

          {importedCount > 0 && (
            <Alert type="info" showIcon message={`已从 Excel 导入 ${importedCount} 行数据`}
              style={{ marginBottom: 16, borderRadius: 6 }} closable onClose={() => setImportedCount(0)} />
          )}

          <Table
            dataSource={skuRows.map((r, i) => ({ ...r, key: i }))}
            pagination={false}
            size="middle"
            columns={[
              { title: '#', width: 44,
                render: (_: any, __: any, i: number) => <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}</Text> },
              {
                title: 'SKU', dataIndex: 'sku', width: 200,
                render: (v: string, _: any, i: number) => (
                  <SkuInputCell
                    key={`sku-${i}-v${importVersion}`}
                    rowIndex={i}
                    initialSku={v}
                    version={importVersion}
                    onSkuChange={handleSkuChange}
                  />
                ),
              },
              { title: '数量（张）', dataIndex: 'quantity', width: 130,
                render: (v: number, _: any, i: number) => (
                  <InputNumber
                    defaultValue={v}
                    onChange={val => handleQtyChange(i, val || 0)}
                    onBlur={handleSkuBlur}
                    min={1} style={{ width: '100%' }} variant="borderless" placeholder="0" />) },
              ...(showTemplateCol ? [{
                title: '匹配模板', dataIndex: 'template', width: 260,
                render: (_: any, r: any, i: number) => {
                  const tid = manualOverrides[i] ?? skuTemplateMap[i] ?? null;
                  return (
                    <TemplateMatchCell
                      key={`tmpl-${i}-${tid}`}
                      sku={r.sku} templateId={tid}
                      isManualOverride={manualOverrides[i] !== undefined}
                      availableTemplates={availableForType} rowIndex={i}
                      onSwitchTemplate={handleSwitchTemplate} />
                  );
                },
              }] : []),
              { title: '', width: 40,
                render: (_: any, __: any, i: number) => (
                  <Button type="text" danger icon={<DeleteOutlined />} size="small"
                    onClick={() => removeRow(i)} disabled={skuRows.length === 1} />) },
            ]}
            footer={() => (
              <Button type="dashed" onClick={addRow} icon={<PlusOutlined />} block>添加行</Button>
            )}
            summary={() => skuRows.length > 0 ? (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}><Text strong>合计</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong style={{ fontSize: 15, color: '#1677ff' }}>
                    {skuRows.reduce((s, r) => s + (r.quantity || 0), 0).toLocaleString()} 张
                  </Text>
                </Table.Summary.Cell>
                {showTemplateCol && <Table.Summary.Cell index={2} />}
                <Table.Summary.Cell index={showTemplateCol ? 3 : 2} />
              </Table.Summary.Row>
            ) : undefined}
          />

          {/* 下载模板 Modal */}
          <Modal
            title="Excel 导入模板说明"
            open={templateModalOpen}
            onCancel={() => setTemplateModalOpen(false)}
            width={800}
            footer={
              <Space>
                <Button onClick={() => setTemplateModalOpen(false)}>关闭</Button>
                <Button type="primary" icon={<DownloadOutlined />} onClick={() => { message.success('模板文件已开始下载（模拟）'); setTemplateModalOpen(false); }}>
                  下载 Excel 模板
                </Button>
              </Space>
            }
          >
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <Text strong style={{ fontSize: 14 }}>📋 模板格式</Text>
              <div style={{ background: '#fafafa', borderRadius: 6, padding: 12, margin: '8px 0 16px', fontFamily: 'monospace', fontSize: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e6f7ff', fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #d9d9d9' }}>A</td>
                      <td style={{ padding: '4px 8px', border: '1px solid #d9d9d9' }}>B</td>
                    </tr>
                    <tr style={{ background: '#f0f0f0' }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #d9d9d9', fontWeight: 600 }}>SKU</td>
                      <td style={{ padding: '4px 8px', border: '1px solid #d9d9d9', fontWeight: 600 }}>数量（张）</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#52c41a' }}>BSD-SS25-TEE-001</td><td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#52c41a' }}>80000</td></tr>
                    <tr><td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#52c41a' }}>BSD-SS25-TEE-002</td><td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#52c41a' }}>60000</td></tr>
                    <tr><td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#52c41a' }}>BSD-SS25-JKT-003</td><td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#52c41a' }}>45000</td></tr>
                  </tbody>
                </table>
              </div>

              <Text strong style={{ fontSize: 14 }}>📝 填写说明</Text>
              <ol style={{ margin: '8px 0 16px', paddingLeft: 20 }}>
                <li>第一行为表头，<Text code>SKU</Text> 和 <Text code>数量（张）</Text> 列名不可修改</li>
                <li>SKU 必须与系统中的产品档案完全一致（含大小写、连字符）</li>
                <li>数量必须为 <Text strong>正整数</Text>，不能为空、不能为 0、不能含小数</li>
                <li>Excel 文件格式仅支持 <Text code>.xlsx</Text>，不支持 <Text code>.xls</Text> 或 <Text code>.csv</Text></li>
                <li>单次导入最多 <Text strong>500 行</Text>，超出请分批导入</li>
              </ol>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 14, color: '#52c41a' }}>✅ 正确示例</Text>
                  <div style={{ background: '#f6ffed', borderRadius: 6, padding: 12, margin: '8px 0', fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
                    BSD-SS25-TEE-001&emsp;80000<br />
                    BSD-SS25-TEE-002&emsp;60000<br />
                    BSD-SS25-JKT-003&emsp;45000<br />
                    XZF-SS25-TEE-001&emsp;120000
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>✓ SKU 与系统一致，数量为正整数</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>❌ 常见错误</Text>
                  <div style={{ background: '#fff2f0', borderRadius: 6, padding: 12, margin: '8px 0', fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
                    <span style={{ color: '#ff4d4f' }}>bsd-ss25-tee-001&emsp;80000</span><br />
                    <span style={{ color: '#999' }}>→ 大小写不一致，应写 BSD-SS25-TEE-001</span><br /><br />
                    <span style={{ color: '#ff4d4f' }}>BSD-SS25-TEE-002&emsp;0</span><br />
                    <span style={{ color: '#999' }}>→ 数量不能为 0</span><br /><br />
                    <span style={{ color: '#ff4d4f' }}>BSD-SS25-TEE&emsp;&emsp;&emsp;60000</span><br />
                    <span style={{ color: '#999' }}>→ SKU 不完整，缺少后缀编号</span><br /><br />
                    <span style={{ color: '#ff4d4f' }}>BSD-SS25-JKT-003&emsp;4.5万</span><br />
                    <span style={{ color: '#999' }}>→ 数量含中文/单位，应为纯数字 45000</span>
                  </div>
                </div>
              </div>
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />导入后系统会自动校验，异常行会被跳过并在结果中提示。建议先在模板中填入数据再导入，避免手动逐行录入。
              </Text>
            </div>
          </Modal>
        </div>
      );
    }

    const isLastStep = (createPath === 'template' && current === 2) || (createPath === 'instant' && current === 1);
    if (isLastStep) {
      const totalQty = skuRows.reduce((s, r) => s + (r.quantity || 0), 0);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 15 }}>收货信息</Text>
            <Form layout="vertical">
              <Form.Item label="所在地区" required>
                <Cascader options={regionData} value={regionPath}
                  onChange={(val) => setRegionPath(val as string[])}
                  placeholder="省 / 市 / 区" style={{ width: '100%' }} changeOnSelect />
              </Form.Item>
              <Form.Item label="详细地址" required>
                <Input.TextArea rows={2} placeholder="街道、楼栋、门牌号"
                  value={addressDetail} onChange={e => setAddressDetail(e.target.value)} />
              </Form.Item>
              <Form.Item label="联系人" required>
                <Input placeholder="联系人姓名" value={contactName} onChange={e => setContactName(e.target.value)} />
              </Form.Item>
              <Form.Item label="联系电话" required>
                <Input placeholder="手机号" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </Form.Item>
            </Form>
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 15 }}>订单摘要</Text>
            <Card size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {createPath === 'template' && (<>
                    <tr><td style={{ padding: '6px 0', color: '#888', width: 80 }}>标签类型</td><td><Tag>{tagType}</Tag></td></tr>
                    <tr><td style={{ padding: '6px 0', color: '#888' }}>订单类型</td><td><Tag color="blue">{orderTypeLabels[orderType]}</Tag></td></tr>
                  </>)}
                  {createPath === 'instant' && (
                    <tr><td style={{ padding: '6px 0', color: '#888', width: 80 }}>下单方式</td><td><Tag color="orange">即时下单</Tag></td></tr>
                  )}
                  <tr><td style={{ padding: '6px 0', color: '#888' }}>SKU 数</td><td><Text>{skuRows.length} 个</Text></td></tr>
                  <tr><td style={{ padding: '6px 0', color: '#888' }}>总数量</td><td><Text strong style={{ fontSize: 16, color: '#1677ff' }}>{totalQty.toLocaleString()} 张</Text></td></tr>
                </tbody>
              </table>
            </Card>
            {createPath === 'template' && skuRows.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>SKU — 模板匹配明细</Text>
                <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                  {skuRows.map((r, i) => {
                    const t = effectiveTemplate(i);
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 12px', borderBottom: '1px solid #f5f5f5', fontSize: 12 }}>
                        <Space size={8}>
                          <Text code style={{ fontSize: 11 }}>{r.sku}</Text>
                          <Text type="secondary">{r.quantity.toLocaleString()} 张</Text>
                        </Space>
                        <Tag color={t ? 'green' : 'red'} style={{ margin: 0, fontSize: 11 }}>
                          {t ? `${t.name} v${t.version}` : '无模板'}
                        </Tag>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {createPath === 'instant' && (
              <Alert type="warning" showIcon message="提交后订单状态为「待补模板」"
                description="请通知品牌方打单员为以上 SKU 创建标签模板，完成后订单将推送至平台审核。"
                style={{ marginTop: 16, borderRadius: 6 }} />
            )}
            {createPath === 'template' && (
              <Alert type="info" showIcon message="提交后订单状态为「待审核」"
                description="平台运营人员将尽快审核您的订单。" style={{ marginTop: 16, borderRadius: 6 }} />
            )}
            <Button type="primary" size="large" block style={{ marginTop: 20 }}
              onClick={handleSubmit}
              disabled={
                regionPath.length === 0 || !addressDetail || !contactName || !contactPhone ||
                skuRows.length === 0 || skuRows.some(r => !r.sku || !r.quantity) ||
                (createPath === 'template' && skuRows.some((_, i) => !effectiveTemplate(i)))
              }>
              {createPath === 'template' ? '确认提交订单' : '提交订单（待补模板）'}
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  const canNext = (): boolean => {
    const rows = skuRowsRef.current;
    if (createPath === 'template') {
      if (current === 0) return !!tagType;
      if (current === 1) return rows.length > 0 && !rows.some(r => !r.sku || !r.quantity);
    }
    if (createPath === 'instant') {
      if (current === 0) return rows.length > 0 && !rows.some(r => !r.sku || !r.quantity);
    }
    return false;
  };

  const isLast = (createPath === 'template' && current === 2) || (createPath === 'instant' && current === 1);

  return (
    <div>
      <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
        创建订单 — {createPath === 'template' ? '模板下单' : '即时下单'}
      </Title>
      <Card style={{ marginBottom: 24 }}>
        <Steps current={current} items={steps} size="small" />
      </Card>
      <Card style={{ minHeight: 320 }}>{stepContent()}</Card>
      {!isLast && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={current === 0 ? resetAndBack : prev}>
            {current === 0 ? '返回选择方式' : '上一步'}
          </Button>
          <Button type="primary" onClick={next} disabled={!canNext()}>下一步</Button>
        </div>
      )}
    </div>
  );
}
