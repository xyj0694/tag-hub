import { useState, useMemo } from 'react';
import { Card, Table, Button, Tag, Select, Input, Space, Typography, Modal, Descriptions, Form, message, Popconfirm, InputNumber, Alert, Switch } from "antd";
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined, EditOutlined, CopyOutlined, EyeOutlined, ArrowLeftOutlined,
  DeleteOutlined, StopOutlined, CheckCircleOutlined,
BookOutlined } from '@ant-design/icons';
import { templates as initialTemplates, orders } from '../data/mock';

const { Title, Text } = Typography;

const tagColors: Record<string, string> = {
  '吊牌标签': 'blue',
  '不干胶贴纸标签': 'orange',
  '洗麦标签': 'green',
};

interface TemplateField {
  name: string; label: string; type: string; required: boolean;
}

interface Template {
  id: number; name: string; type: string; version: number;
  fields: TemplateField[];
  createdAt: string;
  active: boolean;
}

function templateInUse(tmpl: Template): { used: boolean; orderNos: string[] } {
  const orderNos = orders
    .filter(o => o.templateName && o.templateName.includes(tmpl.name))
    .map(o => o.orderNo);
  return { used: orderNos.length > 0, orderNos };
}

// ========== 标签设计稿 SVG 组件 ==========

function HangTagPreview({ fields, version }: { fields: TemplateField[]; version: number }) {
  return (
    <svg width="280" height="420" viewBox="0 0 280 420" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
      {/* 挂绳 */}
      <line x1="140" y1="0" x2="140" y2="22" stroke="#aaa" strokeWidth="3" strokeDasharray="4,3" strokeLinecap="round" />
      {/* 挂绳环 */}
      <ellipse cx="140" cy="8" rx="6" ry="3" fill="none" stroke="#bbb" strokeWidth="1.5" />

      {/* 主体卡片 */}
      <rect x="18" y="22" width="244" height="385" rx="12" fill="white" stroke="#d9d9d9" strokeWidth="1.5" />

      {/* 挂孔 */}
      <circle cx="140" cy="46" r="10" fill="white" stroke="#d0d0d0" strokeWidth="2" />
      <circle cx="140" cy="46" r="7.5" fill="white" stroke="#e8e8e8" strokeWidth="1" />
      <circle cx="140" cy="46" r="5" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />

      {/* 品牌区域 */}
      <rect x="34" y="70" width="212" height="36" rx="6" fill="#f4fafa" />
      <text x="140" y="94" textAnchor="middle" fontSize="16" fontWeight="700" fill="#008089" fontFamily="'Helvetica Neue', Arial, sans-serif" letterSpacing="2">INVENGO</text>

      {/* 产品名称 */}
      <text x="140" y="128" textAnchor="middle" fontSize="12" fontWeight="600" fill="#333" fontFamily="'Helvetica Neue', Arial, sans-serif">RFID 吊牌标签</text>

      {/* 分隔线 */}
      <line x1="40" y1="138" x2="240" y2="138" stroke="#eee" strokeWidth="1" />

      {/* 字段区 */}
      {fields.slice(0, 7).map((f, i) => (
        <g key={f.name}>
          <text x="42" y={160 + i * 27} fontSize="11" fontWeight="500" fill="#555" fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif">
            {f.required && <tspan fill="#ff4d4f" fontSize="10">* </tspan>}
            {f.label}
          </text>
          <line x1="130" y1={160 + i * 27 - 3} x2="236" y2={160 + i * 27 - 3} stroke="#e0e0e0" strokeWidth="0.8" />
        </g>
      ))}

      {/* 分隔线 */}
      <line x1="40" y1={162 + Math.min(fields.length, 7) * 27} x2="240" y2={162 + Math.min(fields.length, 7) * 27} stroke="#eee" strokeWidth="1" />

      {/* 条码区 */}
      <rect x="58" y={168 + Math.min(fields.length, 7) * 27} width="164" height="38" rx="4" fill="#fafafa" stroke="#e8e8e8" strokeWidth="0.8" />
      {[...Array(22)].map((_, i) => (
        <line key={i}
          x1={64 + i * 7.4} y1={170 + Math.min(fields.length, 7) * 27}
          x2={64 + i * 7.4} y2={204 + Math.min(fields.length, 7) * 27}
          stroke={i % 3 === 0 ? '#2c2c2c' : i % 3 === 1 ? '#555' : '#888'}
          strokeWidth={i % 4 === 0 ? 2 : 0.8}
        />
      ))}
      {/* EPC 编码 */}
      <text x="140" y={220 + Math.min(fields.length, 7) * 27} textAnchor="middle" fontSize="9" fill="#aaa" fontFamily="'Courier New', monospace">3034ABC000000001234</text>

      {/* 底部信息 */}
      <line x1="40" y1={232 + Math.min(fields.length, 7) * 27} x2="240" y2={232 + Math.min(fields.length, 7) * 27} stroke="#eee" strokeWidth="0.8" />
      <text x="140" y={252 + Math.min(fields.length, 7) * 27} textAnchor="middle" fontSize="8.5" fill="#bbb" fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif">
        执行标准：GB/T 22849-2014  ·  安全类别：GB 18401 B类
      </text>
      <text x="252" y="400" textAnchor="end" fontSize="8" fill="#ccc" fontFamily="sans-serif">v{version}</text>
    </svg>
  );
}

