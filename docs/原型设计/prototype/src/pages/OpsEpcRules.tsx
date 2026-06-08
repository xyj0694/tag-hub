import { useState, useMemo } from 'react';
import {
  Card, Table, Button, Tag, Select, Space, Typography, Modal, Form, Input, InputNumber,
  Badge, Timeline, Drawer, Popconfirm, Alert, Progress, List, Collapse, Radio, message, theme, Empty
} from 'antd';
import {
  PlusOutlined, WarningOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, HistoryOutlined, InfoCircleOutlined,
  BarcodeOutlined, NumberOutlined, TagOutlined, FileAddOutlined,
  ExclamationCircleOutlined, DownloadOutlined, CopyOutlined, ThunderboltOutlined,
  SwapOutlined, BookOutlined
} from '@ant-design/icons';
import { brands, epcRuleChangeLogs } from '../data/mock';
import type { EpcRule, EpcRuleChangeLog, Brand, EpcSchemeType, Charset } from '../data/mock';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── 方案类型定义 ───────────────────────────────────────
interface RuleTypeDef {
  value: EpcSchemeType; label: string; color: string; icon: React.ReactNode;
  desc: string; fixedBit: number | null;
}
const RULE_TYPES: RuleTypeDef[] = [
  { value: 'SGTIN96',        label: 'SGTIN-96',       color: 'blue',   icon: <BarcodeOutlined />,    desc: 'GS1 国际标准编码',           fixedBit: 96 },
  { value: 'UPC_SGTIN96',    label: 'UPC → SGTIN-96', color: 'cyan',   icon: <SwapOutlined />,       desc: 'UPC 码转 GS1 SGTIN-96',      fixedBit: 96 },
  { value: 'GRAI96',         label: 'GRAI-96',        color: 'purple', icon: <TagOutlined />,        desc: 'GS1 可回收资产标识',         fixedBit: 96 },
  { value: 'HYBRID',         label: '混合编码',        color: 'orange', icon: <NumberOutlined />,     desc: '业务前缀 + 序列号',          fixedBit: null },
  { value: 'PLATFORM_RANDOM',label: '平台随机码',      color: 'green',  icon: <ThunderboltOutlined />,     desc: '纯标识符，DB 绑定商品',       fixedBit: null },
];

const FILTER_VALUES = [
  { value: 0, label: '0 — 单品 (Item)' },
  { value: 1, label: '1 — 内箱 (Inner Case)' },
  { value: 2, label: '2 — 外箱 (Case)' },
  { value: 3, label: '3 — 托盘 (Pallet)' },
  { value: 4, label: '4 — 单品-短GTIN' },
];

const CHARSET_OPTIONS: { value: Charset; label: string; hint: string }[] = [
  { value: 'HEX',      label: 'HEX (0-9, A-F)',     hint: '每字符4bit，芯片原生映射' },
  { value: 'NUMERIC',  label: 'NUMERIC (0-9)',       hint: 'BCD编码，每数字4bit，与HEX同等容量' },
  { value: 'ALPHANUM', label: 'ALPHANUM (0-9, A-Z)', hint: 'Base36编码，每字符≈5.17bit，96-bit最多18字符' },
];

interface RuleTemplate {
  id: number; name: string; type: EpcSchemeType; charset?: Charset; bitCapacity?: 96 | 128;
  companyPrefix?: string; serialStart?: number; serialEnd?: number; filterValue?: number;
  prefix?: string; seqLength?: number; seqStart?: number; step?: number;
  graiAssetType?: string; graiSerialStart?: number; graiSerialEnd?: number;
  randomLength?: number; upcCode?: string;
}

// ─── 工具函数 ──────────────────────────────────────────

function getMaxChars(rule: { charset?: Charset; bitCapacity?: 96 | 128 }): number {
  const bits = rule.bitCapacity || 96;
  if (rule.charset === 'ALPHANUM') {
    // 36 chars → ~5.17 bits per char → floor(96/5.17)=18, 128→24
    return bits === 128 ? 24 : 18;
  }
  if (rule.charset === 'NUMERIC') {
    // BCD 编码：4bit/十进制位，与 HEX 同等容量
    return bits === 128 ? 32 : 24;
  }
  // HEX: 16 chars → 4 bits → 96/4=24, 128/4=32
  return bits === 128 ? 32 : 24;
}

function detectConflicts(rules: EpcRule[]): { ruleA: EpcRule; ruleB: EpcRule; reason: string }[] {
  const sgtin = rules.filter(r => r.type === 'SGTIN96' && r.active && r.companyPrefix);
  const conflicts: { ruleA: EpcRule; ruleB: EpcRule; reason: string }[] = [];
  for (let i = 0; i < sgtin.length; i++) {
    for (let j = i + 1; j < sgtin.length; j++) {
      if (sgtin[i].companyPrefix === sgtin[j].companyPrefix) {
        conflicts.push({ ruleA: sgtin[i], ruleB: sgtin[j], reason: '公司前缀重复，可能产生重复 EPC 编码' });
        continue;
      }
      const aS = sgtin[i].serialStart ?? 0, aE = sgtin[i].serialEnd ?? 0;
      const bS = sgtin[j].serialStart ?? 0, bE = sgtin[j].serialEnd ?? 0;
      if (aS <= bE && bS <= aE) {
        conflicts.push({ ruleA: sgtin[i], ruleB: sgtin[j], reason: '序列号区间重叠，可能产生重复标签' });
      }
    }
  }
  return conflicts;
}

function formatConfig(r: EpcRule): string {
  switch (r.type) {
    case 'SGTIN96':
      return `前缀:${r.companyPrefix || '—'} | Filter:${r.filterValue ?? 0} | 范围:${(r.serialStart ?? 0).toLocaleString()}-${(r.serialEnd ?? 0).toLocaleString()}`;
    case 'UPC_SGTIN96':
      return `UPC:${r.upcCode || '—'} | 前缀:${r.companyPrefix || '—'} | 范围:${(r.serialStart ?? 0).toLocaleString()}-${(r.serialEnd ?? 0).toLocaleString()}`;
    case 'GRAI96':
      return `资产:${r.graiAssetType || '—'} | 范围:${(r.graiSerialStart ?? 0).toLocaleString()}-${(r.graiSerialEnd ?? 0).toLocaleString()}`;
    case 'HYBRID':
      return `前缀:${r.prefix || '—'} | 序列:${String(r.seqStart ?? 1).padStart(r.seqLength || 6, '0')}-${'9'.repeat(r.seqLength || 6)} | 字符集:${r.charset || 'HEX'}`;
    case 'PLATFORM_RANDOM':
      return `长度:${r.randomLength || 24} | 字符集:${r.charset || 'HEX'} | 前缀:${r.prefix || '无'}`;
    default:
      return r.config;
  }
}

function calcSerialProgress(r: EpcRule): { pct: number; color: string } {
  let range = 1;
  if (r.type === 'SGTIN96' || r.type === 'UPC_SGTIN96') range = Math.max(1, (r.serialEnd ?? 0) - (r.serialStart ?? 0) + 1);
  else if (r.type === 'GRAI96') range = Math.max(1, (r.graiSerialEnd ?? 0) - (r.graiSerialStart ?? 0) + 1);
  else if (r.type === 'HYBRID') {
    const len = r.seqLength || 6;
    range = Math.pow(10, len);
  } else return { pct: 0, color: 'default' };
  const pct = Math.min(100, Math.round(((r.usageCount ?? 0) / range) * 100));
  const color = pct >= 80 ? '#ff4d4f' : pct >= 50 ? '#fa8c16' : '#52c41a';
  return { pct, color };
}

// ─── 组件 ──────────────────────────────────────────────

