// ============================================================
// 标签接单协作平台 — Mock 数据 v2
// ============================================================

export type TagType = '吊牌标签' | '不干胶贴纸标签' | '洗麦标签';
export type OrderType = '大货单' | '免费单' | '补单';
export type OrderStatus = '待审核' | '已审核' | '已拆分' | '待接单' | '已接单' | '生产中' | '生产完成' | '部分发货' | '已发货' | '已签收' | '已取消' | '已驳回';

export interface Template {
  id: number; name: string; type: TagType; version: number;
  fields: { name: string; label: string; type: string; required: boolean }[];
  createdAt: string;
  active: boolean;
}

export interface Order {
  id: string; orderNo: string; brandName: string; factoryName: string;
  type: OrderType; tagType: TagType; totalQuantity: number; status: OrderStatus;
  createdAt: string; shippingAddress: string; contact: string; phone: string;
  templateName?: string;
  productName?: string;
  styleNo?: string;
  sku?: string;
  isUrgent?: boolean;
  createdBy?: string;
  dataSource?: 'platform' | 'customer';
  subOrders: SubOrder[];
  cancelReason?: string;
  reduceQuantity?: number;
  statusLog: { status: string; time: string; operator: string }[];
}

export interface PurchaserAccount {
  id: number;
  name: string;
  phone: string;
  brandId: number;
  role: 'admin' | 'purchaser';
  allowBilling: boolean;
  remark?: string;
}

export interface SubOrder {
  id: string; orderNo: string; supplierName: string; supplierId?: number; sku: string;
  quantity: number; status: OrderStatus; shippedQuantity: number;
  shipments?: Shipment[];        // 发货批次（可能多次）
}

export interface Supplier {
  id: number; name: string; contact: string; phone: string; orderCount: number; status: string;
  email: string; address: string; specialty: string; createdAt: string;
}


export interface Factory {
  id: number; name: string; contact: string; phone: string; email: string;
  address: string; status: string; // '未激活' | '启用' | '停用'
  orderCount: number; lastLoginAt: string;
  brandName: string;
  brandId: number | null; // null = 独立工厂，不挂靠品牌
  visibleToBrand: boolean; // 品牌方可见性，由平台方配置
}

export interface CustomerCompany {
  id: number; name: string; contact: string; phone: string;
  email: string; allowBrandSwitch: boolean; status: string;
}

export interface Brand {
  id: number; customerCompanyId: number; name: string; contact: string; phone: string; factoryCount: number;
  epcRules: EpcRule[];
}

export type EpcSchemeType = 'SGTIN96' | 'GRAI96' | 'PLATFORM_RANDOM' | 'HYBRID' | 'UPC_SGTIN96';
export type Charset = 'HEX' | 'NUMERIC' | 'ALPHANUM';

export interface EpcRule {
  id: number; name: string; type: EpcSchemeType;
  config: string; active: boolean;
  priority?: number;
  charset?: Charset;
  bitCapacity?: 96 | 128;
  // SGTIN-96 / UPC_SGTIN96 fields
  companyPrefix?: string;
  serialStart?: number;
  serialEnd?: number;
  filterValue?: number;
  // UPC_SGTIN96 specific
  upcCode?: string;
  // HYBRID / PLATFORM_RANDOM fields
  prefix?: string;
  seqLength?: number;
  seqStart?: number;
  step?: number;
  seqCurrent?: number;
  randomLength?: number;
  // GRAI-96 fields
  graiAssetType?: string;
  graiSerialStart?: number;
  graiSerialEnd?: number;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  usageCount?: number;
  wasteAllowancePct?: number; // 废标预留比例，默认 2%
}

export interface EpcRuleChangeLog {
  id: number; ruleId: number; action: string; field: string; from: string; to: string; by: string; at: string;
}

export interface Shipment {
  id: string; batchNo: string; quantity: number; trackingNo: string;
  courier: string; shippedAt: string; signed: boolean;
  supTrackingNo?: string;        // 供应商→平台快递单号
  platformTrackingNo?: string;   // 平台→客户快递单号
  signedAt?: string;             // 签收时间
  signedDocNo?: string;          // 回签单号
  signedDocUrl?: string;        // 回签单图片/PDF 地址
  signedDocType?: 'image' | 'pdf'; // 回签单类型
}

export interface ShipmentBatch {
  batchNo: string;              // 批次号
  quantity: number;             // 发货数量
  shippedAt: string;            // 发货时间
  supTrackingNo: string;        // 供应商→平台方 快递单号
  platformTrackingNo: string;   // 平台方→客户 快递单号
  signedAt: string;             // 签收时间
  signedDocNo: string;          // 签收单号（电子回单编号）
}

export interface BillingDetailItem {
  parentOrderNo: string;   // 父订单号
  subOrderNo: string;      // 子订单号
  sku: string; productName: string; quantity: number;
  unitPrice: number; amount: number;
  batches: ShipmentBatch[]; // 发货批次（可能多次）
}

export interface BillingItem {
  key: string; billingNo: string; period: string; totalAmount: number;
  status: string; // 待确认 | 已确认 | 已付款 | 超期未付
  invoiceUploaded: boolean;
  paymentDueDate: string;     // 付款到期日
  overdue: boolean;            // 是否超期
  brandName: string;           // 品牌方名称
  dimension: 'factory' | 'brand' | 'company';
  dimensionName: string;       // 工厂名/品牌名/公司名
  items: BillingDetailItem[]; // 对账单明细
}

export interface EpcValidationError {
  row: number; epc: string; reason: string;
}

// ---- 模板 ----
export const templates: Template[] = [
  { id: 1, name: '标准吊牌模板', type: '吊牌标签', version: 3, createdAt: '2025-11-15 14:30', active: true,
    fields: [
      { name: 'productName', label: '品名', type: 'text', required: true },
      { name: 'standard', label: '执行标准', type: 'text', required: true },
      { name: 'size', label: '尺码', type: 'text', required: true },
      { name: 'washMethod', label: '洗涤方式', type: 'text', required: false },
      { name: 'composition', label: '成分', type: 'text', required: true },
      { name: 'grade', label: '安全类别', type: 'text', required: true },
    ] },
  { id: 2, name: '不干胶通用模板', type: '不干胶贴纸标签', version: 2, createdAt: '2026-01-20 09:15', active: true,
    fields: [
      { name: 'productName', label: '品名', type: 'text', required: true },
      { name: 'size', label: '尺码', type: 'text', required: true },
      { name: 'color', label: '颜色', type: 'text', required: true },
      { name: 'barcode', label: '条码', type: 'text', required: true },
    ] },
  { id: 3, name: '洗麦基础模板', type: '洗麦标签', version: 1, createdAt: '2026-03-08 16:45', active: true,
    fields: [
      { name: 'productName', label: '品名', type: 'text', required: true },
      { name: 'composition', label: '成分', type: 'text', required: true },
      { name: 'washMethod', label: '洗涤方式', type: 'text', required: true },
      { name: 'standard', label: '执行标准', type: 'text', required: true },
      { name: 'grade', label: '安全类别', type: 'text', required: true },
    ] },
  { id: 4, name: '羽绒服吊牌模板', type: '吊牌标签', version: 2, createdAt: '2026-02-10 10:00', active: true,
    fields: [
      { name: 'productName', label: '品名', type: 'text', required: true },
      { name: 'standard', label: '执行标准', type: 'text', required: true },
      { name: 'size', label: '尺码', type: 'text', required: true },
      { name: 'fillContent', label: '填充物', type: 'text', required: true },
      { name: 'fillRatio', label: '含绒量', type: 'text', required: true },
      { name: 'composition', label: '面料成分', type: 'text', required: true },
      { name: 'grade', label: '安全类别', type: 'text', required: true },
    ] },
  { id: 5, name: '童装吊牌模板', type: '吊牌标签', version: 1, createdAt: '2026-04-01 08:30', active: false,
    fields: [
      { name: 'productName', label: '品名', type: 'text', required: true },
      { name: 'standard', label: '执行标准', type: 'text', required: true },
      { name: 'size', label: '尺码', type: 'text', required: true },
      { name: 'composition', label: '成分', type: 'text', required: true },
      { name: 'grade', label: '安全类别', type: 'text', required: true },
      { name: 'ageRange', label: '适龄范围', type: 'text', required: true },
    ] },
];

// ---- 客户公司 ----
export const customerCompanies: CustomerCompany[] = [
  { id: 1, name: '波司登国际控股有限公司', contact: '高德康', phone: '139****0000', email: 'gaodekang@bosideng.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 2, name: '太平鸟集团有限公司', contact: '张江平', phone: '138****1111', email: 'zhangjp@peacebird.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 3, name: '江南布衣服饰有限公司', contact: '吴健', phone: '137****2222', email: 'wujian@jnby.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 4, name: '森马服饰股份有限公司', contact: '邱光和', phone: '136****3333', email: 'qiugh@semir.com', allowBrandSwitch: true, status: 'INACTIVE' },
  { id: 5, name: '安踏体育用品有限公司', contact: '丁世忠', phone: '135****4444', email: 'dingsz@anta.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 6, name: '海澜之家集团股份有限公司', contact: '周立宸', phone: '134****5555', email: 'zhoulc@hla.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 7, name: '李宁（中国）体育用品有限公司', contact: '李宁', phone: '133****6666', email: 'lining@lining.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 8, name: '特步（中国）有限公司', contact: '丁水波', phone: '132****7777', email: 'dingsb@xtep.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 9, name: '雅戈尔集团股份有限公司', contact: '李如成', phone: '131****8888', email: 'lirc@youngor.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 10, name: '报喜鸟控股股份有限公司', contact: '吴志泽', phone: '130****9999', email: 'wuzz@baoxiniao.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 11, name: '七匹狼实业股份有限公司', contact: '周少雄', phone: '139****1010', email: 'zhousx@septwolves.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 12, name: '九牧王股份有限公司', contact: '林聪颖', phone: '138****1112', email: 'lincy@joecne.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 13, name: '罗蒙集团股份有限公司', contact: '盛静生', phone: '137****1212', email: 'shengjs@romon.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 14, name: '红豆集团有限公司', contact: '周海江', phone: '136****1313', email: 'zhouhj@hongdou.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 15, name: '杉杉品牌运营股份有限公司', contact: '郑永刚', phone: '135****1414', email: 'zhengyg@shanshan.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 16, name: '地素时尚股份有限公司', contact: '马瑞敏', phone: '134****1515', email: 'marm@dazzle.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 17, name: '朗姿股份有限公司', contact: '申东日', phone: '133****1616', email: 'shendr@lancy.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 18, name: '歌力思服饰股份有限公司', contact: '夏国新', phone: '132****1717', email: 'xiagx@ellassay.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 19, name: '锦泓时装集团股份有限公司', contact: '王致勤', phone: '131****1818', email: 'wangzq@jinhong.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 20, name: '日播时尚集团股份有限公司', contact: '王卫东', phone: '130****1919', email: 'wangwd@ribo.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 21, name: '安正时尚集团股份有限公司', contact: '郑安政', phone: '139****2020', email: 'zhengaz@anzheng.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 22, name: '欣贺股份有限公司', contact: '孙瑞哲', phone: '138****2121', email: 'sunrz@xinhee.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 23, name: '汇洁股份有限公司', contact: '林升智', phone: '137****2222', email: 'linsz@huijie.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 24, name: '探路者控股集团股份有限公司', contact: '李明', phone: '136****2323', email: 'liming@toread.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 25, name: '比音勒芬服饰股份有限公司', contact: '谢秉政', phone: '135****2424', email: 'xiebz@biyinlefen.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 26, name: '乔治白服饰股份有限公司', contact: '池方燃', phone: '134****2525', email: 'chifr@qiaozhibai.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 27, name: '步森服饰股份有限公司', contact: '陈建飞', phone: '133****2626', email: 'chenjf@busen.com', allowBrandSwitch: false, status: 'INACTIVE' },
  { id: 28, name: '美邦服饰股份有限公司', contact: '周成建', phone: '132****2727', email: 'zhoucj@metersbonwe.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 29, name: '卡宾服饰（中国）有限公司', contact: '杨紫明', phone: '131****2828', email: 'yangzm@cabbeen.com', allowBrandSwitch: false, status: 'ACTIVE' },
  { id: 30, name: '玛丝菲尔时尚集团', contact: '朱崇恽', phone: '130****2929', email: 'zhucy@marisfrolg.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 31, name: '影儿时尚集团', contact: '俞淇纲', phone: '139****3030', email: 'yuqg@yinger.com', allowBrandSwitch: true, status: 'ACTIVE' },
  { id: 32, name: '赢家时尚控股有限公司', contact: '金明', phone: '138****3131', email: 'jinming@yingjia.com', allowBrandSwitch: false, status: 'ACTIVE' },
];

// ---- 供应商 ----
export const suppliers: Supplier[] = [
  { id: 1, name: '杭州信达标签印刷有限公司', contact: '王建国', phone: '137****9012', email: 'wangjg@xinda-label.cn', address: '浙江省杭州市余杭区仓前街道文一西路998号', specialty: '织唛、吊牌', orderCount: 47, status: 'ACTIVE', createdAt: '2025-03-15' },
  { id: 2, name: '温州正邦印务有限公司', contact: '赵志强', phone: '136****3456', email: 'zhaozq@zhengbang.cn', address: '浙江省温州市龙湾区永中街道高新大道168号', specialty: '洗标、贴纸', orderCount: 32, status: 'ACTIVE', createdAt: '2025-06-20' },
  { id: 3, name: '宁波华美印刷包装有限公司', contact: '钱伟明', phone: '135****7890', email: 'qianwm@huamei-pack.cn', address: '浙江省宁波市北仑区大碶街道沿山公路55号', specialty: '包装盒、吊牌', orderCount: 58, status: 'ACTIVE', createdAt: '2025-01-10' },
  { id: 4, name: '绍兴天成标签科技有限公司', contact: '孙海龙', phone: '134****2345', email: 'sunhl@tiancheng-label.cn', address: '浙江省绍兴市柯桥区钱清镇工业园区12号', specialty: '不干胶标签', orderCount: 19, status: 'ACTIVE', createdAt: '2025-08-05' },
  { id: 5, name: '嘉兴恒达标识制作有限公司', contact: '周永强', phone: '133****6789', email: 'zhouyq@hengda-sign.cn', address: '浙江省嘉兴市南湖区大桥镇工业路88号', specialty: '热转印、织标', orderCount: 41, status: 'ACTIVE', createdAt: '2025-04-22' },
  { id: 6, name: '上海启明不干胶制品厂', contact: '李长江', phone: '132****3456', email: 'licj@qiming-sticker.cn', address: '上海市松江区新桥镇新格路208号', specialty: '不干胶、水洗标', orderCount: 23, status: 'ACTIVE', createdAt: '2025-09-12' },
  { id: 7, name: '义乌丰源包装印刷有限公司', contact: '黄志远', phone: '131****7890', email: 'huangzy@fengyuan.cn', address: '浙江省金华市义乌市稠江街道城店路333号', specialty: '吊牌、贴纸、织唛', orderCount: 35, status: 'ACTIVE', createdAt: '2025-02-28' },
  { id: 8, name: '深圳鹏程数码印刷有限公司', contact: '郑浩宇', phone: '130****2345', email: 'zhenghy@pengcheng-print.cn', address: '广东省深圳市宝安区西乡街道宝源路77号', specialty: '数码印刷标签', orderCount: 12, status: 'INACTIVE', createdAt: '2025-07-18' },
];


// ---- 工厂（成衣厂） ----
export const factories: Factory[] = [
  { id: 1, name: '杭州成衣一厂', contact: '李明辉', phone: '139****5678', email: 'liminghui@example.com', address: '浙江省杭州市萧山区经济技术开发区桥南区块128号', status: '启用', orderCount: 47, lastLoginAt: '2026-06-06 09:15', brandName: '波司登（Bosideng）', brandId: 1, visibleToBrand: true },
  { id: 2, name: '宁波成衣二厂', contact: '王建国', phone: '137****9012', email: 'wangjianguo@example.com', address: '浙江省宁波市鄞州区姜山镇明光路88号', status: '启用', orderCount: 32, lastLoginAt: '2026-06-05 14:30', brandName: '波司登（Bosideng）', brandId: 1, visibleToBrand: true },
  { id: 3, name: '温州成衣三厂', contact: '陈志强', phone: '136****2345', email: 'chenzhiqiang@example.com', address: '浙江省温州市瓯海区娄桥工业区55号', status: '未激活', orderCount: 0, lastLoginAt: '—', brandName: '波司登（Bosideng）', brandId: 1, visibleToBrand: false },
  { id: 4, name: '嘉兴成衣四厂', contact: '赵永刚', phone: '135****6789', email: 'zhaoyonggang@example.com', address: '浙江省嘉兴市南湖区余新镇工业园12号', status: '停用', orderCount: 12, lastLoginAt: '2026-03-20 10:00', brandName: '波司登（Bosideng）', brandId: 1, visibleToBrand: false },
  { id: 5, name: '苏州成衣五厂', contact: '孙海龙', phone: '134****2345', email: 'sunhailong@example.com', address: '江苏省苏州市吴江区盛泽镇纺织工业园', status: '启用', orderCount: 58, lastLoginAt: '2026-06-06 08:22', brandName: '雪中飞（Snow Flying）', brandId: 2, visibleToBrand: true },
  { id: 6, name: '无锡成衣六厂', contact: '周永强', phone: '133****6789', email: 'zhouyongqiang@example.com', address: '江苏省无锡市锡山区东港镇工业园区', status: '未激活', orderCount: 0, lastLoginAt: '—', brandName: '雪中飞（Snow Flying）', brandId: 2, visibleToBrand: false },
  { id: 7, name: '福建晋江成衣厂', contact: '林志伟', phone: '159****3344', email: 'linzw@jinjiang-garment.cn', address: '福建省泉州市晋江市陈埭镇鞋都路88号', status: '启用', orderCount: 15, lastLoginAt: '2026-06-06 11:00', brandName: '—', brandId: null, visibleToBrand: false },
];

// ---- 采购子账号 ----
export const purchaserAccounts: PurchaserAccount[] = [
  { id: 1, name: '赵采购', phone: '138****7701', brandId: 1, role: 'purchaser', allowBilling: false, remark: 'T恤品类' },
  { id: 2, name: '钱采购', phone: '138****7702', brandId: 1, role: 'purchaser', allowBilling: true, remark: '外套品类' },
];


// ---- EPC 规则变更记录 ----
export const epcRuleChangeLogs: EpcRuleChangeLog[] = [
  { id: 1, ruleId: 1, action: '编辑', field: '公司前缀', from: '3033', to: '3034', by: '张运营', at: '2026-05-20 14:30' },
  { id: 2, ruleId: 1, action: '编辑', field: '规则名称', from: '默认SGTIN', to: '新货SGTIN', by: '张运营', at: '2026-05-20 14:28' },
  { id: 3, ruleId: 2, action: '编辑', field: '当前值', from: 'BSD145', to: 'BSD158', by: '系统自动', at: '2026-06-06 09:00' },
  { id: 4, ruleId: 23, action: '新增', field: '全部', from: '', to: '创建', by: '赵运营', at: '2026-06-02 10:15' },
  { id: 5, ruleId: 22, action: '新增', field: '全部', from: '', to: '创建', by: '王运营', at: '2026-04-10 11:00' },
];

// ---- 品牌 ----
export const brands: Brand[] = [
  { id: 1, customerCompanyId: 1, name: '波司登（Bosideng）', contact: '张建国', phone: '138****1234', factoryCount: 4,
    epcRules: [
      { id: 1, name: '新货SGTIN', type: 'SGTIN96', config: '公司前缀:3034 | 序列号:000000001-999999999', active: true, priority: 1, charset: 'HEX', companyPrefix: '3034', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 156, wasteAllowancePct: 2, createdAt: '2026-01-10', updatedAt: '2026-05-20', updatedBy: '张运营' },
      { id: 2, name: '补货款号流水', type: 'HYBRID', config: '前缀:BSD | 序列:000001-999999 | 字符集:HEX', active: true, priority: 2, charset: 'HEX', prefix: 'BSD', seqLength: 6, seqStart: 1, step: 1, seqCurrent: 158, bitCapacity: 96, usageCount: 42, createdAt: '2026-02-15', updatedAt: '2026-05-22', updatedBy: '张运营' },
      { id: 24, name: '平台兜底随机码', type: 'PLATFORM_RANDOM', config: '长度:24 | 字符集:HEX', active: true, priority: 99, charset: 'HEX', randomLength: 24, bitCapacity: 96, usageCount: 0, createdAt: '2026-06-05', updatedAt: '2026-06-05', updatedBy: '张运营' },
    ] },
  { id: 2, customerCompanyId: 1, name: '雪中飞（Snow Flying）', contact: '李明辉', phone: '139****5678', factoryCount: 2,
    epcRules: [{ id: 3, name: '默认SGTIN', type: 'SGTIN96', config: '公司前缀:3035 | 序列号:000000001-999999999', active: true, charset: 'HEX', companyPrefix: '3035', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 34, wasteAllowancePct: 2, createdAt: '2026-01-15', updatedAt: '2026-03-10', updatedBy: '张运营' }] },
  { id: 3, customerCompanyId: 2, name: '太平鸟男装（PEACEBIRD MEN）', contact: '陈伟', phone: '138****2345', factoryCount: 3,
    epcRules: [{ id: 4, name: 'PB-SGTIN', type: 'SGTIN96', config: '公司前缀:3036 | 序列号:000000001-999999999', active: true, charset: 'HEX', companyPrefix: '3036', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 67, createdAt: '2026-02-20', updatedAt: '2026-04-05', updatedBy: '李运营' }] },
  { id: 4, customerCompanyId: 2, name: '乐町（LEDIN）', contact: '王芳', phone: '137****3456', factoryCount: 2,
    epcRules: [{ id: 5, name: 'LD-SGTIN', type: 'SGTIN96', config: '公司前缀:3037 | 序列号:000000001-999999999', active: true, charset: 'HEX', companyPrefix: '3037', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 23, createdAt: '2026-03-01', updatedAt: '2026-03-01', updatedBy: '张运营' }] },
  { id: 5, customerCompanyId: 3, name: 'JNBY', contact: '吴健', phone: '137****2222', factoryCount: 2,
    epcRules: [{ id: 6, name: 'JNBY-SGTIN', type: 'SGTIN96', config: '公司前缀:3038 | 序列号:000000001-999999999', active: true, charset: 'HEX', companyPrefix: '3038', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 45, createdAt: '2026-02-10', updatedAt: '2026-02-10', updatedBy: '吴运营' }] },
  { id: 6, customerCompanyId: 5, name: '安踏（ANTA）', contact: '郑捷', phone: '135****4444', factoryCount: 5,
    epcRules: [
      { id: 7, name: 'ANTA-SGTIN', type: 'SGTIN96', config: '公司前缀:3039 | 序列号:000000001-999999999', active: true, priority: 1, charset: 'HEX', companyPrefix: '3039', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 210, createdAt: '2026-01-20', updatedAt: '2026-05-15', updatedBy: '王运营' },
      { id: 22, name: 'ANTA退货资产', type: 'GRAI96', config: '资产类型:RT01 | 序列号:000001-999999', active: true, priority: 2, graiAssetType: 'RT01', graiSerialStart: 1, graiSerialEnd: 999999, usageCount: 12, createdAt: '2026-04-10', updatedAt: '2026-05-30', updatedBy: '王运营' },
      { id: 26, name: 'ANTA鞋类款号', type: 'HYBRID', config: '前缀:ANTAM | 序列:0001-9999 | 字符集:ALPHANUM', active: true, priority: 3, charset: 'ALPHANUM', prefix: 'ANTAM', seqLength: 4, seqStart: 1, step: 1, seqCurrent: 145, bitCapacity: 96, usageCount: 145, createdAt: '2026-03-20', updatedAt: '2026-05-01', updatedBy: '王运营' },
    ] },
  { id: 7, customerCompanyId: 5, name: '斐乐（FILA）', contact: '姚伟雄', phone: '136****5555', factoryCount: 3,
    epcRules: [{ id: 8, name: 'FILA-SGTIN', type: 'SGTIN96', config: '公司前缀:3040 | 序列号:000000001-999999999', active: true, charset: 'HEX', companyPrefix: '3040', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 56, createdAt: '2026-03-15', updatedAt: '2026-05-01', updatedBy: '王运营' }] },
  { id: 8, customerCompanyId: 6, name: '海澜之家（HLA）', contact: '周立宸', phone: '134****5555', factoryCount: 6,
    epcRules: [
      { id: 9, name: 'HLA-SGTIN', type: 'SGTIN96', config: '公司前缀:3041 | 序列号:000000001-999999999', active: true, priority: 1, charset: 'HEX', companyPrefix: '3041', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 78, createdAt: '2026-02-01', updatedAt: '2026-05-10', updatedBy: '赵运营' },
      { id: 23, name: 'HLA补货SGTIN', type: 'SGTIN96', config: '公司前缀:3041 | 序列号:500000001-600000000', active: true, priority: 2, charset: 'HEX', companyPrefix: '3041', serialStart: 500000001, serialEnd: 600000000, filterValue: 0, usageCount: 0, createdAt: '2026-06-02', updatedAt: '2026-06-02', updatedBy: '赵运营' },
    ] },
  { id: 9, customerCompanyId: 6, name: '爱居兔（EICHITOO）', contact: '赵丽', phone: '133****6667', factoryCount: 1,
    epcRules: [{ id: 10, name: 'EIC-SGTIN', type: 'SGTIN96', config: '公司前缀:3042 | 序列号:000000001-999999999', active: true }] },
  { id: 10, customerCompanyId: 7, name: '李宁（LI-NING）', contact: '李宁', phone: '133****6666', factoryCount: 4,
    epcRules: [
      { id: 11, name: 'LN-SGTIN', type: 'SGTIN96', config: '公司前缀:3043 | 序列号:000000001-999999999', active: true, priority: 1, charset: 'HEX', companyPrefix: '3043', serialStart: 1, serialEnd: 999999999, filterValue: 0, usageCount: 89, createdAt: '2026-03-01', updatedAt: '2026-06-01', updatedBy: '李运营' },
      { id: 12, name: 'LN款号流水', type: 'HYBRID', config: '前缀:LN | 序列:000001-999999 | 字符集:HEX', active: true, priority: 2, charset: 'HEX', prefix: 'LN', seqLength: 6, seqStart: 1, step: 1, seqCurrent: 320, usageCount: 28, createdAt: '2026-03-01', updatedAt: '2026-04-15', updatedBy: '李运营' },
      { id: 25, name: 'UPC进口线', type: 'UPC_SGTIN96', config: 'UPC:190198253018 | 序列号:000001-999999', active: true, priority: 3, charset: 'HEX', upcCode: '190198253018', companyPrefix: '1901982', serialStart: 1, serialEnd: 999999, filterValue: 0, usageCount: 5, createdAt: '2026-06-01', updatedAt: '2026-06-01', updatedBy: '李运营' },
    ] },
  { id: 11, customerCompanyId: 8, name: '特步（XTEP）', contact: '丁水波', phone: '132****7777', factoryCount: 3,
    epcRules: [{ id: 13, name: 'XTEP-SGTIN', type: 'SGTIN96', config: '公司前缀:3044 | 序列号:000000001-999999999', active: true }] },
  { id: 12, customerCompanyId: 8, name: '索康尼（Saucony）', contact: '林海', phone: '131****7778', factoryCount: 1,
    epcRules: [{ id: 14, name: 'SAU-SGTIN', type: 'SGTIN96', config: '公司前缀:3045 | 序列号:000000001-999999999', active: true }] },
  { id: 13, customerCompanyId: 9, name: '雅戈尔（YOUNGOR）', contact: '李如成', phone: '131****8888', factoryCount: 3,
    epcRules: [{ id: 15, name: 'YG-SGTIN', type: 'SGTIN96', config: '公司前缀:3046 | 序列号:000000001-999999999', active: true }] },
  { id: 14, customerCompanyId: 10, name: '报喜鸟（SAINT ANGELO）', contact: '吴志泽', phone: '130****9999', factoryCount: 1,
    epcRules: [{ id: 16, name: 'SA-SGTIN', type: 'SGTIN96', config: '公司前缀:3047 | 序列号:000000001-999999999', active: true }] },
  { id: 15, customerCompanyId: 11, name: '七匹狼（SEPTWOLVES）', contact: '周少雄', phone: '139****1010', factoryCount: 2,
    epcRules: [{ id: 17, name: '7W-SGTIN', type: 'SGTIN96', config: '公司前缀:3048 | 序列号:000000001-999999999', active: true }] },
  { id: 16, customerCompanyId: 12, name: '九牧王（JOEONE）', contact: '林聪颖', phone: '138****1112', factoryCount: 2,
    epcRules: [{ id: 18, name: 'JOE-SGTIN', type: 'SGTIN96', config: '公司前缀:3049 | 序列号:000000001-999999999', active: true }] },
  { id: 17, customerCompanyId: 13, name: '罗蒙（ROMON）', contact: '盛静生', phone: '137****1212', factoryCount: 1,
    epcRules: [{ id: 19, name: 'RM-SGTIN', type: 'SGTIN96', config: '公司前缀:3050 | 序列号:000000001-999999999', active: true }] },
  { id: 18, customerCompanyId: 14, name: '红豆（HODO）', contact: '周海江', phone: '136****1313', factoryCount: 2,
    epcRules: [{ id: 20, name: 'HD-SGTIN', type: 'SGTIN96', config: '公司前缀:3051 | 序列号:000000001-999999999', active: true }] },
  { id: 19, customerCompanyId: 15, name: '杉杉（SHANSHAN）', contact: '郑永刚', phone: '135****1414', factoryCount: 1,
    epcRules: [{ id: 21, name: 'SS-SGTIN', type: 'SGTIN96', config: '公司前缀:3052 | 序列号:000000001-999999999', active: true }] },
  { id: 20, customerCompanyId: 16, name: 'DAZZLE', contact: '马瑞敏', phone: '134****1515', factoryCount: 1,
    epcRules: [{ id: 22, name: 'DZ-SGTIN', type: 'SGTIN96', config: '公司前缀:3053 | 序列号:000000001-999999999', active: true }] },
  { id: 21, customerCompanyId: 17, name: '朗姿（LANCY）', contact: '申东日', phone: '133****1616', factoryCount: 2,
    epcRules: [{ id: 23, name: 'LC-SGTIN', type: 'SGTIN96', config: '公司前缀:3054 | 序列号:000000001-999999999', active: true }] },
  { id: 22, customerCompanyId: 18, name: '歌力思（ELLASSAY）', contact: '夏国新', phone: '132****1717', factoryCount: 1,
    epcRules: [{ id: 24, name: 'EL-SGTIN', type: 'SGTIN96', config: '公司前缀:3055 | 序列号:000000001-999999999', active: true }] },
  { id: 23, customerCompanyId: 19, name: '锦泓（VGRASS）', contact: '王致勤', phone: '131****1818', factoryCount: 1,
    epcRules: [{ id: 25, name: 'VG-SGTIN', type: 'SGTIN96', config: '公司前缀:3056 | 序列号:000000001-999999999', active: true }] },
  { id: 24, customerCompanyId: 20, name: '播（broadcast）', contact: '王卫东', phone: '130****1919', factoryCount: 1,
    epcRules: [{ id: 26, name: 'BC-SGTIN', type: 'SGTIN96', config: '公司前缀:3057 | 序列号:000000001-999999999', active: true }] },
  { id: 25, customerCompanyId: 21, name: '玖姿（JZ）', contact: '郑安政', phone: '139****2020', factoryCount: 2,
    epcRules: [{ id: 27, name: 'JZ-SGTIN', type: 'SGTIN96', config: '公司前缀:3058 | 序列号:000000001-999999999', active: true }] },
  { id: 26, customerCompanyId: 22, name: 'JORYA', contact: '孙瑞哲', phone: '138****2121', factoryCount: 1,
    epcRules: [{ id: 28, name: 'JY-SGTIN', type: 'SGTIN96', config: '公司前缀:3059 | 序列号:000000001-999999999', active: true }] },
  { id: 27, customerCompanyId: 23, name: '曼妮芬（MANIFORM）', contact: '林升智', phone: '137****2222', factoryCount: 1,
    epcRules: [{ id: 29, name: 'MF-SGTIN', type: 'SGTIN96', config: '公司前缀:3060 | 序列号:000000001-999999999', active: true }] },
  { id: 28, customerCompanyId: 24, name: '探路者（TOREAD）', contact: '李明', phone: '136****2323', factoryCount: 1,
    epcRules: [{ id: 30, name: 'TR-SGTIN', type: 'SGTIN96', config: '公司前缀:3061 | 序列号:000000001-999999999', active: true }] },
  { id: 29, customerCompanyId: 25, name: '比音勒芬（BIEM.L.FDLKK）', contact: '谢秉政', phone: '135****2424', factoryCount: 1,
    epcRules: [{ id: 31, name: 'BY-SGTIN', type: 'SGTIN96', config: '公司前缀:3062 | 序列号:000000001-999999999', active: true }] },
  { id: 30, customerCompanyId: 26, name: '乔治白（QIAOZHIBAI）', contact: '池方燃', phone: '134****2525', factoryCount: 1,
    epcRules: [{ id: 32, name: 'QZB-SGTIN', type: 'SGTIN96', config: '公司前缀:3063 | 序列号:000000001-999999999', active: true }] },
  { id: 31, customerCompanyId: 28, name: '美特斯邦威（Meters/bonwe）', contact: '周成建', phone: '132****2727', factoryCount: 3,
    epcRules: [{ id: 33, name: 'MB-SGTIN', type: 'SGTIN96', config: '公司前缀:3064 | 序列号:000000001-999999999', active: true }] },
  { id: 32, customerCompanyId: 28, name: 'ME&CITY', contact: '林佳', phone: '131****2728', factoryCount: 1,
    epcRules: [{ id: 34, name: 'MC-SGTIN', type: 'SGTIN96', config: '公司前缀:3065 | 序列号:000000001-999999999', active: true }] },
  { id: 33, customerCompanyId: 29, name: '卡宾（Cabbeen）', contact: '杨紫明', phone: '131****2828', factoryCount: 1,
    epcRules: [{ id: 35, name: 'CB-SGTIN', type: 'SGTIN96', config: '公司前缀:3066 | 序列号:000000001-999999999', active: true }] },
  { id: 34, customerCompanyId: 30, name: '玛丝菲尔（Marisfrolg）', contact: '朱崇恽', phone: '130****2929', factoryCount: 2,
    epcRules: [{ id: 36, name: 'MS-SGTIN', type: 'SGTIN96', config: '公司前缀:3067 | 序列号:000000001-999999999', active: true }] },
  { id: 35, customerCompanyId: 31, name: '影儿（YINGER）', contact: '俞淇纲', phone: '139****3030', factoryCount: 2,
    epcRules: [{ id: 37, name: 'YE-SGTIN', type: 'SGTIN96', config: '公司前缀:3068 | 序列号:000000001-999999999', active: true }] },
  { id: 36, customerCompanyId: 32, name: '珂莱蒂尔（Koradior）', contact: '金明', phone: '138****3131', factoryCount: 1,
    epcRules: [{ id: 38, name: 'KD-SGTIN', type: 'SGTIN96', config: '公司前缀:3069 | 序列号:000000001-999999999', active: true }] },
];

// 辅助：生成订单号
const oNo = (date: string, seq: string) => `TH${date.replace(/-/g, '')}-${seq}`;

// 辅助：状态日志
const log = (status: string, time: string, operator: string) => ({ status, time, operator });

// ---- 订单 ----
export const orders: Order[] = [
  // === 波司登（Bosideng）品牌订单 ===
  { id: '1', orderNo: oNo('2026-06-05', '003'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 200000, status: '生产中',
    createdAt: '2026-06-05 14:30', shippingAddress: '浙江省杭州市余杭区仓前街道文一西路1500号', contact: '张三丰', phone: '138****1234',
    templateName: '标准吊牌模板 v3',
    productName: '经典圆领短袖T恤', styleNo: 'BST25001', sku: 'BSD-SS25-TEE-001', createdBy: '赵采购（T恤品类）', dataSource: 'platform',
    subOrders: [
      { id: '1-1', orderNo: 'TH20260605-003-1', supplierName: '杭州信达标签印刷有限公司', sku: 'BSD-SS24-TEE-001', quantity: 50000, status: '生产中', shippedQuantity: 0 },
      { id: '1-2', orderNo: 'TH20260605-003-2', supplierName: '温州正邦印务有限公司', sku: 'BSD-SS24-TEE-001', quantity: 50000, status: '待接单', shippedQuantity: 0 },
      { id: '1-3', orderNo: 'TH20260605-003-3', supplierName: '宁波华美印刷包装有限公司', sku: 'BSD-SS24-TEE-001', quantity: 50000, status: '待接单', shippedQuantity: 0 },
      { id: '1-4', orderNo: 'TH20260605-003-4', supplierName: '绍兴天成标签科技有限公司', sku: 'BSD-SS24-TEE-001', quantity: 50000, status: '待接单', shippedQuantity: 0 },
    ],
    statusLog: [
      log('待审核', '2026-06-05 14:30', '张三丰'),
      log('已审核', '2026-06-05 16:00', '运营-刘洋'),
      log('已拆分', '2026-06-05 16:15', '运营-刘洋'),
      log('待接单', '2026-06-05 16:15', '系统'),
      log('生产中', '2026-06-06 09:00', '杭州信达标签印刷有限公司'),
    ],
  },
  { id: '2', orderNo: oNo('2026-06-04', '002'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 200000, status: '部分发货',
    createdAt: '2026-06-04 10:15', shippingAddress: '浙江省杭州市余杭区仓前街道文一西路1500号', contact: '张三丰', phone: '138****1234',
    subOrders: [
      { id: '2-1', orderNo: 'TH20260604-002-1', supplierName: '杭州信达标签印刷有限公司', sku: 'BSD-SS24-STK-002', quantity: 100000, status: '已发货', shippedQuantity: 100000 },
      { id: '2-2', orderNo: 'TH20260604-002-2', supplierName: '温州正邦印务有限公司', sku: 'BSD-SS24-STK-002', quantity: 100000, status: '部分发货', shippedQuantity: 50000 },
    ],
    statusLog: [
      log('待审核', '2026-06-04 10:15', '张三丰'),
      log('已审核', '2026-06-04 11:30', '运营-陈芳'),
      log('已拆分', '2026-06-04 11:45', '运营-陈芳'),
      log('生产中', '2026-06-04 13:00', '杭州信达标签印刷有限公司'),
      log('生产完成', '2026-06-05 09:00', '杭州信达标签印刷有限公司'),
      log('部分发货', '2026-06-05 10:00', '杭州信达标签印刷有限公司'),
    ],
  },
  { id: '3', orderNo: oNo('2026-06-03', '001'), brandName: '波司登（Bosideng）', factoryName: '宁波成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 100000, status: '已签收',
    createdAt: '2026-06-03 09:00', shippingAddress: '浙江省宁波市鄞州区姜山镇明光路88号', contact: '张三丰', phone: '138****1234',
    subOrders: [
      { id: '3-1', orderNo: 'TH20260603-001-1', supplierName: '宁波华美印刷包装有限公司', sku: 'BSD-SS24-WM-003', quantity: 100000, status: '已签收', shippedQuantity: 100000, shipments: [{ id: 'sh-3-1-1', batchNo: 'SH20260605-001', quantity: 100000, trackingNo: 'YTO9876543210123', courier: '圆通速递', shippedAt: '2026-06-05 08:00', signed: true, platformTrackingNo: 'YTO9876543210123', signedAt: '2026-06-05 15:00', signedDocNo: 'ESIGN-20260605-001', signedDocUrl: '/mock/signed-docs/ESIGN-20260605-001.png', signedDocType: 'image' }] },
    ],
    statusLog: [
      log('待审核', '2026-06-03 09:00', '张三丰'),
      log('已审核', '2026-06-03 10:30', '运营-刘洋'),
      log('已拆分', '2026-06-03 10:45', '运营-刘洋'),
      log('待接单', '2026-06-03 10:45', '系统'),
      log('已接单', '2026-06-03 13:00', '宁波华美印刷包装有限公司'),
      log('生产中', '2026-06-03 14:00', '宁波华美印刷包装有限公司'),
      log('生产完成', '2026-06-04 16:00', '宁波华美印刷包装有限公司'),
      log('已发货', '2026-06-05 08:00', '宁波华美印刷包装有限公司'),
      log('已签收', '2026-06-05 15:00', '张三丰'),
    ],
  },
  { id: '4', orderNo: oNo('2026-06-05', '004'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣三厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 300000, status: '待审核',
    createdAt: '2026-06-05 16:00', shippingAddress: '浙江省杭州市萧山区经济技术开发区桥南区块', contact: '张三丰', phone: '138****1234', isUrgent: true, productName: '经典圆领短袖T恤', styleNo: 'BST25001', sku: 'BSD-SS25-TEE-001', subOrders: [],
    statusLog: [log('待审核', '2026-06-05 16:00', '张三丰')],
  },
  { id: '5', orderNo: oNo('2026-06-05', '005'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 50000, status: '待审核',
    createdAt: '2026-06-05 17:20', shippingAddress: '浙江省杭州市余杭区仓前街道文一西路1500号', contact: '张三丰', phone: '138****1234', productName: '珠地棉翻领Polo', styleNo: 'BSP25001', sku: 'BSD-SS25-POL-004', subOrders: [],
    statusLog: [log('待审核', '2026-06-05 17:20', '张三丰')],
  },

  // === 雪中飞（Snow Flying）品牌订单 ===
  { id: '6', orderNo: oNo('2026-06-05', '006'), brandName: '雪中飞（Snow Flying）', factoryName: '温州童装一厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 150000, status: '待审核',
    createdAt: '2026-06-05 15:30', shippingAddress: '浙江省温州市瓯海区娄桥工业区', contact: '赵敏', phone: '139****5678',
    productName: '冰感速干T恤', styleNo: 'XZT25001', sku: 'XZF-SS25-TEE-001', createdBy: '钱采购（外套品类）', dataSource: 'platform', subOrders: [],
    statusLog: [log('待审核', '2026-06-05 15:30', '赵敏')],
  },
  { id: '7', orderNo: oNo('2026-06-02', '002'), brandName: '雪中飞（Snow Flying）', factoryName: '温州童装一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 80000, status: '已发货',
    createdAt: '2026-06-02 11:00', shippingAddress: '浙江省温州市瓯海区娄桥工业区', contact: '赵敏', phone: '139****5678',
    templateName: '不干胶通用模板 v2',
    productName: '冰感速干T恤', styleNo: 'XZT25001', sku: 'XZF-SS25-TEE-001',
    subOrders: [
      { id: '7-1', orderNo: 'TH20260602-002-1', supplierName: '嘉兴恒达标识制作有限公司', sku: 'XZF-SS24-STK-001', quantity: 80000, status: '已发货', shippedQuantity: 80000 },
    ],
    statusLog: [
      log('待审核', '2026-06-02 11:00', '赵敏'),
      log('已审核', '2026-06-02 14:00', '运营-陈芳'),
      log('已拆分', '2026-06-02 14:10', '运营-陈芳'),
      log('待接单', '2026-06-02 14:10', '系统'),
      log('已接单', '2026-06-02 16:00', '嘉兴恒达标识制作有限公司'),
      log('生产中', '2026-06-03 08:00', '嘉兴恒达标识制作有限公司'),
      log('生产完成', '2026-06-04 17:00', '嘉兴恒达标识制作有限公司'),
      log('已发货', '2026-06-05 10:00', '嘉兴恒达标识制作有限公司'),
    ],
  },
  { id: '8', orderNo: oNo('2026-05-28', '001'), brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 60000, status: '已签收',
    createdAt: '2026-05-28 09:30', shippingAddress: '浙江省杭州市临平区东湖街道', contact: '赵敏', phone: '139****5678',
    templateName: '洗麦基础模板 v1',
    productName: '轻薄防晒外套', styleNo: 'XZJ25001', sku: 'XZF-SS25-JKT-002',
    subOrders: [
      { id: '8-1', orderNo: 'TH20260528-001-1', supplierName: '上海启明不干胶制品厂', sku: 'XZF-SS24-WM-002', quantity: 60000, status: '已签收', shippedQuantity: 60000, shipments: [{ id: 'sh-8-1-1', batchNo: 'SH20260531-001', quantity: 60000, trackingNo: 'SF7766554433221', courier: '顺丰速运', shippedAt: '2026-05-31 09:00', signed: true, platformTrackingNo: 'SF7766554433221', signedAt: '2026-06-02 10:00', signedDocNo: 'ESIGN-20260602-001', signedDocUrl: '/mock/signed-docs/ESIGN-20260602-001.png', signedDocType: 'image' }] },
    ],
    statusLog: [
      log('待审核', '2026-05-28 09:30', '赵敏'),
      log('已审核', '2026-05-28 11:00', '运营-刘洋'),
      log('已拆分', '2026-05-28 11:15', '运营-刘洋'),
      log('已接单', '2026-05-28 14:00', '上海启明不干胶制品厂'),
      log('生产中', '2026-05-29 08:00', '上海启明不干胶制品厂'),
      log('生产完成', '2026-05-30 16:00', '上海启明不干胶制品厂'),
      log('已发货', '2026-05-31 09:00', '上海启明不干胶制品厂'),
      log('已签收', '2026-06-02 10:00', '赵敏'),
    ],
  },


  { id: '9', orderNo: oNo('2026-06-05', '007'), brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 250000, status: '待审核',
    createdAt: '2026-06-05 11:00', shippingAddress: '浙江省宁波市海曙区环城西路南段826号', contact: '周杰', phone: '136****8901',
    isUrgent: true, productName: '防风连帽夹克', styleNo: 'BSJ25001', sku: 'BSD-SS25-JKT-003', subOrders: [],
    statusLog: [log('待审核', '2026-06-05 11:00', '周杰')],
  },
  { id: '10', orderNo: oNo('2026-06-04', '003'), brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 120000, status: '生产中',
    createdAt: '2026-06-04 08:00', shippingAddress: '浙江省宁波市海曙区环城西路南段826号', contact: '周杰', phone: '136****8901',
    templateName: '不干胶通用模板 v2',
    productName: '珠地棉翻领Polo', styleNo: 'BSP25001', sku: 'BSD-SS25-POL-004',
    subOrders: [
      { id: '10-1', orderNo: 'TH20260604-003-1', supplierName: '宁波华美印刷包装有限公司', sku: 'BSD-SS24-STK-001', quantity: 60000, status: '生产中', shippedQuantity: 0 },
      { id: '10-2', orderNo: 'TH20260604-003-2', supplierName: '绍兴天成标签科技有限公司', sku: 'BSD-SS24-STK-001', quantity: 60000, status: '待接单', shippedQuantity: 0 },
    ],
    statusLog: [
      log('待审核', '2026-06-04 08:00', '周杰'),
      log('已审核', '2026-06-04 09:30', '运营-刘洋'),
      log('已拆分', '2026-06-04 09:45', '运营-刘洋'),
      log('生产中', '2026-06-04 14:00', '宁波华美印刷包装有限公司'),
    ],
  },
  { id: '11', orderNo: oNo('2026-06-01', '001'), brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 180000, status: '已发货',
    createdAt: '2026-06-01 10:00', shippingAddress: '浙江省宁波市海曙区环城西路南段826号', contact: '周杰', phone: '136****8901',
    templateName: '洗麦基础模板 v1',
    productName: '通勤抗皱衬衫', styleNo: 'BSD25001', sku: 'BSD-SS25-DRS-006',
    subOrders: [
      { id: '11-1', orderNo: 'TH20260601-001-1', supplierName: '义乌丰源包装印刷有限公司', sku: 'BSD-SS24-WM-001', quantity: 90000, status: '已发货', shippedQuantity: 90000 },
      { id: '11-2', orderNo: 'TH20260601-001-2', supplierName: '嘉兴恒达标识制作有限公司', sku: 'BSD-SS24-WM-001', quantity: 90000, status: '已发货', shippedQuantity: 90000 },
    ],
    statusLog: [
      log('待审核', '2026-06-01 10:00', '周杰'),
      log('已审核', '2026-06-01 13:00', '运营-陈芳'),
      log('已拆分', '2026-06-01 13:20', '运营-陈芳'),
      log('生产中', '2026-06-02 08:00', '义乌丰源包装印刷有限公司'),
      log('生产完成', '2026-06-03 15:00', '义乌丰源包装印刷有限公司'),
      log('已发货', '2026-06-04 09:00', '义乌丰源包装印刷有限公司'),
    ],
  },


  { id: '12', orderNo: oNo('2026-06-05', '008'), brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 90000, status: '待审核',
    createdAt: '2026-06-05 13:00', shippingAddress: '浙江省宁波市江北区洪塘工业区', contact: '陈丽', phone: '135****2345',
    productName: '轻薄防晒外套', styleNo: 'XZJ25001', sku: 'XZF-SS25-JKT-002', subOrders: [],
    statusLog: [log('待审核', '2026-06-05 13:00', '陈丽')],
  },
  { id: '13', orderNo: oNo('2026-06-03', '002'), brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 30000, status: '生产完成',
    createdAt: '2026-06-03 14:00', shippingAddress: '浙江省宁波市江北区洪塘工业区', contact: '陈丽', phone: '135****2345',
    templateName: '不干胶通用模板 v2',
    productName: '冰感速干T恤', styleNo: 'XZT25001', sku: 'XZF-SS25-TEE-001',
    subOrders: [
      { id: '13-1', orderNo: 'TH20260603-002-1', supplierName: '上海启明不干胶制品厂', sku: 'XZF-SS24-STK-001', quantity: 30000, status: '生产完成', shippedQuantity: 0 },
    ],
    statusLog: [
      log('待审核', '2026-06-03 14:00', '陈丽'),
      log('已审核', '2026-06-03 15:30', '运营-陈芳'),
      log('已拆分', '2026-06-03 15:40', '运营-陈芳'),
      log('已接单', '2026-06-03 17:00', '上海启明不干胶制品厂'),
      log('生产中', '2026-06-04 08:00', '上海启明不干胶制品厂'),
      log('生产完成', '2026-06-05 11:00', '上海启明不干胶制品厂'),
    ],
  },
  { id: '14', orderNo: oNo('2026-05-25', '001'), brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 75000, status: '已签收',
    createdAt: '2026-05-25 08:30', shippingAddress: '浙江省宁波市江北区洪塘工业区', contact: '陈丽', phone: '135****2345',
    templateName: '洗麦基础模板 v1',
    productName: '轻薄防晒外套', styleNo: 'XZJ25001', sku: 'XZF-SS25-JKT-002',
    subOrders: [
      { id: '14-1', orderNo: 'TH20260525-001-1', supplierName: '绍兴天成标签科技有限公司', sku: 'XZF-SS24-WM-002', quantity: 75000, status: '已签收', shippedQuantity: 75000, shipments: [{ id: 'sh-14-1-1', batchNo: 'SH20260529-001', quantity: 75000, trackingNo: 'ZTO8877665544332', courier: '中通速递', shippedAt: '2026-05-29 10:00', signed: true, platformTrackingNo: 'ZTO8877665544332', signedAt: '2026-05-30 16:00', signedDocNo: 'ESIGN-20260530-001', signedDocUrl: '/mock/signed-docs/ESIGN-20260530-001.png', signedDocType: 'image' }] },
    ],
    statusLog: [
      log('待审核', '2026-05-25 08:30', '陈丽'),
      log('已审核', '2026-05-25 10:00', '运营-刘洋'),
      log('已拆分', '2026-05-25 10:15', '运营-刘洋'),
      log('已接单', '2026-05-25 14:00', '绍兴天成标签科技有限公司'),
      log('生产中', '2026-05-26 08:00', '绍兴天成标签科技有限公司'),
      log('生产完成', '2026-05-28 15:00', '绍兴天成标签科技有限公司'),
      log('已发货', '2026-05-29 10:00', '绍兴天成标签科技有限公司'),
      log('已签收', '2026-05-30 16:00', '陈丽'),
    ],
  },


  { id: '15', orderNo: oNo('2026-06-05', '009'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣设计中心',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '待审核',
    createdAt: '2026-06-05 10:30', shippingAddress: '浙江省杭州市西湖区文二西路738号', contact: '林晓', phone: '134****6789',
    productName: '通勤抗皱衬衫', styleNo: 'BSD25001', sku: 'BSD-SS25-DRS-006', subOrders: [],
    statusLog: [log('待审核', '2026-06-05 10:30', '林晓')],
  },
  { id: '16', orderNo: oNo('2026-06-04', '004'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣设计中心',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 85000, status: '已审核',
    createdAt: '2026-06-04 15:00', shippingAddress: '浙江省杭州市西湖区文二西路738号', contact: '林晓', phone: '134****6789',
    templateName: '洗麦基础模板 v1',
    subOrders: [],
    statusLog: [
      log('待审核', '2026-06-04 15:00', '林晓'),
      log('已审核', '2026-06-04 17:00', '运营-陈芳'),
    ],
  },
  { id: '17', orderNo: oNo('2026-05-31', '001'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣设计中心',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 160000, status: '已签收',
    createdAt: '2026-05-31 09:00', shippingAddress: '浙江省杭州市西湖区文二西路738号', contact: '林晓', phone: '134****6789',
    templateName: '标准吊牌模板 v3',
    productName: '抓绒圆领卫衣', styleNo: 'BSS25001', sku: 'BSD-SS25-SWT-005',
    subOrders: [
      { id: '17-1', orderNo: 'TH20260531-001-1', supplierName: '杭州信达标签印刷有限公司', sku: 'BSD-SS24-TAG-005', quantity: 80000, status: '已签收', shippedQuantity: 80000, shipments: [{ id: 'sh-17-1-1', batchNo: 'SH20260603-001', quantity: 80000, trackingNo: 'YTO5544332211001', courier: '圆通速递', shippedAt: '2026-06-03 09:00', signed: true, platformTrackingNo: 'YTO5544332211001', signedAt: '2026-06-04 14:00', signedDocNo: 'ESIGN-20260604-001', signedDocUrl: '/mock/signed-docs/ESIGN-20260604-001.pdf', signedDocType: 'pdf' }] },
      { id: '17-2', orderNo: 'TH20260531-001-2', supplierName: '义乌丰源包装印刷有限公司', sku: 'BSD-SS24-TAG-005', quantity: 80000, status: '已签收', shippedQuantity: 80000, shipments: [{ id: 'sh-17-2-1', batchNo: 'SH20260603-002', quantity: 80000, trackingNo: 'YTO5544332211002', courier: '圆通速递', shippedAt: '2026-06-03 16:00', signed: true, platformTrackingNo: 'YTO5544332211002', signedAt: '2026-06-04 14:00', signedDocNo: 'ESIGN-20260604-002', signedDocUrl: '/mock/signed-docs/ESIGN-20260604-002.png', signedDocType: 'image' }] },
    ],
    statusLog: [
      log('待审核', '2026-05-31 09:00', '林晓'),
      log('已审核', '2026-05-31 11:00', '运营-陈芳'),
      log('已拆分', '2026-05-31 11:15', '运营-陈芳'),
      log('已接单', '2026-05-31 14:00', '杭州信达标签印刷有限公司'),
      log('生产中', '2026-06-01 08:00', '杭州信达标签印刷有限公司'),
      log('生产完成', '2026-06-02 17:00', '杭州信达标签印刷有限公司'),
      log('已发货', '2026-06-03 09:00', '杭州信达标签印刷有限公司'),
      log('已签收', '2026-06-04 14:00', '林晓'),
    ],
  },


  // === 已驳回 / 已取消订单 ===
  { id: '18', orderNo: oNo('2026-06-05', '010'), brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 50000, status: '已驳回',
    createdAt: '2026-06-05 09:00', shippingAddress: '浙江省杭州市滨江区浦沿街道', contact: '张三丰', phone: '138****1234', sku: 'BSD-SS25-HKT-001', productName: '防风夹克', dataSource: 'platform', subOrders: [],
    cancelReason: '模板信息与图稿不一致，请核实后重新提交',
    statusLog: [
      log('待审核', '2026-06-05 09:00', '张三丰'),
      log('已驳回', '2026-06-05 10:00', '运营-刘洋（原因：模板信息与图稿不一致）'),
    ],
  },
  { id: '19', orderNo: oNo('2026-06-01', '002'), brandName: '雪中飞（Snow Flying）', factoryName: '温州童装一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 40000, status: '已取消',
    createdAt: '2026-06-01 16:00', shippingAddress: '浙江省温州市瓯海区娄桥工业区', contact: '赵敏', phone: '139****5678',
    subOrders: [], cancelReason: '业务变更，款式取消',
    statusLog: [
      log('待审核', '2026-06-01 16:00', '赵敏'),
      log('已审核', '2026-06-01 17:30', '运营-陈芳'),
      log('已拆分', '2026-06-01 17:40', '运营-陈芳'),
      log('已取消', '2026-06-02 10:00', '赵敏（原因：业务变更）'),
    ],
  },

  { id: '20', orderNo: 'TH20260604-96', brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 80000, status: '生产完成',
    createdAt: '2026-06-04 10:00', shippingAddress: '浙江省杭州市工业园区33号', contact: '李娜', phone: '139****7912',
    subOrders: [{"id": "20-1", "orderNo": "TH20260604-96-1", "supplierName": "杭州信达标签印刷有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 46912, "status": "生产完成", "shippedQuantity": 0}, {"id": "20-2", "orderNo": "TH20260604-96-2", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "BSD-SS25-POL-002", "quantity": 19208, "status": "生产完成", "shippedQuantity": 0}, {"id": "20-3", "orderNo": "TH20260604-96-3", "supplierName": "温州正邦印务有限公司", "sku": "BSD-SS25-DRS-003", "quantity": 13880, "status": "生产完成", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-04 10:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-04 12:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-04 12:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-04 12:15", "detail": "通知供应商"}],
  },
  { id: '21', orderNo: 'TH20260526-53', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 30000, status: '已审核',
    createdAt: '2026-05-26 10:45', shippingAddress: '浙江省杭州市工业园区981号', contact: '周明', phone: '132****4527',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-26 10:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-05-26 13:45", "detail": "审核通过"}],
  },
  { id: '22', orderNo: 'TH20260527-58', brandName: '森马（Semir）', factoryName: '嘉兴成衣二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 30000, status: '已审核',
    createdAt: '2026-05-27 15:00', shippingAddress: '浙江省嘉兴市工业园区850号', contact: '李娜', phone: '138****5803',
    templateName: '不干胶通用模板 v2',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-05-27 15:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-05-27 18:00", "detail": "审核通过"}],
  },
  { id: '23', orderNo: 'TH20260606-58', brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 100000, status: '已发货',
    createdAt: '2026-06-06 11:00', shippingAddress: '浙江省杭州市工业园区167号', contact: '周明', phone: '137****6977',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "23-1", "orderNo": "TH20260606-58-1", "supplierName": "上海启明不干胶制品厂", "sku": "BSD-SS25-CWT-001", "quantity": 51365, "status": "已发货", "shippedQuantity": 51365, "shipments": [{"id": "sh-23-1-1", "batchNo": "SH20262895-298", "quantity": 51365, "trackingNo": "YD8772300920", "courier": "德邦物流", "shippedAt": "2026-06-05 17:21", "signed": false, "platformTrackingNo": "YD8772300920"}]}, {"id": "23-2", "orderNo": "TH20260606-58-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "BSD-SS25-SWT-002", "quantity": 19353, "status": "已发货", "shippedQuantity": 19353, "shipments": [{"id": "sh-23-2-1", "batchNo": "SH20269400-125", "quantity": 19353, "trackingNo": "ZTO9900310191", "courier": "顺丰速运", "shippedAt": "2026-06-09 10:13", "signed": false, "platformTrackingNo": "ZTO9900310191"}]}, {"id": "23-3", "orderNo": "TH20260606-58-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "BSD-SS25-HOD-003", "quantity": 14198, "status": "已发货", "shippedQuantity": 14198, "shipments": [{"id": "sh-23-3-1", "batchNo": "SH20268837-337", "quantity": 14198, "trackingNo": "YD4865194628", "courier": "顺丰速运", "shippedAt": "2026-06-06 17:45", "signed": false, "platformTrackingNo": "YD4865194628"}]}, {"id": "23-4", "orderNo": "TH20260606-58-4", "supplierName": "温州正邦印务有限公司", "sku": "BSD-SS25-SCK-004", "quantity": 15084, "status": "已发货", "shippedQuantity": 15084, "shipments": [{"id": "sh-23-4-1", "batchNo": "SH20267596-785", "quantity": 15084, "trackingNo": "YD4447721988", "courier": "圆通快递", "shippedAt": "2026-06-01 10:04", "signed": false, "platformTrackingNo": "YD4447721988"}]}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-06 11:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-06 13:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-06 13:15", "detail": "拆分为 4 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-06 13:15", "detail": "通知供应商"}],
  },
  { id: '24', orderNo: 'TH20260525-61', brandName: '雪中飞（Snow Flying）', factoryName: '温州童装一厂',
    type: '免费单', tagType: '吊牌标签', totalQuantity: 80000, status: '已审核',
    createdAt: '2026-05-25 08:30', shippingAddress: '浙江省温州市工业园区936号', contact: '周明', phone: '131****4456',
    templateName: '不干胶通用模板 v2',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-25 08:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-05-25 11:30", "detail": "审核通过"}],
  },
  { id: '25', orderNo: 'TH20260603-81', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 60000, status: '待审核',
    createdAt: '2026-06-03 10:15', shippingAddress: '浙江省常熟市工业园区920号', contact: '周明', phone: '139****8019',
    sku: 'SEM-SS25-CWT-001', productName: '百搭圆领卫衣', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-03 10:15", "detail": "订单提交"}],
  },
  { id: '26', orderNo: 'TH20260528-86', brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '免费单', tagType: '吊牌标签', totalQuantity: 60000, status: '已驳回',
    createdAt: '2026-05-28 10:45', shippingAddress: '浙江省杭州市工业园区611号', contact: '李娜', phone: '136****7252',
    templateName: '标准吊牌模板 v3',
    sku: 'XZF-SS25-HKT-001', productName: '轻量冲锋衣', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-05-28 10:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-28 12:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '27', orderNo: 'TH20260606-30', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 120000, status: '待审核',
    createdAt: '2026-06-06 12:45', shippingAddress: '浙江省杭州市工业园区996号', contact: '钱华', phone: '130****5315',
    templateName: '洗麦基础模板 v1',
    sku: 'XZF-SS25-STK-001', productName: '品牌联名贴纸', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "钱华", "time": "2026-06-06 12:45", "detail": "订单提交"}],
  },
  { id: '28', orderNo: 'TH20260526-86', brandName: '雪中飞（Snow Flying）', factoryName: '无锡成衣六厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 200000, status: '已审核',
    createdAt: '2026-05-26 16:00', shippingAddress: '浙江省无锡市工业园区115号', contact: '吴芳', phone: '137****1319',
    templateName: '不干胶通用模板 v2',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-05-26 16:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-05-26 19:00", "detail": "审核通过"}],
  },
  { id: '29', orderNo: 'TH20260527-78', brandName: '波司登（Bosideng）', factoryName: '宁波成衣二厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 50000, status: '已驳回',
    createdAt: '2026-05-27 15:00', shippingAddress: '浙江省宁波市工业园区970号', contact: '赵刚', phone: '132****8787',
    sku: 'BSD-SS25-POL-002', productName: '冰氧科技Polo衫', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-05-27 15:00", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-27 17:00", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '30', orderNo: 'TH20260527-95', brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '免费单', tagType: '洗麦标签', totalQuantity: 80000, status: '已发货',
    createdAt: '2026-05-27 12:45', shippingAddress: '浙江省宁波市工业园区463号', contact: '吴芳', phone: '137****9479',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "30-1", "orderNo": "TH20260527-95-1", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "XZF-SS25-JKT-001", "quantity": 80000, "status": "已发货", "shippedQuantity": 80000, "shipments": [{"id": "sh-30-1-1", "batchNo": "SH20269035-178", "quantity": 80000, "trackingNo": "SF2446810901", "courier": "圆通快递", "shippedAt": "2026-06-05 18:22", "signed": false, "platformTrackingNo": "SF2446810901"}]}],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-05-27 12:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-27 14:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-27 15:00", "detail": "拆分为 1 个子订单"}],
  },
  { id: '31', orderNo: 'TH20260604-52', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 30000, status: '待审核',
    createdAt: '2026-06-04 09:00', shippingAddress: '浙江省苏州市工业园区286号', contact: '李娜', phone: '138****4899',
    sku: 'XZF-SS25-WHL-001', productName: '柔软水洗标', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-04 09:00", "detail": "订单提交"}],
  },
  { id: '32', orderNo: 'TH20260606-55', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 80000, status: '已驳回',
    createdAt: '2026-06-06 09:45', shippingAddress: '浙江省杭州市工业园区885号', contact: '郑强', phone: '136****8651',
    templateName: '标准吊牌模板 v3',
    sku: 'XZF-SS25-STK-002', productName: '透明不干胶贴', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-06-06 09:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-06 11:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '33', orderNo: 'TH20260604-78', brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 50000, status: '生产中',
    createdAt: '2026-06-04 11:15', shippingAddress: '浙江省宁波市工业园区188号', contact: '钱华', phone: '132****7912',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "33-1", "orderNo": "TH20260604-78-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "BSD-SS25-CWT-001", "quantity": 16011, "status": "生产中", "shippedQuantity": 0}, {"id": "33-2", "orderNo": "TH20260604-78-2", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "BSD-SS25-SWT-002", "quantity": 23782, "status": "生产中", "shippedQuantity": 0}, {"id": "33-3", "orderNo": "TH20260604-78-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "BSD-SS25-HOD-003", "quantity": 10207, "status": "生产中", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "钱华", "time": "2026-06-04 11:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-04 13:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-04 13:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-04 13:30", "detail": "通知供应商"}],
  },
  { id: '34', orderNo: 'TH20260531-17', brandName: '波司登（Bosideng）', factoryName: '宁波成衣二厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 180000, status: '已签收',
    createdAt: '2026-05-31 11:45', shippingAddress: '浙江省宁波市工业园区400号', contact: '赵刚', phone: '136****1035',
    subOrders: [{"id": "34-1", "orderNo": "TH20260531-17-1", "supplierName": "绍兴天成标签科技有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 122926, "status": "已签收", "shippedQuantity": 122926, "shipments": [{"id": "sh-34-1-1", "batchNo": "SH20263375-629", "quantity": 122926, "trackingNo": "ST5184316533", "courier": "极兔速递", "shippedAt": "2026-06-09 11:49", "signed": true, "signedAt": "2026-06-10 14:09", "platformTrackingNo": "ST5184316533"}]}, {"id": "34-2", "orderNo": "TH20260531-17-2", "supplierName": "上海启明不干胶制品厂", "sku": "BSD-SS25-POL-002", "quantity": 57074, "status": "已签收", "shippedQuantity": 57074, "shipments": [{"id": "sh-34-2-1", "batchNo": "SH20262937-157", "quantity": 57074, "trackingNo": "ST4834226578", "courier": "申通快递", "shippedAt": "2026-06-03 12:05", "signed": true, "signedAt": "2026-06-04 16:15", "platformTrackingNo": "ST4834226578"}]}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-05-31 11:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-31 13:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-31 14:00", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-31 14:00", "detail": "通知供应商"}, {status: "已签收", operator: "品牌方", time: "2026-06-10 10:00", detail: "确认签收"}],
  },
  { id: '35', orderNo: 'TH20260529-50', brandName: '雪中飞（Snow Flying）', factoryName: '无锡成衣六厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 30000, status: '待审核',
    createdAt: '2026-05-29 16:00', shippingAddress: '浙江省无锡市工业园区515号', contact: '王磊', phone: '130****8811',
    templateName: '标准吊牌模板 v3',
    sku: 'HLA-SS25-CWT-001', productName: '加绒连帽卫衣', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-05-29 16:00", "detail": "订单提交"}],
  },
  { id: '36', orderNo: 'TH20260601-84', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 80000, status: '已审核',
    createdAt: '2026-06-01 09:15', shippingAddress: '浙江省苏州市工业园区430号', contact: '王磊', phone: '139****2343',
    templateName: '洗麦基础模板 v1',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-06-01 09:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-06-01 12:15", "detail": "审核通过"}],
  },
  { id: '37', orderNo: 'TH20260605-68', brandName: '雪中飞（Snow Flying）', factoryName: '温州童装一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 150000, status: '待审核',
    createdAt: '2026-06-05 18:30', shippingAddress: '浙江省温州市工业园区470号', contact: '吴芳', phone: '131****1152',
    templateName: '标准吊牌模板 v3',
    sku: 'HLA-SS25-STK-001', productName: '防伪二维码贴', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-06-05 18:30", "detail": "订单提交"}],
  },
  { id: '38', orderNo: 'TH20260524-57', brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '已驳回',
    createdAt: '2026-05-24 09:15', shippingAddress: '浙江省宁波市工业园区854号', contact: '周明', phone: '132****8179',
    templateName: '标准吊牌模板 v3',
    sku: 'HLA-SS25-HKT-001', productName: '商务通勤夹克', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-24 09:15", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-24 11:15", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '39', orderNo: 'TH20260606-44', brandName: '森马（Semir）', factoryName: '台州成衣三厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 100000, status: '已发货',
    createdAt: '2026-06-06 09:15', shippingAddress: '浙江省台州市工业园区735号', contact: '周明', phone: '139****4450',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "39-1", "orderNo": "TH20260606-44-1", "supplierName": "绍兴天成标签科技有限公司", "sku": "SEM-SS25-CWT-001", "quantity": 33691, "status": "已发货", "shippedQuantity": 33691, "shipments": [{"id": "sh-39-1-1", "batchNo": "SH20269193-971", "quantity": 33691, "trackingNo": "YD4660792301", "courier": "圆通快递", "shippedAt": "2026-06-01 17:05", "signed": false, "platformTrackingNo": "YD4660792301"}]}, {"id": "39-2", "orderNo": "TH20260606-44-2", "supplierName": "宁波华美印刷包装有限公司", "sku": "SEM-SS25-SWT-002", "quantity": 31127, "status": "已发货", "shippedQuantity": 31127, "shipments": [{"id": "sh-39-2-1", "batchNo": "SH20263295-711", "quantity": 31127, "trackingNo": "ZTO2651975407", "courier": "申通快递", "shippedAt": "2026-06-12 08:00", "signed": false, "platformTrackingNo": "ZTO2651975407"}]}, {"id": "39-3", "orderNo": "TH20260606-44-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SEM-SS25-HOD-003", "quantity": 35182, "status": "已发货", "shippedQuantity": 35182, "shipments": [{"id": "sh-39-3-1", "batchNo": "SH20266186-772", "quantity": 35182, "trackingNo": "ZTO9339516939", "courier": "顺丰速运", "shippedAt": "2026-06-10 08:31", "signed": false, "platformTrackingNo": "ZTO9339516939"}]}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-06 09:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-06 11:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-06 11:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-06 11:30", "detail": "通知供应商"}],
  },
  { id: '40', orderNo: 'TH20260605-81', brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 100000, status: '已驳回',
    createdAt: '2026-06-05 15:45', shippingAddress: '浙江省杭州市工业园区968号', contact: '王磊', phone: '131****2232',
    templateName: '标准吊牌模板 v3',
    sku: 'HLA-SS25-TEE-001', productName: '精梳棉圆领T恤', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-06-05 15:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-05 17:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '41', orderNo: 'TH20260605-56', brandName: '森马（Semir）', factoryName: '台州成衣三厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 150000, status: '生产完成',
    createdAt: '2026-06-05 08:30', shippingAddress: '浙江省台州市工业园区699号', contact: '王磊', phone: '135****4441',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "41-1", "orderNo": "TH20260605-56-1", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SEM-SS25-CWT-001", "quantity": 100545, "status": "生产完成", "shippedQuantity": 0}, {"id": "41-2", "orderNo": "TH20260605-56-2", "supplierName": "上海启明不干胶制品厂", "sku": "SEM-SS25-SWT-002", "quantity": 19519, "status": "生产完成", "shippedQuantity": 0}, {"id": "41-3", "orderNo": "TH20260605-56-3", "supplierName": "温州正邦印务有限公司", "sku": "SEM-SS25-HOD-003", "quantity": 29936, "status": "生产完成", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-06-05 08:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-05 10:30", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-05 10:45", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-05 10:45", "detail": "通知供应商"}],
  },
  { id: '42', orderNo: 'TH20260526-44', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '部分发货',
    createdAt: '2026-05-26 14:15', shippingAddress: '浙江省杭州市工业园区894号', contact: '赵刚', phone: '131****7267',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "42-1", "orderNo": "TH20260526-44-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "XZF-SS25-JKT-001", "quantity": 46700, "status": "生产中", "shippedQuantity": 0}, {"id": "42-2", "orderNo": "TH20260526-44-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "XZF-SS25-POL-002", "quantity": 27652, "status": "部分发货", "shippedQuantity": 12917, "shipments": [{"id": "sh-42-2-1", "batchNo": "SH20261340-200", "quantity": 12917, "trackingNo": "ZTO8267755151", "courier": "中通快递", "shippedAt": "2026-06-11 11:56", "signed": false, "platformTrackingNo": "ZTO8267755151"}]}, {"id": "42-3", "orderNo": "TH20260526-44-3", "supplierName": "温州正邦印务有限公司", "sku": "XZF-SS25-DRS-003", "quantity": 45648, "status": "已发货", "shippedQuantity": 45648, "shipments": [{"id": "sh-42-3-1", "batchNo": "SH20263743-401", "quantity": 45648, "trackingNo": "YT8409647531", "courier": "德邦物流", "shippedAt": "2026-06-10 15:32", "signed": false, "platformTrackingNo": "YT8409647531"}]}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-05-26 14:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-26 16:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-26 16:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-26 16:30", "detail": "通知供应商"}],
  },
  { id: '43', orderNo: 'TH20260602-43', brandName: '森马（Semir）', factoryName: '台州成衣三厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 200000, status: '已发货',
    createdAt: '2026-06-02 08:00', shippingAddress: '浙江省台州市工业园区40号', contact: '赵刚', phone: '139****5349',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "43-1", "orderNo": "TH20260602-43-1", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SEM-SS25-CWT-001", "quantity": 90815, "status": "已发货", "shippedQuantity": 90815, "shipments": [{"id": "sh-43-1-1", "batchNo": "SH20261382-139", "quantity": 90815, "trackingNo": "ZTO2992880676", "courier": "极兔速递", "shippedAt": "2026-06-11 08:57", "signed": false, "platformTrackingNo": "ZTO2992880676"}]}, {"id": "43-2", "orderNo": "TH20260602-43-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SEM-SS25-SWT-002", "quantity": 57937, "status": "已发货", "shippedQuantity": 57937, "shipments": [{"id": "sh-43-2-1", "batchNo": "SH20266004-712", "quantity": 57937, "trackingNo": "JD8114113649", "courier": "顺丰速运", "shippedAt": "2026-06-08 10:35", "signed": false, "platformTrackingNo": "JD8114113649"}]}, {"id": "43-3", "orderNo": "TH20260602-43-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SEM-SS25-HOD-003", "quantity": 51248, "status": "已发货", "shippedQuantity": 51248, "shipments": [{"id": "sh-43-3-1", "batchNo": "SH20267488-405", "quantity": 51248, "trackingNo": "ST1382351929", "courier": "中通快递", "shippedAt": "2026-06-07 16:54", "signed": false, "platformTrackingNo": "ST1382351929"}]}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-06-02 08:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-02 10:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-02 10:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-02 10:15", "detail": "通知供应商"}],
  },
  { id: '44', orderNo: 'TH20260524-56', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 200000, status: '已发货',
    createdAt: '2026-05-24 16:15', shippingAddress: '浙江省杭州市工业园区639号', contact: '郑强', phone: '131****6409',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "44-1", "orderNo": "TH20260524-56-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 86094, "status": "已发货", "shippedQuantity": 86094, "shipments": [{"id": "sh-44-1-1", "batchNo": "SH20263532-964", "quantity": 86094, "trackingNo": "JD9364613698", "courier": "申通快递", "shippedAt": "2026-06-05 14:55", "signed": false, "platformTrackingNo": "JD9364613698"}]}, {"id": "44-2", "orderNo": "TH20260524-56-2", "supplierName": "上海启明不干胶制品厂", "sku": "BSD-SS25-POL-002", "quantity": 65938, "status": "已发货", "shippedQuantity": 65938, "shipments": [{"id": "sh-44-2-1", "batchNo": "SH20266235-354", "quantity": 65938, "trackingNo": "YD6050932795", "courier": "顺丰速运", "shippedAt": "2026-06-01 09:50", "signed": false, "platformTrackingNo": "YD6050932795"}]}, {"id": "44-3", "orderNo": "TH20260524-56-3", "supplierName": "绍兴天成标签科技有限公司", "sku": "BSD-SS25-DRS-003", "quantity": 47968, "status": "已发货", "shippedQuantity": 47968, "shipments": [{"id": "sh-44-3-1", "batchNo": "SH20265291-416", "quantity": 47968, "trackingNo": "JD7435583453", "courier": "顺丰速运", "shippedAt": "2026-06-12 17:41", "signed": false, "platformTrackingNo": "JD7435583453"}]}],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-24 16:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-24 18:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-24 18:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-24 18:30", "detail": "通知供应商"}],
  },
  { id: '45', orderNo: 'TH20260529-61', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 60000, status: '已发货',
    createdAt: '2026-05-29 17:30', shippingAddress: '浙江省杭州市工业园区216号', contact: '王磊', phone: '134****5700',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "45-1", "orderNo": "TH20260529-61-1", "supplierName": "绍兴天成标签科技有限公司", "sku": "XZF-SS25-CWT-001", "quantity": 30268, "status": "已发货", "shippedQuantity": 30268, "shipments": [{"id": "sh-45-1-1", "batchNo": "SH20265134-303", "quantity": 30268, "trackingNo": "YD9344593962", "courier": "韵达快递", "shippedAt": "2026-06-05 15:50", "signed": false, "platformTrackingNo": "YD9344593962"}]}, {"id": "45-2", "orderNo": "TH20260529-61-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "XZF-SS25-SWT-002", "quantity": 18359, "status": "已发货", "shippedQuantity": 18359, "shipments": [{"id": "sh-45-2-1", "batchNo": "SH20265158-815", "quantity": 18359, "trackingNo": "SF2550602577", "courier": "中通快递", "shippedAt": "2026-06-05 11:16", "signed": false, "platformTrackingNo": "SF2550602577"}]}, {"id": "45-3", "orderNo": "TH20260529-61-3", "supplierName": "温州正邦印务有限公司", "sku": "XZF-SS25-HOD-003", "quantity": 11373, "status": "已发货", "shippedQuantity": 11373, "shipments": [{"id": "sh-45-3-1", "batchNo": "SH20264226-234", "quantity": 11373, "trackingNo": "JD8038782283", "courier": "德邦物流", "shippedAt": "2026-06-12 10:44", "signed": false, "platformTrackingNo": "JD8038782283"}]}],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-05-29 17:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-29 19:30", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-29 19:45", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-29 19:45", "detail": "通知供应商"}],
  },
  { id: '46', orderNo: 'TH20260602-96', brandName: '波司登（Bosideng）', factoryName: '杭州成衣三厂',
    type: '补单', tagType: '洗麦标签', totalQuantity: 250000, status: '已签收',
    createdAt: '2026-06-02 09:15', shippingAddress: '浙江省杭州市工业园区151号', contact: '周明', phone: '133****4262',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "46-1", "orderNo": "TH20260602-96-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 116444, "status": "已签收", "shippedQuantity": 116444, "shipments": [{"id": "sh-46-1-1", "batchNo": "SH20262709-318", "quantity": 116444, "trackingNo": "SF3872200871", "courier": "韵达快递", "shippedAt": "2026-06-08 10:26", "signed": true, "signedAt": "2026-06-08 16:22", "platformTrackingNo": "SF3872200871"}]}, {"id": "46-2", "orderNo": "TH20260602-96-2", "supplierName": "杭州信达标签印刷有限公司", "sku": "BSD-SS25-POL-002", "quantity": 73710, "status": "已签收", "shippedQuantity": 73710, "shipments": [{"id": "sh-46-2-1", "batchNo": "SH20266108-105", "quantity": 73710, "trackingNo": "YT2828623392", "courier": "极兔速递", "shippedAt": "2026-06-09 10:42", "signed": true, "signedAt": "2026-06-09 16:20", "platformTrackingNo": "YT2828623392"}]}, {"id": "46-3", "orderNo": "TH20260602-96-3", "supplierName": "绍兴天成标签科技有限公司", "sku": "BSD-SS25-DRS-003", "quantity": 59846, "status": "已签收", "shippedQuantity": 59846, "shipments": [{"id": "sh-46-3-1", "batchNo": "SH20269568-788", "quantity": 59846, "trackingNo": "ZTO8591738537", "courier": "中通快递", "shippedAt": "2026-06-06 11:21", "signed": true, "signedAt": "2026-06-05 09:42", "platformTrackingNo": "ZTO8591738537"}]}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-02 09:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-02 11:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-02 11:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-02 11:30", "detail": "通知供应商"}, {status: "已签收", operator: "品牌方", time: "2026-06-10 10:00", detail: "确认签收"}],
  },
  { id: '47', orderNo: 'TH20260528-64', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 60000, status: '生产中',
    createdAt: '2026-05-28 08:00', shippingAddress: '浙江省常熟市工业园区476号', contact: '孙婷', phone: '132****9486',
    subOrders: [{"id": "47-1", "orderNo": "TH20260528-64-1", "supplierName": "温州正邦印务有限公司", "sku": "HLA-SS25-CWT-001", "quantity": 41709, "status": "生产中", "shippedQuantity": 0}, {"id": "47-2", "orderNo": "TH20260528-64-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "HLA-SS25-SWT-002", "quantity": 9843, "status": "生产中", "shippedQuantity": 0}, {"id": "47-3", "orderNo": "TH20260528-64-3", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "HLA-SS25-HOD-003", "quantity": 8448, "status": "生产中", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-05-28 08:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-28 10:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-28 10:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-28 10:15", "detail": "通知供应商"}],
  },
  { id: '48', orderNo: 'TH20260531-91', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 180000, status: '已发货',
    createdAt: '2026-05-31 12:15', shippingAddress: '浙江省常熟市工业园区642号', contact: '周明', phone: '138****8939',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "48-1", "orderNo": "TH20260531-91-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "HLA-SS25-JKT-001", "quantity": 77019, "status": "已发货", "shippedQuantity": 77019, "shipments": [{"id": "sh-48-1-1", "batchNo": "SH20265778-717", "quantity": 77019, "trackingNo": "JD3673429346", "courier": "顺丰速运", "shippedAt": "2026-06-06 10:55", "signed": false, "platformTrackingNo": "JD3673429346"}]}, {"id": "48-2", "orderNo": "TH20260531-91-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "HLA-SS25-POL-002", "quantity": 102981, "status": "已发货", "shippedQuantity": 102981, "shipments": [{"id": "sh-48-2-1", "batchNo": "SH20261700-457", "quantity": 102981, "trackingNo": "SF4680430028", "courier": "德邦物流", "shippedAt": "2026-06-09 11:19", "signed": false, "platformTrackingNo": "SF4680430028"}]}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-31 12:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-31 14:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-31 14:30", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-31 14:30", "detail": "通知供应商"}],
  },
  { id: '49', orderNo: 'TH20260527-63', brandName: '雪中飞（Snow Flying）', factoryName: '无锡成衣六厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 60000, status: '已签收',
    createdAt: '2026-05-27 11:00', shippingAddress: '浙江省无锡市工业园区478号', contact: '郑强', phone: '135****9890',
    subOrders: [{"id": "49-1", "orderNo": "TH20260527-63-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "XZF-SS25-CWT-001", "quantity": 38561, "status": "已签收", "shippedQuantity": 38561, "shipments": [{"id": "sh-49-1-1", "batchNo": "SH20265861-226", "quantity": 38561, "trackingNo": "YD9335007847", "courier": "中通快递", "shippedAt": "2026-06-09 10:14", "signed": true, "signedAt": "2026-06-09 14:40", "platformTrackingNo": "YD9335007847"}]}, {"id": "49-2", "orderNo": "TH20260527-63-2", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "XZF-SS25-SWT-002", "quantity": 12997, "status": "已签收", "shippedQuantity": 12997, "shipments": [{"id": "sh-49-2-1", "batchNo": "SH20265827-733", "quantity": 12997, "trackingNo": "YD6904748298", "courier": "顺丰速运", "shippedAt": "2026-06-01 09:48", "signed": true, "signedAt": "2026-06-07 14:19", "platformTrackingNo": "YD6904748298"}]}, {"id": "49-3", "orderNo": "TH20260527-63-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "XZF-SS25-HOD-003", "quantity": 8442, "status": "已签收", "shippedQuantity": 8442, "shipments": [{"id": "sh-49-3-1", "batchNo": "SH20263399-321", "quantity": 8442, "trackingNo": "ST2997795110", "courier": "申通快递", "shippedAt": "2026-06-02 16:20", "signed": true, "signedAt": "2026-06-01 17:08", "platformTrackingNo": "ST2997795110"}]}],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-27 11:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-27 13:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-27 13:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-27 13:15", "detail": "通知供应商"}, {status: "已签收", operator: "品牌方", time: "2026-06-10 10:00", detail: "确认签收"}],
  },
  { id: '50', orderNo: 'TH20260525-72', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 150000, status: '已签收',
    createdAt: '2026-05-25 14:15', shippingAddress: '浙江省江阴市工业园区498号', contact: '孙婷', phone: '134****8140',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "50-1", "orderNo": "TH20260525-72-1", "supplierName": "温州正邦印务有限公司", "sku": "HLA-SS25-JKT-001", "quantity": 99415, "status": "已签收", "shippedQuantity": 99415, "shipments": [{"id": "sh-50-1-1", "batchNo": "SH20262257-298", "quantity": 99415, "trackingNo": "YT8720369027", "courier": "韵达快递", "shippedAt": "2026-06-07 15:47", "signed": true, "signedAt": "2026-06-05 11:52", "platformTrackingNo": "YT8720369027"}]}, {"id": "50-2", "orderNo": "TH20260525-72-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "HLA-SS25-POL-002", "quantity": 27151, "status": "已签收", "shippedQuantity": 27151, "shipments": [{"id": "sh-50-2-1", "batchNo": "SH20265431-726", "quantity": 27151, "trackingNo": "YT8061626853", "courier": "中通快递", "shippedAt": "2026-06-03 09:46", "signed": true, "signedAt": "2026-06-08 08:08", "platformTrackingNo": "YT8061626853"}]}, {"id": "50-3", "orderNo": "TH20260525-72-3", "supplierName": "义乌丰源包装印刷有限公司", "sku": "HLA-SS25-DRS-003", "quantity": 13244, "status": "已签收", "shippedQuantity": 13244, "shipments": [{"id": "sh-50-3-1", "batchNo": "SH20265283-485", "quantity": 13244, "trackingNo": "YD4694370211", "courier": "德邦物流", "shippedAt": "2026-06-02 18:44", "signed": true, "signedAt": "2026-06-07 09:21", "platformTrackingNo": "YD4694370211"}]}, {"id": "50-4", "orderNo": "TH20260525-72-4", "supplierName": "杭州信达标签印刷有限公司", "sku": "HLA-SS25-SHT-004", "quantity": 10190, "status": "已签收", "shippedQuantity": 10190, "shipments": [{"id": "sh-50-4-1", "batchNo": "SH20265748-594", "quantity": 10190, "trackingNo": "SF1068694114", "courier": "中通快递", "shippedAt": "2026-06-01 11:34", "signed": true, "signedAt": "2026-06-03 11:42", "platformTrackingNo": "SF1068694114"}]}],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-05-25 14:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-25 16:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-25 16:30", "detail": "拆分为 4 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-25 16:30", "detail": "通知供应商"}, {status: "已签收", operator: "品牌方", time: "2026-06-10 10:00", detail: "确认签收"}],
  },
  { id: '51', orderNo: 'TH20260607-51', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 60000, status: '已审核',
    createdAt: '2026-06-07 12:45', shippingAddress: '浙江省江阴市工业园区346号', contact: '孙婷', phone: '137****6355',
    templateName: '洗麦基础模板 v1',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-06-07 12:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-06-07 15:45", "detail": "审核通过"}],
  },
  { id: '52', orderNo: 'TH20260607-93', brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 200000, status: '生产完成',
    createdAt: '2026-06-07 13:15', shippingAddress: '浙江省宁波市工业园区973号', contact: '李娜', phone: '130****1508',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "52-1", "orderNo": "TH20260607-93-1", "supplierName": "温州正邦印务有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 97884, "status": "生产完成", "shippedQuantity": 0}, {"id": "52-2", "orderNo": "TH20260607-93-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "BSD-SS25-POL-002", "quantity": 102116, "status": "生产完成", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-07 13:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-07 15:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-07 15:30", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-07 15:30", "detail": "通知供应商"}],
  },
  { id: '53', orderNo: 'TH20260605-30', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 120000, status: '已签收',
    createdAt: '2026-06-05 17:00', shippingAddress: '浙江省杭州市工业园区952号', contact: '周明', phone: '131****1420',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "53-1", "orderNo": "TH20260605-30-1", "supplierName": "上海启明不干胶制品厂", "sku": "XZF-SS25-CWT-001", "quantity": 64420, "status": "已签收", "shippedQuantity": 64420, "shipments": [{"id": "sh-53-1-1", "batchNo": "SH20266342-108", "quantity": 64420, "trackingNo": "SF3967364811", "courier": "中通快递", "shippedAt": "2026-06-10 11:09", "signed": true, "signedAt": "2026-06-10 12:51", "platformTrackingNo": "SF3967364811"}]}, {"id": "53-2", "orderNo": "TH20260605-30-2", "supplierName": "温州正邦印务有限公司", "sku": "XZF-SS25-SWT-002", "quantity": 35139, "status": "已签收", "shippedQuantity": 35139, "shipments": [{"id": "sh-53-2-1", "batchNo": "SH20264017-816", "quantity": 35139, "trackingNo": "SF6110154742", "courier": "德邦物流", "shippedAt": "2026-06-10 15:52", "signed": true, "signedAt": "2026-06-10 14:23", "platformTrackingNo": "SF6110154742"}]}, {"id": "53-3", "orderNo": "TH20260605-30-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "XZF-SS25-HOD-003", "quantity": 20441, "status": "已签收", "shippedQuantity": 20441, "shipments": [{"id": "sh-53-3-1", "batchNo": "SH20264906-357", "quantity": 20441, "trackingNo": "JD2834772742", "courier": "顺丰速运", "shippedAt": "2026-06-03 14:51", "signed": true, "signedAt": "2026-06-12 15:23", "platformTrackingNo": "JD2834772742"}]}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-05 17:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-05 19:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-05 19:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-05 19:15", "detail": "通知供应商"}, {status: "已签收", operator: "品牌方", time: "2026-06-10 10:00", detail: "确认签收"}],
  },
  { id: '54', orderNo: 'TH20260526-54', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 250000, status: '已审核',
    isUrgent: true,
    createdAt: '2026-05-26 09:00', shippingAddress: '浙江省杭州市工业园区519号', contact: '郑强', phone: '135****2129',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-26 09:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-05-26 12:00", "detail": "审核通过"}],
  },
  { id: '55', orderNo: 'TH20260527-32', brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 180000, status: '已驳回',
    createdAt: '2026-05-27 10:45', shippingAddress: '浙江省宁波市工业园区794号', contact: '周明', phone: '139****9817',
    templateName: '洗麦基础模板 v1',
    sku: 'SEM-SS25-STK-001', productName: '镭射防伪贴', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-27 10:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-27 12:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '56', orderNo: 'TH20260524-69', brandName: '森马（Semir）', factoryName: '温州成衣一厂',
    type: '免费单', tagType: '吊牌标签', totalQuantity: 100000, status: '待审核',
    createdAt: '2026-05-24 15:15', shippingAddress: '浙江省温州市工业园区507号', contact: '郑强', phone: '135****1470',
    templateName: '洗麦基础模板 v1',
    sku: 'SEM-SS25-POL-002', productName: '速干运动Polo', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-24 15:15", "detail": "订单提交"}],
  },
  { id: '57', orderNo: 'TH20260530-20', brandName: '森马（Semir）', factoryName: '嘉兴成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 100000, status: '已驳回',
    createdAt: '2026-05-30 08:15', shippingAddress: '浙江省嘉兴市工业园区569号', contact: '孙婷', phone: '136****9004',
    sku: 'SEM-SS25-WHL-001', productName: '基础水洗标', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-05-30 08:15", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-30 10:15", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '58', orderNo: 'TH20260601-94', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 80000, status: '已发货',
    createdAt: '2026-06-01 11:30', shippingAddress: '浙江省江阴市工业园区353号', contact: '吴芳', phone: '137****9698',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "58-1", "orderNo": "TH20260601-94-1", "supplierName": "上海启明不干胶制品厂", "sku": "HLA-SS25-JKT-001", "quantity": 32669, "status": "已发货", "shippedQuantity": 32669, "shipments": [{"id": "sh-58-1-1", "batchNo": "SH20265842-559", "quantity": 32669, "trackingNo": "YT2082198244", "courier": "圆通快递", "shippedAt": "2026-06-02 08:02", "signed": false, "platformTrackingNo": "YT2082198244"}]}, {"id": "58-2", "orderNo": "TH20260601-94-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "HLA-SS25-POL-002", "quantity": 47331, "status": "已发货", "shippedQuantity": 47331, "shipments": [{"id": "sh-58-2-1", "batchNo": "SH20267912-820", "quantity": 47331, "trackingNo": "YT5259262928", "courier": "圆通快递", "shippedAt": "2026-06-01 16:10", "signed": false, "platformTrackingNo": "YT5259262928"}]}],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-06-01 11:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-01 13:30", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-01 13:45", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-01 13:45", "detail": "通知供应商"}],
  },
  { id: '59', orderNo: 'TH20260606-34', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 120000, status: '已驳回',
    createdAt: '2026-06-06 16:15', shippingAddress: '浙江省苏州市工业园区742号', contact: '孙婷', phone: '137****5530',
    templateName: '洗麦基础模板 v1',
    sku: 'SEM-SS25-DRS-003', productName: '弹力运动连衣裙', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-06-06 16:15", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-06 18:15", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '60', orderNo: 'TH20260605-78', brandName: '波司登（Bosideng）', factoryName: '宁波成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '部分发货',
    createdAt: '2026-06-05 12:00', shippingAddress: '浙江省宁波市工业园区998号', contact: '赵刚', phone: '134****1745',
    subOrders: [{"id": "60-1", "orderNo": "TH20260605-78-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 63555, "status": "部分发货", "shippedQuantity": 37321, "shipments": [{"id": "sh-60-1-1", "batchNo": "SH20265731-294", "quantity": 37321, "trackingNo": "YT1776250453", "courier": "中通快递", "shippedAt": "2026-06-01 14:13", "signed": false, "platformTrackingNo": "YT1776250453"}]}, {"id": "60-2", "orderNo": "TH20260605-78-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "BSD-SS25-POL-002", "quantity": 24625, "status": "已发货", "shippedQuantity": 24625, "shipments": [{"id": "sh-60-2-1", "batchNo": "SH20267142-375", "quantity": 24625, "trackingNo": "YD8631691328", "courier": "极兔速递", "shippedAt": "2026-06-05 18:30", "signed": false, "platformTrackingNo": "YD8631691328"}]}, {"id": "60-3", "orderNo": "TH20260605-78-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "BSD-SS25-DRS-003", "quantity": 12759, "status": "部分发货", "shippedQuantity": 4701, "shipments": [{"id": "sh-60-3-1", "batchNo": "SH20266884-187", "quantity": 4701, "trackingNo": "YD8380979412", "courier": "顺丰速运", "shippedAt": "2026-06-12 08:40", "signed": false, "platformTrackingNo": "YD8380979412"}]}, {"id": "60-4", "orderNo": "TH20260605-78-4", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "BSD-SS25-SHT-004", "quantity": 19061, "status": "已发货", "shippedQuantity": 19061, "shipments": [{"id": "sh-60-4-1", "batchNo": "SH20261603-971", "quantity": 19061, "trackingNo": "JD6484509176", "courier": "圆通快递", "shippedAt": "2026-06-06 13:24", "signed": false, "platformTrackingNo": "JD6484509176"}]}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-06-05 12:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-05 14:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-05 14:15", "detail": "拆分为 4 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-05 14:15", "detail": "通知供应商"}],
  },
  { id: '61', orderNo: 'TH20260605-20', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '补单', tagType: '洗麦标签', totalQuantity: 30000, status: '已驳回',
    createdAt: '2026-06-05 10:30', shippingAddress: '浙江省江阴市工业园区621号', contact: '孙婷', phone: '131****7818',
    sku: 'SEM-SS25-HKT-001', productName: '轻薄防晒衣', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-06-05 10:30", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-05 12:30", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '62', orderNo: 'TH20260603-88', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 150000, status: '待审核',
    createdAt: '2026-06-03 17:00', shippingAddress: '浙江省常熟市工业园区271号', contact: '李娜', phone: '133****4457',
    templateName: '标准吊牌模板 v3',
    sku: 'SEM-SS25-SWT-002', productName: '半拉链针织衫', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-03 17:00", "detail": "订单提交"}],
  },
  { id: '63', orderNo: 'TH20260531-39', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 250000, status: '已驳回',
    createdAt: '2026-05-31 12:00', shippingAddress: '浙江省苏州市工业园区73号', contact: '周明', phone: '134****8438',
    templateName: '不干胶通用模板 v2',
    sku: 'SEM-SS25-STK-002', productName: '环保牛皮纸贴', dataSource: 'platform', subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-31 12:00", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-31 14:00", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '64', orderNo: 'TH20260524-19', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 60000, status: '已审核',
    createdAt: '2026-05-24 12:15', shippingAddress: '浙江省江阴市工业园区610号', contact: '王磊', phone: '132****6039',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-05-24 12:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-陈芳", "time": "2026-05-24 15:15", "detail": "审核通过"}],
  },
  { id: '65', orderNo: 'TH20260603-66', brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 150000, status: '已发货',
    createdAt: '2026-06-03 16:45', shippingAddress: '浙江省宁波市工业园区911号', contact: '李娜', phone: '139****1653',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "65-1", "orderNo": "TH20260603-66-1", "supplierName": "杭州信达标签印刷有限公司", "sku": "BSD-SS25-CWT-001", "quantity": 150000, "status": "已发货", "shippedQuantity": 150000, "shipments": [{"id": "sh-65-1-1", "batchNo": "SH20269983-411", "quantity": 150000, "trackingNo": "SF5256645382", "courier": "圆通快递", "shippedAt": "2026-06-07 17:58", "signed": false, "platformTrackingNo": "SF5256645382"}]}],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-03 16:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-03 18:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-03 19:00", "detail": "拆分为 1 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-03 19:00", "detail": "通知供应商"}],
  },
  { id: '66', orderNo: 'TH20260607-76', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 250000, status: '生产中',
    createdAt: '2026-06-07 10:45', shippingAddress: '浙江省杭州市工业园区600号', contact: '钱华', phone: '134****3973',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "66-1", "orderNo": "TH20260607-76-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "BSD-SS25-JKT-001", "quantity": 107105, "status": "生产中", "shippedQuantity": 0}, {"id": "66-2", "orderNo": "TH20260607-76-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "BSD-SS25-POL-002", "quantity": 48847, "status": "生产中", "shippedQuantity": 0}, {"id": "66-3", "orderNo": "TH20260607-76-3", "supplierName": "义乌丰源包装印刷有限公司", "sku": "BSD-SS25-DRS-003", "quantity": 94048, "status": "生产中", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "钱华", "time": "2026-06-07 10:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-07 12:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-07 13:00", "detail": "拆分为 3 个子订单"}],
  },
  { id: '67', orderNo: 'TH20260528-68', brandName: '森马（Semir）', factoryName: '嘉兴成衣二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 100000, status: '生产完成',
    createdAt: '2026-05-28 14:00', shippingAddress: '浙江省嘉兴市工业园区332号', contact: '李娜', phone: '135****5135',
    subOrders: [{"id": "67-1", "orderNo": "TH20260528-68-1", "supplierName": "上海启明不干胶制品厂", "sku": "SEM-SS25-CWT-001", "quantity": 100000, "status": "生产完成", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-05-28 14:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-28 16:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-28 16:15", "detail": "拆分为 1 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-28 16:15", "detail": "通知供应商"}],
  },
];

// ---- 发货记录 ----
export const shipments: Record<string, Shipment[]> = {
  '2-2': [
    { id: 'sh1', batchNo: 'SH20260605-001', quantity: 30000, trackingNo: 'SF1234567890123', courier: '顺丰速运', shippedAt: '2026-06-05 10:00', signed: false, supTrackingNo: 'SUP-SF-20260605-001', platformTrackingNo: 'SF1234567890123' },
    { id: 'sh2', batchNo: 'SH20260605-002', quantity: 20000, trackingNo: 'SF1234567890456', courier: '顺丰速运', shippedAt: '2026-06-05 15:00', signed: false, supTrackingNo: 'SUP-SF-20260605-002', platformTrackingNo: 'SF1234567890456' },
  ],
  '2-1': [
    { id: 'sh3', batchNo: 'SH20260604-001', quantity: 100000, trackingNo: 'YTO9876543210123', courier: '圆通速递', shippedAt: '2026-06-04 16:00', signed: true, supTrackingNo: 'SUP-YTO-20260604-001', platformTrackingNo: 'YTO9876543210123', signedAt: '2026-06-06 14:00', signedDocNo: 'ESIGN-20260606-001' },
  ],
  '7-1': [
    { id: 'sh4', batchNo: 'SH20260605-003', quantity: 50000, trackingNo: 'ZTO1122334455667', courier: '中通速递', shippedAt: '2026-06-05 10:00', signed: false, supTrackingNo: 'SUP-ZTO-20260605-001', platformTrackingNo: 'ZTO1122334455667' },
    { id: 'sh5', batchNo: 'SH20260605-004', quantity: 30000, trackingNo: 'ZTO1122334455888', courier: '中通速递', shippedAt: '2026-06-05 18:00', signed: false, supTrackingNo: 'SUP-ZTO-20260605-002', platformTrackingNo: 'ZTO1122334455888' },
  ],
  '3-1': [
    { id: 'sh6', batchNo: 'SH20260604-002', quantity: 100000, trackingNo: 'STO9988776655443', courier: '申通快递', shippedAt: '2026-06-05 08:00', signed: true, supTrackingNo: 'SUP-STO-20260604-001', platformTrackingNo: 'STO9988776655443', signedAt: '2026-06-05 15:00', signedDocNo: 'ESIGN-20260605-001' },
  ],
  '8-1': [
    { id: 'sh7', batchNo: 'SH20260531-001', quantity: 40000, trackingNo: 'YTO5544332211001', courier: '圆通速递', shippedAt: '2026-05-31 09:00', signed: true, supTrackingNo: 'SUP-YTO-20260531-001', platformTrackingNo: 'YTO5544332211001', signedAt: '2026-06-02 10:00', signedDocNo: 'ESIGN-20260602-001' },
    { id: 'sh8', batchNo: 'SH20260531-002', quantity: 20000, trackingNo: 'YTO5544332211002', courier: '圆通速递', shippedAt: '2026-05-31 16:00', signed: true, supTrackingNo: 'SUP-YTO-20260531-002', platformTrackingNo: 'YTO5544332211002', signedAt: '2026-06-02 14:00', signedDocNo: 'ESIGN-20260602-002' },
  ],
  '10-1': [
    { id: 'sh9', batchNo: 'SH20260605-005', quantity: 30000, trackingNo: 'SF9988776655443', courier: '顺丰速运', shippedAt: '2026-06-05 14:00', signed: false, supTrackingNo: 'SUP-SF-20260605-003', platformTrackingNo: 'SF9988776655443' },
    { id: 'sh10', batchNo: 'SH20260606-001', quantity: 30000, trackingNo: 'SF9988776655444', courier: '顺丰速运', shippedAt: '2026-06-06 09:00', signed: false, supTrackingNo: 'SUP-SF-20260606-001', platformTrackingNo: 'SF9988776655444' },
  ],
  '11-1': [
    { id: 'sh11', batchNo: 'SH20260604-003', quantity: 90000, trackingNo: 'YTO1122334455779', courier: '圆通速递', shippedAt: '2026-06-04 09:00', signed: true, supTrackingNo: 'SUP-YTO-20260604-002', platformTrackingNo: 'YTO1122334455779', signedAt: '2026-06-06 11:00', signedDocNo: 'ESIGN-20260606-002' },
  ],
  '11-2': [
    { id: 'sh12', batchNo: 'SH20260604-004', quantity: 50000, trackingNo: 'ZTO8877665544332', courier: '中通速递', shippedAt: '2026-06-04 10:00', signed: true, supTrackingNo: 'SUP-ZTO-20260604-001', platformTrackingNo: 'ZTO8877665544332', signedAt: '2026-06-05 16:00', signedDocNo: 'ESIGN-20260605-002' },
    { id: 'sh13', batchNo: 'SH20260604-005', quantity: 40000, trackingNo: 'ZTO8877665544333', courier: '中通速递', shippedAt: '2026-06-04 14:00', signed: true, supTrackingNo: 'SUP-ZTO-20260604-002', platformTrackingNo: 'ZTO8877665544333', signedAt: '2026-06-05 18:00', signedDocNo: 'ESIGN-20260605-003' },
  ],
  '13-1': [
    { id: 'sh14', batchNo: 'SH20260604-006', quantity: 15000, trackingNo: 'STO5544332211889', courier: '申通快递', shippedAt: '2026-06-04 08:00', signed: false, supTrackingNo: 'SUP-STO-20260604-002', platformTrackingNo: 'STO5544332211889' },
    { id: 'sh15', batchNo: 'SH20260605-006', quantity: 15000, trackingNo: 'STO5544332211890', courier: '申通快递', shippedAt: '2026-06-05 11:00', signed: false, supTrackingNo: 'SUP-STO-20260605-001', platformTrackingNo: 'STO5544332211890' },
  ],
  '14-1': [
    { id: 'sh16', batchNo: 'SH20260528-001', quantity: 50000, trackingNo: 'SF7766554433221', courier: '顺丰速运', shippedAt: '2026-05-28 10:00', signed: true, supTrackingNo: 'SUP-SF-20260528-001', platformTrackingNo: 'SF7766554433221', signedAt: '2026-05-30 09:00', signedDocNo: 'ESIGN-20260530-001' },
    { id: 'sh17', batchNo: 'SH20260529-001', quantity: 25000, trackingNo: 'SF7766554433222', courier: '顺丰速运', shippedAt: '2026-05-29 14:00', signed: true, supTrackingNo: 'SUP-SF-20260529-001', platformTrackingNo: 'SF7766554433222', signedAt: '2026-05-31 11:00', signedDocNo: 'ESIGN-20260531-001' },
  ],
  '23-1': [
    { id: 'sh-gen-23-1-1', batchNo: 'SH23-1-01', quantity: 18554, trackingNo: 'SF1673772246159', courier: '顺丰速运', shippedAt: '2026-06-04 12:00', signed: false, supTrackingNo: 'SUP-SF-497540', platformTrackingNo: 'SF1673772246159' },
    { id: 'sh-gen-23-1-2', batchNo: 'SH23-1-02', quantity: 32811, trackingNo: 'SF3804836560203', courier: '顺丰速运', shippedAt: '2026-06-05 16:30', signed: false, supTrackingNo: 'SUP-SF-241618', platformTrackingNo: 'SF3804836560203' }
  ],
  '23-2': [
    { id: 'sh-gen-23-2-1', batchNo: 'SH23-2-01', quantity: 19353, trackingNo: 'ZTO1026473219996', courier: '中通速递', shippedAt: '2026-06-05 13:00', signed: false, supTrackingNo: 'SUP-ZTO-557468', platformTrackingNo: 'ZTO1026473219996' }
  ],
  '23-3': [
    { id: 'sh-gen-23-3-1', batchNo: 'SH23-3-01', quantity: 14198, trackingNo: 'SF6549126071919', courier: '顺丰速运', shippedAt: '2026-06-05 14:00', signed: false, supTrackingNo: 'SUP-SF-867598', platformTrackingNo: 'SF6549126071919' }
  ],
  '23-4': [
    { id: 'sh-gen-23-4-1', batchNo: 'SH23-4-01', quantity: 15084, trackingNo: 'STO3502536302893', courier: '申通快递', shippedAt: '2026-06-01 08:00', signed: false, supTrackingNo: 'SUP-STO-232382', platformTrackingNo: 'STO3502536302893' }
  ],
  '30-1': [
    { id: 'sh-gen-30-1-1', batchNo: 'SH30-1-01', quantity: 48222, trackingNo: 'SF7040034400382', courier: '顺丰速运', shippedAt: '2026-06-05 15:30', signed: false, supTrackingNo: 'SUP-SF-647010', platformTrackingNo: 'SF7040034400382' },
    { id: 'sh-gen-30-1-2', batchNo: 'SH30-1-02', quantity: 31778, trackingNo: 'SF8005145553416', courier: '顺丰速运', shippedAt: '2026-06-04 11:30', signed: false, supTrackingNo: 'SUP-SF-906647', platformTrackingNo: 'SF8005145553416' }
  ],
  '34-1': [
    { id: 'sh-gen-34-1-1', batchNo: 'SH34-1-01', quantity: 110249, trackingNo: 'YD7590281554747', courier: '韵达快递', shippedAt: '2026-06-05 18:30', signed: true, supTrackingNo: 'SUP-YD-776804', platformTrackingNo: 'YD7590281554747', signedAt: '2026-06-05 09:00', signedDocNo: 'ESIGN-20260607-872' },
    { id: 'sh-gen-34-1-2', batchNo: 'SH34-1-02', quantity: 5743, trackingNo: 'YD5607031348307', courier: '韵达快递', shippedAt: '2026-06-06 09:30', signed: true, supTrackingNo: 'SUP-YD-510195', platformTrackingNo: 'YD5607031348307', signedAt: '2026-06-02 14:00', signedDocNo: 'ESIGN-20260603-667' },
    { id: 'sh-gen-34-1-3', batchNo: 'SH34-1-03', quantity: 6934, trackingNo: 'YD1284911406265', courier: '韵达快递', shippedAt: '2026-06-01 15:30', signed: true, supTrackingNo: 'SUP-YD-481173', platformTrackingNo: 'YD1284911406265', signedAt: '2026-06-02 10:00', signedDocNo: 'ESIGN-20260607-743' }
  ],
  '34-2': [
    { id: 'sh-gen-34-2-1', batchNo: 'SH34-2-01', quantity: 29284, trackingNo: 'SF6062215103408', courier: '顺丰速运', shippedAt: '2026-06-04 16:00', signed: true, supTrackingNo: 'SUP-SF-286216', platformTrackingNo: 'SF6062215103408', signedAt: '2026-06-04 12:00', signedDocNo: 'ESIGN-20260605-595' },
    { id: 'sh-gen-34-2-2', batchNo: 'SH34-2-02', quantity: 27790, trackingNo: 'SF1775075364776', courier: '顺丰速运', shippedAt: '2026-06-02 16:30', signed: true, supTrackingNo: 'SUP-SF-122029', platformTrackingNo: 'SF1775075364776', signedAt: '2026-06-01 11:00', signedDocNo: 'ESIGN-20260604-297' }
  ],
  '39-1': [
    { id: 'sh-gen-39-1-1', batchNo: 'SH39-1-01', quantity: 17332, trackingNo: 'ZTO2906967005574', courier: '中通速递', shippedAt: '2026-06-04 18:30', signed: false, supTrackingNo: 'SUP-ZTO-747584', platformTrackingNo: 'ZTO2906967005574' },
    { id: 'sh-gen-39-1-2', batchNo: 'SH39-1-02', quantity: 16359, trackingNo: 'ZTO2562109895914', courier: '中通速递', shippedAt: '2026-06-01 16:30', signed: false, supTrackingNo: 'SUP-ZTO-186932', platformTrackingNo: 'ZTO2562109895914' }
  ],
  '39-2': [
    { id: 'sh-gen-39-2-1', batchNo: 'SH39-2-01', quantity: 31127, trackingNo: 'STO8110898579089', courier: '申通快递', shippedAt: '2026-06-05 14:00', signed: false, supTrackingNo: 'SUP-STO-130552', platformTrackingNo: 'STO8110898579089' }
  ],
  '39-3': [
    { id: 'sh-gen-39-3-1', batchNo: 'SH39-3-01', quantity: 24278, trackingNo: 'ZTO7126401788002', courier: '中通速递', shippedAt: '2026-06-01 16:30', signed: false, supTrackingNo: 'SUP-ZTO-124947', platformTrackingNo: 'ZTO7126401788002' },
    { id: 'sh-gen-39-3-2', batchNo: 'SH39-3-02', quantity: 10904, trackingNo: 'ZTO2131376152597', courier: '中通速递', shippedAt: '2026-06-06 18:00', signed: false, supTrackingNo: 'SUP-ZTO-852581', platformTrackingNo: 'ZTO2131376152597' }
  ],
  '42-2': [
    { id: 'sh-gen-42-2-1', batchNo: 'SH42-2-01', quantity: 12411, trackingNo: 'YTO3569705406363', courier: '圆通速递', shippedAt: '2026-06-04 09:00', signed: false, supTrackingNo: 'SUP-YTO-909974', platformTrackingNo: 'YTO3569705406363' }
  ],
  '42-3': [
    { id: 'sh-gen-42-3-1', batchNo: 'SH42-3-01', quantity: 23486, trackingNo: 'ZTO3102459950325', courier: '中通速递', shippedAt: '2026-06-02 16:30', signed: false, supTrackingNo: 'SUP-ZTO-760201', platformTrackingNo: 'ZTO3102459950325' },
    { id: 'sh-gen-42-3-2', batchNo: 'SH42-3-02', quantity: 22162, trackingNo: 'ZTO2092777901842', courier: '中通速递', shippedAt: '2026-06-02 17:30', signed: false, supTrackingNo: 'SUP-ZTO-877372', platformTrackingNo: 'ZTO2092777901842' }
  ],
  '43-1': [
    { id: 'sh-gen-43-1-1', batchNo: 'SH43-1-01', quantity: 17836, trackingNo: 'YTO8547562374975', courier: '圆通速递', shippedAt: '2026-06-03 15:30', signed: false, supTrackingNo: 'SUP-YTO-929538', platformTrackingNo: 'YTO8547562374975' },
    { id: 'sh-gen-43-1-2', batchNo: 'SH43-1-02', quantity: 20095, trackingNo: 'YTO7043608991565', courier: '圆通速递', shippedAt: '2026-06-02 16:30', signed: false, supTrackingNo: 'SUP-YTO-624416', platformTrackingNo: 'YTO7043608991565' },
    { id: 'sh-gen-43-1-3', batchNo: 'SH43-1-03', quantity: 52884, trackingNo: 'YTO6981043403369', courier: '圆通速递', shippedAt: '2026-06-01 16:30', signed: false, supTrackingNo: 'SUP-YTO-197367', platformTrackingNo: 'YTO6981043403369' }
  ],
  '43-2': [
    { id: 'sh-gen-43-2-1', batchNo: 'SH43-2-01', quantity: 57937, trackingNo: 'ZTO1757624372004', courier: '中通速递', shippedAt: '2026-06-02 13:30', signed: false, supTrackingNo: 'SUP-ZTO-624861', platformTrackingNo: 'ZTO1757624372004' }
  ],
  '43-3': [
    { id: 'sh-gen-43-3-1', batchNo: 'SH43-3-01', quantity: 51248, trackingNo: 'SF5716708016013', courier: '顺丰速运', shippedAt: '2026-06-05 11:00', signed: false, supTrackingNo: 'SUP-SF-692051', platformTrackingNo: 'SF5716708016013' }
  ],
  '44-1': [
    { id: 'sh-gen-44-1-1', batchNo: 'SH44-1-01', quantity: 86094, trackingNo: 'YTO3347361470229', courier: '圆通速递', shippedAt: '2026-06-05 13:00', signed: false, supTrackingNo: 'SUP-YTO-948318', platformTrackingNo: 'YTO3347361470229' }
  ],
  '44-2': [
    { id: 'sh-gen-44-2-1', batchNo: 'SH44-2-01', quantity: 65938, trackingNo: 'YD1497258232991', courier: '韵达快递', shippedAt: '2026-06-04 15:30', signed: false, supTrackingNo: 'SUP-YD-369328', platformTrackingNo: 'YD1497258232991' }
  ],
  '44-3': [
    { id: 'sh-gen-44-3-1', batchNo: 'SH44-3-01', quantity: 23150, trackingNo: 'YD9701476401546', courier: '韵达快递', shippedAt: '2026-06-04 11:00', signed: false, supTrackingNo: 'SUP-YD-460075', platformTrackingNo: 'YD9701476401546' },
    { id: 'sh-gen-44-3-2', batchNo: 'SH44-3-02', quantity: 24818, trackingNo: 'YD1922091981882', courier: '韵达快递', shippedAt: '2026-06-06 17:00', signed: false, supTrackingNo: 'SUP-YD-478164', platformTrackingNo: 'YD1922091981882' }
  ],
  '45-1': [
    { id: 'sh-gen-45-1-1', batchNo: 'SH45-1-01', quantity: 21354, trackingNo: 'STO8901753210392', courier: '申通快递', shippedAt: '2026-06-03 13:00', signed: false, supTrackingNo: 'SUP-STO-459696', platformTrackingNo: 'STO8901753210392' },
    { id: 'sh-gen-45-1-2', batchNo: 'SH45-1-02', quantity: 8914, trackingNo: 'STO7603145974389', courier: '申通快递', shippedAt: '2026-06-02 10:30', signed: false, supTrackingNo: 'SUP-STO-624785', platformTrackingNo: 'STO7603145974389' }
  ],
  '45-2': [
    { id: 'sh-gen-45-2-1', batchNo: 'SH45-2-01', quantity: 18359, trackingNo: 'ZTO2217058514073', courier: '中通速递', shippedAt: '2026-06-02 16:30', signed: false, supTrackingNo: 'SUP-ZTO-410272', platformTrackingNo: 'ZTO2217058514073' }
  ],
  '45-3': [
    { id: 'sh-gen-45-3-1', batchNo: 'SH45-3-01', quantity: 11373, trackingNo: 'SF1907872700047', courier: '顺丰速运', shippedAt: '2026-06-03 16:30', signed: false, supTrackingNo: 'SUP-SF-714432', platformTrackingNo: 'SF1907872700047' }
  ],
  '46-1': [
    { id: 'sh-gen-46-1-1', batchNo: 'SH46-1-01', quantity: 43196, trackingNo: 'STO5679132462133', courier: '申通快递', shippedAt: '2026-06-04 17:30', signed: true, supTrackingNo: 'SUP-STO-460766', platformTrackingNo: 'STO5679132462133', signedAt: '2026-06-07 16:00', signedDocNo: 'ESIGN-20260605-685' },
    { id: 'sh-gen-46-1-2', batchNo: 'SH46-1-02', quantity: 73248, trackingNo: 'STO4204255062396', courier: '申通快递', shippedAt: '2026-06-02 15:30', signed: true, supTrackingNo: 'SUP-STO-620574', platformTrackingNo: 'STO4204255062396', signedAt: '2026-06-01 09:00', signedDocNo: 'ESIGN-20260604-776' }
  ],
  '46-2': [
    { id: 'sh-gen-46-2-1', batchNo: 'SH46-2-01', quantity: 53495, trackingNo: 'YTO4886695205502', courier: '圆通速递', shippedAt: '2026-06-01 15:00', signed: true, supTrackingNo: 'SUP-YTO-730604', platformTrackingNo: 'YTO4886695205502', signedAt: '2026-06-05 09:00', signedDocNo: 'ESIGN-20260604-616' },
    { id: 'sh-gen-46-2-2', batchNo: 'SH46-2-02', quantity: 20215, trackingNo: 'YTO5004569528502', courier: '圆通速递', shippedAt: '2026-06-03 17:00', signed: true, supTrackingNo: 'SUP-YTO-398941', platformTrackingNo: 'YTO5004569528502', signedAt: '2026-06-06 10:00', signedDocNo: 'ESIGN-20260607-359' }
  ],
  '46-3': [
    { id: 'sh-gen-46-3-1', batchNo: 'SH46-3-01', quantity: 38398, trackingNo: 'YTO4483926156846', courier: '圆通速递', shippedAt: '2026-06-04 08:00', signed: true, supTrackingNo: 'SUP-YTO-900961', platformTrackingNo: 'YTO4483926156846', signedAt: '2026-06-01 13:00', signedDocNo: 'ESIGN-20260605-269' },
    { id: 'sh-gen-46-3-2', batchNo: 'SH46-3-02', quantity: 21448, trackingNo: 'YTO9793098368311', courier: '圆通速递', shippedAt: '2026-06-06 16:00', signed: true, supTrackingNo: 'SUP-YTO-653449', platformTrackingNo: 'YTO9793098368311', signedAt: '2026-06-07 16:00', signedDocNo: 'ESIGN-20260602-389' }
  ],
  '48-1': [
    { id: 'sh-gen-48-1-1', batchNo: 'SH48-1-01', quantity: 77019, trackingNo: 'SF4435146516806', courier: '顺丰速运', shippedAt: '2026-06-04 17:30', signed: false, supTrackingNo: 'SUP-SF-646000', platformTrackingNo: 'SF4435146516806' }
  ],
  '48-2': [
    { id: 'sh-gen-48-2-1', batchNo: 'SH48-2-01', quantity: 70432, trackingNo: 'SF8613130212699', courier: '顺丰速运', shippedAt: '2026-06-04 09:00', signed: false, supTrackingNo: 'SUP-SF-898696', platformTrackingNo: 'SF8613130212699' },
    { id: 'sh-gen-48-2-2', batchNo: 'SH48-2-02', quantity: 22424, trackingNo: 'SF3368645338760', courier: '顺丰速运', shippedAt: '2026-06-05 13:00', signed: false, supTrackingNo: 'SUP-SF-303905', platformTrackingNo: 'SF3368645338760' },
    { id: 'sh-gen-48-2-3', batchNo: 'SH48-2-03', quantity: 10125, trackingNo: 'SF2289384292792', courier: '顺丰速运', shippedAt: '2026-06-02 11:00', signed: false, supTrackingNo: 'SUP-SF-523258', platformTrackingNo: 'SF2289384292792' }
  ],
  '49-1': [
    { id: 'sh-gen-49-1-1', batchNo: 'SH49-1-01', quantity: 38561, trackingNo: 'SF1526335046407', courier: '顺丰速运', shippedAt: '2026-06-04 18:30', signed: true, supTrackingNo: 'SUP-SF-556826', platformTrackingNo: 'SF1526335046407', signedAt: '2026-06-01 12:00', signedDocNo: 'ESIGN-20260606-973' }
  ],
  '49-2': [
    { id: 'sh-gen-49-2-1', batchNo: 'SH49-2-01', quantity: 12997, trackingNo: 'ZTO4729426678664', courier: '中通速递', shippedAt: '2026-06-02 12:00', signed: true, supTrackingNo: 'SUP-ZTO-924261', platformTrackingNo: 'ZTO4729426678664', signedAt: '2026-06-05 09:00', signedDocNo: 'ESIGN-20260606-470' }
  ],
  '49-3': [
    { id: 'sh-gen-49-3-1', batchNo: 'SH49-3-01', quantity: 8442, trackingNo: 'YTO9981730312072', courier: '圆通速递', shippedAt: '2026-06-04 11:30', signed: true, supTrackingNo: 'SUP-YTO-298136', platformTrackingNo: 'YTO9981730312072', signedAt: '2026-06-06 15:00', signedDocNo: 'ESIGN-20260604-673' }
  ],
  '50-1': [
    { id: 'sh-gen-50-1-1', batchNo: 'SH50-1-01', quantity: 99415, trackingNo: 'STO9367194249360', courier: '申通快递', shippedAt: '2026-06-04 08:30', signed: true, supTrackingNo: 'SUP-STO-582454', platformTrackingNo: 'STO9367194249360', signedAt: '2026-06-06 10:00', signedDocNo: 'ESIGN-20260602-224' }
  ],
  '50-2': [
    { id: 'sh-gen-50-2-1', batchNo: 'SH50-2-01', quantity: 27151, trackingNo: 'ZTO6078167493611', courier: '中通速递', shippedAt: '2026-06-05 17:00', signed: true, supTrackingNo: 'SUP-ZTO-210862', platformTrackingNo: 'ZTO6078167493611', signedAt: '2026-06-03 12:00', signedDocNo: 'ESIGN-20260604-148' }
  ],
  '50-3': [
    { id: 'sh-gen-50-3-1', batchNo: 'SH50-3-01', quantity: 13244, trackingNo: 'YD2459155595367', courier: '韵达快递', shippedAt: '2026-06-01 17:30', signed: true, supTrackingNo: 'SUP-YD-539132', platformTrackingNo: 'YD2459155595367', signedAt: '2026-06-07 12:00', signedDocNo: 'ESIGN-20260604-284' }
  ],
  '50-4': [
    { id: 'sh-gen-50-4-1', batchNo: 'SH50-4-01', quantity: 10190, trackingNo: 'YTO2519533750990', courier: '圆通速递', shippedAt: '2026-06-04 10:00', signed: true, supTrackingNo: 'SUP-YTO-329714', platformTrackingNo: 'YTO2519533750990', signedAt: '2026-06-03 09:00', signedDocNo: 'ESIGN-20260601-249' }
  ],
  '53-1': [
    { id: 'sh-gen-53-1-1', batchNo: 'SH53-1-01', quantity: 29266, trackingNo: 'STO3667416797171', courier: '申通快递', shippedAt: '2026-06-06 14:00', signed: true, supTrackingNo: 'SUP-STO-240854', platformTrackingNo: 'STO3667416797171', signedAt: '2026-06-01 16:00', signedDocNo: 'ESIGN-20260606-192' },
    { id: 'sh-gen-53-1-2', batchNo: 'SH53-1-02', quantity: 35154, trackingNo: 'STO5137080611626', courier: '申通快递', shippedAt: '2026-06-06 08:30', signed: true, supTrackingNo: 'SUP-STO-249953', platformTrackingNo: 'STO5137080611626', signedAt: '2026-06-07 15:00', signedDocNo: 'ESIGN-20260603-787' }
  ],
  '53-2': [
    { id: 'sh-gen-53-2-1', batchNo: 'SH53-2-01', quantity: 35139, trackingNo: 'SF2018168705294', courier: '顺丰速运', shippedAt: '2026-06-03 13:30', signed: true, supTrackingNo: 'SUP-SF-402061', platformTrackingNo: 'SF2018168705294', signedAt: '2026-06-05 10:00', signedDocNo: 'ESIGN-20260601-355' }
  ],
  '53-3': [
    { id: 'sh-gen-53-3-1', batchNo: 'SH53-3-01', quantity: 20441, trackingNo: 'YTO7521339807494', courier: '圆通速递', shippedAt: '2026-06-02 16:00', signed: true, supTrackingNo: 'SUP-YTO-134835', platformTrackingNo: 'YTO7521339807494', signedAt: '2026-06-06 11:00', signedDocNo: 'ESIGN-20260607-526' }
  ],
  '58-1': [
    { id: 'sh-gen-58-1-1', batchNo: 'SH58-1-01', quantity: 19631, trackingNo: 'YD2405717605752', courier: '韵达快递', shippedAt: '2026-06-03 08:30', signed: false, supTrackingNo: 'SUP-YD-496909', platformTrackingNo: 'YD2405717605752' },
    { id: 'sh-gen-58-1-2', batchNo: 'SH58-1-02', quantity: 13038, trackingNo: 'YD8018830081023', courier: '韵达快递', shippedAt: '2026-06-06 10:30', signed: false, supTrackingNo: 'SUP-YD-765746', platformTrackingNo: 'YD8018830081023' }
  ],
  '58-2': [
    { id: 'sh-gen-58-2-1', batchNo: 'SH58-2-01', quantity: 47331, trackingNo: 'SF9460132178830', courier: '顺丰速运', shippedAt: '2026-06-02 13:30', signed: false, supTrackingNo: 'SUP-SF-397061', platformTrackingNo: 'SF9460132178830' }
  ],
  '60-1': [
    { id: 'sh-gen-60-1-1', batchNo: 'SH60-1-01', quantity: 44058, trackingNo: 'YD7430393576743', courier: '韵达快递', shippedAt: '2026-06-04 14:00', signed: true, supTrackingNo: 'SUP-YD-177166', platformTrackingNo: 'YD7430393576743', signedAt: '2026-06-05 10:00', signedDocNo: 'ESIGN-20260603-224' }
  ],
  '60-2': [
    { id: 'sh-gen-60-2-1', batchNo: 'SH60-2-01', quantity: 24625, trackingNo: 'ZTO5432964986828', courier: '中通速递', shippedAt: '2026-06-01 12:30', signed: false, supTrackingNo: 'SUP-ZTO-530700', platformTrackingNo: 'ZTO5432964986828' }
  ],
  '60-3': [
    { id: 'sh-gen-60-3-1', batchNo: 'SH60-3-01', quantity: 6997, trackingNo: 'SF6048003007257', courier: '顺丰速运', shippedAt: '2026-06-03 18:00', signed: false, supTrackingNo: 'SUP-SF-768976', platformTrackingNo: 'SF6048003007257' }
  ],
  '60-4': [
    { id: 'sh-gen-60-4-1', batchNo: 'SH60-4-01', quantity: 19061, trackingNo: 'ZTO8760006679479', courier: '中通速递', shippedAt: '2026-06-04 11:00', signed: false, supTrackingNo: 'SUP-ZTO-977986', platformTrackingNo: 'ZTO8760006679479' }
  ],
  '65-1': [
    { id: 'sh-gen-65-1-1', batchNo: 'SH65-1-01', quantity: 125854, trackingNo: 'STO8305740866879', courier: '申通快递', shippedAt: '2026-06-02 10:30', signed: false, supTrackingNo: 'SUP-STO-319840', platformTrackingNo: 'STO8305740866879' },
    { id: 'sh-gen-65-1-2', batchNo: 'SH65-1-02', quantity: 24146, trackingNo: 'STO2476812367437', courier: '申通快递', shippedAt: '2026-06-02 08:30', signed: false, supTrackingNo: 'SUP-STO-283135', platformTrackingNo: 'STO2476812367437' }
  ]
};

// ---- EPC 校验结果 ----
export const mockEpcErrors: EpcValidationError[] = [
  { row: 1234, epc: '3034ABC000000001234', reason: 'EPC 重复：与历史生产数据（订单 TH20260301-001）冲突' },
  { row: 5678, epc: 'XYZ00100000005678', reason: '格式不匹配：公司前缀应为 3034，当前为 XYZ' },
  { row: 8901, epc: '3034ABC000000008901', reason: 'EPC 重复：与当前批次第 456 行重复' },
  { row: 10234, epc: '3034SHORT', reason: 'EPC 长度异常：应为 24 位，当前 12 位' },
  { row: 15000, epc: '3034ABC000000015000', reason: 'EPC 重复：与历史生产数据（订单 TH20260415-002）冲突' },
  { row: 23456, epc: '3035ABC000000023456', reason: '公司前缀不匹配：当前为 3035，品牌规则要求 3034' },
  { row: 31000, epc: '3034---INVALID---!!', reason: 'EPC 编码含非法字符' },
  { row: 42999, epc: '3034ABC000000042999', reason: '序列号超出规则分配范围（上限 999999999）' },
];

// ---- 对账 ----
export const brandBillings: BillingItem[] = [
{
    key: '1', billingNo: 'BILL-2026-05-001', period: '2026-05-01 ~ 2026-05-31',
    totalAmount: 864050, status: '待确认', invoiceUploaded: false,
    paymentDueDate: '—', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-05026', subOrderNo: 'TH-PO-2026-05026-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 71000, unitPrice: 1.10, amount: 78100, batches: [{ batchNo: 'SH202605-114', quantity: 46150, shippedAt: '2026--05-03', supTrackingNo: 'SF735056084331', platformTrackingNo: 'SF842018995729', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05026-1-1' }, { batchNo: 'SH202605-115', quantity: 24850, shippedAt: '2026--05-09', supTrackingNo: 'SF292226710924', platformTrackingNo: 'SF668956468715', signedAt: '2026-05-06', signedDocNo: 'ESIGN-SH202605-114' }] },
      { parentOrderNo: 'TH-PO-2026-05026', subOrderNo: 'TH-PO-2026-05026-2', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 113000, unitPrice: 1.35, amount: 152550, batches: [{ batchNo: 'SH202605-116', quantity: 73440, shippedAt: '2026--05-03', supTrackingNo: 'SF744231975324', platformTrackingNo: 'SF797656813698', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05026-2-1' }, { batchNo: 'SH202605-117', quantity: 39560, shippedAt: '2026--05-10', supTrackingNo: 'SF466826061886', platformTrackingNo: 'SF835818342333', signedAt: '2026--05-13', signedDocNo: 'ESIGN-TH-PO-2026-05026-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-05027', subOrderNo: 'TH-PO-2026-05027-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 82000, unitPrice: 1.20, amount: 98400, batches: [{ batchNo: 'SH202605-118', quantity: 32800, shippedAt: '2026--05-03', supTrackingNo: 'SF542146239550', platformTrackingNo: 'SF936717894940', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05027-1-1' }, { batchNo: 'SH202605-119', quantity: 28700, shippedAt: '2026--05-07', supTrackingNo: 'SF443975597605', platformTrackingNo: 'SF453271363074', signedAt: '2026--05-11', signedDocNo: 'ESIGN-TH-PO-2026-05027-1-2' }, { batchNo: 'SH202605-120', quantity: 20500, shippedAt: '2026--05-11', supTrackingNo: 'SF821559449515', platformTrackingNo: 'SF696439391755', signedAt: '2026--05-15', signedDocNo: 'ESIGN-TH-PO-2026-05027-1-3' }] },
      { parentOrderNo: 'TH-PO-2026-05027', subOrderNo: 'TH-PO-2026-05027-2', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 89000, unitPrice: 0.55, amount: 48950, batches: [{ batchNo: 'SH202605-121', quantity: 57840, shippedAt: '2026--05-03', supTrackingNo: 'SF784453630589', platformTrackingNo: 'SF648709745211', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05027-2-1' }, { batchNo: 'SH202605-122', quantity: 31160, shippedAt: '2026--05-10', supTrackingNo: 'SF244092801172', platformTrackingNo: 'SF417516936790', signedAt: '2026-05-06', signedDocNo: 'ESIGN-SH202605-114' }] },
      { parentOrderNo: 'TH-PO-2026-05028', subOrderNo: 'TH-PO-2026-05028-1', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 110000, unitPrice: 0.55, amount: 60500, batches: [{ batchNo: 'SH202605-123', quantity: 71500, shippedAt: '2026--05-03', supTrackingNo: 'SF439982645429', platformTrackingNo: 'SF115250737438', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05028-1-1' }, { batchNo: 'SH202605-124', quantity: 38500, shippedAt: '2026--05-10', supTrackingNo: 'SF607293452733', platformTrackingNo: 'SF232916613814', signedAt: '2026-05-06', signedDocNo: 'ESIGN-SH202605-114' }] },
      { parentOrderNo: 'TH-PO-2026-05028', subOrderNo: 'TH-PO-2026-05028-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 112000, unitPrice: 0.85, amount: 95200, batches: [{ batchNo: 'SH202605-125', quantity: 44800, shippedAt: '2026--05-03', supTrackingNo: 'SF659599284334', platformTrackingNo: 'SF399382463310', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05028-2-1' }, { batchNo: 'SH202605-126', quantity: 39200, shippedAt: '2026--05-10', supTrackingNo: 'SF619606194160', platformTrackingNo: 'SF599263022595', signedAt: '2026--05-14', signedDocNo: 'ESIGN-TH-PO-2026-05028-2-2' }, { batchNo: 'SH202605-127', quantity: 28000, shippedAt: '2026--05-13', supTrackingNo: 'SF660920055648', platformTrackingNo: 'SF400947542743', signedAt: '2026-05-06', signedDocNo: 'ESIGN-SH202605-114' }] },
      { parentOrderNo: 'TH-PO-2026-05028', subOrderNo: 'TH-PO-2026-05028-3', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 83000, unitPrice: 1.10, amount: 91300, batches: [{ batchNo: 'SH202605-128', quantity: 53950, shippedAt: '2026--05-03', supTrackingNo: 'SF895783733945', platformTrackingNo: 'SF738176038125', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05028-3-1' }, { batchNo: 'SH202605-129', quantity: 29050, shippedAt: '2026--05-10', supTrackingNo: 'SF480037352466', platformTrackingNo: 'SF707018207466', signedAt: '2026--05-13', signedDocNo: 'ESIGN-TH-PO-2026-05028-3-2' }] },
      { parentOrderNo: 'TH-PO-2026-05029', subOrderNo: 'TH-PO-2026-05029-1', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 119000, unitPrice: 0.55, amount: 65450, batches: [{ batchNo: 'SH202605-130', quantity: 119000, shippedAt: '2026--05-03', supTrackingNo: 'SF149008905874', platformTrackingNo: 'SF917410343160', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05029-1-1' }] },
      { parentOrderNo: 'TH-PO-2026-05029', subOrderNo: 'TH-PO-2026-05029-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 90000, unitPrice: 1.20, amount: 108000, batches: [{ batchNo: 'SH202605-131', quantity: 36000, shippedAt: '2026--05-03', supTrackingNo: 'SF830094678828', platformTrackingNo: 'SF641819166671', signedAt: '2026--05-07', signedDocNo: 'ESIGN-TH-PO-2026-05029-2-1' }, { batchNo: 'SH202605-132', quantity: 31500, shippedAt: '2026--05-07', supTrackingNo: 'SF463312058510', platformTrackingNo: 'SF211109516823', signedAt: '2026--05-10', signedDocNo: 'ESIGN-TH-PO-2026-05029-2-2' }, { batchNo: 'SH202605-133', quantity: 22500, shippedAt: '2026--05-17', supTrackingNo: 'SF114847393047', platformTrackingNo: 'SF257721695267', signedAt: '2026--05-20', signedDocNo: 'ESIGN-TH-PO-2026-05029-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-05029', subOrderNo: 'TH-PO-2026-05029-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 82000, unitPrice: 0.80, amount: 65600, batches: [{ batchNo: 'SH202605-134', quantity: 20500, shippedAt: '2026--05-03', supTrackingNo: 'SF961009905968', platformTrackingNo: 'SF391925506721', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05029-3-1' }, { batchNo: 'SH202605-135', quantity: 20500, shippedAt: '2026--05-09', supTrackingNo: 'SF536766840508', platformTrackingNo: 'SF188690373106', signedAt: '2026--05-14', signedDocNo: 'ESIGN-TH-PO-2026-05029-3-2' }, { batchNo: 'SH202605-136', quantity: 20500, shippedAt: '2026--05-15', supTrackingNo: 'SF687806398846', platformTrackingNo: 'SF788554816658', signedAt: '2026--05-20', signedDocNo: 'ESIGN-TH-PO-2026-05029-3-3' }, { batchNo: 'SH202605-137', quantity: 20500, shippedAt: '2026--05-24', supTrackingNo: 'SF357991902637', platformTrackingNo: 'SF854330092722', signedAt: '2026-05-06', signedDocNo: 'ESIGN-SH202605-114' }] },
    ],
  },
  {
    key: '2', billingNo: 'BILL-2026-05-002', period: '2026-05-01 ~ 2026-05-31',
    totalAmount: 621000, status: '已确认', invoiceUploaded: true,
    paymentDueDate: '2026-07-15', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-05030', subOrderNo: 'TH-PO-2026-05030-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 85000, unitPrice: 0.98, amount: 83300, batches: [{ batchNo: 'SH202605-138', quantity: 21250, shippedAt: '2026--05-03', supTrackingNo: 'SF860923742690', platformTrackingNo: 'SF147368967775', signedAt: '2026--05-07', signedDocNo: 'ESIGN-TH-PO-2026-05030-1-1' }, { batchNo: 'SH202605-139', quantity: 21250, shippedAt: '2026--05-09', supTrackingNo: 'SF492102028955', platformTrackingNo: 'SF574056332778', signedAt: '2026--05-12', signedDocNo: 'ESIGN-TH-PO-2026-05030-1-2' }, { batchNo: 'SH202605-140', quantity: 21250, shippedAt: '2026--05-13', supTrackingNo: 'SF553252908058', platformTrackingNo: 'SF849754952027', signedAt: '2026--05-16', signedDocNo: 'ESIGN-TH-PO-2026-05030-1-3' }, { batchNo: 'SH202605-141', quantity: 21250, shippedAt: '2026--05-18', supTrackingNo: 'SF780247848027', platformTrackingNo: 'SF364927045739', signedAt: '2026-05-07', signedDocNo: 'ESIGN-SH202605-138' }] },
      { parentOrderNo: 'TH-PO-2026-05030', subOrderNo: 'TH-PO-2026-05030-2', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 93000, unitPrice: 1.35, amount: 125550, batches: [{ batchNo: 'SH202605-142', quantity: 23240, shippedAt: '2026--05-03', supTrackingNo: 'SF802060293051', platformTrackingNo: 'SF603601998005', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05030-2-1' }, { batchNo: 'SH202605-143', quantity: 23240, shippedAt: '2026--05-09', supTrackingNo: 'SF614556980960', platformTrackingNo: 'SF417403277612', signedAt: '2026--05-14', signedDocNo: 'ESIGN-TH-PO-2026-05030-2-2' }, { batchNo: 'SH202605-144', quantity: 23240, shippedAt: '2026--05-13', supTrackingNo: 'SF428941115748', platformTrackingNo: 'SF857736637113', signedAt: '2026--05-16', signedDocNo: 'ESIGN-TH-PO-2026-05030-2-3' }, { batchNo: 'SH202605-145', quantity: 23280, shippedAt: '2026--05-21', supTrackingNo: 'SF218039479813', platformTrackingNo: 'SF517630618448', signedAt: '2026--05-25', signedDocNo: 'ESIGN-TH-PO-2026-05030-2-4' }] },
      { parentOrderNo: 'TH-PO-2026-05030', subOrderNo: 'TH-PO-2026-05030-3', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 103000, unitPrice: 0.85, amount: 87550, batches: [{ batchNo: 'SH202605-146', quantity: 66960, shippedAt: '2026--05-03', supTrackingNo: 'SF122742842928', platformTrackingNo: 'SF536618772435', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05030-3-1' }, { batchNo: 'SH202605-147', quantity: 36040, shippedAt: '2026--05-09', supTrackingNo: 'SF957643978300', platformTrackingNo: 'SF918648282301', signedAt: '2026--05-12', signedDocNo: 'ESIGN-TH-PO-2026-05030-3-2' }] },
      { parentOrderNo: 'TH-PO-2026-05031', subOrderNo: 'TH-PO-2026-05031-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 107000, unitPrice: 1.50, amount: 160500, batches: [{ batchNo: 'SH202605-148', quantity: 42800, shippedAt: '2026--05-03', supTrackingNo: 'SF779421443451', platformTrackingNo: 'SF844105776108', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05031-1-1' }, { batchNo: 'SH202605-149', quantity: 37450, shippedAt: '2026--05-08', supTrackingNo: 'SF811364515897', platformTrackingNo: 'SF439471735070', signedAt: '2026--05-13', signedDocNo: 'ESIGN-TH-PO-2026-05031-1-2' }, { batchNo: 'SH202605-150', quantity: 26750, shippedAt: '2026--05-17', supTrackingNo: 'SF244879382019', platformTrackingNo: 'SF457749775324', signedAt: '2026--05-20', signedDocNo: 'ESIGN-TH-PO-2026-05031-1-3' }] },
      { parentOrderNo: 'TH-PO-2026-05031', subOrderNo: 'TH-PO-2026-05031-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 83000, unitPrice: 1.10, amount: 91300, batches: [{ batchNo: 'SH202605-151', quantity: 83000, shippedAt: '2026--05-03', supTrackingNo: 'SF681391931090', platformTrackingNo: 'SF379879587162', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05031-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-05031', subOrderNo: 'TH-PO-2026-05031-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 91000, unitPrice: 0.80, amount: 72800, batches: [{ batchNo: 'SH202605-152', quantity: 22750, shippedAt: '2026--05-03', supTrackingNo: 'SF473105513936', platformTrackingNo: 'SF228008204060', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05031-3-1' }, { batchNo: 'SH202605-153', quantity: 22750, shippedAt: '2026--05-10', supTrackingNo: 'SF929533234908', platformTrackingNo: 'SF348964222686', signedAt: '2026--05-13', signedDocNo: 'ESIGN-TH-PO-2026-05031-3-2' }, { batchNo: 'SH202605-154', quantity: 22750, shippedAt: '2026--05-17', supTrackingNo: 'SF200355239707', platformTrackingNo: 'SF537187650084', signedAt: '2026--05-22', signedDocNo: 'ESIGN-TH-PO-2026-05031-3-3' }, { batchNo: 'SH202605-155', quantity: 22750, shippedAt: '2026--05-15', supTrackingNo: 'SF505680216951', platformTrackingNo: 'SF923228529421', signedAt: '2026--05-19', signedDocNo: 'ESIGN-TH-PO-2026-05031-3-4' }] },
    ],
  },
  {
    key: '3', billingNo: 'BILL-2026-05-003', period: '2026-05-01 ~ 2026-05-31',
    totalAmount: 406200, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-06-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-05032', subOrderNo: 'TH-PO-2026-05032-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 77000, unitPrice: 1.10, amount: 84700, batches: [{ batchNo: 'SH202605-156', quantity: 77000, shippedAt: '2026--05-03', supTrackingNo: 'SF458893511908', platformTrackingNo: 'SF773945892375', signedAt: '2026-05-09', signedDocNo: 'ESIGN-SH202605-156' }] },
      { parentOrderNo: 'TH-PO-2026-05032', subOrderNo: 'TH-PO-2026-05032-2', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 58000, unitPrice: 0.55, amount: 31900, batches: [{ batchNo: 'SH202605-157', quantity: 37700, shippedAt: '2026--05-03', supTrackingNo: 'SF814262468039', platformTrackingNo: 'SF226307668955', signedAt: '2026--05-08', signedDocNo: 'ESIGN-TH-PO-2026-05032-2-1' }, { batchNo: 'SH202605-158', quantity: 20300, shippedAt: '2026--05-08', supTrackingNo: 'SF226669858209', platformTrackingNo: 'SF358115474225', signedAt: '2026--05-11', signedDocNo: 'ESIGN-TH-PO-2026-05032-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-05032', subOrderNo: 'TH-PO-2026-05032-3', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 98000, unitPrice: 1.35, amount: 132300, batches: [{ batchNo: 'SH202605-159', quantity: 98000, shippedAt: '2026--05-03', supTrackingNo: 'SF867695941207', platformTrackingNo: 'SF696768414616', signedAt: '2026--05-07', signedDocNo: 'ESIGN-TH-PO-2026-05032-3-1' }] },
      { parentOrderNo: 'TH-PO-2026-05033', subOrderNo: 'TH-PO-2026-05033-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 42000, unitPrice: 1.20, amount: 50400, batches: [{ batchNo: 'SH202605-160', quantity: 16800, shippedAt: '2026--05-03', supTrackingNo: 'SF856054759475', platformTrackingNo: 'SF337814615356', signedAt: '2026--05-07', signedDocNo: 'ESIGN-TH-PO-2026-05033-1-1' }, { batchNo: 'SH202605-161', quantity: 14700, shippedAt: '2026--05-10', supTrackingNo: 'SF361780641120', platformTrackingNo: 'SF498811121833', signedAt: '2026--05-14', signedDocNo: 'ESIGN-TH-PO-2026-05033-1-2' }, { batchNo: 'SH202605-162', quantity: 10500, shippedAt: '2026--05-11', supTrackingNo: 'SF493611533984', platformTrackingNo: 'SF534051757557', signedAt: '2026-05-09', signedDocNo: 'ESIGN-SH202605-156' }] },
      { parentOrderNo: 'TH-PO-2026-05033', subOrderNo: 'TH-PO-2026-05033-2', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 65000, unitPrice: 0.98, amount: 63700, batches: [{ batchNo: 'SH202605-163', quantity: 65000, shippedAt: '2026--05-03', supTrackingNo: 'SF805285624090', platformTrackingNo: 'SF755581630158', signedAt: '2026-05-09', signedDocNo: 'ESIGN-SH202605-156' }] },
      { parentOrderNo: 'TH-PO-2026-05033', subOrderNo: 'TH-PO-2026-05033-3', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 32000, unitPrice: 1.35, amount: 43200, batches: [{ batchNo: 'SH202605-164', quantity: 32000, shippedAt: '2026--05-03', supTrackingNo: 'SF721855335832', platformTrackingNo: 'SF173895795270', signedAt: '2026--05-06', signedDocNo: 'ESIGN-TH-PO-2026-05033-3-1' }] },
    ],
  },
  {
    key: '4', billingNo: 'BILL-2026-04-004', period: '2026-04-01 ~ 2026-04-30',
    totalAmount: 640970, status: '已确认', invoiceUploaded: true,
    paymentDueDate: '2026-07-15', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-04034', subOrderNo: 'TH-PO-2026-04034-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 59000, unitPrice: 1.25, amount: 73750, batches: [{ batchNo: 'SH202604-165', quantity: 38352, shippedAt: '2026--04-03', supTrackingNo: 'SF400659889315', platformTrackingNo: 'SF693263798805', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04034-1-1' }, { batchNo: 'SH202604-166', quantity: 20648, shippedAt: '2026--04-09', supTrackingNo: 'SF129491169126', platformTrackingNo: 'SF113450992449', signedAt: '2026-04-09', signedDocNo: 'ESIGN-SH202604-165' }] },
      { parentOrderNo: 'TH-PO-2026-04034', subOrderNo: 'TH-PO-2026-04034-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 75000, unitPrice: 0.90, amount: 67500, batches: [{ batchNo: 'SH202604-167', quantity: 30000, shippedAt: '2026--04-03', supTrackingNo: 'SF118570457049', platformTrackingNo: 'SF388511190574', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04034-2-1' }, { batchNo: 'SH202604-168', quantity: 26250, shippedAt: '2026--04-07', supTrackingNo: 'SF562747155483', platformTrackingNo: 'SF226813571724', signedAt: '2026--04-10', signedDocNo: 'ESIGN-TH-PO-2026-04034-2-2' }, { batchNo: 'SH202604-169', quantity: 18750, shippedAt: '2026--04-11', supTrackingNo: 'SF664195661328', platformTrackingNo: 'SF218513893124', signedAt: '2026--04-15', signedDocNo: 'ESIGN-TH-PO-2026-04034-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-04035', subOrderNo: 'TH-PO-2026-04035-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 35000, unitPrice: 1.25, amount: 43750, batches: [{ batchNo: 'SH202604-170', quantity: 14000, shippedAt: '2026--04-03', supTrackingNo: 'SF164558300421', platformTrackingNo: 'SF628274907582', signedAt: '2026--04-07', signedDocNo: 'ESIGN-TH-PO-2026-04035-1-1' }, { batchNo: 'SH202604-171', quantity: 12248, shippedAt: '2026--04-10', supTrackingNo: 'SF218910883301', platformTrackingNo: 'SF883789736548', signedAt: '2026--04-14', signedDocNo: 'ESIGN-TH-PO-2026-04035-1-2' }, { batchNo: 'SH202604-172', quantity: 8752, shippedAt: '2026--04-17', supTrackingNo: 'SF767103390612', platformTrackingNo: 'SF169356565695', signedAt: '2026--04-20', signedDocNo: 'ESIGN-TH-PO-2026-04035-1-3' }] },
      { parentOrderNo: 'TH-PO-2026-04035', subOrderNo: 'TH-PO-2026-04035-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 46000, unitPrice: 0.90, amount: 41400, batches: [{ batchNo: 'SH202604-173', quantity: 46000, shippedAt: '2026--04-03', supTrackingNo: 'SF424401271462', platformTrackingNo: 'SF655999474067', signedAt: '2026--04-07', signedDocNo: 'ESIGN-TH-PO-2026-04035-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-04035', subOrderNo: 'TH-PO-2026-04035-3', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 107000, unitPrice: 0.72, amount: 77040, batches: [{ batchNo: 'SH202604-174', quantity: 69550, shippedAt: '2026--04-03', supTrackingNo: 'SF708893058523', platformTrackingNo: 'SF573369919587', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04035-3-1' }, { batchNo: 'SH202604-175', quantity: 37450, shippedAt: '2026--04-10', supTrackingNo: 'SF601769944847', platformTrackingNo: 'SF556979066473', signedAt: '2026--04-13', signedDocNo: 'ESIGN-TH-PO-2026-04035-3-2' }] },
      { parentOrderNo: 'TH-PO-2026-04036', subOrderNo: 'TH-PO-2026-04036-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 70000, unitPrice: 0.72, amount: 50400, batches: [{ batchNo: 'SH202604-176', quantity: 28000, shippedAt: '2026--04-03', supTrackingNo: 'SF175051409106', platformTrackingNo: 'SF199150884956', signedAt: '2026--04-06', signedDocNo: 'ESIGN-TH-PO-2026-04036-1-1' }, { batchNo: 'SH202604-177', quantity: 24500, shippedAt: '2026--04-10', supTrackingNo: 'SF914946804206', platformTrackingNo: 'SF990658736334', signedAt: '2026--04-13', signedDocNo: 'ESIGN-TH-PO-2026-04036-1-2' }, { batchNo: 'SH202604-178', quantity: 17500, shippedAt: '2026--04-13', supTrackingNo: 'SF718288994789', platformTrackingNo: 'SF463189664618', signedAt: '2026-04-09', signedDocNo: 'ESIGN-SH202604-165' }] },
      { parentOrderNo: 'TH-PO-2026-04036', subOrderNo: 'TH-PO-2026-04036-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 115000, unitPrice: 0.88, amount: 101200, batches: [{ batchNo: 'SH202604-179', quantity: 115000, shippedAt: '2026--04-03', supTrackingNo: 'SF894207501080', platformTrackingNo: 'SF758365355182', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04036-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-04037', subOrderNo: 'TH-PO-2026-04037-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 94000, unitPrice: 0.72, amount: 67680, batches: [{ batchNo: 'SH202604-180', quantity: 94000, shippedAt: '2026--04-03', supTrackingNo: 'SF506116067841', platformTrackingNo: 'SF938012051386', signedAt: '2026--04-06', signedDocNo: 'ESIGN-TH-PO-2026-04037-1-1' }] },
      { parentOrderNo: 'TH-PO-2026-04037', subOrderNo: 'TH-PO-2026-04037-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 65000, unitPrice: 0.80, amount: 52000, batches: [{ batchNo: 'SH202604-181', quantity: 42250, shippedAt: '2026--04-03', supTrackingNo: 'SF945999235805', platformTrackingNo: 'SF786414916665', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04037-2-1' }, { batchNo: 'SH202604-182', quantity: 22750, shippedAt: '2026--04-07', supTrackingNo: 'SF863771718361', platformTrackingNo: 'SF131213450306', signedAt: '2026--04-12', signedDocNo: 'ESIGN-TH-PO-2026-04037-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-04037', subOrderNo: 'TH-PO-2026-04037-3', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 53000, unitPrice: 1.25, amount: 66250, batches: [{ batchNo: 'SH202604-183', quantity: 53000, shippedAt: '2026--04-03', supTrackingNo: 'SF719090551088', platformTrackingNo: 'SF540909937895', signedAt: '2026-04-09', signedDocNo: 'ESIGN-SH202604-165' }] },
    ],
  },
  {
    key: '5', billingNo: 'BILL-2026-04-005', period: '2026-04-01 ~ 2026-04-30',
    totalAmount: 329020, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-06-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-04038', subOrderNo: 'TH-PO-2026-04038-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 41000, unitPrice: 0.90, amount: 36900, batches: [{ batchNo: 'SH202604-184', quantity: 16400, shippedAt: '2026--04-03', supTrackingNo: 'SF600019373152', platformTrackingNo: 'SF273262828950', signedAt: '2026--04-07', signedDocNo: 'ESIGN-TH-PO-2026-04038-1-1' }, { batchNo: 'SH202604-185', quantity: 14350, shippedAt: '2026--04-09', supTrackingNo: 'SF459581516648', platformTrackingNo: 'SF755272824750', signedAt: '2026--04-13', signedDocNo: 'ESIGN-TH-PO-2026-04038-1-2' }, { batchNo: 'SH202604-186', quantity: 10250, shippedAt: '2026--04-11', supTrackingNo: 'SF781845110195', platformTrackingNo: 'SF838948103171', signedAt: '2026-04-06', signedDocNo: 'ESIGN-SH202604-184' }] },
      { parentOrderNo: 'TH-PO-2026-04038', subOrderNo: 'TH-PO-2026-04038-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 40000, unitPrice: 0.80, amount: 32000, batches: [{ batchNo: 'SH202604-187', quantity: 40000, shippedAt: '2026--04-03', supTrackingNo: 'SF398131649043', platformTrackingNo: 'SF929854549786', signedAt: '2026--04-07', signedDocNo: 'ESIGN-TH-PO-2026-04038-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-04039', subOrderNo: 'TH-PO-2026-04039-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 44000, unitPrice: 0.72, amount: 31680, batches: [{ batchNo: 'SH202604-188', quantity: 44000, shippedAt: '2026--04-03', supTrackingNo: 'SF340713234664', platformTrackingNo: 'SF162703623248', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04039-1-1' }] },
      { parentOrderNo: 'TH-PO-2026-04039', subOrderNo: 'TH-PO-2026-04039-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 30000, unitPrice: 0.88, amount: 26400, batches: [{ batchNo: 'SH202604-189', quantity: 30000, shippedAt: '2026--04-03', supTrackingNo: 'SF457725451521', platformTrackingNo: 'SF104810296150', signedAt: '2026--04-06', signedDocNo: 'ESIGN-TH-PO-2026-04039-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-04040', subOrderNo: 'TH-PO-2026-04040-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 78000, unitPrice: 0.88, amount: 68640, batches: [{ batchNo: 'SH202604-190', quantity: 50700, shippedAt: '2026--04-03', supTrackingNo: 'SF987632508031', platformTrackingNo: 'SF178830547759', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04040-1-1' }, { batchNo: 'SH202604-191', quantity: 27300, shippedAt: '2026--04-10', supTrackingNo: 'SF602591667934', platformTrackingNo: 'SF185560741164', signedAt: '2026-04-06', signedDocNo: 'ESIGN-SH202604-184' }] },
      { parentOrderNo: 'TH-PO-2026-04040', subOrderNo: 'TH-PO-2026-04040-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 70000, unitPrice: 0.90, amount: 63000, batches: [{ batchNo: 'SH202604-192', quantity: 45500, shippedAt: '2026--04-03', supTrackingNo: 'SF558015920905', platformTrackingNo: 'SF225797509938', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04040-2-1' }, { batchNo: 'SH202604-193', quantity: 24500, shippedAt: '2026--04-10', supTrackingNo: 'SF981206485371', platformTrackingNo: 'SF782674805232', signedAt: '2026--04-13', signedDocNo: 'ESIGN-TH-PO-2026-04040-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-04040', subOrderNo: 'TH-PO-2026-04040-3', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 88000, unitPrice: 0.80, amount: 70400, batches: [{ batchNo: 'SH202604-194', quantity: 35200, shippedAt: '2026--04-03', supTrackingNo: 'SF366742651064', platformTrackingNo: 'SF746116310824', signedAt: '2026--04-06', signedDocNo: 'ESIGN-TH-PO-2026-04040-3-1' }, { batchNo: 'SH202604-195', quantity: 30800, shippedAt: '2026--04-10', supTrackingNo: 'SF534129483583', platformTrackingNo: 'SF443041290279', signedAt: '2026--04-15', signedDocNo: 'ESIGN-TH-PO-2026-04040-3-2' }, { batchNo: 'SH202604-196', quantity: 22000, shippedAt: '2026--04-15', supTrackingNo: 'SF182326503133', platformTrackingNo: 'SF797977210972', signedAt: '2026-04-06', signedDocNo: 'ESIGN-SH202604-184' }] },
    ],
  },
  {
    key: '6', billingNo: 'BILL-2026-04-006', period: '2026-04-01 ~ 2026-04-30',
    totalAmount: 437900, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-06-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-04041', subOrderNo: 'TH-PO-2026-04041-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 74000, unitPrice: 1.25, amount: 92500, batches: [{ batchNo: 'SH202604-197', quantity: 48100, shippedAt: '2026--04-03', supTrackingNo: 'SF259355332042', platformTrackingNo: 'SF315847739947', signedAt: '2026--04-06', signedDocNo: 'ESIGN-TH-PO-2026-04041-1-1' }, { batchNo: 'SH202604-198', quantity: 25900, shippedAt: '2026--04-08', supTrackingNo: 'SF820520073075', platformTrackingNo: 'SF293597168175', signedAt: '2026-04-06', signedDocNo: 'ESIGN-SH202604-197' }] },
      { parentOrderNo: 'TH-PO-2026-04041', subOrderNo: 'TH-PO-2026-04041-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 110000, unitPrice: 0.90, amount: 99000, batches: [{ batchNo: 'SH202604-199', quantity: 71500, shippedAt: '2026--04-03', supTrackingNo: 'SF806799110299', platformTrackingNo: 'SF454869618887', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04041-2-1' }, { batchNo: 'SH202604-200', quantity: 38500, shippedAt: '2026--04-09', supTrackingNo: 'SF587345305175', platformTrackingNo: 'SF433424260229', signedAt: '2026--04-12', signedDocNo: 'ESIGN-TH-PO-2026-04041-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-04042', subOrderNo: 'TH-PO-2026-04042-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 94000, unitPrice: 1.25, amount: 117500, batches: [{ batchNo: 'SH202604-201', quantity: 94000, shippedAt: '2026--04-03', supTrackingNo: 'SF182837365101', platformTrackingNo: 'SF774697686009', signedAt: '2026-04-06', signedDocNo: 'ESIGN-SH202604-197' }] },
      { parentOrderNo: 'TH-PO-2026-04042', subOrderNo: 'TH-PO-2026-04042-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 106000, unitPrice: 0.80, amount: 84800, batches: [{ batchNo: 'SH202604-202', quantity: 68900, shippedAt: '2026--04-03', supTrackingNo: 'SF915149650491', platformTrackingNo: 'SF146797434390', signedAt: '2026--04-08', signedDocNo: 'ESIGN-TH-PO-2026-04042-2-1' }, { batchNo: 'SH202604-203', quantity: 37100, shippedAt: '2026--04-10', supTrackingNo: 'SF762805910527', platformTrackingNo: 'SF651798624996', signedAt: '2026--04-15', signedDocNo: 'ESIGN-TH-PO-2026-04042-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-04042', subOrderNo: 'TH-PO-2026-04042-3', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 49000, unitPrice: 0.90, amount: 44100, batches: [{ batchNo: 'SH202604-204', quantity: 12250, shippedAt: '2026--04-03', supTrackingNo: 'SF477258662365', platformTrackingNo: 'SF885903361820', signedAt: '2026--04-06', signedDocNo: 'ESIGN-TH-PO-2026-04042-3-1' }, { batchNo: 'SH202604-205', quantity: 12250, shippedAt: '2026--04-07', supTrackingNo: 'SF291753655750', platformTrackingNo: 'SF370751053808', signedAt: '2026--04-12', signedDocNo: 'ESIGN-TH-PO-2026-04042-3-2' }, { batchNo: 'SH202604-206', quantity: 12250, shippedAt: '2026--04-17', supTrackingNo: 'SF673481507677', platformTrackingNo: 'SF274417786135', signedAt: '2026--04-21', signedDocNo: 'ESIGN-TH-PO-2026-04042-3-3' }, { batchNo: 'SH202604-207', quantity: 12250, shippedAt: '2026--04-21', supTrackingNo: 'SF548340540254', platformTrackingNo: 'SF472693488384', signedAt: '2026--04-25', signedDocNo: 'ESIGN-TH-PO-2026-04042-3-4' }] },
    ],
  },
  {
    key: '7', billingNo: 'BILL-2026-03-007', period: '2026-03-01 ~ 2026-03-31',
    totalAmount: 471250, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-05-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-03043', subOrderNo: 'TH-PO-2026-03043-1', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 72000, unitPrice: 1.35, amount: 97200, batches: [{ batchNo: 'SH202603-208', quantity: 72000, shippedAt: '2026--03-03', supTrackingNo: 'SF825211954966', platformTrackingNo: 'SF465718068686', signedAt: '2026-03-06', signedDocNo: 'ESIGN-SH202603-208' }] },
      { parentOrderNo: 'TH-PO-2026-03043', subOrderNo: 'TH-PO-2026-03043-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 40000, unitPrice: 0.85, amount: 34000, batches: [{ batchNo: 'SH202603-209', quantity: 26000, shippedAt: '2026--03-03', supTrackingNo: 'SF867321912243', platformTrackingNo: 'SF532340578456', signedAt: '2026--03-07', signedDocNo: 'ESIGN-TH-PO-2026-03043-2-1' }, { batchNo: 'SH202603-210', quantity: 14000, shippedAt: '2026--03-08', supTrackingNo: 'SF439666281776', platformTrackingNo: 'SF514717412425', signedAt: '2026--03-13', signedDocNo: 'ESIGN-TH-PO-2026-03043-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-03044', subOrderNo: 'TH-PO-2026-03044-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 117000, unitPrice: 1.20, amount: 140400, batches: [{ batchNo: 'SH202603-211', quantity: 29250, shippedAt: '2026--03-03', supTrackingNo: 'SF566736054731', platformTrackingNo: 'SF497320932658', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03044-1-1' }, { batchNo: 'SH202603-212', quantity: 29250, shippedAt: '2026--03-07', supTrackingNo: 'SF298895065308', platformTrackingNo: 'SF336013475085', signedAt: '2026--03-11', signedDocNo: 'ESIGN-TH-PO-2026-03044-1-2' }, { batchNo: 'SH202603-213', quantity: 29250, shippedAt: '2026--03-15', supTrackingNo: 'SF345637792072', platformTrackingNo: 'SF254618722248', signedAt: '2026--03-19', signedDocNo: 'ESIGN-TH-PO-2026-03044-1-3' }, { batchNo: 'SH202603-214', quantity: 29250, shippedAt: '2026--03-18', supTrackingNo: 'SF210759132777', platformTrackingNo: 'SF948289068027', signedAt: '2026-03-06', signedDocNo: 'ESIGN-SH202603-208' }] },
      { parentOrderNo: 'TH-PO-2026-03044', subOrderNo: 'TH-PO-2026-03044-2', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 99000, unitPrice: 1.35, amount: 133650, batches: [{ batchNo: 'SH202603-215', quantity: 39600, shippedAt: '2026--03-03', supTrackingNo: 'SF781896098873', platformTrackingNo: 'SF753397880348', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03044-2-1' }, { batchNo: 'SH202603-216', quantity: 34640, shippedAt: '2026--03-10', supTrackingNo: 'SF298265342080', platformTrackingNo: 'SF863779811221', signedAt: '2026--03-13', signedDocNo: 'ESIGN-TH-PO-2026-03044-2-2' }, { batchNo: 'SH202603-217', quantity: 24760, shippedAt: '2026--03-13', supTrackingNo: 'SF501196582838', platformTrackingNo: 'SF893178939077', signedAt: '2026--03-18', signedDocNo: 'ESIGN-TH-PO-2026-03044-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-03044', subOrderNo: 'TH-PO-2026-03044-3', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 60000, unitPrice: 1.10, amount: 66000, batches: [{ batchNo: 'SH202603-218', quantity: 15000, shippedAt: '2026--03-03', supTrackingNo: 'SF592992668649', platformTrackingNo: 'SF685120587252', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03044-3-1' }, { batchNo: 'SH202603-219', quantity: 15000, shippedAt: '2026--03-08', supTrackingNo: 'SF993205436233', platformTrackingNo: 'SF618764920062', signedAt: '2026--03-12', signedDocNo: 'ESIGN-TH-PO-2026-03044-3-2' }, { batchNo: 'SH202603-220', quantity: 15000, shippedAt: '2026--03-13', supTrackingNo: 'SF608698492376', platformTrackingNo: 'SF412542358733', signedAt: '2026--03-17', signedDocNo: 'ESIGN-TH-PO-2026-03044-3-3' }, { batchNo: 'SH202603-221', quantity: 15000, shippedAt: '2026--03-24', supTrackingNo: 'SF280243749279', platformTrackingNo: 'SF322551853248', signedAt: '2026-03-06', signedDocNo: 'ESIGN-SH202603-208' }] },
    ],
  },
  {
    key: '8', billingNo: 'BILL-2026-03-008', period: '2026-03-01 ~ 2026-03-31',
    totalAmount: 365800, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-05-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-03045', subOrderNo: 'TH-PO-2026-03045-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 112000, unitPrice: 1.50, amount: 168000, batches: [{ batchNo: 'SH202603-222', quantity: 72800, shippedAt: '2026--03-03', supTrackingNo: 'SF215681909956', platformTrackingNo: 'SF409773132256', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03045-1-1' }, { batchNo: 'SH202603-223', quantity: 39200, shippedAt: '2026--03-07', supTrackingNo: 'SF666528976346', platformTrackingNo: 'SF200663178163', signedAt: '2026-03-08', signedDocNo: 'ESIGN-SH202603-222' }] },
      { parentOrderNo: 'TH-PO-2026-03045', subOrderNo: 'TH-PO-2026-03045-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 58000, unitPrice: 0.85, amount: 49300, batches: [{ batchNo: 'SH202603-224', quantity: 23200, shippedAt: '2026--03-03', supTrackingNo: 'SF157616543512', platformTrackingNo: 'SF651458570697', signedAt: '2026--03-06', signedDocNo: 'ESIGN-TH-PO-2026-03045-2-1' }, { batchNo: 'SH202603-225', quantity: 20300, shippedAt: '2026--03-09', supTrackingNo: 'SF508372385804', platformTrackingNo: 'SF131029157713', signedAt: '2026--03-12', signedDocNo: 'ESIGN-TH-PO-2026-03045-2-2' }, { batchNo: 'SH202603-226', quantity: 14500, shippedAt: '2026--03-15', supTrackingNo: 'SF467863780045', platformTrackingNo: 'SF262312743925', signedAt: '2026--03-18', signedDocNo: 'ESIGN-TH-PO-2026-03045-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-03046', subOrderNo: 'TH-PO-2026-03046-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 90000, unitPrice: 0.85, amount: 76500, batches: [{ batchNo: 'SH202603-227', quantity: 36000, shippedAt: '2026--03-03', supTrackingNo: 'SF591641084415', platformTrackingNo: 'SF106937867936', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03046-1-1' }, { batchNo: 'SH202603-228', quantity: 31500, shippedAt: '2026--03-07', supTrackingNo: 'SF337322386179', platformTrackingNo: 'SF266794896461', signedAt: '2026--03-10', signedDocNo: 'ESIGN-TH-PO-2026-03046-1-2' }, { batchNo: 'SH202603-229', quantity: 22500, shippedAt: '2026--03-17', supTrackingNo: 'SF431733138815', platformTrackingNo: 'SF152062942213', signedAt: '2026--03-20', signedDocNo: 'ESIGN-TH-PO-2026-03046-1-3' }] },
      { parentOrderNo: 'TH-PO-2026-03046', subOrderNo: 'TH-PO-2026-03046-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 60000, unitPrice: 1.20, amount: 72000, batches: [{ batchNo: 'SH202603-230', quantity: 39000, shippedAt: '2026--03-03', supTrackingNo: 'SF649348422854', platformTrackingNo: 'SF690973494218', signedAt: '2026--03-06', signedDocNo: 'ESIGN-TH-PO-2026-03046-2-1' }, { batchNo: 'SH202603-231', quantity: 21000, shippedAt: '2026--03-07', supTrackingNo: 'SF887018131529', platformTrackingNo: 'SF418444237753', signedAt: '2026--03-12', signedDocNo: 'ESIGN-TH-PO-2026-03046-2-2' }] },
    ],
  },
  {
    key: '9', billingNo: 'BILL-2026-03-009', period: '2026-03-01 ~ 2026-03-31',
    totalAmount: 557950, status: '超期未付', invoiceUploaded: true,
    paymentDueDate: '2026-05-01', overdue: true,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-03047', subOrderNo: 'TH-PO-2026-03047-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 60000, unitPrice: 0.85, amount: 51000, batches: [{ batchNo: 'SH202603-232', quantity: 39000, shippedAt: '2026--03-03', supTrackingNo: 'SF193064274382', platformTrackingNo: 'SF174563225376', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03047-1-1' }, { batchNo: 'SH202603-233', quantity: 21000, shippedAt: '2026--03-07', supTrackingNo: 'SF795971680889', platformTrackingNo: 'SF376481228502', signedAt: '2026--03-11', signedDocNo: 'ESIGN-TH-PO-2026-03047-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-03047', subOrderNo: 'TH-PO-2026-03047-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 32000, unitPrice: 1.50, amount: 48000, batches: [{ batchNo: 'SH202603-234', quantity: 20800, shippedAt: '2026--03-03', supTrackingNo: 'SF904194512296', platformTrackingNo: 'SF790017009256', signedAt: '2026--03-07', signedDocNo: 'ESIGN-TH-PO-2026-03047-2-1' }, { batchNo: 'SH202603-235', quantity: 11200, shippedAt: '2026--03-07', supTrackingNo: 'SF247457044614', platformTrackingNo: 'SF486737476962', signedAt: '2026--03-12', signedDocNo: 'ESIGN-TH-PO-2026-03047-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-03047', subOrderNo: 'TH-PO-2026-03047-3', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 99000, unitPrice: 1.20, amount: 118800, batches: [{ batchNo: 'SH202603-236', quantity: 64350, shippedAt: '2026--03-03', supTrackingNo: 'SF626972684219', platformTrackingNo: 'SF300281780432', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03047-3-1' }, { batchNo: 'SH202603-237', quantity: 34650, shippedAt: '2026--03-08', supTrackingNo: 'SF606563926910', platformTrackingNo: 'SF422281391379', signedAt: '2026--03-11', signedDocNo: 'ESIGN-TH-PO-2026-03047-3-2' }] },
      { parentOrderNo: 'TH-PO-2026-03048', subOrderNo: 'TH-PO-2026-03048-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 55000, unitPrice: 0.85, amount: 46750, batches: [{ batchNo: 'SH202603-238', quantity: 13760, shippedAt: '2026--03-03', supTrackingNo: 'SF536005252551', platformTrackingNo: 'SF997601447225', signedAt: '2026--03-07', signedDocNo: 'ESIGN-TH-PO-2026-03048-1-1' }, { batchNo: 'SH202603-239', quantity: 13760, shippedAt: '2026--03-10', supTrackingNo: 'SF924791005825', platformTrackingNo: 'SF308936846719', signedAt: '2026--03-14', signedDocNo: 'ESIGN-TH-PO-2026-03048-1-2' }, { batchNo: 'SH202603-240', quantity: 13760, shippedAt: '2026--03-15', supTrackingNo: 'SF958401348691', platformTrackingNo: 'SF463593597644', signedAt: '2026--03-19', signedDocNo: 'ESIGN-TH-PO-2026-03048-1-3' }, { batchNo: 'SH202603-241', quantity: 13720, shippedAt: '2026--03-21', supTrackingNo: 'SF917761866683', platformTrackingNo: 'SF525014839815', signedAt: '2026--03-24', signedDocNo: 'ESIGN-TH-PO-2026-03048-1-4' }] },
      { parentOrderNo: 'TH-PO-2026-03048', subOrderNo: 'TH-PO-2026-03048-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 73000, unitPrice: 1.10, amount: 80300, batches: [{ batchNo: 'SH202603-242', quantity: 18250, shippedAt: '2026--03-03', supTrackingNo: 'SF505863772515', platformTrackingNo: 'SF980143211604', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03048-2-1' }, { batchNo: 'SH202603-243', quantity: 18250, shippedAt: '2026--03-09', supTrackingNo: 'SF566979258469', platformTrackingNo: 'SF572785391458', signedAt: '2026--03-12', signedDocNo: 'ESIGN-TH-PO-2026-03048-2-2' }, { batchNo: 'SH202603-244', quantity: 18250, shippedAt: '2026--03-13', supTrackingNo: 'SF453449035452', platformTrackingNo: 'SF186340000596', signedAt: '2026--03-18', signedDocNo: 'ESIGN-TH-PO-2026-03048-2-3' }, { batchNo: 'SH202603-245', quantity: 18250, shippedAt: '2026--03-21', supTrackingNo: 'SF763340157198', platformTrackingNo: 'SF571233773989', signedAt: '2026-03-08', signedDocNo: 'ESIGN-SH202603-232' }] },
      { parentOrderNo: 'TH-PO-2026-03049', subOrderNo: 'TH-PO-2026-03049-1', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 87000, unitPrice: 0.55, amount: 47850, batches: [{ batchNo: 'SH202603-246', quantity: 87000, shippedAt: '2026--03-03', supTrackingNo: 'SF801258875542', platformTrackingNo: 'SF971792578891', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03049-1-1' }] },
      { parentOrderNo: 'TH-PO-2026-03049', subOrderNo: 'TH-PO-2026-03049-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 37000, unitPrice: 1.20, amount: 44400, batches: [{ batchNo: 'SH202603-247', quantity: 37000, shippedAt: '2026--03-03', supTrackingNo: 'SF846250129533', platformTrackingNo: 'SF254752570608', signedAt: '2026--03-07', signedDocNo: 'ESIGN-TH-PO-2026-03049-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-03050', subOrderNo: 'TH-PO-2026-03050-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 60000, unitPrice: 0.85, amount: 51000, batches: [{ batchNo: 'SH202603-248', quantity: 24000, shippedAt: '2026--03-03', supTrackingNo: 'SF136796035576', platformTrackingNo: 'SF270102587051', signedAt: '2026--03-07', signedDocNo: 'ESIGN-TH-PO-2026-03050-1-1' }, { batchNo: 'SH202603-249', quantity: 21000, shippedAt: '2026--03-10', supTrackingNo: 'SF586929089756', platformTrackingNo: 'SF184881801482', signedAt: '2026--03-14', signedDocNo: 'ESIGN-TH-PO-2026-03050-1-2' }, { batchNo: 'SH202603-250', quantity: 15000, shippedAt: '2026--03-13', supTrackingNo: 'SF814314846322', platformTrackingNo: 'SF371779903099', signedAt: '2026-03-08', signedDocNo: 'ESIGN-SH202603-232' }] },
      { parentOrderNo: 'TH-PO-2026-03050', subOrderNo: 'TH-PO-2026-03050-2', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 44000, unitPrice: 0.80, amount: 35200, batches: [{ batchNo: 'SH202603-251', quantity: 44000, shippedAt: '2026--03-03', supTrackingNo: 'SF718103958517', platformTrackingNo: 'SF388268588472', signedAt: '2026--03-07', signedDocNo: 'ESIGN-TH-PO-2026-03050-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-03050', subOrderNo: 'TH-PO-2026-03050-3', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 63000, unitPrice: 0.55, amount: 34650, batches: [{ batchNo: 'SH202603-252', quantity: 25200, shippedAt: '2026--03-03', supTrackingNo: 'SF861435754729', platformTrackingNo: 'SF321153020865', signedAt: '2026--03-08', signedDocNo: 'ESIGN-TH-PO-2026-03050-3-1' }, { batchNo: 'SH202603-253', quantity: 22040, shippedAt: '2026--03-07', supTrackingNo: 'SF180972272366', platformTrackingNo: 'SF290920069592', signedAt: '2026--03-10', signedDocNo: 'ESIGN-TH-PO-2026-03050-3-2' }, { batchNo: 'SH202603-254', quantity: 15760, shippedAt: '2026--03-17', supTrackingNo: 'SF452129656888', platformTrackingNo: 'SF480825472103', signedAt: '2026--03-20', signedDocNo: 'ESIGN-TH-PO-2026-03050-3-3' }] },
    ],
  },
  {
    key: '10', billingNo: 'BILL-2026-02-010', period: '2026-02-01 ~ 2026-02-28',
    totalAmount: 301000, status: '超期未付', invoiceUploaded: true,
    paymentDueDate: '2026-04-01', overdue: true,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-02051', subOrderNo: 'TH-PO-2026-02051-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 68000, unitPrice: 1.25, amount: 85000, batches: [{ batchNo: 'SH202602-255', quantity: 17000, shippedAt: '2026--02-03', supTrackingNo: 'SF346998225159', platformTrackingNo: 'SF968446597902', signedAt: '2026--02-07', signedDocNo: 'ESIGN-TH-PO-2026-02051-1-1' }, { batchNo: 'SH202602-256', quantity: 17000, shippedAt: '2026--02-08', supTrackingNo: 'SF644560505739', platformTrackingNo: 'SF495249880275', signedAt: '2026--02-11', signedDocNo: 'ESIGN-TH-PO-2026-02051-1-2' }, { batchNo: 'SH202602-257', quantity: 17000, shippedAt: '2026--02-15', supTrackingNo: 'SF244103226328', platformTrackingNo: 'SF169089769417', signedAt: '2026--02-19', signedDocNo: 'ESIGN-TH-PO-2026-02051-1-3' }, { batchNo: 'SH202602-258', quantity: 17000, shippedAt: '2026--02-21', supTrackingNo: 'SF627073531786', platformTrackingNo: 'SF553229411741', signedAt: '2026--02-25', signedDocNo: 'ESIGN-TH-PO-2026-02051-1-4' }] },
      { parentOrderNo: 'TH-PO-2026-02051', subOrderNo: 'TH-PO-2026-02051-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 82000, unitPrice: 0.72, amount: 59040, batches: [{ batchNo: 'SH202602-259', quantity: 32800, shippedAt: '2026--02-03', supTrackingNo: 'SF452068690122', platformTrackingNo: 'SF180068234568', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02051-2-1' }, { batchNo: 'SH202602-260', quantity: 28700, shippedAt: '2026--02-10', supTrackingNo: 'SF669856728937', platformTrackingNo: 'SF238918633188', signedAt: '2026--02-14', signedDocNo: 'ESIGN-TH-PO-2026-02051-2-2' }, { batchNo: 'SH202602-261', quantity: 20500, shippedAt: '2026--02-13', supTrackingNo: 'SF667468951032', platformTrackingNo: 'SF431369678216', signedAt: '2026--02-16', signedDocNo: 'ESIGN-TH-PO-2026-02051-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-02052', subOrderNo: 'TH-PO-2026-02052-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 120000, unitPrice: 0.90, amount: 108000, batches: [{ batchNo: 'SH202602-262', quantity: 120000, shippedAt: '2026--02-03', supTrackingNo: 'SF403013556602', platformTrackingNo: 'SF787732369667', signedAt: '2026-02-07', signedDocNo: 'ESIGN-SH202602-255' }] },
      { parentOrderNo: 'TH-PO-2026-02052', subOrderNo: 'TH-PO-2026-02052-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 68000, unitPrice: 0.72, amount: 48960, batches: [{ batchNo: 'SH202602-263', quantity: 44200, shippedAt: '2026--02-03', supTrackingNo: 'SF287436613779', platformTrackingNo: 'SF269997582302', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02052-2-1' }, { batchNo: 'SH202602-264', quantity: 23800, shippedAt: '2026--02-08', supTrackingNo: 'SF765299027914', platformTrackingNo: 'SF722443538576', signedAt: '2026--02-13', signedDocNo: 'ESIGN-TH-PO-2026-02052-2-2' }] },
    ],
  },
  {
    key: '11', billingNo: 'BILL-2026-02-011', period: '2026-02-01 ~ 2026-02-28',
    totalAmount: 718440, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-04-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-02053', subOrderNo: 'TH-PO-2026-02053-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 35000, unitPrice: 0.80, amount: 28000, batches: [{ batchNo: 'SH202602-265', quantity: 8750, shippedAt: '2026--02-03', supTrackingNo: 'SF942719005116', platformTrackingNo: 'SF557723843956', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02053-1-1' }, { batchNo: 'SH202602-266', quantity: 8750, shippedAt: '2026--02-07', supTrackingNo: 'SF791012979889', platformTrackingNo: 'SF420170817348', signedAt: '2026--02-11', signedDocNo: 'ESIGN-TH-PO-2026-02053-1-2' }, { batchNo: 'SH202602-267', quantity: 8750, shippedAt: '2026--02-15', supTrackingNo: 'SF985815005569', platformTrackingNo: 'SF855086815695', signedAt: '2026--02-19', signedDocNo: 'ESIGN-TH-PO-2026-02053-1-3' }, { batchNo: 'SH202602-268', quantity: 8750, shippedAt: '2026--02-24', supTrackingNo: 'SF167382082209', platformTrackingNo: 'SF581715287513', signedAt: '2026--02-28', signedDocNo: 'ESIGN-TH-PO-2026-02053-1-4' }] },
      { parentOrderNo: 'TH-PO-2026-02053', subOrderNo: 'TH-PO-2026-02053-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 83000, unitPrice: 1.25, amount: 103750, batches: [{ batchNo: 'SH202602-269', quantity: 53952, shippedAt: '2026--02-03', supTrackingNo: 'SF257224408651', platformTrackingNo: 'SF450977696076', signedAt: '2026--02-07', signedDocNo: 'ESIGN-TH-PO-2026-02053-2-1' }, { batchNo: 'SH202602-270', quantity: 29048, shippedAt: '2026--02-09', supTrackingNo: 'SF664232173806', platformTrackingNo: 'SF218376390592', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-265' }] },
      { parentOrderNo: 'TH-PO-2026-02054', subOrderNo: 'TH-PO-2026-02054-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 64000, unitPrice: 0.90, amount: 57600, batches: [{ batchNo: 'SH202602-271', quantity: 41600, shippedAt: '2026--02-03', supTrackingNo: 'SF418044927983', platformTrackingNo: 'SF524967192201', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02054-1-1' }, { batchNo: 'SH202602-272', quantity: 22400, shippedAt: '2026--02-10', supTrackingNo: 'SF275674087343', platformTrackingNo: 'SF459976146311', signedAt: '2026--02-13', signedDocNo: 'ESIGN-TH-PO-2026-02054-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-02054', subOrderNo: 'TH-PO-2026-02054-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 103000, unitPrice: 0.88, amount: 90640, batches: [{ batchNo: 'SH202602-273', quantity: 41200, shippedAt: '2026--02-03', supTrackingNo: 'SF613311834571', platformTrackingNo: 'SF646786017864', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02054-2-1' }, { batchNo: 'SH202602-274', quantity: 36050, shippedAt: '2026--02-07', supTrackingNo: 'SF533556473575', platformTrackingNo: 'SF604682041068', signedAt: '2026--02-10', signedDocNo: 'ESIGN-TH-PO-2026-02054-2-2' }, { batchNo: 'SH202602-275', quantity: 25750, shippedAt: '2026--02-13', supTrackingNo: 'SF151748592655', platformTrackingNo: 'SF642374295556', signedAt: '2026--02-16', signedDocNo: 'ESIGN-TH-PO-2026-02054-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-02054', subOrderNo: 'TH-PO-2026-02054-3', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 106000, unitPrice: 0.80, amount: 84800, batches: [{ batchNo: 'SH202602-276', quantity: 26500, shippedAt: '2026--02-03', supTrackingNo: 'SF110895003819', platformTrackingNo: 'SF219602694622', signedAt: '2026--02-07', signedDocNo: 'ESIGN-TH-PO-2026-02054-3-1' }, { batchNo: 'SH202602-277', quantity: 26500, shippedAt: '2026--02-10', supTrackingNo: 'SF391552927358', platformTrackingNo: 'SF502556581887', signedAt: '2026--02-13', signedDocNo: 'ESIGN-TH-PO-2026-02054-3-2' }, { batchNo: 'SH202602-278', quantity: 26500, shippedAt: '2026--02-17', supTrackingNo: 'SF538280978812', platformTrackingNo: 'SF722989978517', signedAt: '2026--02-21', signedDocNo: 'ESIGN-TH-PO-2026-02054-3-3' }, { batchNo: 'SH202602-279', quantity: 26500, shippedAt: '2026--02-18', supTrackingNo: 'SF521222611462', platformTrackingNo: 'SF596087000060', signedAt: '2026--02-22', signedDocNo: 'ESIGN-TH-PO-2026-02054-3-4' }] },
      { parentOrderNo: 'TH-PO-2026-02055', subOrderNo: 'TH-PO-2026-02055-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 42000, unitPrice: 1.25, amount: 52500, batches: [{ batchNo: 'SH202602-280', quantity: 27300, shippedAt: '2026--02-03', supTrackingNo: 'SF503464711934', platformTrackingNo: 'SF257861373383', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02055-1-1' }, { batchNo: 'SH202602-281', quantity: 14700, shippedAt: '2026--02-08', supTrackingNo: 'SF145097491216', platformTrackingNo: 'SF138849282100', signedAt: '2026--02-13', signedDocNo: 'ESIGN-TH-PO-2026-02055-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-02055', subOrderNo: 'TH-PO-2026-02055-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 47000, unitPrice: 0.80, amount: 37600, batches: [{ batchNo: 'SH202602-282', quantity: 18800, shippedAt: '2026--02-03', supTrackingNo: 'SF265171508177', platformTrackingNo: 'SF252537935638', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02055-2-1' }, { batchNo: 'SH202602-283', quantity: 16450, shippedAt: '2026--02-09', supTrackingNo: 'SF277461735201', platformTrackingNo: 'SF914396668382', signedAt: '2026--02-14', signedDocNo: 'ESIGN-TH-PO-2026-02055-2-2' }, { batchNo: 'SH202602-284', quantity: 11750, shippedAt: '2026--02-15', supTrackingNo: 'SF661903224297', platformTrackingNo: 'SF639157294166', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-265' }] },
      { parentOrderNo: 'TH-PO-2026-02055', subOrderNo: 'TH-PO-2026-02055-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 120000, unitPrice: 0.88, amount: 105600, batches: [{ batchNo: 'SH202602-285', quantity: 78000, shippedAt: '2026--02-03', supTrackingNo: 'SF462359337607', platformTrackingNo: 'SF223153060732', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02055-3-1' }, { batchNo: 'SH202602-286', quantity: 42000, shippedAt: '2026--02-10', supTrackingNo: 'SF898429125064', platformTrackingNo: 'SF859659881269', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-265' }] },
      { parentOrderNo: 'TH-PO-2026-02056', subOrderNo: 'TH-PO-2026-02056-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 63000, unitPrice: 1.25, amount: 78750, batches: [{ batchNo: 'SH202602-287', quantity: 15752, shippedAt: '2026--02-03', supTrackingNo: 'SF740170695850', platformTrackingNo: 'SF286747105556', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02056-1-1' }, { batchNo: 'SH202602-288', quantity: 15752, shippedAt: '2026--02-10', supTrackingNo: 'SF850853317874', platformTrackingNo: 'SF135399964686', signedAt: '2026--02-13', signedDocNo: 'ESIGN-TH-PO-2026-02056-1-2' }, { batchNo: 'SH202602-289', quantity: 15752, shippedAt: '2026--02-11', supTrackingNo: 'SF581117672542', platformTrackingNo: 'SF560908799623', signedAt: '2026--02-14', signedDocNo: 'ESIGN-TH-PO-2026-02056-1-3' }, { batchNo: 'SH202602-290', quantity: 15744, shippedAt: '2026--02-18', supTrackingNo: 'SF651518371426', platformTrackingNo: 'SF773343378855', signedAt: '2026--02-22', signedDocNo: 'ESIGN-TH-PO-2026-02056-1-4' }] },
      { parentOrderNo: 'TH-PO-2026-02056', subOrderNo: 'TH-PO-2026-02056-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 90000, unitPrice: 0.88, amount: 79200, batches: [{ batchNo: 'SH202602-291', quantity: 22500, shippedAt: '2026--02-03', supTrackingNo: 'SF667528742820', platformTrackingNo: 'SF715070849168', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02056-2-1' }, { batchNo: 'SH202602-292', quantity: 22500, shippedAt: '2026--02-09', supTrackingNo: 'SF677580205397', platformTrackingNo: 'SF445215833763', signedAt: '2026--02-14', signedDocNo: 'ESIGN-TH-PO-2026-02056-2-2' }, { batchNo: 'SH202602-293', quantity: 22500, shippedAt: '2026--02-13', supTrackingNo: 'SF688033095688', platformTrackingNo: 'SF698470737486', signedAt: '2026--02-17', signedDocNo: 'ESIGN-TH-PO-2026-02056-2-3' }, { batchNo: 'SH202602-294', quantity: 22500, shippedAt: '2026--02-21', supTrackingNo: 'SF850420656911', platformTrackingNo: 'SF983231287229', signedAt: '2026--02-26', signedDocNo: 'ESIGN-TH-PO-2026-02056-2-4' }] },
    ],
  },
  {
    key: '12', billingNo: 'BILL-2026-02-012', period: '2026-02-01 ~ 2026-02-28',
    totalAmount: 820400, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-04-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-02057', subOrderNo: 'TH-PO-2026-02057-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 61000, unitPrice: 1.25, amount: 76250, batches: [{ batchNo: 'SH202602-295', quantity: 61000, shippedAt: '2026--02-03', supTrackingNo: 'SF430636290339', platformTrackingNo: 'SF416844780876', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02057-1-1' }] },
      { parentOrderNo: 'TH-PO-2026-02057', subOrderNo: 'TH-PO-2026-02057-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 120000, unitPrice: 0.88, amount: 105600, batches: [{ batchNo: 'SH202602-296', quantity: 120000, shippedAt: '2026--02-03', supTrackingNo: 'SF975891945255', platformTrackingNo: 'SF403747235645', signedAt: '2026--02-07', signedDocNo: 'ESIGN-TH-PO-2026-02057-2-1' }] },
      { parentOrderNo: 'TH-PO-2026-02057', subOrderNo: 'TH-PO-2026-02057-3', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 66000, unitPrice: 0.80, amount: 52800, batches: [{ batchNo: 'SH202602-297', quantity: 66000, shippedAt: '2026--02-03', supTrackingNo: 'SF950208571145', platformTrackingNo: 'SF262369588665', signedAt: '2026--02-07', signedDocNo: 'ESIGN-TH-PO-2026-02057-3-1' }] },
      { parentOrderNo: 'TH-PO-2026-02058', subOrderNo: 'TH-PO-2026-02058-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 40000, unitPrice: 0.80, amount: 32000, batches: [{ batchNo: 'SH202602-298', quantity: 26000, shippedAt: '2026--02-03', supTrackingNo: 'SF921440172013', platformTrackingNo: 'SF333985863762', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02058-1-1' }, { batchNo: 'SH202602-299', quantity: 14000, shippedAt: '2026--02-08', supTrackingNo: 'SF866918027702', platformTrackingNo: 'SF251490460699', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-295' }] },
      { parentOrderNo: 'TH-PO-2026-02058', subOrderNo: 'TH-PO-2026-02058-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 43000, unitPrice: 0.72, amount: 30960, batches: [{ batchNo: 'SH202602-300', quantity: 27950, shippedAt: '2026--02-03', supTrackingNo: 'SF834657443459', platformTrackingNo: 'SF683708321452', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02058-2-1' }, { batchNo: 'SH202602-301', quantity: 15050, shippedAt: '2026--02-08', supTrackingNo: 'SF551401913033', platformTrackingNo: 'SF887397615467', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-295' }] },
      { parentOrderNo: 'TH-PO-2026-02058', subOrderNo: 'TH-PO-2026-02058-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 90000, unitPrice: 0.88, amount: 79200, batches: [{ batchNo: 'SH202602-302', quantity: 90000, shippedAt: '2026--02-03', supTrackingNo: 'SF547354950544', platformTrackingNo: 'SF626029124512', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02058-3-1' }] },
      { parentOrderNo: 'TH-PO-2026-02059', subOrderNo: 'TH-PO-2026-02059-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 66000, unitPrice: 0.72, amount: 47520, batches: [{ batchNo: 'SH202602-303', quantity: 42900, shippedAt: '2026--02-03', supTrackingNo: 'SF355868954463', platformTrackingNo: 'SF914047280448', signedAt: '2026--02-08', signedDocNo: 'ESIGN-TH-PO-2026-02059-1-1' }, { batchNo: 'SH202602-304', quantity: 23100, shippedAt: '2026--02-07', supTrackingNo: 'SF296871013927', platformTrackingNo: 'SF537383162273', signedAt: '2026--02-10', signedDocNo: 'ESIGN-TH-PO-2026-02059-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-02059', subOrderNo: 'TH-PO-2026-02059-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 93000, unitPrice: 1.25, amount: 116250, batches: [{ batchNo: 'SH202602-305', quantity: 93000, shippedAt: '2026--02-03', supTrackingNo: 'SF763864341229', platformTrackingNo: 'SF469294146760', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-295' }] },
      { parentOrderNo: 'TH-PO-2026-02060', subOrderNo: 'TH-PO-2026-02060-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 94000, unitPrice: 0.88, amount: 82720, batches: [{ batchNo: 'SH202602-306', quantity: 61100, shippedAt: '2026--02-03', supTrackingNo: 'SF277513936539', platformTrackingNo: 'SF605651306822', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02060-1-1' }, { batchNo: 'SH202602-307', quantity: 32900, shippedAt: '2026--02-09', supTrackingNo: 'SF472530937217', platformTrackingNo: 'SF425518868472', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-295' }] },
      { parentOrderNo: 'TH-PO-2026-02060', subOrderNo: 'TH-PO-2026-02060-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 102000, unitPrice: 1.25, amount: 127500, batches: [{ batchNo: 'SH202602-308', quantity: 40800, shippedAt: '2026--02-03', supTrackingNo: 'SF664477687248', platformTrackingNo: 'SF195897714803', signedAt: '2026--02-06', signedDocNo: 'ESIGN-TH-PO-2026-02060-2-1' }, { batchNo: 'SH202602-309', quantity: 35700, shippedAt: '2026--02-10', supTrackingNo: 'SF302273138816', platformTrackingNo: 'SF254540161162', signedAt: '2026--02-15', signedDocNo: 'ESIGN-TH-PO-2026-02060-2-2' }, { batchNo: 'SH202602-310', quantity: 25500, shippedAt: '2026--02-17', supTrackingNo: 'SF383497176691', platformTrackingNo: 'SF359345477235', signedAt: '2026--02-21', signedDocNo: 'ESIGN-TH-PO-2026-02060-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-02060', subOrderNo: 'TH-PO-2026-02060-3', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 87000, unitPrice: 0.80, amount: 69600, batches: [{ batchNo: 'SH202602-311', quantity: 34800, shippedAt: '2026--02-03', supTrackingNo: 'SF897070599637', platformTrackingNo: 'SF111050424083', signedAt: '2026--02-07', signedDocNo: 'ESIGN-TH-PO-2026-02060-3-1' }, { batchNo: 'SH202602-312', quantity: 30450, shippedAt: '2026--02-09', supTrackingNo: 'SF861753475856', platformTrackingNo: 'SF165439421288', signedAt: '2026--02-14', signedDocNo: 'ESIGN-TH-PO-2026-02060-3-2' }, { batchNo: 'SH202602-313', quantity: 21750, shippedAt: '2026--02-11', supTrackingNo: 'SF853360527876', platformTrackingNo: 'SF949130311759', signedAt: '2026-02-09', signedDocNo: 'ESIGN-SH202602-295' }] },
    ],
  },
  {
    key: '13', billingNo: 'BILL-2026-01-013', period: '2026-01-01 ~ 2026-01-31',
    totalAmount: 974630, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-01061', subOrderNo: 'TH-PO-2026-01061-1', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 77000, unitPrice: 0.80, amount: 61600, batches: [{ batchNo: 'SH202601-314', quantity: 50050, shippedAt: '2026--01-03', supTrackingNo: 'SF269557500167', platformTrackingNo: 'SF922292872033', signedAt: '2026--01-06', signedDocNo: 'ESIGN-TH-PO-2026-01061-1-1' }, { batchNo: 'SH202601-315', quantity: 26950, shippedAt: '2026--01-09', supTrackingNo: 'SF619316508315', platformTrackingNo: 'SF691663315274', signedAt: '2026--01-13', signedDocNo: 'ESIGN-TH-PO-2026-01061-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-01061', subOrderNo: 'TH-PO-2026-01061-2', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 115000, unitPrice: 1.35, amount: 155250, batches: [{ batchNo: 'SH202601-316', quantity: 46000, shippedAt: '2026--01-03', supTrackingNo: 'SF756076610661', platformTrackingNo: 'SF967038513015', signedAt: '2026--01-08', signedDocNo: 'ESIGN-TH-PO-2026-01061-2-1' }, { batchNo: 'SH202601-317', quantity: 40240, shippedAt: '2026--01-07', supTrackingNo: 'SF681739352909', platformTrackingNo: 'SF498159643734', signedAt: '2026--01-12', signedDocNo: 'ESIGN-TH-PO-2026-01061-2-2' }, { batchNo: 'SH202601-318', quantity: 28760, shippedAt: '2026--01-11', supTrackingNo: 'SF704854978910', platformTrackingNo: 'SF657928656291', signedAt: '2026-01-07', signedDocNo: 'ESIGN-SH202601-314' }] },
      { parentOrderNo: 'TH-PO-2026-01061', subOrderNo: 'TH-PO-2026-01061-3', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 55000, unitPrice: 1.20, amount: 66000, batches: [{ batchNo: 'SH202601-319', quantity: 35750, shippedAt: '2026--01-03', supTrackingNo: 'SF587566154345', platformTrackingNo: 'SF847823556587', signedAt: '2026--01-06', signedDocNo: 'ESIGN-TH-PO-2026-01061-3-1' }, { batchNo: 'SH202601-320', quantity: 19250, shippedAt: '2026--01-08', supTrackingNo: 'SF591818317190', platformTrackingNo: 'SF163602848199', signedAt: '2026--01-13', signedDocNo: 'ESIGN-TH-PO-2026-01061-3-2' }] },
      { parentOrderNo: 'TH-PO-2026-01062', subOrderNo: 'TH-PO-2026-01062-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 88000, unitPrice: 1.20, amount: 105600, batches: [{ batchNo: 'SH202601-321', quantity: 57200, shippedAt: '2026--01-03', supTrackingNo: 'SF438473124150', platformTrackingNo: 'SF124581300799', signedAt: '2026--01-08', signedDocNo: 'ESIGN-TH-PO-2026-01062-1-1' }, { batchNo: 'SH202601-322', quantity: 30800, shippedAt: '2026--01-10', supTrackingNo: 'SF339426407161', platformTrackingNo: 'SF179793239299', signedAt: '2026--01-14', signedDocNo: 'ESIGN-TH-PO-2026-01062-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-01062', subOrderNo: 'TH-PO-2026-01062-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 35000, unitPrice: 1.50, amount: 52500, batches: [{ batchNo: 'SH202601-323', quantity: 22750, shippedAt: '2026--01-03', supTrackingNo: 'SF168694238050', platformTrackingNo: 'SF619406611023', signedAt: '2026--01-08', signedDocNo: 'ESIGN-TH-PO-2026-01062-2-1' }, { batchNo: 'SH202601-324', quantity: 12250, shippedAt: '2026--01-07', supTrackingNo: 'SF249331597922', platformTrackingNo: 'SF807663841396', signedAt: '2026--01-11', signedDocNo: 'ESIGN-TH-PO-2026-01062-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-01062', subOrderNo: 'TH-PO-2026-01062-3', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 112000, unitPrice: 0.98, amount: 109760, batches: [{ batchNo: 'SH202601-325', quantity: 28000, shippedAt: '2026--01-03', supTrackingNo: 'SF513938194900', platformTrackingNo: 'SF847668980598', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01062-3-1' }, { batchNo: 'SH202601-326', quantity: 28000, shippedAt: '2026--01-08', supTrackingNo: 'SF485946992088', platformTrackingNo: 'SF293783053908', signedAt: '2026--01-13', signedDocNo: 'ESIGN-TH-PO-2026-01062-3-2' }, { batchNo: 'SH202601-327', quantity: 28000, shippedAt: '2026--01-17', supTrackingNo: 'SF899410868608', platformTrackingNo: 'SF349016725058', signedAt: '2026--01-22', signedDocNo: 'ESIGN-TH-PO-2026-01062-3-3' }, { batchNo: 'SH202601-328', quantity: 28000, shippedAt: '2026--01-15', supTrackingNo: 'SF840722961506', platformTrackingNo: 'SF700088939243', signedAt: '2026--01-18', signedDocNo: 'ESIGN-TH-PO-2026-01062-3-4' }] },
      { parentOrderNo: 'TH-PO-2026-01063', subOrderNo: 'TH-PO-2026-01063-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 61000, unitPrice: 1.10, amount: 67100, batches: [{ batchNo: 'SH202601-329', quantity: 39650, shippedAt: '2026--01-03', supTrackingNo: 'SF898327940253', platformTrackingNo: 'SF223546838526', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01063-1-1' }, { batchNo: 'SH202601-330', quantity: 21350, shippedAt: '2026--01-07', supTrackingNo: 'SF362060203245', platformTrackingNo: 'SF173899557866', signedAt: '2026--01-12', signedDocNo: 'ESIGN-TH-PO-2026-01063-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-01063', subOrderNo: 'TH-PO-2026-01063-2', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 42000, unitPrice: 0.55, amount: 23100, batches: [{ batchNo: 'SH202601-331', quantity: 27300, shippedAt: '2026--01-03', supTrackingNo: 'SF875980432823', platformTrackingNo: 'SF155285731383', signedAt: '2026--01-08', signedDocNo: 'ESIGN-TH-PO-2026-01063-2-1' }, { batchNo: 'SH202601-332', quantity: 14700, shippedAt: '2026--01-08', supTrackingNo: 'SF355288401397', platformTrackingNo: 'SF338541452006', signedAt: '2026-01-07', signedDocNo: 'ESIGN-SH202601-314' }] },
      { parentOrderNo: 'TH-PO-2026-01063', subOrderNo: 'TH-PO-2026-01063-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 37000, unitPrice: 0.80, amount: 29600, batches: [{ batchNo: 'SH202601-333', quantity: 37000, shippedAt: '2026--01-03', supTrackingNo: 'SF734502036188', platformTrackingNo: 'SF732729873446', signedAt: '2026--01-06', signedDocNo: 'ESIGN-TH-PO-2026-01063-3-1' }] },
      { parentOrderNo: 'TH-PO-2026-01064', subOrderNo: 'TH-PO-2026-01064-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 114000, unitPrice: 0.98, amount: 111720, batches: [{ batchNo: 'SH202601-334', quantity: 74100, shippedAt: '2026--01-03', supTrackingNo: 'SF165606286550', platformTrackingNo: 'SF787946958681', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01064-1-1' }, { batchNo: 'SH202601-335', quantity: 39900, shippedAt: '2026--01-10', supTrackingNo: 'SF482133076827', platformTrackingNo: 'SF808418719388', signedAt: '2026--01-15', signedDocNo: 'ESIGN-TH-PO-2026-01064-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-01064', subOrderNo: 'TH-PO-2026-01064-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 115000, unitPrice: 1.20, amount: 138000, batches: [{ batchNo: 'SH202601-336', quantity: 74750, shippedAt: '2026--01-03', supTrackingNo: 'SF548464699476', platformTrackingNo: 'SF427058399256', signedAt: '2026--01-08', signedDocNo: 'ESIGN-TH-PO-2026-01064-2-1' }, { batchNo: 'SH202601-337', quantity: 40250, shippedAt: '2026--01-10', supTrackingNo: 'SF364026752906', platformTrackingNo: 'SF348461027407', signedAt: '2026--01-13', signedDocNo: 'ESIGN-TH-PO-2026-01064-2-2' }] },
      { parentOrderNo: 'TH-PO-2026-01064', subOrderNo: 'TH-PO-2026-01064-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 68000, unitPrice: 0.80, amount: 54400, batches: [{ batchNo: 'SH202601-338', quantity: 17000, shippedAt: '2026--01-03', supTrackingNo: 'SF164058325585', platformTrackingNo: 'SF553386995357', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01064-3-1' }, { batchNo: 'SH202601-339', quantity: 17000, shippedAt: '2026--01-10', supTrackingNo: 'SF248305185574', platformTrackingNo: 'SF367956219484', signedAt: '2026--01-15', signedDocNo: 'ESIGN-TH-PO-2026-01064-3-2' }, { batchNo: 'SH202601-340', quantity: 17000, shippedAt: '2026--01-15', supTrackingNo: 'SF810088072580', platformTrackingNo: 'SF200378013519', signedAt: '2026--01-18', signedDocNo: 'ESIGN-TH-PO-2026-01064-3-3' }, { batchNo: 'SH202601-341', quantity: 17000, shippedAt: '2026--01-18', supTrackingNo: 'SF764318362436', platformTrackingNo: 'SF145539203444', signedAt: '2026-01-07', signedDocNo: 'ESIGN-SH202601-314' }] },
    ],
  },
  {
    key: '14', billingNo: 'BILL-2026-01-014', period: '2026-01-01 ~ 2026-01-31',
    totalAmount: 309300, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2026-01065', subOrderNo: 'TH-PO-2026-01065-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 105000, unitPrice: 0.98, amount: 102900, batches: [{ batchNo: 'SH202601-342', quantity: 42000, shippedAt: '2026--01-03', supTrackingNo: 'SF468967896485', platformTrackingNo: 'SF116789002083', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01065-1-1' }, { batchNo: 'SH202601-343', quantity: 36750, shippedAt: '2026--01-08', supTrackingNo: 'SF915880910572', platformTrackingNo: 'SF920842622752', signedAt: '2026--01-11', signedDocNo: 'ESIGN-TH-PO-2026-01065-1-2' }, { batchNo: 'SH202601-344', quantity: 26250, shippedAt: '2026--01-17', supTrackingNo: 'SF326360962451', platformTrackingNo: 'SF706618307372', signedAt: '2026--01-20', signedDocNo: 'ESIGN-TH-PO-2026-01065-1-3' }] },
      { parentOrderNo: 'TH-PO-2026-01065', subOrderNo: 'TH-PO-2026-01065-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 71000, unitPrice: 1.10, amount: 78100, batches: [{ batchNo: 'SH202601-345', quantity: 28400, shippedAt: '2026--01-03', supTrackingNo: 'SF815256580982', platformTrackingNo: 'SF436550457148', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01065-2-1' }, { batchNo: 'SH202601-346', quantity: 24850, shippedAt: '2026--01-09', supTrackingNo: 'SF613236897932', platformTrackingNo: 'SF980891814797', signedAt: '2026--01-13', signedDocNo: 'ESIGN-TH-PO-2026-01065-2-2' }, { batchNo: 'SH202601-347', quantity: 17750, shippedAt: '2026--01-17', supTrackingNo: 'SF445189549205', platformTrackingNo: 'SF149022456817', signedAt: '2026--01-21', signedDocNo: 'ESIGN-TH-PO-2026-01065-2-3' }] },
      { parentOrderNo: 'TH-PO-2026-01066', subOrderNo: 'TH-PO-2026-01066-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 63000, unitPrice: 1.20, amount: 75600, batches: [{ batchNo: 'SH202601-348', quantity: 40950, shippedAt: '2026--01-03', supTrackingNo: 'SF315402966821', platformTrackingNo: 'SF350524863789', signedAt: '2026--01-07', signedDocNo: 'ESIGN-TH-PO-2026-01066-1-1' }, { batchNo: 'SH202601-349', quantity: 22050, shippedAt: '2026--01-10', supTrackingNo: 'SF703439904963', platformTrackingNo: 'SF472308581268', signedAt: '2026--01-15', signedDocNo: 'ESIGN-TH-PO-2026-01066-1-2' }] },
      { parentOrderNo: 'TH-PO-2026-01066', subOrderNo: 'TH-PO-2026-01066-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 62000, unitPrice: 0.85, amount: 52700, batches: [{ batchNo: 'SH202601-350', quantity: 24800, shippedAt: '2026--01-03', supTrackingNo: 'SF914504875619', platformTrackingNo: 'SF604618265615', signedAt: '2026--01-08', signedDocNo: 'ESIGN-TH-PO-2026-01066-2-1' }, { batchNo: 'SH202601-351', quantity: 21700, shippedAt: '2026--01-08', supTrackingNo: 'SF489961450482', platformTrackingNo: 'SF251050846074', signedAt: '2026--01-13', signedDocNo: 'ESIGN-TH-PO-2026-01066-2-2' }, { batchNo: 'SH202601-352', quantity: 15500, shippedAt: '2026--01-17', supTrackingNo: 'SF675777869916', platformTrackingNo: 'SF185240916199', signedAt: '2026--01-20', signedDocNo: 'ESIGN-TH-PO-2026-01066-2-3' }] },
    ],
  },
  {
    key: '15', billingNo: 'BILL-2025-12-015', period: '2025-12-01 ~ 2025-12-31',
    totalAmount: 698050, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-00-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-12067', subOrderNo: 'TH-PO-2025-12067-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 47000, unitPrice: 0.80, amount: 37600, batches: [{ batchNo: 'SH202512-353', quantity: 18800, shippedAt: '2025--12-03', supTrackingNo: 'SF266246027419', platformTrackingNo: 'SF336262463569', signedAt: '2025--12-06', signedDocNo: 'ESIGN-TH-PO-2025-12067-1-1' }, { batchNo: 'SH202512-354', quantity: 16450, shippedAt: '2025--12-10', supTrackingNo: 'SF778864464039', platformTrackingNo: 'SF832883463760', signedAt: '2025--12-14', signedDocNo: 'ESIGN-TH-PO-2025-12067-1-2' }, { batchNo: 'SH202512-355', quantity: 11750, shippedAt: '2025--12-17', supTrackingNo: 'SF684143952105', platformTrackingNo: 'SF553340857127', signedAt: '2025--12-22', signedDocNo: 'ESIGN-TH-PO-2025-12067-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-12067', subOrderNo: 'TH-PO-2025-12067-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 31000, unitPrice: 0.88, amount: 27280, batches: [{ batchNo: 'SH202512-356', quantity: 31000, shippedAt: '2025--12-03', supTrackingNo: 'SF649829440782', platformTrackingNo: 'SF867996662339', signedAt: '2025--12-08', signedDocNo: 'ESIGN-TH-PO-2025-12067-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-12068', subOrderNo: 'TH-PO-2025-12068-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 97000, unitPrice: 0.90, amount: 87300, batches: [{ batchNo: 'SH202512-357', quantity: 97000, shippedAt: '2025--12-03', supTrackingNo: 'SF490048375787', platformTrackingNo: 'SF973026512093', signedAt: '2025--12-08', signedDocNo: 'ESIGN-TH-PO-2025-12068-1-1' }] },
      { parentOrderNo: 'TH-PO-2025-12068', subOrderNo: 'TH-PO-2025-12068-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 80000, unitPrice: 0.80, amount: 64000, batches: [{ batchNo: 'SH202512-358', quantity: 80000, shippedAt: '2025--12-03', supTrackingNo: 'SF868757197171', platformTrackingNo: 'SF427387564031', signedAt: '2025--12-07', signedDocNo: 'ESIGN-TH-PO-2025-12068-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-12068', subOrderNo: 'TH-PO-2025-12068-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 117000, unitPrice: 0.88, amount: 102960, batches: [{ batchNo: 'SH202512-359', quantity: 46800, shippedAt: '2025--12-03', supTrackingNo: 'SF936014930826', platformTrackingNo: 'SF198920331732', signedAt: '2025--12-08', signedDocNo: 'ESIGN-TH-PO-2025-12068-3-1' }, { batchNo: 'SH202512-360', quantity: 40950, shippedAt: '2025--12-10', supTrackingNo: 'SF707210319708', platformTrackingNo: 'SF162173968482', signedAt: '2025--12-14', signedDocNo: 'ESIGN-TH-PO-2025-12068-3-2' }, { batchNo: 'SH202512-361', quantity: 29250, shippedAt: '2025--12-11', supTrackingNo: 'SF810533231606', platformTrackingNo: 'SF464146123458', signedAt: '2025-12-08', signedDocNo: 'ESIGN-SH202512-353' }] },
      { parentOrderNo: 'TH-PO-2025-12069', subOrderNo: 'TH-PO-2025-12069-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 59000, unitPrice: 1.25, amount: 73750, batches: [{ batchNo: 'SH202512-362', quantity: 59000, shippedAt: '2025--12-03', supTrackingNo: 'SF851938599284', platformTrackingNo: 'SF408918034515', signedAt: '2025-12-08', signedDocNo: 'ESIGN-SH202512-353' }] },
      { parentOrderNo: 'TH-PO-2025-12069', subOrderNo: 'TH-PO-2025-12069-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 99000, unitPrice: 0.80, amount: 79200, batches: [{ batchNo: 'SH202512-363', quantity: 64350, shippedAt: '2025--12-03', supTrackingNo: 'SF118530570661', platformTrackingNo: 'SF331762745410', signedAt: '2025--12-06', signedDocNo: 'ESIGN-TH-PO-2025-12069-2-1' }, { batchNo: 'SH202512-364', quantity: 34650, shippedAt: '2025--12-08', supTrackingNo: 'SF185593866132', platformTrackingNo: 'SF277379043591', signedAt: '2025--12-13', signedDocNo: 'ESIGN-TH-PO-2025-12069-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-12070', subOrderNo: 'TH-PO-2025-12070-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 116000, unitPrice: 1.25, amount: 145000, batches: [{ batchNo: 'SH202512-365', quantity: 29000, shippedAt: '2025--12-03', supTrackingNo: 'SF914994136012', platformTrackingNo: 'SF968184477004', signedAt: '2025--12-07', signedDocNo: 'ESIGN-TH-PO-2025-12070-1-1' }, { batchNo: 'SH202512-366', quantity: 29000, shippedAt: '2025--12-07', supTrackingNo: 'SF157320030087', platformTrackingNo: 'SF577160927111', signedAt: '2025--12-12', signedDocNo: 'ESIGN-TH-PO-2025-12070-1-2' }, { batchNo: 'SH202512-367', quantity: 29000, shippedAt: '2025--12-13', supTrackingNo: 'SF762887798281', platformTrackingNo: 'SF777612719605', signedAt: '2025--12-16', signedDocNo: 'ESIGN-TH-PO-2025-12070-1-3' }, { batchNo: 'SH202512-368', quantity: 29000, shippedAt: '2025--12-24', supTrackingNo: 'SF960167389837', platformTrackingNo: 'SF598184362921', signedAt: '2025-12-08', signedDocNo: 'ESIGN-SH202512-353' }] },
      { parentOrderNo: 'TH-PO-2025-12070', subOrderNo: 'TH-PO-2025-12070-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 92000, unitPrice: 0.88, amount: 80960, batches: [{ batchNo: 'SH202512-369', quantity: 92000, shippedAt: '2025--12-03', supTrackingNo: 'SF828365787510', platformTrackingNo: 'SF191826713117', signedAt: '2025-12-08', signedDocNo: 'ESIGN-SH202512-353' }] },
    ],
  },
  {
    key: '16', billingNo: 'BILL-2025-12-016', period: '2025-12-01 ~ 2025-12-31',
    totalAmount: 477520, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-00-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-12071', subOrderNo: 'TH-PO-2025-12071-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 64000, unitPrice: 0.90, amount: 57600, batches: [{ batchNo: 'SH202512-370', quantity: 64000, shippedAt: '2025--12-03', supTrackingNo: 'SF217513312700', platformTrackingNo: 'SF104688044575', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-370' }] },
      { parentOrderNo: 'TH-PO-2025-12071', subOrderNo: 'TH-PO-2025-12071-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 69000, unitPrice: 0.80, amount: 55200, batches: [{ batchNo: 'SH202512-371', quantity: 44850, shippedAt: '2025--12-03', supTrackingNo: 'SF195058393769', platformTrackingNo: 'SF573251244158', signedAt: '2025--12-06', signedDocNo: 'ESIGN-TH-PO-2025-12071-2-1' }, { batchNo: 'SH202512-372', quantity: 24150, shippedAt: '2025--12-10', supTrackingNo: 'SF213421686085', platformTrackingNo: 'SF194602074538', signedAt: '2025--12-15', signedDocNo: 'ESIGN-TH-PO-2025-12071-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-12071', subOrderNo: 'TH-PO-2025-12071-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 75000, unitPrice: 0.88, amount: 66000, batches: [{ batchNo: 'SH202512-373', quantity: 48750, shippedAt: '2025--12-03', supTrackingNo: 'SF417880582454', platformTrackingNo: 'SF526979063011', signedAt: '2025--12-07', signedDocNo: 'ESIGN-TH-PO-2025-12071-3-1' }, { batchNo: 'SH202512-374', quantity: 26250, shippedAt: '2025--12-07', supTrackingNo: 'SF370489193682', platformTrackingNo: 'SF673687201701', signedAt: '2025--12-12', signedDocNo: 'ESIGN-TH-PO-2025-12071-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-12072', subOrderNo: 'TH-PO-2025-12072-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 47000, unitPrice: 0.88, amount: 41360, batches: [{ batchNo: 'SH202512-375', quantity: 47000, shippedAt: '2025--12-03', supTrackingNo: 'SF577459520169', platformTrackingNo: 'SF560746747880', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-370' }] },
      { parentOrderNo: 'TH-PO-2025-12072', subOrderNo: 'TH-PO-2025-12072-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 68000, unitPrice: 0.90, amount: 61200, batches: [{ batchNo: 'SH202512-376', quantity: 44200, shippedAt: '2025--12-03', supTrackingNo: 'SF891333078722', platformTrackingNo: 'SF643850378538', signedAt: '2025--12-07', signedDocNo: 'ESIGN-TH-PO-2025-12072-2-1' }, { batchNo: 'SH202512-377', quantity: 23800, shippedAt: '2025--12-08', supTrackingNo: 'SF105603463447', platformTrackingNo: 'SF537866862632', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-370' }] },
      { parentOrderNo: 'TH-PO-2025-12073', subOrderNo: 'TH-PO-2025-12073-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 86000, unitPrice: 1.25, amount: 107500, batches: [{ batchNo: 'SH202512-378', quantity: 55900, shippedAt: '2025--12-03', supTrackingNo: 'SF762802209928', platformTrackingNo: 'SF864277743389', signedAt: '2025--12-07', signedDocNo: 'ESIGN-TH-PO-2025-12073-1-1' }, { batchNo: 'SH202512-379', quantity: 30100, shippedAt: '2025--12-08', supTrackingNo: 'SF537934513371', platformTrackingNo: 'SF452052994127', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-370' }] },
      { parentOrderNo: 'TH-PO-2025-12073', subOrderNo: 'TH-PO-2025-12073-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 67000, unitPrice: 0.88, amount: 58960, batches: [{ batchNo: 'SH202512-380', quantity: 26800, shippedAt: '2025--12-03', supTrackingNo: 'SF369646526717', platformTrackingNo: 'SF513716531159', signedAt: '2025--12-08', signedDocNo: 'ESIGN-TH-PO-2025-12073-2-1' }, { batchNo: 'SH202512-381', quantity: 23450, shippedAt: '2025--12-09', supTrackingNo: 'SF226121781400', platformTrackingNo: 'SF722478488545', signedAt: '2025--12-13', signedDocNo: 'ESIGN-TH-PO-2025-12073-2-2' }, { batchNo: 'SH202512-382', quantity: 16750, shippedAt: '2025--12-13', supTrackingNo: 'SF848097090995', platformTrackingNo: 'SF704592315249', signedAt: '2025--12-18', signedDocNo: 'ESIGN-TH-PO-2025-12073-2-3' }] },
      { parentOrderNo: 'TH-PO-2025-12073', subOrderNo: 'TH-PO-2025-12073-3', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 33000, unitPrice: 0.90, amount: 29700, batches: [{ batchNo: 'SH202512-383', quantity: 8250, shippedAt: '2025--12-03', supTrackingNo: 'SF581936770150', platformTrackingNo: 'SF421253613135', signedAt: '2025--12-08', signedDocNo: 'ESIGN-TH-PO-2025-12073-3-1' }, { batchNo: 'SH202512-384', quantity: 8250, shippedAt: '2025--12-07', supTrackingNo: 'SF648351263590', platformTrackingNo: 'SF796382471712', signedAt: '2025--12-11', signedDocNo: 'ESIGN-TH-PO-2025-12073-3-2' }, { batchNo: 'SH202512-385', quantity: 8250, shippedAt: '2025--12-15', supTrackingNo: 'SF822639765311', platformTrackingNo: 'SF886641055298', signedAt: '2025--12-18', signedDocNo: 'ESIGN-TH-PO-2025-12073-3-3' }, { batchNo: 'SH202512-386', quantity: 8250, shippedAt: '2025--12-24', supTrackingNo: 'SF761385023008', platformTrackingNo: 'SF742008424449', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-370' }] },
    ],
  },
  {
    key: '17', billingNo: 'BILL-2025-11-017', period: '2025-11-01 ~ 2025-11-30',
    totalAmount: 476300, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2025-00-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-11074', subOrderNo: 'TH-PO-2025-11074-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 76000, unitPrice: 1.10, amount: 83600, batches: [{ batchNo: 'SH202511-387', quantity: 30400, shippedAt: '2025--11-03', supTrackingNo: 'SF373885572142', platformTrackingNo: 'SF832968817887', signedAt: '2025--11-06', signedDocNo: 'ESIGN-TH-PO-2025-11074-1-1' }, { batchNo: 'SH202511-388', quantity: 26600, shippedAt: '2025--11-09', supTrackingNo: 'SF772793741349', platformTrackingNo: 'SF718665543456', signedAt: '2025--11-12', signedDocNo: 'ESIGN-TH-PO-2025-11074-1-2' }, { batchNo: 'SH202511-389', quantity: 19000, shippedAt: '2025--11-17', supTrackingNo: 'SF217812909480', platformTrackingNo: 'SF207419484756', signedAt: '2025--11-21', signedDocNo: 'ESIGN-TH-PO-2025-11074-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-11074', subOrderNo: 'TH-PO-2025-11074-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 63000, unitPrice: 1.50, amount: 94500, batches: [{ batchNo: 'SH202511-390', quantity: 63000, shippedAt: '2025--11-03', supTrackingNo: 'SF948097398654', platformTrackingNo: 'SF747163762980', signedAt: '2025-11-07', signedDocNo: 'ESIGN-SH202511-387' }] },
      { parentOrderNo: 'TH-PO-2025-11074', subOrderNo: 'TH-PO-2025-11074-3', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 118000, unitPrice: 0.85, amount: 100300, batches: [{ batchNo: 'SH202511-391', quantity: 76700, shippedAt: '2025--11-03', supTrackingNo: 'SF213742635729', platformTrackingNo: 'SF556535405107', signedAt: '2025--11-06', signedDocNo: 'ESIGN-TH-PO-2025-11074-3-1' }, { batchNo: 'SH202511-392', quantity: 41300, shippedAt: '2025--11-07', supTrackingNo: 'SF257754796139', platformTrackingNo: 'SF440798476551', signedAt: '2025--11-10', signedDocNo: 'ESIGN-TH-PO-2025-11074-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-11075', subOrderNo: 'TH-PO-2025-11075-1', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 96000, unitPrice: 0.55, amount: 52800, batches: [{ batchNo: 'SH202511-393', quantity: 62400, shippedAt: '2025--11-03', supTrackingNo: 'SF892155890847', platformTrackingNo: 'SF596913814495', signedAt: '2025--11-06', signedDocNo: 'ESIGN-TH-PO-2025-11075-1-1' }, { batchNo: 'SH202511-394', quantity: 33600, shippedAt: '2025--11-09', supTrackingNo: 'SF880868802680', platformTrackingNo: 'SF121969123942', signedAt: '2025-11-07', signedDocNo: 'ESIGN-SH202511-387' }] },
      { parentOrderNo: 'TH-PO-2025-11075', subOrderNo: 'TH-PO-2025-11075-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 73000, unitPrice: 1.10, amount: 80300, batches: [{ batchNo: 'SH202511-395', quantity: 47450, shippedAt: '2025--11-03', supTrackingNo: 'SF667983281203', platformTrackingNo: 'SF706339659651', signedAt: '2025--11-08', signedDocNo: 'ESIGN-TH-PO-2025-11075-2-1' }, { batchNo: 'SH202511-396', quantity: 25550, shippedAt: '2025--11-08', supTrackingNo: 'SF610922706541', platformTrackingNo: 'SF977169140360', signedAt: '2025--11-12', signedDocNo: 'ESIGN-TH-PO-2025-11075-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-11075', subOrderNo: 'TH-PO-2025-11075-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 81000, unitPrice: 0.80, amount: 64800, batches: [{ batchNo: 'SH202511-397', quantity: 52650, shippedAt: '2025--11-03', supTrackingNo: 'SF575269518531', platformTrackingNo: 'SF131763784467', signedAt: '2025--11-08', signedDocNo: 'ESIGN-TH-PO-2025-11075-3-1' }, { batchNo: 'SH202511-398', quantity: 28350, shippedAt: '2025--11-08', supTrackingNo: 'SF105965004278', platformTrackingNo: 'SF334955050419', signedAt: '2025--11-12', signedDocNo: 'ESIGN-TH-PO-2025-11075-3-2' }] },
    ],
  },
  {
    key: '18', billingNo: 'BILL-2025-11-018', period: '2025-11-01 ~ 2025-11-30',
    totalAmount: 464150, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2025-00-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-11076', subOrderNo: 'TH-PO-2025-11076-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 120000, unitPrice: 1.50, amount: 180000, batches: [{ batchNo: 'SH202511-399', quantity: 48000, shippedAt: '2025--11-03', supTrackingNo: 'SF976610350084', platformTrackingNo: 'SF692155642250', signedAt: '2025--11-08', signedDocNo: 'ESIGN-TH-PO-2025-11076-1-1' }, { batchNo: 'SH202511-400', quantity: 42000, shippedAt: '2025--11-08', supTrackingNo: 'SF316148459341', platformTrackingNo: 'SF226519215686', signedAt: '2025--11-12', signedDocNo: 'ESIGN-TH-PO-2025-11076-1-2' }, { batchNo: 'SH202511-401', quantity: 30000, shippedAt: '2025--11-15', supTrackingNo: 'SF446342334150', platformTrackingNo: 'SF527765732491', signedAt: '2025--11-20', signedDocNo: 'ESIGN-TH-PO-2025-11076-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-11076', subOrderNo: 'TH-PO-2025-11076-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 108000, unitPrice: 1.10, amount: 118800, batches: [{ batchNo: 'SH202511-402', quantity: 70200, shippedAt: '2025--11-03', supTrackingNo: 'SF780571329007', platformTrackingNo: 'SF994094197579', signedAt: '2025--11-07', signedDocNo: 'ESIGN-TH-PO-2025-11076-2-1' }, { batchNo: 'SH202511-403', quantity: 37800, shippedAt: '2025--11-09', supTrackingNo: 'SF248915578881', platformTrackingNo: 'SF230194141422', signedAt: '2025--11-14', signedDocNo: 'ESIGN-TH-PO-2025-11076-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-11077', subOrderNo: 'TH-PO-2025-11077-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 53000, unitPrice: 1.50, amount: 79500, batches: [{ batchNo: 'SH202511-404', quantity: 34450, shippedAt: '2025--11-03', supTrackingNo: 'SF561229937700', platformTrackingNo: 'SF252885484746', signedAt: '2025--11-08', signedDocNo: 'ESIGN-TH-PO-2025-11077-1-1' }, { batchNo: 'SH202511-405', quantity: 18550, shippedAt: '2025--11-10', supTrackingNo: 'SF691139978315', platformTrackingNo: 'SF293273096911', signedAt: '2025-11-06', signedDocNo: 'ESIGN-SH202511-399' }] },
      { parentOrderNo: 'TH-PO-2025-11077', subOrderNo: 'TH-PO-2025-11077-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 101000, unitPrice: 0.85, amount: 85850, batches: [{ batchNo: 'SH202511-406', quantity: 101000, shippedAt: '2025--11-03', supTrackingNo: 'SF597537538003', platformTrackingNo: 'SF158494920476', signedAt: '2025-11-06', signedDocNo: 'ESIGN-SH202511-399' }] },
    ],
  },
  {
    key: '19', billingNo: 'BILL-2025-10-019', period: '2025-10-01 ~ 2025-10-31',
    totalAmount: 351110, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-00-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-10078', subOrderNo: 'TH-PO-2025-10078-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 54000, unitPrice: 0.80, amount: 43200, batches: [{ batchNo: 'SH202510-407', quantity: 21600, shippedAt: '2025--10-03', supTrackingNo: 'SF639811661808', platformTrackingNo: 'SF879174199684', signedAt: '2025--10-07', signedDocNo: 'ESIGN-TH-PO-2025-10078-1-1' }, { batchNo: 'SH202510-408', quantity: 18900, shippedAt: '2025--10-10', supTrackingNo: 'SF190912661480', platformTrackingNo: 'SF132493136128', signedAt: '2025--10-14', signedDocNo: 'ESIGN-TH-PO-2025-10078-1-2' }, { batchNo: 'SH202510-409', quantity: 13500, shippedAt: '2025--10-13', supTrackingNo: 'SF689376214683', platformTrackingNo: 'SF285923423266', signedAt: '2025-10-09', signedDocNo: 'ESIGN-SH202510-407' }] },
      { parentOrderNo: 'TH-PO-2025-10078', subOrderNo: 'TH-PO-2025-10078-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 88000, unitPrice: 0.88, amount: 77440, batches: [{ batchNo: 'SH202510-410', quantity: 57200, shippedAt: '2025--10-03', supTrackingNo: 'SF222452979272', platformTrackingNo: 'SF227013839735', signedAt: '2025--10-08', signedDocNo: 'ESIGN-TH-PO-2025-10078-2-1' }, { batchNo: 'SH202510-411', quantity: 30800, shippedAt: '2025--10-09', supTrackingNo: 'SF694281146167', platformTrackingNo: 'SF932461775149', signedAt: '2025--10-14', signedDocNo: 'ESIGN-TH-PO-2025-10078-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-10078', subOrderNo: 'TH-PO-2025-10078-3', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 35000, unitPrice: 1.25, amount: 43750, batches: [{ batchNo: 'SH202510-412', quantity: 14000, shippedAt: '2025--10-03', supTrackingNo: 'SF213495175185', platformTrackingNo: 'SF927441219419', signedAt: '2025--10-08', signedDocNo: 'ESIGN-TH-PO-2025-10078-3-1' }, { batchNo: 'SH202510-413', quantity: 12248, shippedAt: '2025--10-08', supTrackingNo: 'SF594059667546', platformTrackingNo: 'SF483380872138', signedAt: '2025--10-12', signedDocNo: 'ESIGN-TH-PO-2025-10078-3-2' }, { batchNo: 'SH202510-414', quantity: 8752, shippedAt: '2025--10-11', supTrackingNo: 'SF950907693749', platformTrackingNo: 'SF361185074105', signedAt: '2025--10-15', signedDocNo: 'ESIGN-TH-PO-2025-10078-3-3' }] },
      { parentOrderNo: 'TH-PO-2025-10079', subOrderNo: 'TH-PO-2025-10079-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 120000, unitPrice: 1.25, amount: 150000, batches: [{ batchNo: 'SH202510-415', quantity: 78000, shippedAt: '2025--10-03', supTrackingNo: 'SF252970204608', platformTrackingNo: 'SF326709201530', signedAt: '2025--10-06', signedDocNo: 'ESIGN-TH-PO-2025-10079-1-1' }, { batchNo: 'SH202510-416', quantity: 42000, shippedAt: '2025--10-08', supTrackingNo: 'SF407228806626', platformTrackingNo: 'SF690974003794', signedAt: '2025--10-11', signedDocNo: 'ESIGN-TH-PO-2025-10079-1-2' }] },
      { parentOrderNo: 'TH-PO-2025-10079', subOrderNo: 'TH-PO-2025-10079-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 51000, unitPrice: 0.72, amount: 36720, batches: [{ batchNo: 'SH202510-417', quantity: 33150, shippedAt: '2025--10-03', supTrackingNo: 'SF394517656722', platformTrackingNo: 'SF846895479712', signedAt: '2025--10-07', signedDocNo: 'ESIGN-TH-PO-2025-10079-2-1' }, { batchNo: 'SH202510-418', quantity: 17850, shippedAt: '2025--10-07', supTrackingNo: 'SF554346083428', platformTrackingNo: 'SF168370591034', signedAt: '2025--10-10', signedDocNo: 'ESIGN-TH-PO-2025-10079-2-2' }] },
    ],
  },
  {
    key: '20', billingNo: 'BILL-2025-10-020', period: '2025-10-01 ~ 2025-10-31',
    totalAmount: 428320, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-00-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-10080', subOrderNo: 'TH-PO-2025-10080-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 48000, unitPrice: 0.90, amount: 43200, batches: [{ batchNo: 'SH202510-419', quantity: 19200, shippedAt: '2025--10-03', supTrackingNo: 'SF638557548869', platformTrackingNo: 'SF731970815033', signedAt: '2025--10-08', signedDocNo: 'ESIGN-TH-PO-2025-10080-1-1' }, { batchNo: 'SH202510-420', quantity: 16800, shippedAt: '2025--10-09', supTrackingNo: 'SF514095943637', platformTrackingNo: 'SF183545668309', signedAt: '2025--10-14', signedDocNo: 'ESIGN-TH-PO-2025-10080-1-2' }, { batchNo: 'SH202510-421', quantity: 12000, shippedAt: '2025--10-11', supTrackingNo: 'SF861404181627', platformTrackingNo: 'SF599801354952', signedAt: '2025--10-15', signedDocNo: 'ESIGN-TH-PO-2025-10080-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-10080', subOrderNo: 'TH-PO-2025-10080-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 92000, unitPrice: 1.25, amount: 115000, batches: [{ batchNo: 'SH202510-422', quantity: 59800, shippedAt: '2025--10-03', supTrackingNo: 'SF903558924728', platformTrackingNo: 'SF606686527351', signedAt: '2025--10-08', signedDocNo: 'ESIGN-TH-PO-2025-10080-2-1' }, { batchNo: 'SH202510-423', quantity: 32200, shippedAt: '2025--10-09', supTrackingNo: 'SF337931377943', platformTrackingNo: 'SF572309515869', signedAt: '2025--10-12', signedDocNo: 'ESIGN-TH-PO-2025-10080-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-10080', subOrderNo: 'TH-PO-2025-10080-3', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 57000, unitPrice: 0.80, amount: 45600, batches: [{ batchNo: 'SH202510-424', quantity: 37050, shippedAt: '2025--10-03', supTrackingNo: 'SF702746068790', platformTrackingNo: 'SF244216126870', signedAt: '2025--10-07', signedDocNo: 'ESIGN-TH-PO-2025-10080-3-1' }, { batchNo: 'SH202510-425', quantity: 19950, shippedAt: '2025--10-10', supTrackingNo: 'SF154813463654', platformTrackingNo: 'SF207571505778', signedAt: '2025--10-14', signedDocNo: 'ESIGN-TH-PO-2025-10080-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-10081', subOrderNo: 'TH-PO-2025-10081-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 86000, unitPrice: 0.80, amount: 68800, batches: [{ batchNo: 'SH202510-426', quantity: 55900, shippedAt: '2025--10-03', supTrackingNo: 'SF860190717545', platformTrackingNo: 'SF245639795025', signedAt: '2025--10-06', signedDocNo: 'ESIGN-TH-PO-2025-10081-1-1' }, { batchNo: 'SH202510-427', quantity: 30100, shippedAt: '2025--10-09', supTrackingNo: 'SF404412657737', platformTrackingNo: 'SF817660430611', signedAt: '2025--10-12', signedDocNo: 'ESIGN-TH-PO-2025-10081-1-2' }] },
      { parentOrderNo: 'TH-PO-2025-10081', subOrderNo: 'TH-PO-2025-10081-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 76000, unitPrice: 1.25, amount: 95000, batches: [{ batchNo: 'SH202510-428', quantity: 76000, shippedAt: '2025--10-03', supTrackingNo: 'SF156545499672', platformTrackingNo: 'SF788897041424', signedAt: '2025--10-08', signedDocNo: 'ESIGN-TH-PO-2025-10081-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-10081', subOrderNo: 'TH-PO-2025-10081-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 69000, unitPrice: 0.88, amount: 60720, batches: [{ batchNo: 'SH202510-429', quantity: 27600, shippedAt: '2025--10-03', supTrackingNo: 'SF201599535427', platformTrackingNo: 'SF206101575193', signedAt: '2025--10-07', signedDocNo: 'ESIGN-TH-PO-2025-10081-3-1' }, { batchNo: 'SH202510-430', quantity: 24150, shippedAt: '2025--10-07', supTrackingNo: 'SF183652247871', platformTrackingNo: 'SF749110002950', signedAt: '2025--10-10', signedDocNo: 'ESIGN-TH-PO-2025-10081-3-2' }, { batchNo: 'SH202510-431', quantity: 17250, shippedAt: '2025--10-13', supTrackingNo: 'SF108629821731', platformTrackingNo: 'SF476649721582', signedAt: '2025--10-18', signedDocNo: 'ESIGN-TH-PO-2025-10081-3-3' }] },
    ],
  },
  {
    key: '21', billingNo: 'BILL-2025-09-021', period: '2025-09-01 ~ 2025-09-30',
    totalAmount: 229400, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-09082', subOrderNo: 'TH-PO-2025-09082-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 46000, unitPrice: 1.10, amount: 50600, batches: [{ batchNo: 'SH202509-432', quantity: 29900, shippedAt: '2025--09-03', supTrackingNo: 'SF903542558409', platformTrackingNo: 'SF215130707965', signedAt: '2025--09-07', signedDocNo: 'ESIGN-TH-PO-2025-09082-1-1' }, { batchNo: 'SH202509-433', quantity: 16100, shippedAt: '2025--09-07', supTrackingNo: 'SF251609147228', platformTrackingNo: 'SF952047299002', signedAt: '2025-09-07', signedDocNo: 'ESIGN-SH202509-432' }] },
      { parentOrderNo: 'TH-PO-2025-09082', subOrderNo: 'TH-PO-2025-09082-2', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 47000, unitPrice: 1.35, amount: 63450, batches: [{ batchNo: 'SH202509-434', quantity: 30560, shippedAt: '2025--09-03', supTrackingNo: 'SF720753806333', platformTrackingNo: 'SF770051296899', signedAt: '2025--09-06', signedDocNo: 'ESIGN-TH-PO-2025-09082-2-1' }, { batchNo: 'SH202509-435', quantity: 16440, shippedAt: '2025--09-08', supTrackingNo: 'SF788109833536', platformTrackingNo: 'SF266422547450', signedAt: '2025-09-07', signedDocNo: 'ESIGN-SH202509-432' }] },
      { parentOrderNo: 'TH-PO-2025-09083', subOrderNo: 'TH-PO-2025-09083-1', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 41000, unitPrice: 0.55, amount: 22550, batches: [{ batchNo: 'SH202509-436', quantity: 10240, shippedAt: '2025--09-03', supTrackingNo: 'SF901396117733', platformTrackingNo: 'SF483901493835', signedAt: '2025--09-06', signedDocNo: 'ESIGN-TH-PO-2025-09083-1-1' }, { batchNo: 'SH202509-437', quantity: 10240, shippedAt: '2025--09-10', supTrackingNo: 'SF253721503747', platformTrackingNo: 'SF401711945117', signedAt: '2025--09-14', signedDocNo: 'ESIGN-TH-PO-2025-09083-1-2' }, { batchNo: 'SH202509-438', quantity: 10240, shippedAt: '2025--09-11', supTrackingNo: 'SF759506816723', platformTrackingNo: 'SF892850996614', signedAt: '2025--09-14', signedDocNo: 'ESIGN-TH-PO-2025-09083-1-3' }, { batchNo: 'SH202509-439', quantity: 10280, shippedAt: '2025--09-21', supTrackingNo: 'SF825192643768', platformTrackingNo: 'SF434474130940', signedAt: '2025-09-07', signedDocNo: 'ESIGN-SH202509-432' }] },
      { parentOrderNo: 'TH-PO-2025-09083', subOrderNo: 'TH-PO-2025-09083-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 56000, unitPrice: 1.10, amount: 61600, batches: [{ batchNo: 'SH202509-440', quantity: 36400, shippedAt: '2025--09-03', supTrackingNo: 'SF423805105007', platformTrackingNo: 'SF158609852896', signedAt: '2025--09-08', signedDocNo: 'ESIGN-TH-PO-2025-09083-2-1' }, { batchNo: 'SH202509-441', quantity: 19600, shippedAt: '2025--09-08', supTrackingNo: 'SF646496284838', platformTrackingNo: 'SF755575571743', signedAt: '2025-09-07', signedDocNo: 'ESIGN-SH202509-432' }] },
      { parentOrderNo: 'TH-PO-2025-09083', subOrderNo: 'TH-PO-2025-09083-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 39000, unitPrice: 0.80, amount: 31200, batches: [{ batchNo: 'SH202509-442', quantity: 25350, shippedAt: '2025--09-03', supTrackingNo: 'SF451903525746', platformTrackingNo: 'SF525768624477', signedAt: '2025--09-07', signedDocNo: 'ESIGN-TH-PO-2025-09083-3-1' }, { batchNo: 'SH202509-443', quantity: 13650, shippedAt: '2025--09-10', supTrackingNo: 'SF938260665564', platformTrackingNo: 'SF950349263131', signedAt: '2025--09-14', signedDocNo: 'ESIGN-TH-PO-2025-09083-3-2' }] },
    ],
  },
  {
    key: '22', billingNo: 'BILL-2025-09-022', period: '2025-09-01 ~ 2025-09-30',
    totalAmount: 733510, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-09084', subOrderNo: 'TH-PO-2025-09084-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 38000, unitPrice: 0.85, amount: 32300, batches: [{ batchNo: 'SH202509-444', quantity: 38000, shippedAt: '2025--09-03', supTrackingNo: 'SF971657943339', platformTrackingNo: 'SF655760070901', signedAt: '2025--09-06', signedDocNo: 'ESIGN-TH-PO-2025-09084-1-1' }] },
      { parentOrderNo: 'TH-PO-2025-09084', subOrderNo: 'TH-PO-2025-09084-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 66000, unitPrice: 1.50, amount: 99000, batches: [{ batchNo: 'SH202509-445', quantity: 42900, shippedAt: '2025--09-03', supTrackingNo: 'SF541100917930', platformTrackingNo: 'SF800433694008', signedAt: '2025--09-07', signedDocNo: 'ESIGN-TH-PO-2025-09084-2-1' }, { batchNo: 'SH202509-446', quantity: 23100, shippedAt: '2025--09-08', supTrackingNo: 'SF658685143493', platformTrackingNo: 'SF327293641554', signedAt: '2025-09-06', signedDocNo: 'ESIGN-SH202509-444' }] },
      { parentOrderNo: 'TH-PO-2025-09085', subOrderNo: 'TH-PO-2025-09085-1', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 105000, unitPrice: 1.35, amount: 141750, batches: [{ batchNo: 'SH202509-447', quantity: 68240, shippedAt: '2025--09-03', supTrackingNo: 'SF579742159924', platformTrackingNo: 'SF365628557943', signedAt: '2025--09-07', signedDocNo: 'ESIGN-TH-PO-2025-09085-1-1' }, { batchNo: 'SH202509-448', quantity: 36760, shippedAt: '2025--09-07', supTrackingNo: 'SF226420144405', platformTrackingNo: 'SF771962115421', signedAt: '2025-09-06', signedDocNo: 'ESIGN-SH202509-444' }] },
      { parentOrderNo: 'TH-PO-2025-09085', subOrderNo: 'TH-PO-2025-09085-2', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 107000, unitPrice: 0.98, amount: 104860, batches: [{ batchNo: 'SH202509-449', quantity: 107000, shippedAt: '2025--09-03', supTrackingNo: 'SF869388466165', platformTrackingNo: 'SF276142409609', signedAt: '2025-09-06', signedDocNo: 'ESIGN-SH202509-444' }] },
      { parentOrderNo: 'TH-PO-2025-09086', subOrderNo: 'TH-PO-2025-09086-1', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 63000, unitPrice: 1.35, amount: 85050, batches: [{ batchNo: 'SH202509-450', quantity: 63000, shippedAt: '2025--09-03', supTrackingNo: 'SF904313219037', platformTrackingNo: 'SF232656141300', signedAt: '2025--09-08', signedDocNo: 'ESIGN-TH-PO-2025-09086-1-1' }] },
      { parentOrderNo: 'TH-PO-2025-09086', subOrderNo: 'TH-PO-2025-09086-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 33000, unitPrice: 1.50, amount: 49500, batches: [{ batchNo: 'SH202509-451', quantity: 21450, shippedAt: '2025--09-03', supTrackingNo: 'SF170969413467', platformTrackingNo: 'SF882813408006', signedAt: '2025--09-07', signedDocNo: 'ESIGN-TH-PO-2025-09086-2-1' }, { batchNo: 'SH202509-452', quantity: 11550, shippedAt: '2025--09-07', supTrackingNo: 'SF161676262500', platformTrackingNo: 'SF282823383819', signedAt: '2025--09-11', signedDocNo: 'ESIGN-TH-PO-2025-09086-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-09086', subOrderNo: 'TH-PO-2025-09086-3', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 77000, unitPrice: 1.10, amount: 84700, batches: [{ batchNo: 'SH202509-453', quantity: 77000, shippedAt: '2025--09-03', supTrackingNo: 'SF349603457227', platformTrackingNo: 'SF661527374178', signedAt: '2025--09-08', signedDocNo: 'ESIGN-TH-PO-2025-09086-3-1' }] },
      { parentOrderNo: 'TH-PO-2025-09087', subOrderNo: 'TH-PO-2025-09087-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 31000, unitPrice: 0.85, amount: 26350, batches: [{ batchNo: 'SH202509-454', quantity: 31000, shippedAt: '2025--09-03', supTrackingNo: 'SF293918137066', platformTrackingNo: 'SF142337576544', signedAt: '2025-09-06', signedDocNo: 'ESIGN-SH202509-444' }] },
      { parentOrderNo: 'TH-PO-2025-09087', subOrderNo: 'TH-PO-2025-09087-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 100000, unitPrice: 1.10, amount: 110000, batches: [{ batchNo: 'SH202509-455', quantity: 40000, shippedAt: '2025--09-03', supTrackingNo: 'SF371965068780', platformTrackingNo: 'SF450985964040', signedAt: '2025--09-06', signedDocNo: 'ESIGN-TH-PO-2025-09087-2-1' }, { batchNo: 'SH202509-456', quantity: 35000, shippedAt: '2025--09-09', supTrackingNo: 'SF510476621401', platformTrackingNo: 'SF650268636982', signedAt: '2025--09-12', signedDocNo: 'ESIGN-TH-PO-2025-09087-2-2' }, { batchNo: 'SH202509-457', quantity: 25000, shippedAt: '2025--09-11', supTrackingNo: 'SF174736403158', platformTrackingNo: 'SF614867756918', signedAt: '2025-09-06', signedDocNo: 'ESIGN-SH202509-444' }] },
    ],
  },
  {
    key: '23', billingNo: 'BILL-2025-08-023', period: '2025-08-01 ~ 2025-08-31',
    totalAmount: 655810, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-08088', subOrderNo: 'TH-PO-2025-08088-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 100000, unitPrice: 0.72, amount: 72000, batches: [{ batchNo: 'SH202508-458', quantity: 65000, shippedAt: '2025--08-03', supTrackingNo: 'SF719727682003', platformTrackingNo: 'SF434081914647', signedAt: '2025--08-06', signedDocNo: 'ESIGN-TH-PO-2025-08088-1-1' }, { batchNo: 'SH202508-459', quantity: 35000, shippedAt: '2025--08-08', supTrackingNo: 'SF645339976524', platformTrackingNo: 'SF950394020333', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-458' }] },
      { parentOrderNo: 'TH-PO-2025-08088', subOrderNo: 'TH-PO-2025-08088-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 55000, unitPrice: 1.25, amount: 68750, batches: [{ batchNo: 'SH202508-460', quantity: 22000, shippedAt: '2025--08-03', supTrackingNo: 'SF127530895459', platformTrackingNo: 'SF693706204534', signedAt: '2025--08-06', signedDocNo: 'ESIGN-TH-PO-2025-08088-2-1' }, { batchNo: 'SH202508-461', quantity: 19248, shippedAt: '2025--08-09', supTrackingNo: 'SF863815154283', platformTrackingNo: 'SF112357473974', signedAt: '2025--08-14', signedDocNo: 'ESIGN-TH-PO-2025-08088-2-2' }, { batchNo: 'SH202508-462', quantity: 13752, shippedAt: '2025--08-15', supTrackingNo: 'SF902033957947', platformTrackingNo: 'SF212989897853', signedAt: '2025--08-18', signedDocNo: 'ESIGN-TH-PO-2025-08088-2-3' }] },
      { parentOrderNo: 'TH-PO-2025-08088', subOrderNo: 'TH-PO-2025-08088-3', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 56000, unitPrice: 0.80, amount: 44800, batches: [{ batchNo: 'SH202508-463', quantity: 36400, shippedAt: '2025--08-03', supTrackingNo: 'SF258900730136', platformTrackingNo: 'SF407999202121', signedAt: '2025--08-07', signedDocNo: 'ESIGN-TH-PO-2025-08088-3-1' }, { batchNo: 'SH202508-464', quantity: 19600, shippedAt: '2025--08-07', supTrackingNo: 'SF553203914925', platformTrackingNo: 'SF604111014485', signedAt: '2025--08-10', signedDocNo: 'ESIGN-TH-PO-2025-08088-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-08089', subOrderNo: 'TH-PO-2025-08089-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 94000, unitPrice: 1.25, amount: 117500, batches: [{ batchNo: 'SH202508-465', quantity: 94000, shippedAt: '2025--08-03', supTrackingNo: 'SF577008872735', platformTrackingNo: 'SF358259425584', signedAt: '2025--08-06', signedDocNo: 'ESIGN-TH-PO-2025-08089-1-1' }] },
      { parentOrderNo: 'TH-PO-2025-08089', subOrderNo: 'TH-PO-2025-08089-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 67000, unitPrice: 0.80, amount: 53600, batches: [{ batchNo: 'SH202508-466', quantity: 67000, shippedAt: '2025--08-03', supTrackingNo: 'SF459640602106', platformTrackingNo: 'SF595287286538', signedAt: '2025--08-07', signedDocNo: 'ESIGN-TH-PO-2025-08089-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-08090', subOrderNo: 'TH-PO-2025-08090-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 47000, unitPrice: 0.90, amount: 42300, batches: [{ batchNo: 'SH202508-467', quantity: 18800, shippedAt: '2025--08-03', supTrackingNo: 'SF280842423019', platformTrackingNo: 'SF613031982692', signedAt: '2025--08-06', signedDocNo: 'ESIGN-TH-PO-2025-08090-1-1' }, { batchNo: 'SH202508-468', quantity: 16450, shippedAt: '2025--08-09', supTrackingNo: 'SF688929079884', platformTrackingNo: 'SF330941837832', signedAt: '2025--08-13', signedDocNo: 'ESIGN-TH-PO-2025-08090-1-2' }, { batchNo: 'SH202508-469', quantity: 11750, shippedAt: '2025--08-17', supTrackingNo: 'SF232510401994', platformTrackingNo: 'SF272187046599', signedAt: '2025--08-21', signedDocNo: 'ESIGN-TH-PO-2025-08090-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-08090', subOrderNo: 'TH-PO-2025-08090-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 117000, unitPrice: 0.80, amount: 93600, batches: [{ batchNo: 'SH202508-470', quantity: 76050, shippedAt: '2025--08-03', supTrackingNo: 'SF260321653017', platformTrackingNo: 'SF882075804310', signedAt: '2025--08-06', signedDocNo: 'ESIGN-TH-PO-2025-08090-2-1' }, { batchNo: 'SH202508-471', quantity: 40950, shippedAt: '2025--08-08', supTrackingNo: 'SF843239583508', platformTrackingNo: 'SF384751352634', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-458' }] },
      { parentOrderNo: 'TH-PO-2025-08090', subOrderNo: 'TH-PO-2025-08090-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 52000, unitPrice: 0.88, amount: 45760, batches: [{ batchNo: 'SH202508-472', quantity: 52000, shippedAt: '2025--08-03', supTrackingNo: 'SF372945690890', platformTrackingNo: 'SF607212982896', signedAt: '2025--08-07', signedDocNo: 'ESIGN-TH-PO-2025-08090-3-1' }] },
      { parentOrderNo: 'TH-PO-2025-08091', subOrderNo: 'TH-PO-2025-08091-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 31000, unitPrice: 0.90, amount: 27900, batches: [{ batchNo: 'SH202508-473', quantity: 31000, shippedAt: '2025--08-03', supTrackingNo: 'SF509742378907', platformTrackingNo: 'SF794437307398', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-458' }] },
      { parentOrderNo: 'TH-PO-2025-08091', subOrderNo: 'TH-PO-2025-08091-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 112000, unitPrice: 0.80, amount: 89600, batches: [{ batchNo: 'SH202508-474', quantity: 112000, shippedAt: '2025--08-03', supTrackingNo: 'SF315025270085', platformTrackingNo: 'SF812545794982', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-458' }] },
    ],
  },
  {
    key: '24', billingNo: 'BILL-2025-08-024', period: '2025-08-01 ~ 2025-08-31',
    totalAmount: 410250, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-08092', subOrderNo: 'TH-PO-2025-08092-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 45000, unitPrice: 0.90, amount: 40500, batches: [{ batchNo: 'SH202508-475', quantity: 45000, shippedAt: '2025--08-03', supTrackingNo: 'SF574911216420', platformTrackingNo: 'SF898098061664', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-475' }] },
      { parentOrderNo: 'TH-PO-2025-08092', subOrderNo: 'TH-PO-2025-08092-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 80000, unitPrice: 0.80, amount: 64000, batches: [{ batchNo: 'SH202508-476', quantity: 52000, shippedAt: '2025--08-03', supTrackingNo: 'SF290811069045', platformTrackingNo: 'SF333448408697', signedAt: '2025--08-08', signedDocNo: 'ESIGN-TH-PO-2025-08092-2-1' }, { batchNo: 'SH202508-477', quantity: 28000, shippedAt: '2025--08-08', supTrackingNo: 'SF267003033571', platformTrackingNo: 'SF774458683681', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-475' }] },
      { parentOrderNo: 'TH-PO-2025-08092', subOrderNo: 'TH-PO-2025-08092-3', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 109000, unitPrice: 1.25, amount: 136250, batches: [{ batchNo: 'SH202508-478', quantity: 70848, shippedAt: '2025--08-03', supTrackingNo: 'SF626351199913', platformTrackingNo: 'SF194751183616', signedAt: '2025--08-07', signedDocNo: 'ESIGN-TH-PO-2025-08092-3-1' }, { batchNo: 'SH202508-479', quantity: 38152, shippedAt: '2025--08-09', supTrackingNo: 'SF805231301283', platformTrackingNo: 'SF979972881986', signedAt: '2025-08-09', signedDocNo: 'ESIGN-SH202508-475' }] },
      { parentOrderNo: 'TH-PO-2025-08093', subOrderNo: 'TH-PO-2025-08093-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 78000, unitPrice: 1.25, amount: 97500, batches: [{ batchNo: 'SH202508-480', quantity: 31200, shippedAt: '2025--08-03', supTrackingNo: 'SF961332145358', platformTrackingNo: 'SF480038804602', signedAt: '2025--08-07', signedDocNo: 'ESIGN-TH-PO-2025-08093-1-1' }, { batchNo: 'SH202508-481', quantity: 27300, shippedAt: '2025--08-09', supTrackingNo: 'SF298730008062', platformTrackingNo: 'SF448004290576', signedAt: '2025--08-13', signedDocNo: 'ESIGN-TH-PO-2025-08093-1-2' }, { batchNo: 'SH202508-482', quantity: 19500, shippedAt: '2025--08-13', supTrackingNo: 'SF408286474495', platformTrackingNo: 'SF989309877693', signedAt: '2025--08-16', signedDocNo: 'ESIGN-TH-PO-2025-08093-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-08093', subOrderNo: 'TH-PO-2025-08093-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 90000, unitPrice: 0.80, amount: 72000, batches: [{ batchNo: 'SH202508-483', quantity: 58500, shippedAt: '2025--08-03', supTrackingNo: 'SF371013013359', platformTrackingNo: 'SF364814216258', signedAt: '2025--08-06', signedDocNo: 'ESIGN-TH-PO-2025-08093-2-1' }, { batchNo: 'SH202508-484', quantity: 31500, shippedAt: '2025--08-09', supTrackingNo: 'SF911393451108', platformTrackingNo: 'SF937758748549', signedAt: '2025--08-14', signedDocNo: 'ESIGN-TH-PO-2025-08093-2-2' }] },
    ],
  },
  {
    key: '25', billingNo: 'BILL-2025-07-025', period: '2025-07-01 ~ 2025-07-31',
    totalAmount: 794550, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-07094', subOrderNo: 'TH-PO-2025-07094-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 52000, unitPrice: 1.10, amount: 57200, batches: [{ batchNo: 'SH202507-485', quantity: 52000, shippedAt: '2025--07-03', supTrackingNo: 'SF752465575906', platformTrackingNo: 'SF873215259556', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07094-1-1' }] },
      { parentOrderNo: 'TH-PO-2025-07094', subOrderNo: 'TH-PO-2025-07094-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 119000, unitPrice: 1.20, amount: 142800, batches: [{ batchNo: 'SH202507-486', quantity: 77350, shippedAt: '2025--07-03', supTrackingNo: 'SF310231641923', platformTrackingNo: 'SF645333662778', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07094-2-1' }, { batchNo: 'SH202507-487', quantity: 41650, shippedAt: '2025--07-09', supTrackingNo: 'SF160517194624', platformTrackingNo: 'SF762424073287', signedAt: '2025--07-12', signedDocNo: 'ESIGN-TH-PO-2025-07094-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-07095', subOrderNo: 'TH-PO-2025-07095-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 91000, unitPrice: 0.85, amount: 77350, batches: [{ batchNo: 'SH202507-488', quantity: 91000, shippedAt: '2025--07-03', supTrackingNo: 'SF455916282315', platformTrackingNo: 'SF121730627400', signedAt: '2025-07-08', signedDocNo: 'ESIGN-SH202507-485' }] },
      { parentOrderNo: 'TH-PO-2025-07095', subOrderNo: 'TH-PO-2025-07095-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 48000, unitPrice: 1.50, amount: 72000, batches: [{ batchNo: 'SH202507-489', quantity: 31200, shippedAt: '2025--07-03', supTrackingNo: 'SF679161225398', platformTrackingNo: 'SF503128505755', signedAt: '2025--07-06', signedDocNo: 'ESIGN-TH-PO-2025-07095-2-1' }, { batchNo: 'SH202507-490', quantity: 16800, shippedAt: '2025--07-07', supTrackingNo: 'SF536635564628', platformTrackingNo: 'SF209891104821', signedAt: '2025--07-11', signedDocNo: 'ESIGN-TH-PO-2025-07095-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-07096', subOrderNo: 'TH-PO-2025-07096-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 50000, unitPrice: 1.50, amount: 75000, batches: [{ batchNo: 'SH202507-491', quantity: 20000, shippedAt: '2025--07-03', supTrackingNo: 'SF636701956994', platformTrackingNo: 'SF450680559005', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07096-1-1' }, { batchNo: 'SH202507-492', quantity: 17500, shippedAt: '2025--07-08', supTrackingNo: 'SF718341042388', platformTrackingNo: 'SF778299225256', signedAt: '2025--07-13', signedDocNo: 'ESIGN-TH-PO-2025-07096-1-2' }, { batchNo: 'SH202507-493', quantity: 12500, shippedAt: '2025--07-15', supTrackingNo: 'SF292476615352', platformTrackingNo: 'SF436632596465', signedAt: '2025--07-18', signedDocNo: 'ESIGN-TH-PO-2025-07096-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-07096', subOrderNo: 'TH-PO-2025-07096-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 118000, unitPrice: 1.20, amount: 141600, batches: [{ batchNo: 'SH202507-494', quantity: 118000, shippedAt: '2025--07-03', supTrackingNo: 'SF531957036292', platformTrackingNo: 'SF136797058268', signedAt: '2025-07-08', signedDocNo: 'ESIGN-SH202507-485' }] },
      { parentOrderNo: 'TH-PO-2025-07096', subOrderNo: 'TH-PO-2025-07096-3', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 53000, unitPrice: 0.80, amount: 42400, batches: [{ batchNo: 'SH202507-495', quantity: 34450, shippedAt: '2025--07-03', supTrackingNo: 'SF214098169516', platformTrackingNo: 'SF649483890039', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07096-3-1' }, { batchNo: 'SH202507-496', quantity: 18550, shippedAt: '2025--07-08', supTrackingNo: 'SF478979306783', platformTrackingNo: 'SF452111639457', signedAt: '2025--07-12', signedDocNo: 'ESIGN-TH-PO-2025-07096-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-07097', subOrderNo: 'TH-PO-2025-07097-1', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 120000, unitPrice: 0.80, amount: 96000, batches: [{ batchNo: 'SH202507-497', quantity: 48000, shippedAt: '2025--07-03', supTrackingNo: 'SF387811752671', platformTrackingNo: 'SF371483526792', signedAt: '2025--07-07', signedDocNo: 'ESIGN-TH-PO-2025-07097-1-1' }, { batchNo: 'SH202507-498', quantity: 42000, shippedAt: '2025--07-07', supTrackingNo: 'SF964390763960', platformTrackingNo: 'SF890737987526', signedAt: '2025--07-11', signedDocNo: 'ESIGN-TH-PO-2025-07097-1-2' }, { batchNo: 'SH202507-499', quantity: 30000, shippedAt: '2025--07-11', supTrackingNo: 'SF562707927107', platformTrackingNo: 'SF284550887103', signedAt: '2025-07-08', signedDocNo: 'ESIGN-SH202507-485' }] },
      { parentOrderNo: 'TH-PO-2025-07097', subOrderNo: 'TH-PO-2025-07097-2', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 82000, unitPrice: 1.10, amount: 90200, batches: [{ batchNo: 'SH202507-500', quantity: 53300, shippedAt: '2025--07-03', supTrackingNo: 'SF514662015490', platformTrackingNo: 'SF965347817151', signedAt: '2025--07-07', signedDocNo: 'ESIGN-TH-PO-2025-07097-2-1' }, { batchNo: 'SH202507-501', quantity: 28700, shippedAt: '2025--07-08', supTrackingNo: 'SF422266054018', platformTrackingNo: 'SF447978585341', signedAt: '2025--07-11', signedDocNo: 'ESIGN-TH-PO-2025-07097-2-2' }] },
    ],
  },
  {
    key: '26', billingNo: 'BILL-2025-07-026', period: '2025-07-01 ~ 2025-07-31',
    totalAmount: 533250, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'factory', dimensionName: '波司登（Bosideng）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-07098', subOrderNo: 'TH-PO-2025-07098-1', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 51000, unitPrice: 0.80, amount: 40800, batches: [{ batchNo: 'SH202507-502', quantity: 12750, shippedAt: '2025--07-03', supTrackingNo: 'SF701617554377', platformTrackingNo: 'SF202984904161', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07098-1-1' }, { batchNo: 'SH202507-503', quantity: 12750, shippedAt: '2025--07-09', supTrackingNo: 'SF778541594085', platformTrackingNo: 'SF632117354605', signedAt: '2025--07-14', signedDocNo: 'ESIGN-TH-PO-2025-07098-1-2' }, { batchNo: 'SH202507-504', quantity: 12750, shippedAt: '2025--07-11', supTrackingNo: 'SF821307297093', platformTrackingNo: 'SF766428588429', signedAt: '2025--07-15', signedDocNo: 'ESIGN-TH-PO-2025-07098-1-3' }, { batchNo: 'SH202507-505', quantity: 12750, shippedAt: '2025--07-24', supTrackingNo: 'SF324760339804', platformTrackingNo: 'SF310343439553', signedAt: '2025-07-07', signedDocNo: 'ESIGN-SH202507-502' }] },
      { parentOrderNo: 'TH-PO-2025-07098', subOrderNo: 'TH-PO-2025-07098-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 82000, unitPrice: 0.85, amount: 69700, batches: [{ batchNo: 'SH202507-506', quantity: 32800, shippedAt: '2025--07-03', supTrackingNo: 'SF427626646882', platformTrackingNo: 'SF204099477227', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07098-2-1' }, { batchNo: 'SH202507-507', quantity: 28700, shippedAt: '2025--07-07', supTrackingNo: 'SF703751154073', platformTrackingNo: 'SF640478059617', signedAt: '2025--07-11', signedDocNo: 'ESIGN-TH-PO-2025-07098-2-2' }, { batchNo: 'SH202507-508', quantity: 20500, shippedAt: '2025--07-13', supTrackingNo: 'SF196325834133', platformTrackingNo: 'SF790038122566', signedAt: '2025-07-07', signedDocNo: 'ESIGN-SH202507-502' }] },
      { parentOrderNo: 'TH-PO-2025-07098', subOrderNo: 'TH-PO-2025-07098-3', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 106000, unitPrice: 1.20, amount: 127200, batches: [{ batchNo: 'SH202507-509', quantity: 68900, shippedAt: '2025--07-03', supTrackingNo: 'SF285572450017', platformTrackingNo: 'SF420568587905', signedAt: '2025--07-06', signedDocNo: 'ESIGN-TH-PO-2025-07098-3-1' }, { batchNo: 'SH202507-510', quantity: 37100, shippedAt: '2025--07-07', supTrackingNo: 'SF960317826944', platformTrackingNo: 'SF617103184787', signedAt: '2025--07-11', signedDocNo: 'ESIGN-TH-PO-2025-07098-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-07099', subOrderNo: 'TH-PO-2025-07099-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 99000, unitPrice: 1.50, amount: 148500, batches: [{ batchNo: 'SH202507-511', quantity: 64350, shippedAt: '2025--07-03', supTrackingNo: 'SF303450030993', platformTrackingNo: 'SF149159230489', signedAt: '2025--07-07', signedDocNo: 'ESIGN-TH-PO-2025-07099-1-1' }, { batchNo: 'SH202507-512', quantity: 34650, shippedAt: '2025--07-09', supTrackingNo: 'SF719628755610', platformTrackingNo: 'SF263473496339', signedAt: '2025--07-13', signedDocNo: 'ESIGN-TH-PO-2025-07099-1-2' }] },
      { parentOrderNo: 'TH-PO-2025-07099', subOrderNo: 'TH-PO-2025-07099-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 119000, unitPrice: 0.85, amount: 101150, batches: [{ batchNo: 'SH202507-513', quantity: 47600, shippedAt: '2025--07-03', supTrackingNo: 'SF986239835712', platformTrackingNo: 'SF553297071863', signedAt: '2025--07-08', signedDocNo: 'ESIGN-TH-PO-2025-07099-2-1' }, { batchNo: 'SH202507-514', quantity: 41640, shippedAt: '2025--07-08', supTrackingNo: 'SF999310772891', platformTrackingNo: 'SF561805974462', signedAt: '2025--07-13', signedDocNo: 'ESIGN-TH-PO-2025-07099-2-2' }, { batchNo: 'SH202507-515', quantity: 29760, shippedAt: '2025--07-17', supTrackingNo: 'SF428463045436', platformTrackingNo: 'SF534130806261', signedAt: '2025--07-22', signedDocNo: 'ESIGN-TH-PO-2025-07099-2-3' }] },
      { parentOrderNo: 'TH-PO-2025-07099', subOrderNo: 'TH-PO-2025-07099-3', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 34000, unitPrice: 1.35, amount: 45900, batches: [{ batchNo: 'SH202507-516', quantity: 22100, shippedAt: '2025--07-03', supTrackingNo: 'SF933005706518', platformTrackingNo: 'SF290907172011', signedAt: '2025--07-06', signedDocNo: 'ESIGN-TH-PO-2025-07099-3-1' }, { batchNo: 'SH202507-517', quantity: 11900, shippedAt: '2025--07-08', supTrackingNo: 'SF143491637722', platformTrackingNo: 'SF187717727276', signedAt: '2025--07-11', signedDocNo: 'ESIGN-TH-PO-2025-07099-3-2' }] },
    ],
  },
  {
    key: '27', billingNo: 'BILL-2025-06-027', period: '2025-06-01 ~ 2025-06-30',
    totalAmount: 726920, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-06100', subOrderNo: 'TH-PO-2025-06100-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 63000, unitPrice: 0.90, amount: 56700, batches: [{ batchNo: 'SH202506-518', quantity: 40950, shippedAt: '2025--06-03', supTrackingNo: 'SF711552229213', platformTrackingNo: 'SF707297015444', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06100-1-1' }, { batchNo: 'SH202506-519', quantity: 22050, shippedAt: '2025--06-09', supTrackingNo: 'SF963341528602', platformTrackingNo: 'SF785908047210', signedAt: '2025--06-13', signedDocNo: 'ESIGN-TH-PO-2025-06100-1-2' }] },
      { parentOrderNo: 'TH-PO-2025-06100', subOrderNo: 'TH-PO-2025-06100-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 105000, unitPrice: 1.25, amount: 131250, batches: [{ batchNo: 'SH202506-520', quantity: 68248, shippedAt: '2025--06-03', supTrackingNo: 'SF264988773807', platformTrackingNo: 'SF723406770954', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06100-2-1' }, { batchNo: 'SH202506-521', quantity: 36752, shippedAt: '2025--06-07', supTrackingNo: 'SF963722177122', platformTrackingNo: 'SF389527568106', signedAt: '2025--06-10', signedDocNo: 'ESIGN-TH-PO-2025-06100-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-06100', subOrderNo: 'TH-PO-2025-06100-3', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 79000, unitPrice: 0.72, amount: 56880, batches: [{ batchNo: 'SH202506-522', quantity: 31600, shippedAt: '2025--06-03', supTrackingNo: 'SF401387302916', platformTrackingNo: 'SF256349582652', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06100-3-1' }, { batchNo: 'SH202506-523', quantity: 27650, shippedAt: '2025--06-10', supTrackingNo: 'SF464552347164', platformTrackingNo: 'SF360663771768', signedAt: '2025--06-13', signedDocNo: 'ESIGN-TH-PO-2025-06100-3-2' }, { batchNo: 'SH202506-524', quantity: 19750, shippedAt: '2025--06-11', supTrackingNo: 'SF123074457091', platformTrackingNo: 'SF999099288622', signedAt: '2025--06-16', signedDocNo: 'ESIGN-TH-PO-2025-06100-3-3' }] },
      { parentOrderNo: 'TH-PO-2025-06101', subOrderNo: 'TH-PO-2025-06101-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 119000, unitPrice: 0.72, amount: 85680, batches: [{ batchNo: 'SH202506-525', quantity: 47600, shippedAt: '2025--06-03', supTrackingNo: 'SF588525573162', platformTrackingNo: 'SF393435895045', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06101-1-1' }, { batchNo: 'SH202506-526', quantity: 41650, shippedAt: '2025--06-10', supTrackingNo: 'SF197261917326', platformTrackingNo: 'SF586138482099', signedAt: '2025--06-15', signedDocNo: 'ESIGN-TH-PO-2025-06101-1-2' }, { batchNo: 'SH202506-527', quantity: 29750, shippedAt: '2025--06-13', supTrackingNo: 'SF670197681926', platformTrackingNo: 'SF511746441386', signedAt: '2025--06-17', signedDocNo: 'ESIGN-TH-PO-2025-06101-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-06101', subOrderNo: 'TH-PO-2025-06101-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 37000, unitPrice: 1.25, amount: 46250, batches: [{ batchNo: 'SH202506-528', quantity: 24048, shippedAt: '2025--06-03', supTrackingNo: 'SF878725344094', platformTrackingNo: 'SF544558300629', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06101-2-1' }, { batchNo: 'SH202506-529', quantity: 12952, shippedAt: '2025--06-08', supTrackingNo: 'SF289102892419', platformTrackingNo: 'SF322620738943', signedAt: '2025--06-13', signedDocNo: 'ESIGN-TH-PO-2025-06101-2-2' }] },
      { parentOrderNo: 'TH-PO-2025-06101', subOrderNo: 'TH-PO-2025-06101-3', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 37000, unitPrice: 0.90, amount: 33300, batches: [{ batchNo: 'SH202506-530', quantity: 37000, shippedAt: '2025--06-03', supTrackingNo: 'SF317774744552', platformTrackingNo: 'SF504903650217', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06101-3-1' }] },
      { parentOrderNo: 'TH-PO-2025-06102', subOrderNo: 'TH-PO-2025-06102-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 45000, unitPrice: 1.25, amount: 56250, batches: [{ batchNo: 'SH202506-531', quantity: 18000, shippedAt: '2025--06-03', supTrackingNo: 'SF754934352045', platformTrackingNo: 'SF295189527983', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06102-1-1' }, { batchNo: 'SH202506-532', quantity: 15748, shippedAt: '2025--06-10', supTrackingNo: 'SF484620049657', platformTrackingNo: 'SF277572197362', signedAt: '2025--06-15', signedDocNo: 'ESIGN-TH-PO-2025-06102-1-2' }, { batchNo: 'SH202506-533', quantity: 11252, shippedAt: '2025--06-15', supTrackingNo: 'SF409625875675', platformTrackingNo: 'SF521024693954', signedAt: '2025--06-20', signedDocNo: 'ESIGN-TH-PO-2025-06102-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-06102', subOrderNo: 'TH-PO-2025-06102-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 36000, unitPrice: 0.88, amount: 31680, batches: [{ batchNo: 'SH202506-534', quantity: 36000, shippedAt: '2025--06-03', supTrackingNo: 'SF326248978305', platformTrackingNo: 'SF814120276299', signedAt: '2025--06-06', signedDocNo: 'ESIGN-TH-PO-2025-06102-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-06102', subOrderNo: 'TH-PO-2025-06102-3', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 82000, unitPrice: 0.72, amount: 59040, batches: [{ batchNo: 'SH202506-535', quantity: 53300, shippedAt: '2025--06-03', supTrackingNo: 'SF245648849791', platformTrackingNo: 'SF291759000690', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06102-3-1' }, { batchNo: 'SH202506-536', quantity: 28700, shippedAt: '2025--06-07', supTrackingNo: 'SF882995987275', platformTrackingNo: 'SF881542418920', signedAt: '2025-06-06', signedDocNo: 'ESIGN-SH202506-518' }] },
      { parentOrderNo: 'TH-PO-2025-06103', subOrderNo: 'TH-PO-2025-06103-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 88000, unitPrice: 0.88, amount: 77440, batches: [{ batchNo: 'SH202506-537', quantity: 88000, shippedAt: '2025--06-03', supTrackingNo: 'SF786440188094', platformTrackingNo: 'SF741655884287', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06103-1-1' }] },
      { parentOrderNo: 'TH-PO-2025-06103', subOrderNo: 'TH-PO-2025-06103-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 43000, unitPrice: 1.25, amount: 53750, batches: [{ batchNo: 'SH202506-538', quantity: 43000, shippedAt: '2025--06-03', supTrackingNo: 'SF411853495593', platformTrackingNo: 'SF852901221143', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06103-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-06103', subOrderNo: 'TH-PO-2025-06103-3', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 43000, unitPrice: 0.90, amount: 38700, batches: [{ batchNo: 'SH202506-539', quantity: 27950, shippedAt: '2025--06-03', supTrackingNo: 'SF459233619065', platformTrackingNo: 'SF404347788967', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06103-3-1' }, { batchNo: 'SH202506-540', quantity: 15050, shippedAt: '2025--06-09', supTrackingNo: 'SF816797287397', platformTrackingNo: 'SF307441728275', signedAt: '2025--06-14', signedDocNo: 'ESIGN-TH-PO-2025-06103-3-2' }] },
    ],
  },
  {
    key: '28', billingNo: 'BILL-2025-06-028', period: '2025-06-01 ~ 2025-06-30',
    totalAmount: 716810, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'factory', dimensionName: '雪中飞（Snow Flying）',
    settlementMode: 'monthly', generatedAt: '2025-01-01',
    items: [
      { parentOrderNo: 'TH-PO-2025-06104', subOrderNo: 'TH-PO-2025-06104-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 37000, unitPrice: 1.25, amount: 46250, batches: [{ batchNo: 'SH202506-541', quantity: 14800, shippedAt: '2025--06-03', supTrackingNo: 'SF848696919795', platformTrackingNo: 'SF890874975117', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06104-1-1' }, { batchNo: 'SH202506-542', quantity: 12952, shippedAt: '2025--06-07', supTrackingNo: 'SF384737453791', platformTrackingNo: 'SF563456656182', signedAt: '2025--06-12', signedDocNo: 'ESIGN-TH-PO-2025-06104-1-2' }, { batchNo: 'SH202506-543', quantity: 9248, shippedAt: '2025--06-17', supTrackingNo: 'SF879893148317', platformTrackingNo: 'SF731337659962', signedAt: '2025--06-21', signedDocNo: 'ESIGN-TH-PO-2025-06104-1-3' }] },
      { parentOrderNo: 'TH-PO-2025-06104', subOrderNo: 'TH-PO-2025-06104-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 54000, unitPrice: 0.90, amount: 48600, batches: [{ batchNo: 'SH202506-544', quantity: 35100, shippedAt: '2025--06-03', supTrackingNo: 'SF802375909504', platformTrackingNo: 'SF623062150007', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06104-2-1' }, { batchNo: 'SH202506-545', quantity: 18900, shippedAt: '2025--06-09', supTrackingNo: 'SF299966152730', platformTrackingNo: 'SF204341008026', signedAt: '2025-06-06', signedDocNo: 'ESIGN-SH202506-541' }] },
      { parentOrderNo: 'TH-PO-2025-06105', subOrderNo: 'TH-PO-2025-06105-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 101000, unitPrice: 0.90, amount: 90900, batches: [{ batchNo: 'SH202506-546', quantity: 40400, shippedAt: '2025--06-03', supTrackingNo: 'SF468935934775', platformTrackingNo: 'SF197300055920', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06105-1-1' }, { batchNo: 'SH202506-547', quantity: 35350, shippedAt: '2025--06-08', supTrackingNo: 'SF917002972378', platformTrackingNo: 'SF438750222019', signedAt: '2025--06-12', signedDocNo: 'ESIGN-TH-PO-2025-06105-1-2' }, { batchNo: 'SH202506-548', quantity: 25250, shippedAt: '2025--06-17', supTrackingNo: 'SF424637554196', platformTrackingNo: 'SF615901943089', signedAt: '2025-06-06', signedDocNo: 'ESIGN-SH202506-541' }] },
      { parentOrderNo: 'TH-PO-2025-06105', subOrderNo: 'TH-PO-2025-06105-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 36000, unitPrice: 0.72, amount: 25920, batches: [{ batchNo: 'SH202506-549', quantity: 9000, shippedAt: '2025--06-03', supTrackingNo: 'SF314273453366', platformTrackingNo: 'SF230998552841', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06105-2-1' }, { batchNo: 'SH202506-550', quantity: 9000, shippedAt: '2025--06-10', supTrackingNo: 'SF552252994280', platformTrackingNo: 'SF266877689129', signedAt: '2025--06-15', signedDocNo: 'ESIGN-TH-PO-2025-06105-2-2' }, { batchNo: 'SH202506-551', quantity: 9000, shippedAt: '2025--06-13', supTrackingNo: 'SF548148354736', platformTrackingNo: 'SF727010213563', signedAt: '2025--06-16', signedDocNo: 'ESIGN-TH-PO-2025-06105-2-3' }, { batchNo: 'SH202506-552', quantity: 9000, shippedAt: '2025--06-24', supTrackingNo: 'SF300642268239', platformTrackingNo: 'SF189244872831', signedAt: '2025-06-06', signedDocNo: 'ESIGN-SH202506-541' }] },
      { parentOrderNo: 'TH-PO-2025-06105', subOrderNo: 'TH-PO-2025-06105-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 92000, unitPrice: 0.88, amount: 80960, batches: [{ batchNo: 'SH202506-553', quantity: 59800, shippedAt: '2025--06-03', supTrackingNo: 'SF162854694491', platformTrackingNo: 'SF593941483371', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06105-3-1' }, { batchNo: 'SH202506-554', quantity: 32200, shippedAt: '2025--06-09', supTrackingNo: 'SF732084348726', platformTrackingNo: 'SF275082124507', signedAt: '2025--06-12', signedDocNo: 'ESIGN-TH-PO-2025-06105-3-2' }] },
      { parentOrderNo: 'TH-PO-2025-06106', subOrderNo: 'TH-PO-2025-06106-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 85000, unitPrice: 0.80, amount: 68000, batches: [{ batchNo: 'SH202506-555', quantity: 55250, shippedAt: '2025--06-03', supTrackingNo: 'SF628132061606', platformTrackingNo: 'SF105941298800', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06106-1-1' }, { batchNo: 'SH202506-556', quantity: 29750, shippedAt: '2025--06-07', supTrackingNo: 'SF930312582992', platformTrackingNo: 'SF683399274824', signedAt: '2025-06-06', signedDocNo: 'ESIGN-SH202506-541' }] },
      { parentOrderNo: 'TH-PO-2025-06106', subOrderNo: 'TH-PO-2025-06106-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 54000, unitPrice: 0.90, amount: 48600, batches: [{ batchNo: 'SH202506-557', quantity: 54000, shippedAt: '2025--06-03', supTrackingNo: 'SF861181015201', platformTrackingNo: 'SF481723744536', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06106-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-06106', subOrderNo: 'TH-PO-2025-06106-3', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 69000, unitPrice: 0.72, amount: 49680, batches: [{ batchNo: 'SH202506-558', quantity: 69000, shippedAt: '2025--06-03', supTrackingNo: 'SF169436822986', platformTrackingNo: 'SF150783022571', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06106-3-1' }] },
      { parentOrderNo: 'TH-PO-2025-06107', subOrderNo: 'TH-PO-2025-06107-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 96000, unitPrice: 0.72, amount: 69120, batches: [{ batchNo: 'SH202506-559', quantity: 62400, shippedAt: '2025--06-03', supTrackingNo: 'SF855433096260', platformTrackingNo: 'SF250304409534', signedAt: '2025--06-07', signedDocNo: 'ESIGN-TH-PO-2025-06107-1-1' }, { batchNo: 'SH202506-560', quantity: 33600, shippedAt: '2025--06-09', supTrackingNo: 'SF281197910091', platformTrackingNo: 'SF993001892476', signedAt: '2025-06-06', signedDocNo: 'ESIGN-SH202506-541' }] },
      { parentOrderNo: 'TH-PO-2025-06107', subOrderNo: 'TH-PO-2025-06107-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 81000, unitPrice: 0.88, amount: 71280, batches: [{ batchNo: 'SH202506-561', quantity: 81000, shippedAt: '2025--06-03', supTrackingNo: 'SF904065939484', platformTrackingNo: 'SF744339211168', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06107-2-1' }] },
      { parentOrderNo: 'TH-PO-2025-06107', subOrderNo: 'TH-PO-2025-06107-3', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 94000, unitPrice: 1.25, amount: 117500, batches: [{ batchNo: 'SH202506-562', quantity: 94000, shippedAt: '2025--06-03', supTrackingNo: 'SF512477335111', platformTrackingNo: 'SF803844397637', signedAt: '2025--06-08', signedDocNo: 'ESIGN-TH-PO-2025-06107-3-1' }] },
    ],
  },
];

export const supplierBillings: BillingItem[] = [
{
    key: '2', billingNo: 'BILL-S-202605-002', period: '2026-05-01 ~ 2026-05-31',
    totalAmount: 508690, status: '已确认', invoiceUploaded: true,
    paymentDueDate: '2026-07-15', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '杭州信达标签印刷有限公司',
    settlementMode: 'monthly', generatedAt: '2026-06-01',
    items: [
      { parentOrderNo: 'TH-PO-202605001', subOrderNo: 'TH-PO-202605001-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 65000, unitPrice: 1.20, amount: 78000, batches: [{ batchNo: 'SH202605-001', quantity: 26000, shippedAt: '2026-05-03', supTrackingNo: 'SF566854953850', platformTrackingNo: 'SF406404042870', signedAt: '2026-05-06', signedDocNo: 'ESIGN-TH-PO-202605001-1-1' }, { batchNo: 'SH202605-002', quantity: 22750, shippedAt: '2026-05-08', supTrackingNo: 'SF941629821539', platformTrackingNo: 'SF213114812281', signedAt: '2026-05-11', signedDocNo: 'ESIGN-TH-PO-202605001-1-2' }, { batchNo: 'SH202605-003', quantity: 16250, shippedAt: '2026-05-11', supTrackingNo: 'SF481597082643', platformTrackingNo: 'SF390355792387', signedAt: '2026-05-07', signedDocNo: 'ESIGN-SH202605-001' }] },
      { parentOrderNo: 'TH-PO-202605001', subOrderNo: 'TH-PO-202605001-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 35000, unitPrice: 1.50, amount: 52500, batches: [{ batchNo: 'SH202605-004', quantity: 14000, shippedAt: '2026-05-03', supTrackingNo: 'SF705928833000', platformTrackingNo: 'SF781304820142', signedAt: '2026-05-07', signedDocNo: 'ESIGN-TH-PO-202605001-2-1' }, { batchNo: 'SH202605-005', quantity: 12250, shippedAt: '2026-05-09', supTrackingNo: 'SF873919986476', platformTrackingNo: 'SF147543377362', signedAt: '2026-05-14', signedDocNo: 'ESIGN-TH-PO-202605001-2-2' }, { batchNo: 'SH202605-006', quantity: 8750, shippedAt: '2026-05-13', supTrackingNo: 'SF357076632102', platformTrackingNo: 'SF211095701426', signedAt: '2026-05-17', signedDocNo: 'ESIGN-TH-PO-202605001-2-3' }] },
      { parentOrderNo: 'TH-PO-202605001', subOrderNo: 'TH-PO-202605001-3', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 78000, unitPrice: 0.98, amount: 76440, batches: [{ batchNo: 'SH202605-007', quantity: 78000, shippedAt: '2026-05-03', supTrackingNo: 'SF835339233454', platformTrackingNo: 'SF869945806981', signedAt: '2026-05-07', signedDocNo: 'ESIGN-SH202605-001' }] },
      { parentOrderNo: 'TH-PO-202605002', subOrderNo: 'TH-PO-202605002-1', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 98000, unitPrice: 1.35, amount: 132300, batches: [{ batchNo: 'SH202605-008', quantity: 39200, shippedAt: '2026-05-03', supTrackingNo: 'SF397982492151', platformTrackingNo: 'SF858663022120', signedAt: '2026-05-07', signedDocNo: 'ESIGN-TH-PO-202605002-1-1' }, { batchNo: 'SH202605-009', quantity: 34300, shippedAt: '2026-05-08', supTrackingNo: 'SF953703406284', platformTrackingNo: 'SF349348354829', signedAt: '2026-05-13', signedDocNo: 'ESIGN-TH-PO-202605002-1-2' }, { batchNo: 'SH202605-010', quantity: 24500, shippedAt: '2026-05-11', supTrackingNo: 'SF332212511873', platformTrackingNo: 'SF446680801999', signedAt: '2026-05-15', signedDocNo: 'ESIGN-TH-PO-202605002-1-3' }] },
      { parentOrderNo: 'TH-PO-202605002', subOrderNo: 'TH-PO-202605002-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 57000, unitPrice: 1.20, amount: 68400, batches: [{ batchNo: 'SH202605-011', quantity: 22800, shippedAt: '2026-05-03', supTrackingNo: 'SF256589576361', platformTrackingNo: 'SF251461507038', signedAt: '2026-05-08', signedDocNo: 'ESIGN-TH-PO-202605002-2-1' }, { batchNo: 'SH202605-012', quantity: 19950, shippedAt: '2026-05-08', supTrackingNo: 'SF690821577339', platformTrackingNo: 'SF921467220156', signedAt: '2026-05-13', signedDocNo: 'ESIGN-TH-PO-202605002-2-2' }, { batchNo: 'SH202605-013', quantity: 14250, shippedAt: '2026-05-17', supTrackingNo: 'SF254608246768', platformTrackingNo: 'SF643354278056', signedAt: '2026-05-07', signedDocNo: 'ESIGN-SH202605-001' }] },
      { parentOrderNo: 'TH-PO-202605003', subOrderNo: 'TH-PO-202605003-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 49000, unitPrice: 0.85, amount: 41650, batches: [{ batchNo: 'SH202605-014', quantity: 31840, shippedAt: '2026-05-03', supTrackingNo: 'SF521179644432', platformTrackingNo: 'SF754474071330', signedAt: '2026-05-08', signedDocNo: 'ESIGN-TH-PO-202605003-1-1' }, { batchNo: 'SH202605-015', quantity: 17160, shippedAt: '2026-05-10', supTrackingNo: 'SF112637644335', platformTrackingNo: 'SF893195777447', signedAt: '2026-05-07', signedDocNo: 'ESIGN-SH202605-001' }] },
      { parentOrderNo: 'TH-PO-202605003', subOrderNo: 'TH-PO-202605003-2', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 44000, unitPrice: 1.35, amount: 59400, batches: [{ batchNo: 'SH202605-016', quantity: 17600, shippedAt: '2026-05-03', supTrackingNo: 'SF221720126831', platformTrackingNo: 'SF578001943304', signedAt: '2026-05-08', signedDocNo: 'ESIGN-TH-PO-202605003-2-1' }, { batchNo: 'SH202605-017', quantity: 15400, shippedAt: '2026-05-08', supTrackingNo: 'SF390853813771', platformTrackingNo: 'SF653930041483', signedAt: '2026-05-12', signedDocNo: 'ESIGN-TH-PO-202605003-2-2' }, { batchNo: 'SH202605-018', quantity: 11000, shippedAt: '2026-05-13', supTrackingNo: 'SF790933616150', platformTrackingNo: 'SF656795048359', signedAt: '2026-05-18', signedDocNo: 'ESIGN-TH-PO-202605003-2-3' }] },
    ],
  },
  {
    key: '3', billingNo: 'BILL-S-202604-003', period: '2026-04-01 ~ 2026-04-30',
    totalAmount: 457880, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-06-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'supplier', dimensionName: '温州正邦印务有限公司',
    settlementMode: 'monthly', generatedAt: '2026-05-01',
    items: [
      { parentOrderNo: 'TH-PO-202604004', subOrderNo: 'TH-PO-202604004-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 50000, unitPrice: 0.90, amount: 45000, batches: [{ batchNo: 'SH202604-019', quantity: 32500, shippedAt: '2026-04-03', supTrackingNo: 'SF638263151675', platformTrackingNo: 'SF220342736258', signedAt: '2026-04-08', signedDocNo: 'ESIGN-TH-PO-202604004-1-1' }, { batchNo: 'SH202604-020', quantity: 17500, shippedAt: '2026-04-09', supTrackingNo: 'SF190532572167', platformTrackingNo: 'SF635719463887', signedAt: '2026-04-07', signedDocNo: 'ESIGN-SH202604-019' }] },
      { parentOrderNo: 'TH-PO-202604004', subOrderNo: 'TH-PO-202604004-2', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 38000, unitPrice: 0.88, amount: 33440, batches: [{ batchNo: 'SH202604-021', quantity: 9500, shippedAt: '2026-04-03', supTrackingNo: 'SF622524651020', platformTrackingNo: 'SF705362105548', signedAt: '2026-04-06', signedDocNo: 'ESIGN-TH-PO-202604004-2-1' }, { batchNo: 'SH202604-022', quantity: 9500, shippedAt: '2026-04-08', supTrackingNo: 'SF566461768998', platformTrackingNo: 'SF336070141120', signedAt: '2026-04-12', signedDocNo: 'ESIGN-TH-PO-202604004-2-2' }, { batchNo: 'SH202604-023', quantity: 9500, shippedAt: '2026-04-13', supTrackingNo: 'SF539425475482', platformTrackingNo: 'SF838713541566', signedAt: '2026-04-18', signedDocNo: 'ESIGN-TH-PO-202604004-2-3' }, { batchNo: 'SH202604-024', quantity: 9500, shippedAt: '2026-04-21', supTrackingNo: 'SF230788137103', platformTrackingNo: 'SF345877882397', signedAt: '2026-04-25', signedDocNo: 'ESIGN-TH-PO-202604004-2-4' }] },
      { parentOrderNo: 'TH-PO-202604005', subOrderNo: 'TH-PO-202604005-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 105000, unitPrice: 0.72, amount: 75600, batches: [{ batchNo: 'SH202604-025', quantity: 68250, shippedAt: '2026-04-03', supTrackingNo: 'SF877693993558', platformTrackingNo: 'SF167135076022', signedAt: '2026-04-06', signedDocNo: 'ESIGN-TH-PO-202604005-1-1' }, { batchNo: 'SH202604-026', quantity: 36750, shippedAt: '2026-04-08', supTrackingNo: 'SF464469358785', platformTrackingNo: 'SF662945045779', signedAt: '2026-04-11', signedDocNo: 'ESIGN-TH-PO-202604005-1-2' }] },
      { parentOrderNo: 'TH-PO-202604005', subOrderNo: 'TH-PO-202604005-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 60000, unitPrice: 0.80, amount: 48000, batches: [{ batchNo: 'SH202604-027', quantity: 60000, shippedAt: '2026-04-03', supTrackingNo: 'SF730855031651', platformTrackingNo: 'SF622165852995', signedAt: '2026-04-06', signedDocNo: 'ESIGN-TH-PO-202604005-2-1' }] },
      { parentOrderNo: 'TH-PO-202604006', subOrderNo: 'TH-PO-202604006-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 54000, unitPrice: 0.88, amount: 47520, batches: [{ batchNo: 'SH202604-028', quantity: 54000, shippedAt: '2026-04-03', supTrackingNo: 'SF158965931802', platformTrackingNo: 'SF820151617123', signedAt: '2026-04-07', signedDocNo: 'ESIGN-TH-PO-202604006-1-1' }] },
      { parentOrderNo: 'TH-PO-202604006', subOrderNo: 'TH-PO-202604006-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 112000, unitPrice: 0.90, amount: 100800, batches: [{ batchNo: 'SH202604-029', quantity: 112000, shippedAt: '2026-04-03', supTrackingNo: 'SF219664972382', platformTrackingNo: 'SF311521368324', signedAt: '2026-04-07', signedDocNo: 'ESIGN-SH202604-019' }] },
      { parentOrderNo: 'TH-PO-202604007', subOrderNo: 'TH-PO-202604007-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 84000, unitPrice: 0.88, amount: 73920, batches: [{ batchNo: 'SH202604-030', quantity: 84000, shippedAt: '2026-04-03', supTrackingNo: 'SF585655080082', platformTrackingNo: 'SF704971771246', signedAt: '2026-04-06', signedDocNo: 'ESIGN-TH-PO-202604007-1-1' }] },
      { parentOrderNo: 'TH-PO-202604007', subOrderNo: 'TH-PO-202604007-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 42000, unitPrice: 0.80, amount: 33600, batches: [{ batchNo: 'SH202604-031', quantity: 42000, shippedAt: '2026-04-03', supTrackingNo: 'SF361343158181', platformTrackingNo: 'SF547390899554', signedAt: '2026-04-06', signedDocNo: 'ESIGN-TH-PO-202604007-2-1' }] },
    ],
  },
  {
    key: '4', billingNo: 'BILL-S-202603-004', period: '2026-03-01 ~ 2026-03-31',
    totalAmount: 638500, status: '超期未付', invoiceUploaded: true,
    paymentDueDate: '2026-05-01', overdue: true,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '宁波华美印刷包装有限公司',
    settlementMode: 'monthly', generatedAt: '2026-04-01',
    items: [
      { parentOrderNo: 'TH-PO-202603008', subOrderNo: 'TH-PO-202603008-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 37000, unitPrice: 1.10, amount: 40700, batches: [{ batchNo: 'SH202603-032', quantity: 37000, shippedAt: '2026-03-03', supTrackingNo: 'SF962361016774', platformTrackingNo: 'SF415486858682', signedAt: '2026-03-07', signedDocNo: 'ESIGN-SH202603-032' }] },
      { parentOrderNo: 'TH-PO-202603008', subOrderNo: 'TH-PO-202603008-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 84000, unitPrice: 1.20, amount: 100800, batches: [{ batchNo: 'SH202603-033', quantity: 33600, shippedAt: '2026-03-03', supTrackingNo: 'SF422938152332', platformTrackingNo: 'SF735906343638', signedAt: '2026-03-06', signedDocNo: 'ESIGN-TH-PO-202603008-2-1' }, { batchNo: 'SH202603-034', quantity: 29400, shippedAt: '2026-03-07', supTrackingNo: 'SF161476464570', platformTrackingNo: 'SF740165486786', signedAt: '2026-03-12', signedDocNo: 'ESIGN-TH-PO-202603008-2-2' }, { batchNo: 'SH202603-035', quantity: 21000, shippedAt: '2026-03-17', supTrackingNo: 'SF274079861243', platformTrackingNo: 'SF188080452706', signedAt: '2026-03-22', signedDocNo: 'ESIGN-TH-PO-202603008-2-3' }] },
      { parentOrderNo: 'TH-PO-202603008', subOrderNo: 'TH-PO-202603008-3', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 53000, unitPrice: 0.55, amount: 29150, batches: [{ batchNo: 'SH202603-036', quantity: 53000, shippedAt: '2026-03-03', supTrackingNo: 'SF230583221679', platformTrackingNo: 'SF373029676920', signedAt: '2026-03-08', signedDocNo: 'ESIGN-TH-PO-202603008-3-1' }] },
      { parentOrderNo: 'TH-PO-202603009', subOrderNo: 'TH-PO-202603009-1', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 83000, unitPrice: 0.55, amount: 45650, batches: [{ batchNo: 'SH202603-037', quantity: 33200, shippedAt: '2026-03-03', supTrackingNo: 'SF835316694200', platformTrackingNo: 'SF446673404045', signedAt: '2026-03-07', signedDocNo: 'ESIGN-TH-PO-202603009-1-1' }, { batchNo: 'SH202603-038', quantity: 29040, shippedAt: '2026-03-08', supTrackingNo: 'SF243433808038', platformTrackingNo: 'SF811554491388', signedAt: '2026-03-12', signedDocNo: 'ESIGN-TH-PO-202603009-1-2' }, { batchNo: 'SH202603-039', quantity: 20760, shippedAt: '2026-03-15', supTrackingNo: 'SF108901504899', platformTrackingNo: 'SF784868121383', signedAt: '2026-03-07', signedDocNo: 'ESIGN-SH202603-032' }] },
      { parentOrderNo: 'TH-PO-202603009', subOrderNo: 'TH-PO-202603009-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 102000, unitPrice: 0.85, amount: 86700, batches: [{ batchNo: 'SH202603-040', quantity: 25500, shippedAt: '2026-03-03', supTrackingNo: 'SF654966271979', platformTrackingNo: 'SF242872947887', signedAt: '2026-03-08', signedDocNo: 'ESIGN-TH-PO-202603009-2-1' }, { batchNo: 'SH202603-041', quantity: 25500, shippedAt: '2026-03-09', supTrackingNo: 'SF370064409283', platformTrackingNo: 'SF410824752082', signedAt: '2026-03-12', signedDocNo: 'ESIGN-TH-PO-202603009-2-2' }, { batchNo: 'SH202603-042', quantity: 25500, shippedAt: '2026-03-13', supTrackingNo: 'SF700581361458', platformTrackingNo: 'SF433734162755', signedAt: '2026-03-17', signedDocNo: 'ESIGN-TH-PO-202603009-2-3' }, { batchNo: 'SH202603-043', quantity: 25500, shippedAt: '2026-03-15', supTrackingNo: 'SF214518382535', platformTrackingNo: 'SF388339584783', signedAt: '2026-03-20', signedDocNo: 'ESIGN-TH-PO-202603009-2-4' }] },
      { parentOrderNo: 'TH-PO-202603010', subOrderNo: 'TH-PO-202603010-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 64000, unitPrice: 0.85, amount: 54400, batches: [{ batchNo: 'SH202603-044', quantity: 64000, shippedAt: '2026-03-03', supTrackingNo: 'SF798737479634', platformTrackingNo: 'SF391426041482', signedAt: '2026-03-07', signedDocNo: 'ESIGN-SH202603-032' }] },
      { parentOrderNo: 'TH-PO-202603010', subOrderNo: 'TH-PO-202603010-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 94000, unitPrice: 1.20, amount: 112800, batches: [{ batchNo: 'SH202603-045', quantity: 61100, shippedAt: '2026-03-03', supTrackingNo: 'SF566580698915', platformTrackingNo: 'SF404209733660', signedAt: '2026-03-06', signedDocNo: 'ESIGN-TH-PO-202603010-2-1' }, { batchNo: 'SH202603-046', quantity: 32900, shippedAt: '2026-03-07', supTrackingNo: 'SF800641535392', platformTrackingNo: 'SF391971008994', signedAt: '2026-03-07', signedDocNo: 'ESIGN-SH202603-032' }] },
      { parentOrderNo: 'TH-PO-202603011', subOrderNo: 'TH-PO-202603011-1', sku: 'BSD-SS25-PNT-007', productName: '工装束脚卫裤', quantity: 101000, unitPrice: 1.10, amount: 111100, batches: [{ batchNo: 'SH202603-047', quantity: 101000, shippedAt: '2026-03-03', supTrackingNo: 'SF140997998139', platformTrackingNo: 'SF507311484139', signedAt: '2026-03-08', signedDocNo: 'ESIGN-TH-PO-202603011-1-1' }] },
      { parentOrderNo: 'TH-PO-202603011', subOrderNo: 'TH-PO-202603011-2', sku: 'BSD-SS25-VST-008', productName: '纯棉罗纹背心', quantity: 104000, unitPrice: 0.55, amount: 57200, batches: [{ batchNo: 'SH202603-048', quantity: 67600, shippedAt: '2026-03-03', supTrackingNo: 'SF435187102686', platformTrackingNo: 'SF975885943559', signedAt: '2026-03-06', signedDocNo: 'ESIGN-TH-PO-202603011-2-1' }, { batchNo: 'SH202603-049', quantity: 36400, shippedAt: '2026-03-07', supTrackingNo: 'SF831216162375', platformTrackingNo: 'SF486988551875', signedAt: '2026-03-07', signedDocNo: 'ESIGN-SH202603-032' }] },
    ],
  },
  {
    key: '5', billingNo: 'BILL-S-202602-005', period: '2026-02-01 ~ 2026-02-28',
    totalAmount: 485950, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-04-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'supplier', dimensionName: '义乌丰源包装印刷有限公司',
    settlementMode: 'monthly', generatedAt: '2026-03-01',
    items: [
      { parentOrderNo: 'TH-PO-202602012', subOrderNo: 'TH-PO-202602012-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 60000, unitPrice: 1.25, amount: 75000, batches: [{ batchNo: 'SH202602-050', quantity: 15000, shippedAt: '2026-02-03', supTrackingNo: 'SF293379984954', platformTrackingNo: 'SF960420184902', signedAt: '2026-02-07', signedDocNo: 'ESIGN-TH-PO-202602012-1-1' }, { batchNo: 'SH202602-051', quantity: 15000, shippedAt: '2026-02-10', supTrackingNo: 'SF911164978375', platformTrackingNo: 'SF374065081450', signedAt: '2026-02-15', signedDocNo: 'ESIGN-TH-PO-202602012-1-2' }, { batchNo: 'SH202602-052', quantity: 15000, shippedAt: '2026-02-15', supTrackingNo: 'SF872180893759', platformTrackingNo: 'SF517076094887', signedAt: '2026-02-18', signedDocNo: 'ESIGN-TH-PO-202602012-1-3' }, { batchNo: 'SH202602-053', quantity: 15000, shippedAt: '2026-02-15', supTrackingNo: 'SF484229076692', platformTrackingNo: 'SF345790651066', signedAt: '2026-02-08', signedDocNo: 'ESIGN-SH202602-050' }] },
      { parentOrderNo: 'TH-PO-202602012', subOrderNo: 'TH-PO-202602012-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 33000, unitPrice: 0.80, amount: 26400, batches: [{ batchNo: 'SH202602-054', quantity: 13200, shippedAt: '2026-02-03', supTrackingNo: 'SF408264090646', platformTrackingNo: 'SF805882797681', signedAt: '2026-02-07', signedDocNo: 'ESIGN-TH-PO-202602012-2-1' }, { batchNo: 'SH202602-055', quantity: 11550, shippedAt: '2026-02-10', supTrackingNo: 'SF463080281895', platformTrackingNo: 'SF134098763897', signedAt: '2026-02-15', signedDocNo: 'ESIGN-TH-PO-202602012-2-2' }, { batchNo: 'SH202602-056', quantity: 8250, shippedAt: '2026-02-11', supTrackingNo: 'SF139794875013', platformTrackingNo: 'SF753300614396', signedAt: '2026-02-08', signedDocNo: 'ESIGN-SH202602-050' }] },
      { parentOrderNo: 'TH-PO-202602013', subOrderNo: 'TH-PO-202602013-1', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 85000, unitPrice: 0.90, amount: 76500, batches: [{ batchNo: 'SH202602-057', quantity: 55250, shippedAt: '2026-02-03', supTrackingNo: 'SF735223535913', platformTrackingNo: 'SF379989256365', signedAt: '2026-02-07', signedDocNo: 'ESIGN-TH-PO-202602013-1-1' }, { batchNo: 'SH202602-058', quantity: 29750, shippedAt: '2026-02-07', supTrackingNo: 'SF691874457344', platformTrackingNo: 'SF893224011429', signedAt: '2026-02-12', signedDocNo: 'ESIGN-TH-PO-202602013-1-2' }] },
      { parentOrderNo: 'TH-PO-202602013', subOrderNo: 'TH-PO-202602013-2', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 115000, unitPrice: 1.25, amount: 143750, batches: [{ batchNo: 'SH202602-059', quantity: 115000, shippedAt: '2026-02-03', supTrackingNo: 'SF464731933573', platformTrackingNo: 'SF446273815783', signedAt: '2026-02-06', signedDocNo: 'ESIGN-TH-PO-202602013-2-1' }] },
      { parentOrderNo: 'TH-PO-202602014', subOrderNo: 'TH-PO-202602014-1', sku: 'XZF-SS25-HOD-005', productName: '户外防晒帽衫', quantity: 94000, unitPrice: 1.25, amount: 117500, batches: [{ batchNo: 'SH202602-060', quantity: 61100, shippedAt: '2026-02-03', supTrackingNo: 'SF866232475190', platformTrackingNo: 'SF706860218144', signedAt: '2026-02-07', signedDocNo: 'ESIGN-TH-PO-202602014-1-1' }, { batchNo: 'SH202602-061', quantity: 32900, shippedAt: '2026-02-08', supTrackingNo: 'SF520650658919', platformTrackingNo: 'SF923247811948', signedAt: '2026-02-11', signedDocNo: 'ESIGN-TH-PO-202602014-1-2' }] },
      { parentOrderNo: 'TH-PO-202602014', subOrderNo: 'TH-PO-202602014-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 52000, unitPrice: 0.90, amount: 46800, batches: [{ batchNo: 'SH202602-062', quantity: 33800, shippedAt: '2026-02-03', supTrackingNo: 'SF430714225291', platformTrackingNo: 'SF328865551724', signedAt: '2026-02-07', signedDocNo: 'ESIGN-TH-PO-202602014-2-1' }, { batchNo: 'SH202602-063', quantity: 18200, shippedAt: '2026-02-10', supTrackingNo: 'SF612485158138', platformTrackingNo: 'SF587228760932', signedAt: '2026-02-15', signedDocNo: 'ESIGN-TH-PO-202602014-2-2' }] },
    ],
  },
  {
    key: '6', billingNo: 'BILL-S-202601-006', period: '2026-01-01 ~ 2026-01-31',
    totalAmount: 250950, status: '待确认', invoiceUploaded: false,
    paymentDueDate: '2026-03-15', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '绍兴天成标签科技有限公司',
    settlementMode: 'monthly', generatedAt: '2026-02-01',
    items: [
      { parentOrderNo: 'TH-PO-202601015', subOrderNo: 'TH-PO-202601015-1', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 51000, unitPrice: 1.35, amount: 68850, batches: [{ batchNo: 'SH202601-064', quantity: 20400, shippedAt: '2026-01-03', supTrackingNo: 'SF798635932470', platformTrackingNo: 'SF467731925068', signedAt: '2026-01-08', signedDocNo: 'ESIGN-TH-PO-202601015-1-1' }, { batchNo: 'SH202601-065', quantity: 17840, shippedAt: '2026-01-07', supTrackingNo: 'SF442192051776', platformTrackingNo: 'SF985728087295', signedAt: '2026-01-10', signedDocNo: 'ESIGN-TH-PO-202601015-1-2' }, { batchNo: 'SH202601-066', quantity: 12760, shippedAt: '2026-01-13', supTrackingNo: 'SF772055593219', platformTrackingNo: 'SF945463185629', signedAt: '2026-01-07', signedDocNo: 'ESIGN-SH202601-064' }] },
      { parentOrderNo: 'TH-PO-202601015', subOrderNo: 'TH-PO-202601015-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 39000, unitPrice: 1.50, amount: 58500, batches: [{ batchNo: 'SH202601-067', quantity: 25350, shippedAt: '2026-01-03', supTrackingNo: 'SF523897613735', platformTrackingNo: 'SF540209997973', signedAt: '2026-01-08', signedDocNo: 'ESIGN-TH-PO-202601015-2-1' }, { batchNo: 'SH202601-068', quantity: 13650, shippedAt: '2026-01-08', supTrackingNo: 'SF955156280853', platformTrackingNo: 'SF342344157587', signedAt: '2026-01-11', signedDocNo: 'ESIGN-TH-PO-202601015-2-2' }] },
      { parentOrderNo: 'TH-PO-202601016', subOrderNo: 'TH-PO-202601016-1', sku: 'BSD-SS25-HOD-006', productName: '加绒连帽卫衣', quantity: 36000, unitPrice: 1.35, amount: 48600, batches: [{ batchNo: 'SH202601-069', quantity: 23400, shippedAt: '2026-01-03', supTrackingNo: 'SF981040982753', platformTrackingNo: 'SF832140067838', signedAt: '2026-01-07', signedDocNo: 'ESIGN-TH-PO-202601016-1-1' }, { batchNo: 'SH202601-070', quantity: 12600, shippedAt: '2026-01-09', supTrackingNo: 'SF570319440963', platformTrackingNo: 'SF591979363867', signedAt: '2026-01-13', signedDocNo: 'ESIGN-TH-PO-202601016-1-2' }] },
      { parentOrderNo: 'TH-PO-202601016', subOrderNo: 'TH-PO-202601016-2', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 50000, unitPrice: 1.50, amount: 75000, batches: [{ batchNo: 'SH202601-071', quantity: 20000, shippedAt: '2026-01-03', supTrackingNo: 'SF925746940063', platformTrackingNo: 'SF403386445743', signedAt: '2026-01-07', signedDocNo: 'ESIGN-TH-PO-202601016-2-1' }, { batchNo: 'SH202601-072', quantity: 17500, shippedAt: '2026-01-10', supTrackingNo: 'SF401675263897', platformTrackingNo: 'SF183493617047', signedAt: '2026-01-15', signedDocNo: 'ESIGN-TH-PO-202601016-2-2' }, { batchNo: 'SH202601-073', quantity: 12500, shippedAt: '2026-01-15', supTrackingNo: 'SF188219282055', platformTrackingNo: 'SF263803069319', signedAt: '2026-01-07', signedDocNo: 'ESIGN-SH202601-064' }] },
    ],
  },
  {
    key: '7', billingNo: 'BILL-S-202512-007', period: '2025-12-01 ~ 2025-12-31',
    totalAmount: 888040, status: '超期未付', invoiceUploaded: true,
    paymentDueDate: '2026-02-01', overdue: true,
    brandName: '雪中飞（Snow Flying）', dimension: 'supplier', dimensionName: '温州正邦印务有限公司',
    settlementMode: 'monthly', generatedAt: '2026-01-01',
    items: [
      { parentOrderNo: 'TH-PO-202512017', subOrderNo: 'TH-PO-202512017-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 49000, unitPrice: 0.88, amount: 43120, batches: [{ batchNo: 'SH202512-074', quantity: 19600, shippedAt: '2025-12-03', supTrackingNo: 'SF462527878842', platformTrackingNo: 'SF613431605339', signedAt: '2025-12-07', signedDocNo: 'ESIGN-TH-PO-202512017-1-1' }, { batchNo: 'SH202512-075', quantity: 17150, shippedAt: '2025-12-10', supTrackingNo: 'SF527006264991', platformTrackingNo: 'SF949994808961', signedAt: '2025-12-13', signedDocNo: 'ESIGN-TH-PO-202512017-1-2' }, { batchNo: 'SH202512-076', quantity: 12250, shippedAt: '2025-12-11', supTrackingNo: 'SF427928307068', platformTrackingNo: 'SF528437913341', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-074' }] },
      { parentOrderNo: 'TH-PO-202512017', subOrderNo: 'TH-PO-202512017-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 83000, unitPrice: 0.72, amount: 59760, batches: [{ batchNo: 'SH202512-077', quantity: 53950, shippedAt: '2025-12-03', supTrackingNo: 'SF397295152191', platformTrackingNo: 'SF634447845982', signedAt: '2025-12-07', signedDocNo: 'ESIGN-TH-PO-202512017-2-1' }, { batchNo: 'SH202512-078', quantity: 29050, shippedAt: '2025-12-07', supTrackingNo: 'SF979090220563', platformTrackingNo: 'SF896305476639', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-074' }] },
      { parentOrderNo: 'TH-PO-202512018', subOrderNo: 'TH-PO-202512018-1', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 109000, unitPrice: 0.88, amount: 95920, batches: [{ batchNo: 'SH202512-079', quantity: 70850, shippedAt: '2025-12-03', supTrackingNo: 'SF828273518134', platformTrackingNo: 'SF190310715647', signedAt: '2025-12-08', signedDocNo: 'ESIGN-TH-PO-202512018-1-1' }, { batchNo: 'SH202512-080', quantity: 38150, shippedAt: '2025-12-10', supTrackingNo: 'SF152320127777', platformTrackingNo: 'SF517729190564', signedAt: '2025-12-13', signedDocNo: 'ESIGN-TH-PO-202512018-1-2' }] },
      { parentOrderNo: 'TH-PO-202512018', subOrderNo: 'TH-PO-202512018-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 71000, unitPrice: 0.80, amount: 56800, batches: [{ batchNo: 'SH202512-081', quantity: 71000, shippedAt: '2025-12-03', supTrackingNo: 'SF406571012708', platformTrackingNo: 'SF563134588274', signedAt: '2025-12-07', signedDocNo: 'ESIGN-TH-PO-202512018-2-1' }] },
      { parentOrderNo: 'TH-PO-202512019', subOrderNo: 'TH-PO-202512019-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 99000, unitPrice: 0.80, amount: 79200, batches: [{ batchNo: 'SH202512-082', quantity: 99000, shippedAt: '2025-12-03', supTrackingNo: 'SF145748937891', platformTrackingNo: 'SF133304178029', signedAt: '2025-12-06', signedDocNo: 'ESIGN-TH-PO-202512019-1-1' }] },
      { parentOrderNo: 'TH-PO-202512019', subOrderNo: 'TH-PO-202512019-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 61000, unitPrice: 0.90, amount: 54900, batches: [{ batchNo: 'SH202512-083', quantity: 61000, shippedAt: '2025-12-03', supTrackingNo: 'SF620233157780', platformTrackingNo: 'SF227429355441', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-074' }] },
      { parentOrderNo: 'TH-PO-202512019', subOrderNo: 'TH-PO-202512019-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 102000, unitPrice: 0.88, amount: 89760, batches: [{ batchNo: 'SH202512-084', quantity: 25500, shippedAt: '2025-12-03', supTrackingNo: 'SF942914148319', platformTrackingNo: 'SF281973019143', signedAt: '2025-12-08', signedDocNo: 'ESIGN-TH-PO-202512019-3-1' }, { batchNo: 'SH202512-085', quantity: 25500, shippedAt: '2025-12-07', supTrackingNo: 'SF443445860556', platformTrackingNo: 'SF736119440405', signedAt: '2025-12-10', signedDocNo: 'ESIGN-TH-PO-202512019-3-2' }, { batchNo: 'SH202512-086', quantity: 25500, shippedAt: '2025-12-11', supTrackingNo: 'SF845502370306', platformTrackingNo: 'SF535403628009', signedAt: '2025-12-15', signedDocNo: 'ESIGN-TH-PO-202512019-3-3' }, { batchNo: 'SH202512-087', quantity: 25500, shippedAt: '2025-12-18', supTrackingNo: 'SF790762045351', platformTrackingNo: 'SF212712179857', signedAt: '2025-12-21', signedDocNo: 'ESIGN-TH-PO-202512019-3-4' }] },
      { parentOrderNo: 'TH-PO-202512020', subOrderNo: 'TH-PO-202512020-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 74000, unitPrice: 0.80, amount: 59200, batches: [{ batchNo: 'SH202512-088', quantity: 48100, shippedAt: '2025-12-03', supTrackingNo: 'SF810842688886', platformTrackingNo: 'SF114350478636', signedAt: '2025-12-06', signedDocNo: 'ESIGN-TH-PO-202512020-1-1' }, { batchNo: 'SH202512-089', quantity: 25900, shippedAt: '2025-12-10', supTrackingNo: 'SF499263542423', platformTrackingNo: 'SF606070444418', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-074' }] },
      { parentOrderNo: 'TH-PO-202512020', subOrderNo: 'TH-PO-202512020-2', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 120000, unitPrice: 0.72, amount: 86400, batches: [{ batchNo: 'SH202512-090', quantity: 120000, shippedAt: '2025-12-03', supTrackingNo: 'SF399146436761', platformTrackingNo: 'SF987408586371', signedAt: '2025-12-08', signedDocNo: 'ESIGN-TH-PO-202512020-2-1' }] },
      { parentOrderNo: 'TH-PO-202512020', subOrderNo: 'TH-PO-202512020-3', sku: 'XZF-SS25-POL-004', productName: '运动快干Polo', quantity: 98000, unitPrice: 0.88, amount: 86240, batches: [{ batchNo: 'SH202512-091', quantity: 39200, shippedAt: '2025-12-03', supTrackingNo: 'SF906705387446', platformTrackingNo: 'SF394602435240', signedAt: '2025-12-07', signedDocNo: 'ESIGN-TH-PO-202512020-3-1' }, { batchNo: 'SH202512-092', quantity: 34300, shippedAt: '2025-12-09', supTrackingNo: 'SF405314892324', platformTrackingNo: 'SF597707816158', signedAt: '2025-12-12', signedDocNo: 'ESIGN-TH-PO-202512020-3-2' }, { batchNo: 'SH202512-093', quantity: 24500, shippedAt: '2025-12-13', supTrackingNo: 'SF519481675342', platformTrackingNo: 'SF131509583569', signedAt: '2025-12-17', signedDocNo: 'ESIGN-TH-PO-202512020-3-3' }] },
      { parentOrderNo: 'TH-PO-202512021', subOrderNo: 'TH-PO-202512021-1', sku: 'XZF-SS25-SHT-003', productName: '弹力运动短裤', quantity: 57000, unitPrice: 0.72, amount: 41040, batches: [{ batchNo: 'SH202512-094', quantity: 37050, shippedAt: '2025-12-03', supTrackingNo: 'SF871359612234', platformTrackingNo: 'SF404427742989', signedAt: '2025-12-07', signedDocNo: 'ESIGN-TH-PO-202512021-1-1' }, { batchNo: 'SH202512-095', quantity: 19950, shippedAt: '2025-12-07', supTrackingNo: 'SF362360709927', platformTrackingNo: 'SF549769295925', signedAt: '2025-12-12', signedDocNo: 'ESIGN-TH-PO-202512021-1-2' }] },
      { parentOrderNo: 'TH-PO-202512021', subOrderNo: 'TH-PO-202512021-2', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 92000, unitPrice: 0.80, amount: 73600, batches: [{ batchNo: 'SH202512-096', quantity: 59800, shippedAt: '2025-12-03', supTrackingNo: 'SF810714408170', platformTrackingNo: 'SF639928251843', signedAt: '2025-12-08', signedDocNo: 'ESIGN-TH-PO-202512021-2-1' }, { batchNo: 'SH202512-097', quantity: 32200, shippedAt: '2025-12-10', supTrackingNo: 'SF543333380796', platformTrackingNo: 'SF369259175565', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-074' }] },
      { parentOrderNo: 'TH-PO-202512021', subOrderNo: 'TH-PO-202512021-3', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 69000, unitPrice: 0.90, amount: 62100, batches: [{ batchNo: 'SH202512-098', quantity: 27600, shippedAt: '2025-12-03', supTrackingNo: 'SF682197733190', platformTrackingNo: 'SF565332894722', signedAt: '2025-12-07', signedDocNo: 'ESIGN-TH-PO-202512021-3-1' }, { batchNo: 'SH202512-099', quantity: 24150, shippedAt: '2025-12-09', supTrackingNo: 'SF601234945339', platformTrackingNo: 'SF436171026274', signedAt: '2025-12-13', signedDocNo: 'ESIGN-TH-PO-202512021-3-2' }, { batchNo: 'SH202512-100', quantity: 17250, shippedAt: '2025-12-15', supTrackingNo: 'SF444424526913', platformTrackingNo: 'SF916557269948', signedAt: '2025-12-07', signedDocNo: 'ESIGN-SH202512-074' }] },
    ],
  },
  {
    key: '8', billingNo: 'BILL-S-202511-008', period: '2025-11-01 ~ 2025-11-30',
    totalAmount: 584010, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '杭州信达标签印刷有限公司',
    settlementMode: 'monthly', generatedAt: '2025-12-01',
    items: [
      { parentOrderNo: 'TH-PO-202511022', subOrderNo: 'TH-PO-202511022-1', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 91000, unitPrice: 0.80, amount: 72800, batches: [{ batchNo: 'SH202511-101', quantity: 91000, shippedAt: '2025-11-03', supTrackingNo: 'SF350380472038', platformTrackingNo: 'SF294823500706', signedAt: '2025-11-06', signedDocNo: 'ESIGN-TH-PO-202511022-1-1' }] },
      { parentOrderNo: 'TH-PO-202511022', subOrderNo: 'TH-PO-202511022-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 68000, unitPrice: 0.85, amount: 57800, batches: [{ batchNo: 'SH202511-102', quantity: 68000, shippedAt: '2025-11-03', supTrackingNo: 'SF705824576198', platformTrackingNo: 'SF865758896013', signedAt: '2025-11-08', signedDocNo: 'ESIGN-SH202511-101' }] },
      { parentOrderNo: 'TH-PO-202511023', subOrderNo: 'TH-PO-202511023-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 31000, unitPrice: 0.98, amount: 30380, batches: [{ batchNo: 'SH202511-103', quantity: 20150, shippedAt: '2025-11-03', supTrackingNo: 'SF475553953855', platformTrackingNo: 'SF375098568281', signedAt: '2025-11-07', signedDocNo: 'ESIGN-TH-PO-202511023-1-1' }, { batchNo: 'SH202511-104', quantity: 10850, shippedAt: '2025-11-10', supTrackingNo: 'SF638591937347', platformTrackingNo: 'SF731678373015', signedAt: '2025-11-13', signedDocNo: 'ESIGN-TH-PO-202511023-1-2' }] },
      { parentOrderNo: 'TH-PO-202511023', subOrderNo: 'TH-PO-202511023-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 110000, unitPrice: 0.85, amount: 93500, batches: [{ batchNo: 'SH202511-105', quantity: 44000, shippedAt: '2025-11-03', supTrackingNo: 'SF721959119309', platformTrackingNo: 'SF434788945402', signedAt: '2025-11-06', signedDocNo: 'ESIGN-TH-PO-202511023-2-1' }, { batchNo: 'SH202511-106', quantity: 38500, shippedAt: '2025-11-07', supTrackingNo: 'SF710394101616', platformTrackingNo: 'SF558549792976', signedAt: '2025-11-10', signedDocNo: 'ESIGN-TH-PO-202511023-2-2' }, { batchNo: 'SH202511-107', quantity: 27500, shippedAt: '2025-11-13', supTrackingNo: 'SF589233301053', platformTrackingNo: 'SF436849259207', signedAt: '2025-11-08', signedDocNo: 'ESIGN-SH202511-101' }] },
      { parentOrderNo: 'TH-PO-202511024', subOrderNo: 'TH-PO-202511024-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 110000, unitPrice: 0.85, amount: 93500, batches: [{ batchNo: 'SH202511-108', quantity: 110000, shippedAt: '2025-11-03', supTrackingNo: 'SF183975167271', platformTrackingNo: 'SF100672302490', signedAt: '2025-11-08', signedDocNo: 'ESIGN-SH202511-101' }] },
      { parentOrderNo: 'TH-PO-202511024', subOrderNo: 'TH-PO-202511024-2', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 82000, unitPrice: 0.98, amount: 80360, batches: [{ batchNo: 'SH202511-109', quantity: 53300, shippedAt: '2025-11-03', supTrackingNo: 'SF353543257595', platformTrackingNo: 'SF874331514343', signedAt: '2025-11-07', signedDocNo: 'ESIGN-TH-PO-202511024-2-1' }, { batchNo: 'SH202511-110', quantity: 28700, shippedAt: '2025-11-09', supTrackingNo: 'SF851924991536', platformTrackingNo: 'SF964424679955', signedAt: '2025-11-14', signedDocNo: 'ESIGN-TH-PO-202511024-2-2' }] },
      { parentOrderNo: 'TH-PO-202511025', subOrderNo: 'TH-PO-202511025-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 99000, unitPrice: 0.98, amount: 97020, batches: [{ batchNo: 'SH202511-111', quantity: 99000, shippedAt: '2025-11-03', supTrackingNo: 'SF164731212366', platformTrackingNo: 'SF968296026728', signedAt: '2025-11-07', signedDocNo: 'ESIGN-TH-PO-202511025-1-1' }] },
      { parentOrderNo: 'TH-PO-202511025', subOrderNo: 'TH-PO-202511025-2', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 69000, unitPrice: 0.85, amount: 58650, batches: [{ batchNo: 'SH202511-112', quantity: 44840, shippedAt: '2025-11-03', supTrackingNo: 'SF611635203107', platformTrackingNo: 'SF433670331254', signedAt: '2025-11-07', signedDocNo: 'ESIGN-TH-PO-202511025-2-1' }, { batchNo: 'SH202511-113', quantity: 24160, shippedAt: '2025-11-10', supTrackingNo: 'SF583157171469', platformTrackingNo: 'SF757475491416', signedAt: '2025-11-14', signedDocNo: 'ESIGN-TH-PO-202511025-2-2' }] },
    ],
  },
];


// ---- 产品档案（SKU → 商品信息） ----
export interface ProductInfo {
  sku: string;
  name: string;       // 品名
  spec: string;       // 规格
  size: string;       // 尺码
  color: string;      // 颜色
  styleNo: string;    // 款号
  category: string;   // 品类
}
export const productCatalog: ProductInfo[] = [
  { sku: 'BSD-SS25-TEE-001', name: '经典圆领短袖T恤', spec: '180/100A', size: 'L', color: '白色', styleNo: 'BST25001', category: 'T恤' },
  { sku: 'BSD-SS25-TEE-002', name: '宽松落肩短袖T恤', spec: '175/96A', size: 'M', color: '黑色', styleNo: 'BST25002', category: 'T恤' },
  { sku: 'BSD-SS25-JKT-003', name: '防风连帽夹克', spec: '185/104A', size: 'XL', color: '藏青', styleNo: 'BSJ25001', category: '夹克' },
  { sku: 'BSD-SS25-POL-004', name: '珠地棉翻领Polo', spec: '180/100A', size: 'L', color: '浅灰', styleNo: 'BSP25001', category: 'Polo衫' },
  { sku: 'BSD-SS25-SWT-005', name: '抓绒圆领卫衣', spec: '175/96A', size: 'M', color: '炭灰', styleNo: 'BSS25001', category: '卫衣' },
  { sku: 'BSD-SS25-DRS-006', name: '通勤抗皱衬衫', spec: '180/100A', size: 'L', color: '浅蓝', styleNo: 'BSD25001', category: '衬衫' },
  { sku: 'XZF-SS25-TEE-001', name: '冰感速干T恤', spec: '175/96A', size: 'M', color: '白色', styleNo: 'XZT25001', category: 'T恤' },
  { sku: 'XZF-SS25-JKT-002', name: '轻薄防晒外套', spec: '180/100A', size: 'L', color: '浅灰', styleNo: 'XZJ25001', category: '夹克' },
];


// ---- 供应商提交数据待平台审核队列 ----
export type ReviewItemType = 'epc' | 'shipment';

export interface SupplierReviewItem {
  id: string;
  type: ReviewItemType;
  supplierName: string;
  supplierId: number;
  brandName: string;
  parentOrderNo: string;
  subOrderNo: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  // EPC 数据
  epcTotal?: number;
  epcPassed?: number;
  epcFailed?: number;
  epcErrors?: EpcValidationError[];
  // 发货数据
  shipmentBatchNo?: string;
  shipmentQuantity?: number;
  shipmentCourier?: string;
  shipmentTrackingNo?: string;
  rejectReason?: string;
}

export const supplierReviewQueue: SupplierReviewItem[] = [
  {
    id: 'rev-001', type: 'epc', supplierName: '杭州信达标签印刷有限公司', supplierId: 1,
    brandName: '波司登（Bosideng）', parentOrderNo: 'TH20260605', subOrderNo: 'TH20260605-1',
    submittedAt: '2026-06-07 09:30', status: 'pending',
    epcTotal: 80000, epcPassed: 79850, epcFailed: 150,
    epcErrors: [
      { row: 1234, epc: '3034ABC000000001234', reason: 'EPC 重复：与历史生产数据（订单 TH20260301-001）冲突' },
      { row: 5678, epc: 'XYZ00100000005678', reason: '格式不匹配：公司前缀应为 3034，当前为 XYZ' },
    ],
  },
  {
    id: 'rev-002', type: 'epc', supplierName: '温州正邦印务有限公司', supplierId: 2,
    brandName: '雪中飞（Snow Flying）', parentOrderNo: 'TH20260606', subOrderNo: 'TH20260606-1',
    submittedAt: '2026-06-07 10:15', status: 'pending',
    epcTotal: 50000, epcPassed: 50000, epcFailed: 0,
  },
  {
    id: 'rev-003', type: 'shipment', supplierName: '宁波华美印刷包装有限公司', supplierId: 3,
    brandName: '波司登（Bosideng）', parentOrderNo: 'TH20260601', subOrderNo: 'TH20260601-3',
    submittedAt: '2026-06-07 08:45', status: 'pending',
    shipmentBatchNo: 'SH20260607-001', shipmentQuantity: 40000,
    shipmentCourier: '顺丰速运', shipmentTrackingNo: 'SF9988776655111',
  },
  {
    id: 'rev-004', type: 'shipment', supplierName: '绍兴天成标签科技有限公司', supplierId: 4,
    brandName: '波司登（Bosideng）', parentOrderNo: 'TH20260602', subOrderNo: 'TH20260602-3',
    submittedAt: '2026-06-07 11:00', status: 'pending',
    shipmentBatchNo: 'SH20260607-002', shipmentQuantity: 25000,
    shipmentCourier: '圆通速递', shipmentTrackingNo: 'YTO1122336699001',
  },
  {
    id: 'rev-005', type: 'epc', supplierName: '义乌丰源包装印刷有限公司', supplierId: 7,
    brandName: '雪中飞（Snow Flying）', parentOrderNo: 'TH20260607', subOrderNo: 'TH20260607-1',
    submittedAt: '2026-06-07 14:20', status: 'pending',
    epcTotal: 30000, epcPassed: 29700, epcFailed: 300,
    epcErrors: [
      { row: 450, epc: 'XZF-SS25-ERR-00450', reason: '流水号格式异常：应为 6 位，当前 3 位' },
      { row: 1200, epc: 'XZF-SS25-ERR-01200', reason: 'EPC 长度异常：应为 24 位，当前 18 位' },
      { row: 8900, epc: 'XZF-SS25-ERR-08900', reason: 'EPC 重复：与当前批次第 234 行重复' },
    ],
  },
];