function StickerPreview({ fields, version }: { fields: TemplateField[]; version: number }) {
  return (
    <svg width="320" height="340" viewBox="0 0 320 340" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
      {/* 离型底纸 */}
      <rect x="12" y="8" width="296" height="326" rx="6" fill="#faf1d8" stroke="#e0cc90" strokeWidth="1.2" />
      {/* 底纸纹理细线 */}
      {[...Array(6)].map((_, i) => (
        <line key={i} x1="20" y1={18 + i * 56} x2="304" y2={18 + i * 56} stroke="#f0dfb0" strokeWidth="0.5" />
      ))}

      {/* 贴纸主体 */}
      <rect x="24" y="16" width="272" height="310" rx="8" fill="white" stroke="#f5a623" strokeWidth="1.8" />

      {/* 撕角标识 */}
      <path d="M296,16 Q304,16 296,28" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M296,16 Q304,16 296,24" fill="none" stroke="#f5a623" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <circle cx="296" cy="16" r="3" fill="#fff" stroke="#f5a623" strokeWidth="1" />

      {/* 品牌区 */}
      <text x="160" y="48" textAnchor="middle" fontSize="16" fontWeight="700" fill="#333" fontFamily="'Helvetica Neue', Arial, sans-serif" letterSpacing="3">INVENGO</text>
      <line x1="50" y1="58" x2="270" y2="58" stroke="#f5a623" strokeWidth="1" strokeDasharray="8,3" />

      {/* 字段区 — 左右双栏 */}
      {fields.slice(0, 4).map((f, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = col === 0 ? 50 : 180;
        const y = 80 + row * 36;
        return (
          <g key={f.name}>
            <text x={x} y={y} fontSize="11" fontWeight="500" fill="#555" fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif">
              {f.required && <tspan fill="#ff4d4f" fontSize="9">* </tspan>}
              {f.label}
            </text>
            <line x1={x + 50} y1={y - 3} x2={col === 0 ? 156 : 274} y2={y - 3} stroke="#e8e8e8" strokeWidth="0.8" />
          </g>
        );
      })}

      <line x1="40" y1={76 + Math.ceil(fields.length / 2) * 36} x2="284" y2={76 + Math.ceil(fields.length / 2) * 36} stroke="#eee" strokeWidth="0.8" />

      {/* 条码 + QR */}
      <rect x="48" y={84 + Math.ceil(fields.length / 2) * 36} width="130" height="36" rx="4" fill="#fafafa" stroke="#e8e8e8" strokeWidth="0.8" />
      {[...Array(16)].map((_, i) => (
        <line key={i}
          x1={54 + i * 7.8} y1={86 + Math.ceil(fields.length / 2) * 36}
          x2={54 + i * 7.8} y2={118 + Math.ceil(fields.length / 2) * 36}
          stroke={i % 3 === 0 ? '#2c2c2c' : '#666'} strokeWidth={i % 4 === 0 ? 1.6 : 0.7}
        />
      ))}

      {/* QR 码 */}
      <rect x="200" y={84 + Math.ceil(fields.length / 2) * 36} width="52" height="52" rx="4" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />
      {/* QR 定位图案 */}
      {[[208,92],[228,92],[208,112]].map(([cx, cy], i) => (
        <g key={i}>
          <rect x={cx} y={cy} width="16" height="16" rx="1" fill="none" stroke="#bbb" strokeWidth="1.5" />
          <rect x={cx+4} y={cy+4} width="8" height="8" rx="0.5" fill="none" stroke="#bbb" strokeWidth="1" />
          <rect x={cx+6} y={cy+6} width="4" height="4" rx="0.5" fill="#bbb" />
        </g>
      ))}
      {/* QR 数据模块 */}
      {[[214,108],[220,104],[226,108],[220,116],[236,92],[242,98],[236,104],[242,110],[236,116],[214,96],[226,96],
        [208,116],[214,120],[226,124],[236,120],[244,116],[244,122],[238,128],[230,128],[222,124],[216,128],
        [208,122],[244,108],[248,102],[248,96],[242,124],[248,118]].map(([cx, cy], i) => (
        <rect key={i} x={cx} y={cy} width="3" height="3" rx="0.3" fill="#aaa" opacity={0.7} />
      ))}

      {/* EPC */}
      <text x="160" y={152 + Math.ceil(fields.length / 2) * 36} textAnchor="middle" fontSize="9" fill="#aaa" fontFamily="'Courier New', monospace">EPC: 3034ABC000000001234</text>

      <text x="292" y="320" textAnchor="end" fontSize="8" fill="#ccc" fontFamily="sans-serif">v{version}</text>
    </svg>
  );
}