export default function OpsEpcRules() {
  const { token } = theme.useToken();
  const [brandList, setBrandList] = useState(brands.map(b => ({ ...b, epcRules: [...b.epcRules] })));
  const [selectedBrandId, setSelectedBrandId] = useState<number | 'ALL' | 'MISSING'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<EpcRule | null>(null);
  const [form] = Form.useForm();
  const [ruleType, setRuleType] = useState<EpcSchemeType>('SGTIN96');
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logRuleId, setLogRuleId] = useState<number | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [applyTemplateBrands, setApplyTemplateBrands] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [prefixConflictWarn, setPrefixConflictWarn] = useState('');
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const selectedBrand = (selectedBrandId === 'ALL' || selectedBrandId === 'MISSING')
    ? null : brandList.find(b => b.id === selectedBrandId) || null;

  const rules = (() => {
    if (selectedBrand) return [...selectedBrand.epcRules];
    let allR = brandList.flatMap(b => b.epcRules.map(r => ({ ...r, brandName: b.name, brandId: b.id })));
    if (selectedBrandId === 'MISSING') {
      const missingIds = new Set(brandList.filter(b => b.epcRules.length === 0).map(b => b.id));
      allR = allR.filter((r: any) => missingIds.has(r.brandId));
    }
    return allR;
  })();

  const conflicts = selectedBrand ? detectConflicts(selectedBrand.epcRules) : [];

  // Overview
  const allRules = brandList.flatMap(b => b.epcRules);
  const typeCounts = (t: EpcSchemeType) => allRules.filter(r => r.type === t).length;
  const brandsWithRules = brandList.filter(b => b.epcRules.length > 0).length;
  const brandsWithoutRules = brandList.filter(b => b.epcRules.length === 0).length;
  const allConflicts = brandList.reduce((sum, b) => sum + detectConflicts(b.epcRules).length, 0);
  const firstConflictBrandId = brandList.find(b => detectConflicts(b.epcRules).length > 0)?.id;
  const exhaustedRules = allRules.filter(r => calcSerialProgress(r).pct >= 80 && r.active);

  // Cross-brand prefix check
  const checkCrossBrandPrefix = (prefix: string, excludeRuleId?: number) => {
    const dup = brandList.find(b =>
      b.epcRules.some(r => r.type === 'SGTIN96' && r.companyPrefix === prefix && r.id !== excludeRuleId)
    );
    setPrefixConflictWarn(dup
      ? `公司前缀 ${prefix} 已被品牌「${dup.name}」使用，请确认不会产生跨品牌 EPC 冲突。GS1 标准要求公司前缀全局唯一。`
      : '');
  };

  // ── Form helpers ──
  const openAdd = (type?: EpcSchemeType) => {
    setEditRule(null);
    setRuleType(type || 'SGTIN96');
    form.resetFields();
    form.setFieldValue('bitCapacity', 96);
    form.setFieldValue('filterValue', 0);
    form.setFieldValue('charset', 'HEX');
    form.setFieldValue('step', 1);
    form.setFieldValue('seqStart', 1);
    form.setFieldValue('randomLength', 24);
    form.setFieldValue('seqLength', 6);
    setPrefixConflictWarn('');
    setModalOpen(true);
  };

  const openEdit = (r: EpcRule) => {
    setEditRule(r);
    setRuleType(r.type);
    form.setFieldsValue({
      name: r.name, priority: r.priority || 10, charset: r.charset || 'HEX',
      bitCapacity: r.bitCapacity || 96,
      companyPrefix: r.companyPrefix, serialStart: r.serialStart, serialEnd: r.serialEnd,
      filterValue: r.filterValue, upcCode: r.upcCode,
      prefix: r.prefix, seqLength: r.seqLength || 6, seqStart: r.seqStart, step: r.step, seqCurrent: r.seqCurrent,
      graiAssetType: r.graiAssetType, graiSerialStart: r.graiSerialStart, graiSerialEnd: r.graiSerialEnd,
      randomLength: r.randomLength || 24,
    });
    setPrefixConflictWarn('');
    if (r.type === 'SGTIN96' && r.companyPrefix) checkCrossBrandPrefix(r.companyPrefix, r.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((v: any) => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const cfg = formatConfig({ ...v, type: ruleType, config: '' } as EpcRule);
      if (editRule) {
        Object.assign(editRule, {
          name: v.name, type: ruleType, config: cfg, priority: v.priority || 10,
          charset: v.charset, bitCapacity: v.bitCapacity,
          companyPrefix: v.companyPrefix, serialStart: v.serialStart, serialEnd: v.serialEnd,
          filterValue: v.filterValue, upcCode: v.upcCode,
          prefix: v.prefix, seqLength: v.seqLength, seqStart: v.seqStart, step: v.step, seqCurrent: v.seqCurrent,
          graiAssetType: v.graiAssetType, graiSerialStart: v.graiSerialStart, graiSerialEnd: v.graiSerialEnd,
          randomLength: v.randomLength,
          updatedAt: now, updatedBy: '当前用户',
        });
        setBrandList(prev => [...prev]);
      } else if (selectedBrand) {
        const newId = Math.max(...allRules.map(r => r.id), 0) + 1;
        const newRule: EpcRule = {
          id: newId, name: v.name, type: ruleType, config: cfg, active: true,
          priority: v.priority || 10, charset: v.charset, bitCapacity: v.bitCapacity,
          usageCount: 0, createdAt: now, updatedAt: now, updatedBy: '当前用户',
        };
        if (ruleType === 'SGTIN96' || ruleType === 'UPC_SGTIN96') {
          newRule.companyPrefix = v.companyPrefix; newRule.serialStart = v.serialStart;
          newRule.serialEnd = v.serialEnd; newRule.filterValue = v.filterValue;
          if (ruleType === 'UPC_SGTIN96') newRule.upcCode = v.upcCode;
        }
        if (ruleType === 'HYBRID') {
          newRule.prefix = v.prefix; newRule.seqLength = v.seqLength; newRule.seqStart = v.seqStart;
          newRule.step = v.step; newRule.seqCurrent = v.seqCurrent;
        }
        if (ruleType === 'GRAI96') {
          newRule.graiAssetType = v.graiAssetType; newRule.graiSerialStart = v.graiSerialStart;
          newRule.graiSerialEnd = v.graiSerialEnd;
        }
        if (ruleType === 'PLATFORM_RANDOM') {
          newRule.randomLength = v.randomLength; newRule.prefix = v.prefix || '';
        }
        selectedBrand.epcRules.push(newRule);
        setBrandList(prev => prev.map(b => b.id === selectedBrand.id ? { ...selectedBrand, epcRules: [...selectedBrand.epcRules] } : b));
      }
      setModalOpen(false); form.resetFields();
    });
  };

  const toggleRule = (r: EpcRule) => {
    r.active = !r.active;
    r.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    r.updatedBy = '当前用户';
    setBrandList(prev => [...prev]);
  };

  const openLog = (ruleId: number) => { setLogRuleId(ruleId); setLogDrawerOpen(true); };
  const logs = logRuleId ? epcRuleChangeLogs.filter(l => l.ruleId === logRuleId) : [];
  const logRule = logRuleId ? allRules.find(r => r.id === logRuleId) : null;

  // Template
  const saveAsTemplate = (r: EpcRule) => {
    const tpl: RuleTemplate = {
      id: Date.now(), name: `${r.name} — 模板`, type: r.type,
      charset: r.charset, bitCapacity: r.bitCapacity,
      companyPrefix: r.companyPrefix, serialStart: r.serialStart, serialEnd: r.serialEnd, filterValue: r.filterValue,
      prefix: r.prefix, seqLength: r.seqLength, seqStart: r.seqStart, step: r.step,
      graiAssetType: r.graiAssetType, graiSerialStart: r.graiSerialStart, graiSerialEnd: r.graiSerialEnd,
      randomLength: r.randomLength, upcCode: r.upcCode,
    };
    setTemplates(prev => [...prev, tpl]);
    message.success('已保存为模板');
  };

  const applyTemplate = () => {
    if (!selectedTemplate || applyTemplateBrands.length === 0) return;
    applyTemplateBrands.forEach(bid => {
      const brand = brandList.find(b => b.id === bid);
      if (!brand) return;
      const newId = Math.max(...brandList.flatMap(b => b.epcRules).map(r => r.id), 0) + 1;
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const newRule: EpcRule = {
        id: newId, name: selectedTemplate.name.replace(' — 模板', ''), type: selectedTemplate.type,
        config: formatConfig(selectedTemplate as any), active: true, priority: 10,
        charset: selectedTemplate.charset, bitCapacity: selectedTemplate.bitCapacity,
        usageCount: 0, createdAt: now, updatedAt: now, updatedBy: '当前用户',
        companyPrefix: selectedTemplate.companyPrefix, serialStart: selectedTemplate.serialStart,
        serialEnd: selectedTemplate.serialEnd, filterValue: selectedTemplate.filterValue,
        prefix: selectedTemplate.prefix, seqLength: selectedTemplate.seqLength,
        seqStart: selectedTemplate.seqStart, step: selectedTemplate.step,
        graiAssetType: selectedTemplate.graiAssetType, graiSerialStart: selectedTemplate.graiSerialStart,
        graiSerialEnd: selectedTemplate.graiSerialEnd,
        randomLength: selectedTemplate.randomLength, upcCode: selectedTemplate.upcCode,
      };
      brand.epcRules.push(newRule);
    });
    setBrandList(prev => [...prev]);
    message.success(`已将模板应用到 ${applyTemplateBrands.length} 个品牌`);
    setTemplateModalOpen(false);
    setApplyTemplateBrands([]);
    setSelectedTemplate(null);
  };

  const conflictRuleIds = new Set(conflicts.flatMap(c => [c.ruleA.id, c.ruleB.id]));

  // ── Render helpers ──
  const lengthInfo = (r: EpcRule) => {
    if (r.type === 'SGTIN96' || r.type === 'UPC_SGTIN96' || r.type === 'GRAI96') {
      return <Text type="secondary" style={{ fontSize: 10 }}>96-bit 芯片</Text>;
    }
    const max = getMaxChars(r);
    let used = 0;
    if (r.type === 'HYBRID') used = (r.prefix?.length || 0) + (r.seqLength || 6);
    else if (r.type === 'PLATFORM_RANDOM') used = (r.prefix?.length || 0) + (r.randomLength || 24);
    return (
      <Text type="secondary" style={{ fontSize: 10 }}>
        {used}/{max} 字符 · {r.bitCapacity || 96}-bit
      </Text>
    );
  };

  const renderRuleCard = (r: EpcRule, isConflict: boolean) => {
    const progress = calcSerialProgress(r);
    const rt = RULE_TYPES.find(t => t.value === r.type);
    return (
      <Card
        key={r.id}
        size="small"
        style={{
          marginBottom: 8,
          background: isConflict ? '#fff2f0' : token.colorFillQuaternary,
          border: isConflict ? '1px solid #ff4d4f' : undefined,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Space size={4}>
            <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
            {r.priority && <Text type="secondary" style={{ fontSize: 10 }}>P{r.priority}</Text>}
            {isConflict && <Tag color="red" icon={<WarningOutlined />}>冲突</Tag>}
            {progress.pct >= 80 && <Tag color="red" icon={<ExclamationCircleOutlined />}>即将耗尽</Tag>}
          </Space>
          <Space size={4}>
            {lengthInfo(r)}
            <Tag color={r.active ? 'green' : 'default'}>{r.active ? '启用' : '停用'}</Tag>
          </Space>
        </div>

        <div style={{ marginBottom: 4 }}>
          {(r.type === 'SGTIN96' || r.type === 'UPC_SGTIN96') && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                {r.type === 'UPC_SGTIN96' && <Text type="secondary" style={{ fontSize: 11 }}>UPC：<Text strong>{r.upcCode}</Text></Text>}
                <Text type="secondary" style={{ fontSize: 11 }}>前缀：<Text strong>{r.companyPrefix}</Text></Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Filter：{r.filterValue}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>范围：{((r.serialStart ?? 0)).toLocaleString()} – {((r.serialEnd ?? 0)).toLocaleString()}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Progress percent={progress.pct} size="small" strokeColor={progress.color} style={{ flex: 1, margin: 0 }} />
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{r.usageCount ?? 0} / {((r.serialEnd ?? 0) - (r.serialStart ?? 0) + 1).toLocaleString()}</Text>
              </div>
            </div>
          )}
          {r.type === 'HYBRID' && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>前缀：<Text strong>{r.prefix}</Text></Text>
                <Text type="secondary" style={{ fontSize: 11 }}>序列长度：{r.seqLength} 位</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>字符集：{CHARSET_OPTIONS.find(c => c.value === r.charset)?.label.split(' ')[0]}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>当前：{r.prefix}{String(r.seqCurrent || 0).padStart(r.seqLength || 6, '0')}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Progress percent={progress.pct} size="small" strokeColor={progress.color} style={{ flex: 1, margin: 0 }} />
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{r.usageCount ?? 0} / {Math.pow(10, r.seqLength || 6).toLocaleString()}</Text>
              </div>
            </div>
          )}
          {r.type === 'GRAI96' && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>资产：<Text strong>{r.graiAssetType}</Text></Text>
                <Text type="secondary" style={{ fontSize: 11 }}>范围：{((r.graiSerialStart ?? 0)).toLocaleString()} – {((r.graiSerialEnd ?? 0)).toLocaleString()}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Progress percent={progress.pct} size="small" strokeColor={progress.color} style={{ flex: 1, margin: 0 }} />
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{r.usageCount ?? 0} / {((r.graiSerialEnd ?? 0) - (r.graiSerialStart ?? 0) + 1).toLocaleString()}</Text>
              </div>
            </div>
          )}
          {r.type === 'PLATFORM_RANDOM' && (
            <div style={{ display: 'flex', gap: 16 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>长度：{r.randomLength} 位</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>字符集：{CHARSET_OPTIONS.find(c => c.value === r.charset)?.label.split(' ')[0]}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>前缀：{r.prefix || '无'}</Text>
            </div>
          )}
        </div>
        <Space size={0}>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title={r.active ? '确认停用该规则？' : '确认启用该规则？'}
            description={r.active && (r.usageCount ?? 0) > 0 ? `该规则被 ${r.usageCount} 个订单引用，停用后这些订单的 EPC 生成将受影响。` : ''}
            onConfirm={() => toggleRule(r)}
            okText={r.active ? '确认停用' : '确认启用'} cancelText="取消"
          >
            <Button size="small" type="link" danger={r.active} icon={<StopOutlined />} />
          </Popconfirm>
          <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => saveAsTemplate(r)} />
          <Button size="small" type="link" icon={<HistoryOutlined />} onClick={() => openLog(r.id)} />
        </Space>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>EPC 编码规则配置</Title>
        <Button icon={<BookOutlined />} onClick={() => setGuideModalOpen(true)}>使用说明书</Button>
      </div>

      {/* Overview cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div onClick={() => setSelectedBrandId('ALL')} style={{ flex: 1, minWidth: 130, background: token.colorFillQuaternary, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: selectedBrandId === 'ALL' ? `1px solid ${token.colorPrimary}` : '1px solid transparent' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>规则总数</Text>
          <br /><Text strong style={{ fontSize: 20 }}>{allRules.length}</Text>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>SGTIN {typeCounts('SGTIN96')} · UPC {typeCounts('UPC_SGTIN96')} · HYBRID {typeCounts('HYBRID')} · RANDOM {typeCounts('PLATFORM_RANDOM')} · GRAI {typeCounts('GRAI96')}</Text>
        </div>
        <div style={{ flex: 1, minWidth: 130, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
          <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>已配置品牌</Text>
          <br /><Text strong style={{ fontSize: 20, color: '#52c41a' }}>{brandsWithRules}</Text>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>/ {brandList.length} 个品牌</Text>
        </div>
        <div onClick={() => setSelectedBrandId('MISSING')} style={{ flex: 1, minWidth: 130, background: brandsWithoutRules > 0 ? '#fff7e6' : '#f6ffed', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: selectedBrandId === 'MISSING' ? '1px solid #fa8c16' : (brandsWithoutRules > 0 ? '1px solid #ffd591' : '1px solid #b7eb8f') }}>
          <Text type="secondary" style={{ fontSize: 12, color: brandsWithoutRules > 0 ? '#fa8c16' : '#52c41a' }}>缺失规则</Text>
          <br /><Text strong style={{ fontSize: 20, color: brandsWithoutRules > 0 ? '#fa8c16' : '#52c41a' }}>{brandsWithoutRules}</Text>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{brandsWithoutRules > 0 ? '点击查看' : '全部已配置'}</Text>
        </div>
        <div onClick={() => { if (firstConflictBrandId) setSelectedBrandId(firstConflictBrandId); }} style={{ flex: 1, minWidth: 130, background: allConflicts > 0 ? '#fff2f0' : '#f6ffed', borderRadius: 8, padding: '10px 14px', cursor: allConflicts > 0 ? 'pointer' : 'default', border: allConflicts > 0 ? '1px solid #ffccc7' : '1px solid #b7eb8f' }}>
          <Text type="secondary" style={{ fontSize: 12, color: allConflicts > 0 ? '#cf1322' : '#52c41a' }}>编码冲突</Text>
          <br /><Text strong style={{ fontSize: 20, color: allConflicts > 0 ? '#cf1322' : '#52c41a' }}>{allConflicts}</Text>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{allConflicts > 0 ? '点击查看' : '无冲突'}</Text>
        </div>
        {exhaustedRules.length > 0 && (
          <div onClick={() => { const b = brandList.find(bb => bb.epcRules.some(r => calcSerialProgress(r).pct >= 80 && r.active)); if (b) setSelectedBrandId(b.id); }} style={{ flex: 1, minWidth: 130, background: '#fff2f0', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', border: '1px solid #ffccc7' }}>
            <Text type="secondary" style={{ fontSize: 12, color: '#cf1322' }}>序列号告急</Text>
            <br /><Text strong style={{ fontSize: 20, color: '#cf1322' }}>{exhaustedRules.length}</Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>条规则即将耗尽</Text>
          </div>
        )}
      </div>

      {/* Conflict alert */}
      {conflicts.length > 0 && (
        <Alert message={`${selectedBrand?.name} 存在 ${conflicts.length} 条 EPC 编码冲突`}
          description={conflicts.map((c, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <Text strong>「{c.ruleA.name}」与「{c.ruleB.name}」</Text>：{c.reason}
            </div>
          ))}
          type="error" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16, borderRadius: 6 }} closable />
      )}

      {selectedBrandId === 'MISSING' && brandsWithoutRules === 0 && (
        <Alert message="所有品牌均已配置 EPC 规则" type="success" showIcon style={{ marginBottom: 16, borderRadius: 6 }} />
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <Select value={selectedBrandId} onChange={v => setSelectedBrandId(v)} style={{ width: 260 }}
            showSearch filterOption={(input, option) => (option?.label as string)?.includes(input) ?? false}
            options={[
              { value: 'ALL', label: `全部品牌（${brandList.length} 个）` },
              { value: 'MISSING', label: `⚠️ 缺失规则（${brandsWithoutRules} 个品牌）` },
              ...brandList.map(b => ({ value: b.id, label: `${b.name}（${b.epcRules.length} 条规则）` })),
            ]}
          />
        </Space>
        <Space wrap>
          {selectedBrand && RULE_TYPES.map(rt => (
            <Button key={rt.value} icon={<PlusOutlined />} size="small" onClick={() => openAdd(rt.value)}>{rt.label}</Button>
          ))}
          {templates.length > 0 && (
            <Button icon={<FileAddOutlined />} size="small" onClick={() => setTemplateModalOpen(true)}>应用模板 ({templates.length})</Button>
          )}
          <Button icon={<DownloadOutlined />} size="small" onClick={() => {
            const data = brandList.map(b => ({ brand: b.name, rules: b.epcRules.map(r => ({ name: r.name, type: r.type, config: formatConfig(r), active: r.active, priority: r.priority, usage: r.usageCount })) }));
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'epc-rules-export.json'; a.click();
          }}>导出</Button>
        </Space>
      </div>

      {/* Content */}
      {rules.length === 0 ? (
        (selectedBrandId === 'MISSING' && brandsWithoutRules > 0) ? (
          <Card style={{ borderRadius: 8 }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>缺失 EPC 规则的品牌（{brandsWithoutRules} 个）</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {brandList.filter(b => b.epcRules.length === 0).map(b => (
                <Card key={b.id} size="small" style={{ background: token.colorFillQuaternary }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><Text strong>{b.name}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>工厂：{b.factoryCount} 个</Text></div>
                    <Button size="small" type="primary" onClick={() => { setSelectedBrandId(b.id); setTimeout(() => openAdd('SGTIN96'), 100); }}>一键配置</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ) : <Empty description={selectedBrand ? '该品牌暂无 EPC 规则' : '暂未配置任何规则'} />
      ) : (
        <>
          {selectedBrand ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
              {RULE_TYPES.map(rt => {
                const typeRules = rules.filter(r => r.type === rt.value).sort((a, b) => (a.priority || 99) - (b.priority || 99));
                return (
                  <Card key={rt.value}
                    title={<Space><Tag color={rt.color}>{rt.label}</Tag><Text type="secondary" style={{ fontSize: 12 }}>{rt.desc}</Text></Space>}
                    size="small" style={{ borderRadius: 8 }}
                    extra={typeRules.length === 0 && <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => openAdd(rt.value)}>新增</Button>}
                  >
                    {typeRules.length > 0
                      ? typeRules.map(r => renderRuleCard(r, conflictRuleIds.has(r.id)))
                      : <div style={{ textAlign: 'center', padding: 20 }}><Text type="secondary">暂无 {rt.label} 规则</Text></div>}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ borderRadius: 8, marginBottom: 16 }}>
              <Table
                dataSource={rules as any[]}
                rowKey={(r: any) => `${r.brandId}-${r.id}`}
                size="middle" scroll={{ x: 1100 }}
                pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '15', '50'] }}
                columns={[
                  { title: '规则名称', dataIndex: 'name', width: 160, ellipsis: true },
                  { title: '品牌', dataIndex: 'brandName', width: 160, ellipsis: true, render: (t: string, r: any) => <a onClick={() => setSelectedBrandId(r.brandId)}><Tag color="blue">{t}</Tag></a> },
                  { title: '类型', dataIndex: 'type', width: 120, render: (t: string) => { const rt = RULE_TYPES.find(r => r.value === t); return <Tag color={rt?.color}>{rt?.label}</Tag>; } },
                  { title: '优先级', dataIndex: 'priority', width: 60, align: 'right' as const, render: (v: number) => v ? <Text strong>{v}</Text> : <Text type="secondary">—</Text> },
                  { title: '配置', dataIndex: 'config', ellipsis: true, width: 240, render: (_: string, r: EpcRule) => <Text code style={{ fontSize: 11 }}>{formatConfig(r)}</Text> },
                  { title: '字符集', dataIndex: 'charset', width: 70, render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
                  { title: '芯片', dataIndex: 'bitCapacity', width: 70, render: (v: number) => v ? `${v}-bit` : '—' },
                  { title: '消耗', width: 100, render: (_: any, r: EpcRule) => { const p = calcSerialProgress(r); return p.pct === 0 ? <Text type="secondary">—</Text> : <Progress percent={p.pct} size="small" strokeColor={p.color} style={{ margin: 0 }} />; } },
                  { title: '操作', width: 110, fixed: 'right' as const, render: (_: any, r: EpcRule) => (
                    <Space size={0}>
                      <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                      <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => saveAsTemplate(r)} />
                    </Space>
                  )},
                ]}
              />
            </Card>
          )}

          {selectedBrand && (
            <Card title="全部规则列表" style={{ borderRadius: 8 }} extra={
              <Text type="secondary" style={{ fontSize: 12 }}>最近更新：{[...selectedBrand.epcRules].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0]?.updatedAt || '—'}</Text>
            }>
              <Table
                dataSource={selectedBrand.epcRules} rowKey="id" size="middle" scroll={{ x: 1000 }}
                pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
                columns={[
                  { title: '规则名称', dataIndex: 'name', width: 140, ellipsis: true },
                  { title: '类型', dataIndex: 'type', width: 100, render: (t: string) => { const rt = RULE_TYPES.find(r => r.value === t); return <Tag color={rt?.color}>{rt?.label}</Tag>; } },
                  { title: '优先级', dataIndex: 'priority', width: 60, align: 'right' as const, sorter: (a: EpcRule, b: EpcRule) => (a.priority || 99) - (b.priority || 99), render: (v: number) => v ? <Text strong>{v}</Text> : <Text type="secondary">—</Text> },
                  { title: '配置', dataIndex: 'config', ellipsis: true, render: (_: string, r: EpcRule) => <Text code style={{ fontSize: 11 }}>{formatConfig(r)}</Text> },
                  { title: '字符集', dataIndex: 'charset', width: 70, render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
                  { title: '芯片', dataIndex: 'bitCapacity', width: 70, render: (v: number) => v ? `${v}-bit` : '—' },
                  { title: '状态', dataIndex: 'active', width: 60, render: (v: boolean) => v ? <Badge status="success" text="启用" /> : <Badge status="default" text="停用" /> },
                  { title: '消耗', width: 100, render: (_: any, r: EpcRule) => { const p = calcSerialProgress(r); return p.pct === 0 ? <Text type="secondary">—</Text> : <Progress percent={p.pct} size="small" strokeColor={p.color} format={() => `${p.pct}%`} />; } },
                  { title: '使用量', dataIndex: 'usageCount', width: 60, align: 'right' as const, render: (v: number) => v ? v : '—' },
                  { title: '操作', width: 220, fixed: 'right' as const, render: (_: any, r: EpcRule) => (
                    <Space size={0}>
                      <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                      <Popconfirm title={r.active ? '确认停用？' : '确认启用？'} onConfirm={() => toggleRule(r)} okText="确认" cancelText="取消">
                        <Button size="small" type="link" danger={r.active} icon={<StopOutlined />} />
                      </Popconfirm>
                      <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => saveAsTemplate(r)} />
                      <Button size="small" type="link" icon={<HistoryOutlined />} onClick={() => openLog(r.id)} />
                    </Space>
                  )},
                ]}
              />
            </Card>
          )}
        </>
      )}

      {/* ─── Add/Edit Modal ─── */}
      <Modal
        title={editRule ? `编辑规则：${editRule.name}` : `新增 ${RULE_TYPES.find(t => t.value === ruleType)?.label} 规则`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setPrefixConflictWarn(''); }}
        okText="保存" cancelText="取消" width={640}
      >
        {!editRule && selectedBrand && (
          <Alert message={`将规则添加到「${selectedBrand.name}」`} type="info" showIcon style={{ marginBottom: 12, borderRadius: 6 }} />
        )}
        {prefixConflictWarn && (
          <Alert message={prefixConflictWarn} type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 12, borderRadius: 6 }} />
        )}

        {/* ---- 配置说明 ---- */}
        <Collapse ghost size="small" style={{ marginBottom: 12, background: token.colorFillQuaternary, borderRadius: 6 }}
          items={[{
            key: 'guide', label: <Text type="secondary" style={{ fontSize: 12 }}>📖 配置说明与样例</Text>,
            children: (
              <div style={{ fontSize: 12, lineHeight: 1.8, color: token.colorTextSecondary }}>
                {ruleType === 'SGTIN96' && (<>
                  <Text strong>SGTIN-96（GS1 国际标准，96-bit）</Text>
                  <p style={{ margin: '4px 0' }}>每个标签生成全局唯一的 EPC 编码，适用于期货订单和新货生产，符合 ISO/IEC 18000-6C 标准。</p>
                  <div style={{ background: token.colorFillQuaternary, borderRadius: 4, padding: '6px 10px', margin: '8px 0' }}>
                    示例：前缀 <Text code>3034</Text> + Filter <Text code>0（单品）</Text> + 序列号 <Text code>000000001–999999999</Text>
                    <br />→ SGTIN-96 二进制：<Text code>0011 0000 0011 0100 ...</Text>（96 bits = 24 个 hex 字符）
                  </div>
                  <Text type="secondary">💡 公司前缀由 GS1 分配给品牌方（6-12 位数字，全品牌唯一）。</Text><br />
                  <Text type="secondary">💡 Filter Value：0=单品 1=内箱 2=外箱 3=托盘 4=短GTIN。</Text><br />
                  <Text type="secondary">💡 芯片容量固定 96-bit，无需额外配置。</Text>
                </>)}
                {ruleType === 'UPC_SGTIN96' && (<>
                  <Text strong>UPC → SGTIN-96 转换（GS1 标准，96-bit）</Text>
                  <p style={{ margin: '4px 0' }}>将客户现有的 12 位 UPC 条码转换为 GS1 SGTIN-96 EPC 编码。适用于国外客户已有 UPC 编码体系的场景。</p>
                  <div style={{ background: token.colorFillQuaternary, borderRadius: 4, padding: '6px 10px', margin: '8px 0' }}>
                    示例：UPC <Text code>190198253018</Text> → 补 0 为 GTIN-14 → 提取公司前缀 <Text code>1901982</Text>
                    <br />→ SGTIN-96 编码由 UPC 前缀 + 序列号组成
                  </div>
                  <Text type="secondary">💡 UPC 是 12 位纯数字条码，常见于北美和欧洲市场。</Text><br />
                  <Text type="secondary">💡 转换后编码符合 GS1 EPC Tag Data Standard 1.13。</Text>
                </>)}
                {ruleType === 'HYBRID' && (<>
                  <Text strong>混合编码（业务前缀 + 序列号）</Text>
                  <p style={{ margin: '4px 0' }}>编码前缀携带业务含义（款号/SKU/品牌缩写），扫描时无需查库即可识别品类。序列号自动递增。</p>
                  <div style={{ background: token.colorFillQuaternary, borderRadius: 4, padding: '6px 10px', margin: '8px 0' }}>
                    示例：前缀 <Text code>BSD</Text> + 序列 <Text code>000001–999999</Text> → BSD000001, BSD000002...
                    <br />示例（ALPHANUM）：前缀 <Text code>ANTAM</Text> + 序列 <Text code>0001–9999</Text> → ANTAM0001, ANTAM0002...
                    <div style={{ marginTop: 6, padding: '8px 12px', background: '#fffbe6', borderRadius: 4, fontSize: 11 }}>
                      <Text strong style={{ fontSize: 12 }}>Base36 转存过程（ANTAM0001 → 芯片二进制）</Text>
                      <table style={{ marginTop: 6, borderCollapse: 'collapse', lineHeight: 1.8 }}>
                        <tr>
                          <td style={{ paddingRight: 8, verticalAlign: 'top' }}>第 1 步<br/>字符→数值</td>
                          <td>
                            每个字符映射为 0–35 的整数：<br/>
                            <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 3 }}>
                              A=10, N=23, T=29, A=10, M=22, 0=0, 0=0, 0=0, 1=1
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 2 步<br/>组合为整数</td>
                          <td style={{ paddingTop: 6 }}>
                            按基数为 36 的多项式组合：<br/>
                            <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 3 }}>
                              10×36⁸ + 23×36⁷ + 29×36⁶ + 10×36⁵ + 22×36⁴ + 0 + 0 + 0 + 1
                            </span><br/>
                            <span style={{ fontFamily: 'monospace' }}>
                              = 30,077,243,149,825
                            </span>（约 3.0 × 10¹³）
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 3 步<br/>十进制→二进制</td>
                          <td style={{ paddingTop: 6 }}>
                            转为二进制，仅需 <Text strong style={{ color: '#52c41a' }}>45 bit</Text><br/>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 3 }}>
                              0001 1011 0101 1010 1110 0111 0110 0100 1100 1110 0000 0001
                            </span><br/>
                            <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 3, marginTop: 4, display: 'inline-block' }}>
                              HEX: 1B5A E764 CE01
                            </span>
                            <Text type="secondary">（12 位 HEX，其中前 3 bit 为前导 0，有效 45 bit）</Text>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 4 步<br/>写入芯片</td>
                          <td style={{ paddingTop: 6 }}>
                            45 bit 二进制写入 96-bit 芯片 User Memory 区<br/>
                            <Text type="secondary">占芯片容量 45/96 = 46.9%，剩余空间充足</Text>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 5 步<br/>增量对比</td>
                          <td style={{ paddingTop: 6 }}>
                            下一个标签 <span style={{ fontFamily: 'monospace' }}>ANTAM0002</span> →<br/>
                            <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 3 }}>
                              HEX: 1B5A E764 CE02
                            </span>
                            <Text type="secondary">（末位 +1，仅 1 bit 变化）</Text>
                          </td>
                        </tr>
                      </table>
                      <Text type="secondary" style={{ display: 'block', marginTop: 8, borderTop: '1px dashed #d9d9d9', paddingTop: 6 }}>
                        💡 整个过程由系统自动完成。运营人员只需配置前缀（ANTAM）和序列号（4 位，起始 1），无需关心底层 Base36 编解码。
                      </Text>
                    </div>
                  </div>
                  <Text type="secondary">💡 字符集 HEX 每字符占 4bit，芯片直接存储。ALPHANUM 采用 Base36 编码（每字符约 5.17bit），96-bit 芯片最多存 18 个字符。</Text><br />
                  <Text type="secondary">💡 前缀 + 序列号总长度不能超过芯片容量（需参考容量指示器）。</Text>
                </>)}
                {ruleType === 'PLATFORM_RANDOM' && (<>
                  <Text strong>平台随机码（纯标识符）</Text>
                  <p style={{ margin: '4px 0' }}>平台生成不重复的随机编码，本身无任何业务含义。商品生产后通过扫描条码在后台绑定商品信息。脱离系统无法识别对应业务。</p>
                  <div style={{ background: token.colorFillQuaternary, borderRadius: 4, padding: '6px 10px', margin: '8px 0' }}>
                    示例：<Text code>3A7F012B9C4D5E6F7A8B9C0D</Text>（24 位随机 hex，96-bit 芯片）
                  </div>
                  <Text type="secondary">💡 适用场景：客户未提供任何编码规则，由平台先行生成标识。</Text><br />
                  <Text type="secondary">💡 编码长度由芯片容量决定：96-bit 最多 24 个 HEX 字符，128-bit 最多 32 个。</Text>
                </>)}
                {ruleType === 'GRAI96' && (<>
                  <Text strong>GRAI-96（GS1 可回收资产标识，96-bit）</Text>
                  <p style={{ margin: '4px 0' }}>用于追踪退货标签、周转箱、托盘等循环使用的资产，在一次或多次流转中可追溯每次使用。</p>
                  <div style={{ background: token.colorFillQuaternary, borderRadius: 4, padding: '6px 10px', margin: '8px 0' }}>
                    示例：资产类型 <Text code>RT01</Text>（退货标签）+ 序列号 <Text code>000001–999999</Text>
                  </div>
                  <Text type="secondary">💡 芯片容量固定 96-bit。</Text>
                </>)}
              </div>
            ),
          }]}
        />

        {/* ---- 类型选择 ---- */}
        {!editRule && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>编码方案类型</Text>
            <Select value={ruleType} onChange={v => {
              setRuleType(v);
              form.resetFields();
              form.setFieldValue('filterValue', 0);
              form.setFieldValue('charset', 'HEX');
              form.setFieldValue('step', 1);
              form.setFieldValue('seqStart', 1);
              form.setFieldValue('randomLength', 24);
              form.setFieldValue('seqLength', 6);
              form.setFieldValue('bitCapacity', RULE_TYPES.find(t => t.value === v)?.fixedBit || 96);
              setPrefixConflictWarn('');
            }} style={{ width: '100%' }}>
              {RULE_TYPES.map(rt => (
                <Option key={rt.value} value={rt.value}>
                  <Space>{rt.icon}<Text>{rt.label}</Text><Text type="secondary" style={{ fontSize: 11 }}>— {rt.desc}{rt.fixedBit ? `（固定 ${rt.fixedBit}-bit）` : ''}</Text></Space>
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* ---- Form ---- */}
        <Form form={form} layout="vertical">
          <Form.Item label="规则名称" name="name" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="如：新货SGTIN、补货流水号、进口UPC线" />
          </Form.Item>
          <Form.Item label="优先级" name="priority" tooltip="数字越小优先级越高，品牌匹配规则时优先使用高优先级规则" initialValue={10}>
            <InputNumber min={1} max={99} style={{ width: 120 }} placeholder="10" />
          </Form.Item>
          <Form.Item label="废标预留比例" name="wasteAllowancePct" tooltip="打印过程中的废标预留百分比，默认 2%。如客户要求连码需额外协商。" initialValue={2}>
            <InputNumber min={0} max={10} step={0.5} style={{ width: 140 }} placeholder="2" addonAfter="%" />
          </Form.Item>

          {/* 通用：芯片容量 + 字符集 */}
          {ruleType !== 'SGTIN96' && ruleType !== 'UPC_SGTIN96' && ruleType !== 'GRAI96' && (
            <>
              <Form.Item label="RFID 芯片容量" name="bitCapacity" tooltip="决定编码最大长度。96-bit 是主流 UHF 芯片，128-bit 为高端芯片">
                <Radio.Group>
                  <Radio.Button value={96}>96-bit（24 hex / 18 alpha）</Radio.Button>
                  <Radio.Button value={128}>128-bit（32 hex / 24 alpha）</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="字符集" name="charset" tooltip="决定编码可用的字符范围">
                <Radio.Group>
                  {CHARSET_OPTIONS.map(c => (
                    <Radio.Button key={c.value} value={c.value}>{c.label}</Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </>
          )}

          {/* SGTIN-96 */}
          {(ruleType === 'SGTIN96' || ruleType === 'UPC_SGTIN96') && (
            <>
              {ruleType === 'UPC_SGTIN96' && (
                <Form.Item label="UPC 码" name="upcCode" rules={[
                  { required: true, message: '请输入 12 位 UPC 码' },
                  { pattern: /^\d{12}$/, message: 'UPC 码为 12 位纯数字' },
                ]}>
                  <Input placeholder="如：190198253018（12 位数字）" maxLength={12} />
                </Form.Item>
              )}
              <Form.Item label="GS1 公司前缀" name="companyPrefix" rules={[
                { required: true, message: '请输入公司前缀' },
                { pattern: /^\d{6,12}$/, message: '公司前缀应为 6-12 位数字（GS1 标准）' },
              ]}>
                <Input placeholder="如：3034（6-12位数字）" maxLength={12}
                  onChange={e => checkCrossBrandPrefix(e.target.value, editRule?.id)} />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8, marginTop: -8 }}>
                GS1 公司前缀由 GS1 组织分配，通常为 6-12 位数字，全品牌内应唯一。
              </Text>
              <Space style={{ width: '100%' }} size="middle">
                <Form.Item label="序列号起始" name="serialStart" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: 150 }} />
                </Form.Item>
                <Form.Item label="序列号截止" name="serialEnd" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: 150 }} />
                </Form.Item>
                <Form.Item label="Filter Value" name="filterValue">
                  <Select style={{ width: 170 }}>
                    {FILTER_VALUES.map(f => <Option key={f.value} value={f.value}>{f.label}</Option>)}
                  </Select>
                </Form.Item>
              </Space>
            </>
          )}

          {/* HYBRID */}
          {ruleType === 'HYBRID' && (
            <>
              <Form.Item label="业务前缀" name="prefix" rules={[{ required: true, message: '请输入前缀（款号/SKU/品牌缩写）' }]}>
                <Input placeholder="如：BSD、ANTAM、SKU2024" maxLength={20} onChange={() => {
                  // Update length indicator
                }} />
              </Form.Item>
              <Space style={{ width: '100%' }} size="middle">
                <Form.Item label="序列号长度" name="seqLength" rules={[{ required: true }]} tooltip="序列号部分的位数，如 6 表示 000001–999999">
                  <InputNumber min={2} max={20} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item label="起始序号" name="seqStart" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: 110 }} />
                </Form.Item>
                <Form.Item label="步长" name="step">
                  <InputNumber min={1} style={{ width: 90 }} />
                </Form.Item>
                {editRule && <Form.Item label="当前值" name="seqCurrent"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>}
              </Space>
              {/* Capacity indicator */}
              <div style={{ background: token.colorFillQuaternary, borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                <Space><ThunderboltOutlined style={{ color: token.colorPrimary }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    编码长度预览：{(() => {
                      const prefix = form.getFieldValue('prefix') || '';
                      const seqLen = form.getFieldValue('seqLength') || 6;
                      const max = getMaxChars({ charset: form.getFieldValue('charset') || 'HEX', bitCapacity: form.getFieldValue('bitCapacity') || 96 });
                      const used = prefix.length + seqLen;
                      return `${used} / ${max} 字符${used > max ? ' ⚠️ 超出芯片容量！' : ''}`;
                    })()}
                  </Text>
                </Space>
              </div>
            </>
          )}

          {/* PLATFORM_RANDOM */}
          {ruleType === 'PLATFORM_RANDOM' && (
            <>
              <Form.Item label="固定前缀（可选）" name="prefix" tooltip="如需统一前缀标识，可在此填写；留空则生成纯随机码">
                <Input placeholder="如：TMP（可选，留空则无前缀）" maxLength={8} />
              </Form.Item>
              <Form.Item label="随机码长度" name="randomLength" rules={[{ required: true }]}
                tooltip="随机码的字符位数（不含前缀）。最大长度由芯片容量和字符集决定">
                <InputNumber min={4} max={32} style={{ width: 120 }} />
              </Form.Item>
              <div style={{ background: token.colorFillQuaternary, borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                <Space><ThunderboltOutlined style={{ color: token.colorPrimary }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    编码长度预览：{(() => {
                      const pref = (form.getFieldValue('prefix') || '').length;
                      const rlen = form.getFieldValue('randomLength') || 24;
                      const max = getMaxChars({ charset: form.getFieldValue('charset') || 'HEX', bitCapacity: form.getFieldValue('bitCapacity') || 96 });
                      const used = pref + rlen;
                      return `${used} / ${max} 字符${used > max ? ' ⚠️ 超出芯片容量！' : ''}`;
                    })()}
                  </Text>
                </Space>
              </div>
            </>
          )}

          {/* GRAI-96 */}
          {ruleType === 'GRAI96' && (
            <>
              <Form.Item label="资产类型" name="graiAssetType" rules={[{ required: true }]}>
                <Input placeholder="如：RT01（退货标签）" maxLength={6} />
              </Form.Item>
              <Space size="middle">
                <Form.Item label="序列号起始" name="graiSerialStart" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: 150 }} />
                </Form.Item>
                <Form.Item label="序列号截止" name="graiSerialEnd" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: 150 }} />
                </Form.Item>
              </Space>
            </>
          )}
        </Form>
      </Modal>

      {/* ─── Template Modal ─── */}
      <Modal title="规则模板" open={templateModalOpen}
        onCancel={() => { setTemplateModalOpen(false); setApplyTemplateBrands([]); setSelectedTemplate(null); }}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => { setTemplateModalOpen(false); setApplyTemplateBrands([]); setSelectedTemplate(null); }}>取消</Button>,
          <Button key="apply" type="primary" disabled={!selectedTemplate || applyTemplateBrands.length === 0} onClick={applyTemplate}>应用到选中品牌</Button>,
        ]}
      >
        {templates.length === 0 ? (
          <Empty description="暂无保存的模板。在规则卡片上点击「存模版」即可保存。" />
        ) : (
          <>
            <List dataSource={templates} renderItem={tpl => (
              <List.Item onClick={() => setSelectedTemplate(tpl)}
                style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 6, background: selectedTemplate?.id === tpl.id ? token.colorFillSecondary : token.colorFillQuaternary, marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Space>
                    <Tag color={RULE_TYPES.find(rt => rt.value === tpl.type)?.color}>{RULE_TYPES.find(rt => rt.value === tpl.type)?.label}</Tag>
                    <Text strong>{tpl.name}</Text>
                  </Space>
                  <Button size="small" type="link" danger onClick={e => { e.stopPropagation(); setTemplates(prev => prev.filter(t => t.id !== tpl.id)); }}>删除</Button>
                </div>
              </List.Item>
            )} />
            {selectedTemplate && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>目标品牌（多选）</Text>
                <Select mode="multiple" value={applyTemplateBrands} onChange={v => setApplyTemplateBrands(v)}
                  style={{ width: '100%' }} placeholder="选择要应用此模板的品牌" showSearch
                  filterOption={(input, option) => (option?.label as string)?.includes(input) ?? false}
                  options={brandList.map(b => ({ value: b.id, label: b.name }))} />
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ─── Change Log Drawer ─── */}
      <Drawer title={`变更记录 — ${logRule?.name || ''}`} open={logDrawerOpen} onClose={() => setLogDrawerOpen(false)} width={480}>
        {logs.length === 0 ? <Empty description="暂无变更记录" /> : (
          <Timeline items={logs.map(l => ({
            color: l.action === '新增' ? 'green' : 'blue',
            children: (
              <div>
                <Text strong>{l.action === '新增' ? '创建规则' : `修改「${l.field}」`}</Text>
                <div style={{ marginTop: 2 }}>
                  {l.action !== '新增' && l.from && <Text type="secondary" style={{ fontSize: 12, textDecoration: 'line-through' }}>{l.from}</Text>}
                  {l.action !== '新增' && l.from && l.to && <Text style={{ fontSize: 12, marginLeft: 8 }}>→ {l.to}</Text>}
                  {l.action === '新增' && <Text style={{ fontSize: 12 }}>{l.to}</Text>}
                </div>
                <div style={{ marginTop: 2 }}><Text type="secondary" style={{ fontSize: 11 }}>{l.by} · {l.at}</Text></div>
              </div>
            ),
          }))} />
        )}
      </Drawer>

      {/* ─── 使用说明书 Modal ─── */}
      <Modal
        title={<Space><BookOutlined /> EPC 编码规则使用说明书</Space>}
        open={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        width={800}
        footer={<Button type="primary" onClick={() => setGuideModalOpen(false)}>关闭</Button>}
      >
        <div style={{ fontSize: 13, lineHeight: 1.9, maxHeight: '60vh', overflow: 'auto', paddingRight: 8 }}>
          <Alert
            message="本文档面向平台运营人员，帮助快速判断在何种业务场景下选择哪种编码方案，以及如何正确配置。"
            type="info" showIcon style={{ marginBottom: 20, borderRadius: 6 }}
          />

          {/* 速查表 */}
          <Text strong style={{ fontSize: 15 }}>一、编码方案速查表</Text>
          <div style={{ overflow: 'auto', margin: '12px 0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>编码方案</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>典型场景</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>编码可读性</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>国际标准</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>芯片容量</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>字符集</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="blue">SGTIN-96</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>品牌方提供 GS1 公司前缀</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>无业务含义，需查库</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>✅ ISO 18000-6C / EPC Gen2</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>固定 96-bit</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>HEX</td>
                </tr>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="cyan">UPC → SGTIN-96</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>国外客户有 UPC 条码需转 EPC</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>UPC 部分可读</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>✅ GS1 EPC Tag Data Standard 1.13</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>固定 96-bit</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>HEX</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="orange">混合编码</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>前缀=款号/SKU，扫描即可识货</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>✅ 自带业务含义</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>非 GS1 标准，平台内部使用</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>96 / 128-bit 可选</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>HEX / NUM / ALPHA</td>
                </tr>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="green">平台随机码</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>客户未提供任何编码规则</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>完全无含义，必须查库</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>非 GS1 标准，纯标识符</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>96 / 128-bit 可选</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>HEX / NUM / ALPHA</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag color="purple">GRAI-96</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>退货标签、周转箱等可循环资产</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>资产类型可读</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>✅ GS1 EPC Tag Data Standard</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>固定 96-bit</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>HEX</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 场景详解 */}
          <Text strong style={{ fontSize: 15 }}>二、业务场景详解</Text>

          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>场景 A：品牌方提供 GS1 公司前缀 → 选择 SGTIN-96</Text>
            <p style={{ margin: '4px 0 0' }}>
              品牌方已在 GS1 注册公司前缀（如 3034），按国际标准生成 EPC。生成的编码为纯数字标识符，需配合后台系统查询业务信息。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              配置：公司前缀 <Text code>3034</Text> · Filter <Text code>0（单品）</Text> · 序列号 <Text code>000000001–999999999</Text>
            </p>
            <div style={{ background: '#f0f5ff', borderRadius: 4, padding: '6px 10px', marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>最终 EPC 编码示例（24 位 HEX，96-bit）：</Text><br />
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 4px', borderRadius: 3 }}>3034</span>
                <span> </span>
                <span style={{ background: '#fff7e6', padding: '1px 4px', borderRadius: 3 }}>025A</span>
                <span> </span>
                <span style={{ background: '#fff7e6', padding: '1px 4px', borderRadius: 3 }}>1B20</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0000</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0000</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>公司前缀 3034</span>
                <span style={{ background: '#fff7e6', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>Header(30) + Filter(0)</span>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3 }}>序列号 000000001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>3034 025A 1B20 0000 0000 0002</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>← 第 2 个标签（序列号递增为 000000002）</Text>
              </div>
            </div>
          </div>

          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>场景 B：国外客户有 UPC 条码 → 选择 UPC → SGTIN-96</Text>
            <p style={{ margin: '4px 0 0' }}>
              北美/欧洲客户常用 12 位 UPC 条码。系统按 GS1 EPC Tag Data Standard 将其转换为 SGTIN-96 编码。
            </p>

            <div style={{ margin: '8px 0', padding: '8px 12px', background: token.colorFillQuaternary, borderRadius: 6 }}>
              <Text strong style={{ fontSize: 12 }}>转换步骤（以 UPC 190198253018 为例）</Text>
              <table style={{ width: '100%', marginTop: 6, fontSize: 11, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 0', width: 80 }}>第 1 步</td>
                    <td>客户提供 12 位 UPC 条码</td>
                    <td><Text code>190198253018</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>第 2 步</td>
                    <td>前面补 00，扩展为 14 位 GTIN-14</td>
                    <td><Text code>00190198253018</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>第 3 步</td>
                    <td>从 GTIN-14 中提取 GS1 公司前缀<br /><Text type="secondary">（前缀长度由 GS1 分配决定，本例取 7 位）</Text></td>
                    <td>
                      <span style={{ background: '#e6f7ff', padding: '0 3px', borderRadius: 2 }}>00</span>
                      <span style={{ background: '#fff7e6', padding: '0 3px', borderRadius: 2 }}>1901982</span>
                      <span style={{ background: '#f6ffed', padding: '0 3px', borderRadius: 2, marginLeft: 4 }}>53018</span>
                      <br /><Text type="secondary" style={{ fontSize: 10 }}>Indicator · 公司前缀 · Item Ref+Check</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0' }}>第 4 步</td>
                    <td>公司前缀 1901982 + 用户设定的序列号范围<br />按 GS1 SGTIN-96 标准编码为二进制</td>
                    <td>→ 96-bit 二进制 → 24 位 HEX</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f0f5ff', borderRadius: 4, padding: '6px 10px', marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>最终 EPC 编码（24 位 HEX，96-bit）：</Text><br />
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 4px', borderRadius: 3 }}>3019</span>
                <span> </span>
                <span style={{ background: '#fff7e6', padding: '1px 4px', borderRadius: 3 }}>0198</span>
                <span> </span>
                <span style={{ background: '#fff7e6', padding: '1px 4px', borderRadius: 3 }}>2530</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>1000</span>
                <span> </span>
                <span style={{ background: '#d9f7be', padding: '1px 4px', borderRadius: 3 }}>0000</span>
                <span> </span>
                <span style={{ background: '#d9f7be', padding: '1px 4px', borderRadius: 3 }}>0001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>Header(30) — SGTIN-96 固定头</span>
                <span style={{ background: '#fff7e6', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>公司前缀 1901982 + Item Ref 5301</span>
                <span style={{ background: '#d9f7be', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>序列号 000001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>Filter(0) + Partition</span>
              </div>
            </div>
          </div>

          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>场景 C：客户希望编码自带业务含义 → 选择混合编码</Text>
            <p style={{ margin: '4px 0 0' }}>
              客户期望扫描标签即可识别品类、款号、SKU。前缀填业务代码（如 BSD=波司登、ANTAM=安踏男鞋），后缀序列号自动递增。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              字符集选择：HEX（0-9/A-F，每字符 4bit）可直接写入芯片；NUMERIC（0-9）10bit/3位；ALPHANUM（0-9/A-Z）采用 Base36 编码，96-bit 芯片可存 18 字符。
            </p>
            <div style={{ background: '#f0f5ff', borderRadius: 4, padding: '6px 10px', marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>案例 1（HEX 字符集，96-bit）：</Text><br />
              <Text type="secondary" style={{ fontSize: 11 }}>配置：前缀 <Text code>BSD</Text>（波司登） · 序列号 6 位 · 起始 1</Text><br />
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2, marginBottom: 8 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 4px', borderRadius: 3 }}>BSD</span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>000001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: -4, marginBottom: 8 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>业务前缀 BSD（波司登缩写）</span>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3 }}>序列号 000001 → 000002 → 000003 ...</span>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>案例 2（ALPHANUM 字符集，96-bit）：</Text><br />
              <Text type="secondary" style={{ fontSize: 11 }}>配置：前缀 <Text code>ANTAM</Text>（安踏男鞋） · 序列号 4 位 · 起始 1</Text><br />
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2, marginTop: 4 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 4px', borderRadius: 3 }}>ANTAM</span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>业务前缀 ANTAM</span>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3 }}>序列号 0001 → 0002 → 0003 ...</span>
              </div>

              <div style={{ marginTop: 8, padding: '8px 12px', background: '#fffbe6', borderRadius: 4, fontSize: 11 }}>
                <Text strong style={{ fontSize: 12 }}>Base36 转存过程（ANTAM0001 → 芯片二进制）</Text>
                <table style={{ marginTop: 6, borderCollapse: 'collapse', lineHeight: 1.8 }}>
                  <tr>
                    <td style={{ paddingRight: 8, verticalAlign: 'top' }}>第 1 步<br/>字符→数值</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 3 }}>
                        A=10, N=23, T=29, A=10, M=22, 0=0, 0=0, 0=0, 1=1
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 2 步<br/>组合为整数</td>
                    <td style={{ paddingTop: 6 }}>
                      <span style={{ fontFamily: 'monospace' }}>
                        10×36⁸ + 23×36⁷ + ... + 1 = 30,077,243,149,825
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 3 步<br/>十进制→二进制</td>
                    <td style={{ paddingTop: 6 }}>
                      仅需 <Text strong style={{ color: '#52c41a' }}>45 bit</Text>，HEX: <span style={{ fontFamily: 'monospace' }}>1B5A E764 CE01</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingRight: 8, paddingTop: 6, verticalAlign: 'top' }}>第 4 步<br/>写入芯片</td>
                    <td style={{ paddingTop: 6 }}>
                      45 bit 写入 96-bit 芯片，占 <Text strong>46.9%</Text>，余量充足
                    </td>
                  </tr>
                </table>
                <Text type="secondary" style={{ display: 'block', marginTop: 6, borderTop: '1px dashed #d9d9d9', paddingTop: 6 }}>
                  💡 运营人员只需配置前缀和序列号，底层 Base36 编解码由系统自动完成。
                </Text>
              </div>
            </div>
          </div>

          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>场景 D：客户未提供任何编码规则 → 选择平台随机码</Text>
            <p style={{ margin: '4px 0 0' }}>
              平台生成唯一随机编码，商品生产后通过扫描条码在后台绑定商品信息。编码本身完全无业务含义，脱离系统无法识别。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              配置：随机码长度 <Text code>24</Text> 位 · 字符集 <Text code>HEX</Text> · 芯片 <Text code>96-bit</Text>
            </p>
            <div style={{ background: '#f0f5ff', borderRadius: 4, padding: '6px 10px', marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>生成编码示例（24 位 HEX，96-bit）：</Text><br />
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>3A7F 012B 9C4D 5E6F 7A8B 9C0D</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3 }}>24 位纯随机 HEX 码，无任何业务含义</span>
                <Text type="secondary" style={{ marginLeft: 8 }}>← 后台绑定：SKU=BS2024001</Text>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2, marginTop: 6 }}>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>5B2C 8E13 F047 A19D 3C62 D718</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3 }}>24 位纯随机 HEX 码，无任何业务含义</span>
                <Text type="secondary" style={{ marginLeft: 8 }}>← 后台绑定：SKU=BS2024002</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>⚠️ 扫描编码后必须在后台查询才能获知对应商品信息。</Text>
            </div>
          </div>

          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>场景 E：退货标签 / 周转箱追踪 → 选择 GRAI-96</Text>
            <p style={{ margin: '4px 0 0' }}>
              适用于可循环使用的资产（退货标签、周转箱、托盘）。资产类型编码标识资产类别，序列号追踪单次使用。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              配置：资产类型 <Text code>RT01</Text>（退货标签） · 序列号 <Text code>000001–999999</Text>
            </p>
            <div style={{ background: '#f0f5ff', borderRadius: 4, padding: '6px 10px', marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>最终 EPC 编码示例（24 位 HEX，96-bit）：</Text><br />
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 4px', borderRadius: 3 }}>3354</span>
                <span> </span>
                <span style={{ background: '#e6f7ff', padding: '1px 4px', borderRadius: 3 }}>0100</span>
                <span> </span>
                <span style={{ background: '#fff7e6', padding: '1px 4px', borderRadius: 3 }}>0000</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0000</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0000</span>
                <span> </span>
                <span style={{ background: '#f6ffed', padding: '1px 4px', borderRadius: 3 }}>0001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ background: '#e6f7ff', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>Header(33) + 资产类型 RT01</span>
                <span style={{ background: '#fff7e6', padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>Filter + Partition</span>
                <span style={{ background: '#f6ffed', padding: '1px 6px', borderRadius: 3 }}>序列号 000001</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>3354 0100 0000 0000 0000 0002</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>← 第 2 次流转（序列号递增为 000002）</Text>
              </div>
            </div>
          </div>

          {/* 字符集说明 */}
          <Text strong style={{ fontSize: 15 }}>三、字符集与芯片容量</Text>
          <div style={{ overflow: 'auto', margin: '12px 0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>字符集</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>可用字符</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>编码方式</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>96-bit 可存</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>128-bit 可存</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: `1px solid ${token.colorBorderSecondary}` }}>适用场景</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag>HEX</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>0-9, A-F</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>每字符 4bit，芯片原生支持</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>24 字符</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>32 字符</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>标准 RFID，GS1 编码</td>
                </tr>
                <tr style={{ background: token.colorFillQuaternary }}>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag>NUMERIC</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>0-9</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>BCD 编码（4bit/位）</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>24 个数字</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>32 个数字</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>纯数字序列，兼容性好</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}><Tag>ALPHANUM</Tag></td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>0-9, A-Z</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>Base36 编码（~5.17bit/字符）</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>18 字符</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>24 字符</td>
                  <td style={{ padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}` }}>需嵌入款号等含字母信息</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 常见问题 */}
          <Text strong style={{ fontSize: 15 }}>四、常见问题</Text>
          <div style={{ margin: '12px 0 16px' }}>
            <Text strong>Q: 客户的编码里含有 H、R 等超出 A-F 的字母怎么办？RFID 芯片不是只支持十六进制吗？</Text>
            <p style={{ margin: '4px 0 12px' }}>A: RFID 芯片底层存储的是二进制（0/1），HEX 显示只是因为每个 HEX 字符刚好占 4bit。ALPHANUM 采用 Base36 编码将 0-9/A-Z 映射为二进制后写入芯片，读取时再解码还原。代价是每字符约占 5.17bit，96-bit 芯片最多存 18 个 ALPHANUM 字符（而 HEX 能存 24 个）。适合短款号/前缀场景，如 ANTAM0001（9 字符，完全在 18 字符限制内）。</p>

            <Text strong>Q: 96-bit 和 128-bit 芯片有什么区别？</Text>
            <p style={{ margin: '4px 0 12px' }}>A: 96-bit 是主流 UHF RFID 芯片（如 Impinj Monza），存储 24 个 HEX 字符。128-bit 芯片有更大的用户内存区，可存 32 个 HEX 字符。如编码长度不超过 24 HEX 字符，96-bit 即可。</p>

            <Text strong>Q: 同一个品牌可以配置多条不同方案的规则吗？</Text>
            <p style={{ margin: '4px 0 12px' }}>A: 可以。通过「优先级」字段控制匹配顺序，数字越小越优先。例如波司登：P1=SGTIN-96（新货期货），P2=混合编码（补货款号），P99=平台随机码（兜底）。</p>

            <Text strong>Q: 如何避免不同品牌生成重复的 EPC 编码？</Text>
            <p style={{ margin: '4px 0 0' }}>A: SGTIN-96 方案通过 GS1 公司前缀保证全局唯一，系统配置时会自动检测跨品牌前缀冲突。混合编码和随机码由系统在生成时确保不重复。</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