function CareLabelPreview({ fields, version }: { fields: TemplateField[]; version: number }) {
  return (
    <svg width="260" height="440" viewBox="0 0 260 440" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
      {/* 布料底色 */}
      <rect x="10" y="6" width="240" height="430" rx="4" fill="#fdfaf5" stroke="#c8bfb5" strokeWidth="1.8" />

      {/* 布料纹理 — 水平织纹 */}
      {[...Array(14)].map((_, i) => (
        <line key={`h${i}`} x1="14" y1={16 + i * 30} x2="248" y2={16 + i * 30} stroke="#f2ede6" strokeWidth="0.6" />
      ))}
      {/* 布料纹理 — 垂直织纹 */}
      {[...Array(10)].map((_, i) => (
        <line key={`v${i}`} x1={22 + i * 24} y1="10" x2={22 + i * 24} y2="434" stroke="#f5f0ea" strokeWidth="0.4" />
      ))}

      {/* 缝线内框 */}
      <rect x="20" y="14" width="220" height="414" rx="3" fill="none" stroke="#d8d0c8" strokeWidth="1.2" strokeDasharray="5,3" />

      {/* 顶部折叠区 */}
      <rect x="20" y="14" width="220" height="32" rx="3" fill="#f7f2e9" />
      <line x1="20" y1="46" x2="240" y2="46" stroke="#d8d0c8" strokeWidth="1" strokeDasharray="4,2.5" />
      <text x="130" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="#8c8278" fontFamily="'Helvetica Neue', Arial, sans-serif" letterSpacing="3">INVENGO</text>

      {/* 标题 */}
      <text x="130" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="#9c9288" fontFamily="'Helvetica Neue', Arial, sans-serif" letterSpacing="1">
        CARE INSTRUCTIONS · 洗涤说明
      </text>
      <line x1="60" y1="76" x2="200" y2="76" stroke="#e0d8d0" strokeWidth="0.6" />

      {/* 洗涤图标 */}
      <g transform="translate(28, 90)">
        {/* 水洗 */}
        <rect x="0" y="0" width="38" height="38" rx="4" fill="#f8f3eb" stroke="#d8d0c8" strokeWidth="0.8" />
        <path d="M19,10 L19,30" stroke="#8c8278" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="26" x2="26" y2="26" stroke="#8c8278" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="30" x2="24" y2="30" stroke="#8c8278" strokeWidth="1" strokeDasharray="2,1.5" strokeLinecap="round" />
        <text x="19" y="8" textAnchor="middle" fontSize="7" fill="#8c8278">30°</text>

        {/* 不可漂白 */}
        <rect x="48" y="0" width="38" height="38" rx="4" fill="#f8f3eb" stroke="#d8d0c8" strokeWidth="0.8" />
        <polygon points="67,10 63,28 71,28" fill="none" stroke="#8c8278" strokeWidth="1.4" />
        <line x1="59" y1="18" x2="75" y2="18" stroke="#8c8278" strokeWidth="1.5" />
        <line x1="63" y1="13" x2="71" y2="22" stroke="#8c8278" strokeWidth="1.5" />

        {/* 低温熨烫 */}
        <rect x="96" y="0" width="38" height="38" rx="4" fill="#f8f3eb" stroke="#d8d0c8" strokeWidth="0.8" />
        <ellipse cx="115" cy="14" rx="7" ry="4.5" fill="none" stroke="#8c8278" strokeWidth="1.4" />
        <line x1="115" y1="18" x2="115" y2="30" stroke="#8c8278" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="108" y1="26" x2="122" y2="26" stroke="#8c8278" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="115" cy="20" r="1.5" fill="#8c8278" />

        {/* 专业干洗 */}
        <rect x="144" y="0" width="38" height="38" rx="4" fill="#f8f3eb" stroke="#d8d0c8" strokeWidth="0.8" />
        <circle cx="163" cy="19" r="12" fill="none" stroke="#8c8278" strokeWidth="1.4" />
        <text x="163" y="23" textAnchor="middle" fontSize="12" fontWeight="600" fill="#8c8278" fontFamily="sans-serif">P</text>
      </g>

      {/* 分隔 */}
      <line x1="34" y1="142" x2="228" y2="142" stroke="#e0d8d0" strokeWidth="0.6" />

      {/* 字段区（单列，靠左） */}
      {fields.slice(0, 6).map((f, i) => (
        <g key={f.name}>
          <text x="38" y={164 + i * 28} fontSize="10.5" fontWeight="500" fill="#6c6258" fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif">
            {f.required && <tspan fill="#c0392b" fontSize="9">* </tspan>}
            {f.label}
          </text>
          <text x="138" y={164 + i * 28} fontSize="10.5" fill="#d5cdc5" fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif">——————————</text>
        </g>
      ))}

      {/* 底部认证信息 */}
      <line x1="34" y1={168 + Math.min(fields.length, 6) * 28 + 6} x2="228" y2={168 + Math.min(fields.length, 6) * 28 + 6} stroke="#e0d8d0" strokeWidth="0.6" />
      <text x="130" y={168 + Math.min(fields.length, 6) * 28 + 32} textAnchor="middle" fontSize="8" fill="#b8b0a8" fontFamily="'Helvetica Neue', Arial, sans-serif">
        OEKO-TEX® STANDARD 100 · 环保认证
      </text>
      <text x="130" y={168 + Math.min(fields.length, 6) * 28 + 48} textAnchor="middle" fontSize="8" fill="#c8c0b8" fontFamily="'Helvetica Neue', Arial, sans-serif">
        GB 18401-2010 B类 · 安全技术类别
      </text>

      <text x="242" y="434" textAnchor="end" fontSize="8" fill="#d0c8c0" fontFamily="sans-serif">v{version}</text>
    </svg>
  );
}

// ========== 主组件 ==========

      {/* ─── 使用说明书 Modal ─── */}
      <Modal
        title={<Space><BookOutlined /> 模板管理使用说明书</Space>}
        open={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        width={800}
        footer={<Button type="primary" onClick={() => setGuideModalOpen(false)}>关闭</Button>}
      >
        <div style={{ fontSize: 13, lineHeight: 1.9, maxHeight: '60vh', overflow: 'auto', paddingRight: 8 }}>
          <Alert
            title="本文档面向品牌方打单员，介绍标签模板的创建、编辑、设计、复制与删除等管理操作。"
            type="info" showIcon style={{ marginBottom: 20, borderRadius: 6 }}
          />
          <Text strong style={{ fontSize: 15 }}>一、页面概览</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>模板列表</Text>
            <p style={{ margin: '4px 0 0' }}>
              页面展示本品牌下所有标签模板。每行显示模板名称、标签类型（吊牌/不干胶/洗麦）、版本号、状态（启用/已禁用）和创建时间。
            </p>
          </div>
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>筛选与搜索</Text>
            <p style={{ margin: '4px 0 0' }}>
              支持按<Text code>标签类型</Text>和<Text code>状态</Text>筛选模板。搜索框支持模板名称模糊匹配。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>新建模板</Text>
            <p style={{ margin: '4px 0 0' }}>
              点击<Button size="small" type="primary" icon={<PlusOutlined />}>新建模板</Button>，填写模板名称并选择标签类型即可创建。
            </p>
          </div>
          <Text strong style={{ fontSize: 15 }}>二、模板操作</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>设计</Text>
            <p style={{ margin: '4px 0 0' }}>
              点击<Button size="small" icon={<EditOutlined />}>设计</Button>进入模板设计器，
              可添加标签字段（如品名、尺码、成分、执行标准等），通过拖拽调整字段位置和尺寸。
            </p>
          </div>
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>预览 / 编辑 / 复制</Text>
            <p style={{ margin: '4px 0 0' }}>
              <Button size="small" icon={<EyeOutlined />}>预览</Button>查看模板详情和字段列表。
              <Button size="small" icon={<EditOutlined />}>编辑</Button>修改模板名称。
              <Button size="small" icon={<CopyOutlined />}>复制</Button>基于当前模板创建副本并自动递增版本号。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>删除</Text>
            <p style={{ margin: '4px 0 0' }}>
              仅未被订单引用的模板可删除。若模板正在被订单使用，需先处理关联订单后再删除。
            </p>
          </div>
          <Text strong style={{ fontSize: 15 }}>三、模板与下单的关系</Text>
          <div style={{ margin: '12px 0 16px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>模板下单</Text>
            <p style={{ margin: '4px 0 0' }}>
              在创建订单时选择<Text code>模板下单</Text>路径，系统会根据 SKU 自动匹配对应标签类型的模板。
              模板需处于<Text code>启用</Text>状态才会出现在匹配列表中。
            </p>
          </div>
          <div style={{ margin: '0 0 20px', padding: '10px 14px', background: token.colorFillQuaternary, borderRadius: 6 }}>
            <Text strong>即时下单</Text>
            <p style={{ margin: '4px 0 0' }}>
              选择<Text code>即时下单</Text>路径时，订单提交后状态为<Text code>待补模板</Text>，
              需尽快为订单中的 SKU 创建模板，完成后订单才会推送至平台审核。
            </p>
          </div>
        </div>
      </Modal>


export default function BrandTemplates() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [templates, setTemplates] = useState<Template[]>(initialTemplates as Template[]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [editForm] = Form.useForm();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleteCheckResult, setDeleteCheckResult] = useState<{ used: boolean;
  const [guideModalOpen, setGuideModalOpen] = useState(false); orderNos: string[] }>({ used: false, orderNos: [] });

  const filtered = useMemo(() => {
    return templates
      .filter(t => {
        const matchType = typeFilter === 'all' || t.type === typeFilter;
        const matchName = !searchText || t.name.toLowerCase().includes(searchText.toLowerCase());
        return matchType && matchName;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [templates, typeFilter, searchText]);

  const handlePreview = (record: Template) => {
    setPreviewTemplate(record);
    setPreviewOpen(true);
  };

  const handleEdit = (record: Template) => {
    setEditTemplate(record);
    editForm.setFieldsValue({ name: record.name, type: record.type });
    setEditOpen(true);
  };

  const handleEditSave = () => {
    editForm.validateFields().then(values => {
      if (!editTemplate) return;
      setTemplates(prev => prev.map(t =>
        t.id === editTemplate.id ? { ...t, name: values.name, type: values.type } : t
      ));
      message.success('模板已更新');
      setEditOpen(false);
    });
  };

  const handleCopy = (record: Template) => {
    const newId = Math.max(...templates.map(t => t.id), 0) + 1;
    const copy: Template = {
      ...record,
      id: newId,
      name: `${record.name} — 副本`,
      version: 1,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      active: true,
    };
    setTemplates(prev => [...prev, copy]);
    message.success(`已复制模板：${copy.name}`);
  };

  const handleDeleteClick = (record: Template) => {
    const result = templateInUse(record);
    setDeleteTarget(record);
    setDeleteCheckResult(result);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const result = templateInUse(deleteTarget);
    if (result.used) {
      message.error(`模板已被以下订单使用，无法删除：${result.orderNos.join('、')}`);
      setDeleteTarget(null);
      return;
    }
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
    message.success('模板已删除');
    setDeleteTarget(null);
  };


  const handleCreate = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const handleCreateSave = () => {
    createForm.validateFields().then(values => {
      const newId = Math.max(...templates.map(t => t.id), 0) + 1;
      const newTemplate: Template = {
        id: newId,
        name: values.name,
        type: values.type,
        version: 1,
        fields: [],
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        active: true,
      };
      setTemplates(prev => [...prev, newTemplate]);
      message.success(`模板「${values.name}」已创建`);
      setCreateOpen(false);
      navigate(`/brand/templates/designer?type=${encodeURIComponent(values.type)}&name=${encodeURIComponent(values.name)}&w=${values.width}&h=${values.height}`);
    });
  };
  const handleToggleActive = (record: Template) => {
    setTemplates(prev => prev.map(t =>
      t.id === record.id ? { ...t, active: !t.active } : t
    ));
    message.success(record.active ? '模板已禁用' : '模板已启用');
  };

  const columns = [
    {
      title: '模板名称', dataIndex: 'name', key: 'name',
      render: (t: string, r: Template) => (
        <a
          onClick={() => handlePreview(r)}
          style={{ color: r.active ? undefined : '#bbb', textDecoration: r.active ? undefined : 'line-through' }}
        >
          {t}
        </a>
      ),
    },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (t: string, r: Template) => (
        <Tag color={r.active ? tagColors[t] : undefined} style={r.active ? {} : { opacity: 0.4 }}>
          {t}
        </Tag>
      ),
    },
    {
      title: '状态', key: 'status', width: 80,
      render: (_: any, r: Template) => (
        r.active
          ? <Tag color="green">启用</Tag>
          : <Tag color="default">已禁用</Tag>
      ),
    },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v: number) => `v${v}` },
    {
      title: '字段', dataIndex: 'fields', key: 'fields',
      render: (f: TemplateField[]) => (
        <Space size={[0, 4]} wrap>
          {f.map(field => <Tag key={field.name}>{field.label}</Tag>)}
        </Space>
      ),
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (t: string) => <span style={{ color: '#999', fontSize: 13 }}>{t}</span>,
    },
    {
      title: '操作', key: 'actions', width: 280,
      render: (_: any, record: Template) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/brand/templates/designer?id=${record.id}`)}>设计</Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>复制</Button>
          <Button
            size="small"
            icon={record.active ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleActive(record)}
          >
            {record.active ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除"
            description={templateInUse(record).used ? `该模板正被订单使用，无法删除` : `确定删除「${record.name}」？`}
            onConfirm={() => handleDeleteConfirm()}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, disabled: templateInUse(record).used }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClick(record)}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>模板管理</Title><Button icon={<BookOutlined />} onClick={() => setGuideModalOpen(true)}>使用说明书</Button></div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建模板</Button>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="全部类型"
            style={{ width: 180 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: '全部类型' },
              { value: '吊牌标签', label: '吊牌标签' },
              { value: '不干胶贴纸标签', label: '不干胶贴纸标签' },
              { value: '洗麦标签', label: '洗麦标签' },
            ]}
          />
          <Input.Search
            placeholder="搜索模板名称"
            style={{ width: 240 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onSearch={setSearchText}
            allowClear
          />
        </Space>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          rowClassName={(record: Template) => record.active ? '' : 'ant-table-row-disabled'}
        />
      </Card>

      {/* 预览弹窗 — 加宽 + 设计稿更真实 */}
      <Modal
        title="模板预览"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={<Button onClick={() => setPreviewOpen(false)}>关闭</Button>}
        width={1120}
      >
        {previewTemplate && (
          <div style={{ display: 'flex', gap: 32 }}>
            {/* 左侧：模板信息 */}
            <div style={{ flex: '0 0 420px' }}>
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="模板名称">{previewTemplate.name}</Descriptions.Item>
                <Descriptions.Item label="标签类型">
                  <Tag color={tagColors[previewTemplate.type]}>{previewTemplate.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="版本">v{previewTemplate.version}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  {previewTemplate.active ? <Tag color="green">启用</Tag> : <Tag color="default">已禁用</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>{previewTemplate.createdAt}</Descriptions.Item>
              </Descriptions>
              <Title level={5} style={{ marginTop: 8 }}>模板字段</Title>
              <Table
                dataSource={previewTemplate.fields}
                rowKey="name"
                pagination={false}
                size="small"
                columns={[
                  { title: '字段标识', dataIndex: 'name' },
                  { title: '显示名称', dataIndex: 'label' },
                  { title: '类型', dataIndex: 'type' },
                  { title: '必填', dataIndex: 'required', render: (v: boolean) => v ? <Tag color="red">必填</Tag> : <Tag>选填</Tag> },
                ]}
              />
            </div>

            {/* 右侧：标签设计稿预览 — 更大区域 */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: '#f7f7f7', borderRadius: 12, padding: 32,
              minHeight: 480,
            }}>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 24, letterSpacing: 1 }}>设计稿预览</Text>
              {previewTemplate.type === '吊牌标签' && (
                <HangTagPreview fields={previewTemplate.fields} version={previewTemplate.version} />
              )}
              {previewTemplate.type === '不干胶贴纸标签' && (
                <StickerPreview fields={previewTemplate.fields} version={previewTemplate.version} />
              )}
              {previewTemplate.type === '洗麦标签' && (
                <CareLabelPreview fields={previewTemplate.fields} version={previewTemplate.version} />
              )}
            </div>
          </div>
        )}
      </Modal>


      {/* 新建弹窗 */}
      <Modal
        title="新建模板"
        open={createOpen}
        onOk={handleCreateSave}
        onCancel={() => setCreateOpen(false)}
        okText="创建并进入设计器"
        cancelText="取消"
        width={480}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ type: '吊牌标签', width: 40, height: 90 }}>
          <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例如：波司登标准吊牌模板" />
          </Form.Item>
          <Form.Item label="标签类型" name="type" rules={[{ required: true, message: '请选择标签类型' }]}>
            <Select
              options={[
                { value: '吊牌标签', label: '吊牌标签（40×90mm）' },
                { value: '不干胶贴纸标签', label: '不干胶贴纸标签（55×75mm）' },
                { value: '洗麦标签', label: '洗麦标签（30×65mm）' },
              ]}
            />
          </Form.Item>
          <Form.Item label="标签尺寸（可自定义）">
            <Space>
              <Form.Item name="width" noStyle rules={[{ required: true }]}>
                <InputNumber min={10} max={200} style={{ width: 80 }} placeholder="宽" />
              </Form.Item>
              <Text type="secondary">×</Text>
              <Form.Item name="height" noStyle rules={[{ required: true }]}>
                <InputNumber min={10} max={300} style={{ width: 80 }} placeholder="高" />
              </Form.Item>
              <Text type="secondary">mm</Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      {/* 编辑弹窗 */}
      <Modal
        title="编辑模板"
        open={editOpen}
        onOk={handleEditSave}
        onCancel={() => setEditOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="模板名称" />
          </Form.Item>
          <Form.Item label="标签类型" name="type" rules={[{ required: true, message: '请选择标签类型' }]}>
            <Select
              options={[
                { value: '吊牌标签', label: '吊牌标签' },
                { value: '不干胶贴纸标签', label: '不干胶贴纸标签' },
                { value: '洗麦标签', label: '洗麦标签' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
