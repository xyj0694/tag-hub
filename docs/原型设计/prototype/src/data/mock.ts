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
      { id: '3-1', orderNo: 'TH20260603-001-1', supplierName: '宁波华美印刷包装有限公司', sku: 'BSD-SS24-WM-003', quantity: 100000, status: '已签收', shippedQuantity: 100000 },
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
      { id: '8-1', orderNo: 'TH20260528-001-1', supplierName: '上海启明不干胶制品厂', sku: 'XZF-SS24-WM-002', quantity: 60000, status: '已签收', shippedQuantity: 60000 },
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
      { id: '14-1', orderNo: 'TH20260525-001-1', supplierName: '绍兴天成标签科技有限公司', sku: 'XZF-SS24-WM-002', quantity: 75000, status: '已签收', shippedQuantity: 75000 },
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
      { id: '17-1', orderNo: 'TH20260531-001-1', supplierName: '杭州信达标签印刷有限公司', sku: 'BSD-SS24-TAG-005', quantity: 80000, status: '已签收', shippedQuantity: 80000 },
      { id: '17-2', orderNo: 'TH20260531-001-2', supplierName: '义乌丰源包装印刷有限公司', sku: 'BSD-SS24-TAG-005', quantity: 80000, status: '已签收', shippedQuantity: 80000 },
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
    createdAt: '2026-06-05 09:00', shippingAddress: '浙江省杭州市滨江区浦沿街道', contact: '张三丰', phone: '138****1234', subOrders: [],
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
    subOrders: [{"id": "20-1", "orderNo": "TH20260604-96-1", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-20-001", "quantity": 46912, "status": "生产完成", "shippedQuantity": 0}, {"id": "20-2", "orderNo": "TH20260604-96-2", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-20-002", "quantity": 19208, "status": "生产完成", "shippedQuantity": 0}, {"id": "20-3", "orderNo": "TH20260604-96-3", "supplierName": "温州正邦印务有限公司", "sku": "SKU-20-003", "quantity": 13880, "status": "生产完成", "shippedQuantity": 0}],
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
    subOrders: [{"id": "23-1", "orderNo": "TH20260606-58-1", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-23-001", "quantity": 51365, "status": "已发货", "shippedQuantity": 51365}, {"id": "23-2", "orderNo": "TH20260606-58-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-23-002", "quantity": 19353, "status": "已发货", "shippedQuantity": 19353}, {"id": "23-3", "orderNo": "TH20260606-58-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-23-003", "quantity": 14198, "status": "已发货", "shippedQuantity": 14198}, {"id": "23-4", "orderNo": "TH20260606-58-4", "supplierName": "温州正邦印务有限公司", "sku": "SKU-23-004", "quantity": 15084, "status": "已发货", "shippedQuantity": 15084}],
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
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-03 10:15", "detail": "订单提交"}],
  },
  { id: '26', orderNo: 'TH20260528-86', brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '免费单', tagType: '吊牌标签', totalQuantity: 60000, status: '已驳回',
    createdAt: '2026-05-28 10:45', shippingAddress: '浙江省杭州市工业园区611号', contact: '李娜', phone: '136****7252',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-05-28 10:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-28 12:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '27', orderNo: 'TH20260606-30', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 120000, status: '待审核',
    createdAt: '2026-06-06 12:45', shippingAddress: '浙江省杭州市工业园区996号', contact: '钱华', phone: '130****5315',
    templateName: '洗麦基础模板 v1',
    subOrders: [],
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
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-05-27 15:00", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-27 17:00", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '30', orderNo: 'TH20260527-95', brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '免费单', tagType: '洗麦标签', totalQuantity: 80000, status: '已发货',
    createdAt: '2026-05-27 12:45', shippingAddress: '浙江省宁波市工业园区463号', contact: '吴芳', phone: '137****9479',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "30-1", "orderNo": "TH20260527-95-1", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-30-001", "quantity": 80000, "status": "已发货", "shippedQuantity": 80000}],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-05-27 12:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-27 14:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-27 15:00", "detail": "拆分为 1 个子订单"}],
  },
  { id: '31', orderNo: 'TH20260604-52', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 30000, status: '待审核',
    createdAt: '2026-06-04 09:00', shippingAddress: '浙江省苏州市工业园区286号', contact: '李娜', phone: '138****4899',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-04 09:00", "detail": "订单提交"}],
  },
  { id: '32', orderNo: 'TH20260606-55', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 80000, status: '已驳回',
    createdAt: '2026-06-06 09:45', shippingAddress: '浙江省杭州市工业园区885号', contact: '郑强', phone: '136****8651',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-06-06 09:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-06 11:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '33', orderNo: 'TH20260604-78', brandName: '波司登（Bosideng）', factoryName: '宁波成衣一厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 50000, status: '生产中',
    createdAt: '2026-06-04 11:15', shippingAddress: '浙江省宁波市工业园区188号', contact: '钱华', phone: '132****7912',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "33-1", "orderNo": "TH20260604-78-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-33-001", "quantity": 16011, "status": "生产中", "shippedQuantity": 0}, {"id": "33-2", "orderNo": "TH20260604-78-2", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-33-002", "quantity": 23782, "status": "生产中", "shippedQuantity": 0}, {"id": "33-3", "orderNo": "TH20260604-78-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-33-003", "quantity": 10207, "status": "生产中", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "钱华", "time": "2026-06-04 11:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-04 13:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-04 13:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-04 13:30", "detail": "通知供应商"}],
  },
  { id: '34', orderNo: 'TH20260531-17', brandName: '波司登（Bosideng）', factoryName: '宁波成衣二厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 180000, status: '已签收',
    createdAt: '2026-05-31 11:45', shippingAddress: '浙江省宁波市工业园区400号', contact: '赵刚', phone: '136****1035',
    subOrders: [{"id": "34-1", "orderNo": "TH20260531-17-1", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-34-001", "quantity": 122926, "status": "已签收", "shippedQuantity": 122926}, {"id": "34-2", "orderNo": "TH20260531-17-2", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-34-002", "quantity": 57074, "status": "已签收", "shippedQuantity": 57074}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-05-31 11:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-31 13:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-31 14:00", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-31 14:00", "detail": "通知供应商"}],
  },
  { id: '35', orderNo: 'TH20260529-50', brandName: '雪中飞（Snow Flying）', factoryName: '无锡成衣六厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 30000, status: '待审核',
    createdAt: '2026-05-29 16:00', shippingAddress: '浙江省无锡市工业园区515号', contact: '王磊', phone: '130****8811',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
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
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-06-05 18:30", "detail": "订单提交"}],
  },
  { id: '38', orderNo: 'TH20260524-57', brandName: '雪中飞（Snow Flying）', factoryName: '宁波成衣三厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '已驳回',
    createdAt: '2026-05-24 09:15', shippingAddress: '浙江省宁波市工业园区854号', contact: '周明', phone: '132****8179',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-24 09:15", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-24 11:15", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '39', orderNo: 'TH20260606-44', brandName: '森马（Semir）', factoryName: '台州成衣三厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 100000, status: '已发货',
    createdAt: '2026-06-06 09:15', shippingAddress: '浙江省台州市工业园区735号', contact: '周明', phone: '139****4450',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "39-1", "orderNo": "TH20260606-44-1", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-39-001", "quantity": 33691, "status": "已发货", "shippedQuantity": 33691}, {"id": "39-2", "orderNo": "TH20260606-44-2", "supplierName": "宁波华美印刷包装有限公司", "sku": "SKU-39-002", "quantity": 31127, "status": "已发货", "shippedQuantity": 31127}, {"id": "39-3", "orderNo": "TH20260606-44-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-39-003", "quantity": 35182, "status": "已发货", "shippedQuantity": 35182}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-06 09:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-06 11:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-06 11:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-06 11:30", "detail": "通知供应商"}],
  },
  { id: '40', orderNo: 'TH20260605-81', brandName: '波司登（Bosideng）', factoryName: '杭州成衣一厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 100000, status: '已驳回',
    createdAt: '2026-06-05 15:45', shippingAddress: '浙江省杭州市工业园区968号', contact: '王磊', phone: '131****2232',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-06-05 15:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-05 17:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '41', orderNo: 'TH20260605-56', brandName: '森马（Semir）', factoryName: '台州成衣三厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 150000, status: '生产完成',
    createdAt: '2026-06-05 08:30', shippingAddress: '浙江省台州市工业园区699号', contact: '王磊', phone: '135****4441',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "41-1", "orderNo": "TH20260605-56-1", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-41-001", "quantity": 100545, "status": "生产完成", "shippedQuantity": 0}, {"id": "41-2", "orderNo": "TH20260605-56-2", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-41-002", "quantity": 19519, "status": "生产完成", "shippedQuantity": 0}, {"id": "41-3", "orderNo": "TH20260605-56-3", "supplierName": "温州正邦印务有限公司", "sku": "SKU-41-003", "quantity": 29936, "status": "生产完成", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-06-05 08:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-05 10:30", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-05 10:45", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-05 10:45", "detail": "通知供应商"}],
  },
  { id: '42', orderNo: 'TH20260526-44', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '部分发货',
    createdAt: '2026-05-26 14:15', shippingAddress: '浙江省杭州市工业园区894号', contact: '赵刚', phone: '131****7267',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "42-1", "orderNo": "TH20260526-44-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "SKU-42-001", "quantity": 46700, "status": "生产中", "shippedQuantity": 0}, {"id": "42-2", "orderNo": "TH20260526-44-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-42-002", "quantity": 27652, "status": "部分发货", "shippedQuantity": 12917}, {"id": "42-3", "orderNo": "TH20260526-44-3", "supplierName": "温州正邦印务有限公司", "sku": "SKU-42-003", "quantity": 45648, "status": "已发货", "shippedQuantity": 45648}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-05-26 14:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-26 16:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-26 16:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-26 16:30", "detail": "通知供应商"}],
  },
  { id: '43', orderNo: 'TH20260602-43', brandName: '森马（Semir）', factoryName: '台州成衣三厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 200000, status: '已发货',
    createdAt: '2026-06-02 08:00', shippingAddress: '浙江省台州市工业园区40号', contact: '赵刚', phone: '139****5349',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "43-1", "orderNo": "TH20260602-43-1", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-43-001", "quantity": 90815, "status": "已发货", "shippedQuantity": 90815}, {"id": "43-2", "orderNo": "TH20260602-43-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-43-002", "quantity": 57937, "status": "已发货", "shippedQuantity": 57937}, {"id": "43-3", "orderNo": "TH20260602-43-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-43-003", "quantity": 51248, "status": "已发货", "shippedQuantity": 51248}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-06-02 08:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-02 10:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-02 10:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-02 10:15", "detail": "通知供应商"}],
  },
  { id: '44', orderNo: 'TH20260524-56', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 200000, status: '已发货',
    createdAt: '2026-05-24 16:15', shippingAddress: '浙江省杭州市工业园区639号', contact: '郑强', phone: '131****6409',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "44-1", "orderNo": "TH20260524-56-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "SKU-44-001", "quantity": 86094, "status": "已发货", "shippedQuantity": 86094}, {"id": "44-2", "orderNo": "TH20260524-56-2", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-44-002", "quantity": 65938, "status": "已发货", "shippedQuantity": 65938}, {"id": "44-3", "orderNo": "TH20260524-56-3", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-44-003", "quantity": 47968, "status": "已发货", "shippedQuantity": 47968}],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-24 16:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-24 18:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-24 18:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-24 18:30", "detail": "通知供应商"}],
  },
  { id: '45', orderNo: 'TH20260529-61', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 60000, status: '已发货',
    createdAt: '2026-05-29 17:30', shippingAddress: '浙江省杭州市工业园区216号', contact: '王磊', phone: '134****5700',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "45-1", "orderNo": "TH20260529-61-1", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-45-001", "quantity": 30268, "status": "已发货", "shippedQuantity": 30268}, {"id": "45-2", "orderNo": "TH20260529-61-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-45-002", "quantity": 18359, "status": "已发货", "shippedQuantity": 18359}, {"id": "45-3", "orderNo": "TH20260529-61-3", "supplierName": "温州正邦印务有限公司", "sku": "SKU-45-003", "quantity": 11373, "status": "已发货", "shippedQuantity": 11373}],
    statusLog: [{"status": "待审核", "operator": "王磊", "time": "2026-05-29 17:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-29 19:30", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-29 19:45", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-29 19:45", "detail": "通知供应商"}],
  },
  { id: '46', orderNo: 'TH20260602-96', brandName: '波司登（Bosideng）', factoryName: '杭州成衣三厂',
    type: '补单', tagType: '洗麦标签', totalQuantity: 250000, status: '已签收',
    createdAt: '2026-06-02 09:15', shippingAddress: '浙江省杭州市工业园区151号', contact: '周明', phone: '133****4262',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "46-1", "orderNo": "TH20260602-96-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-46-001", "quantity": 116444, "status": "已签收", "shippedQuantity": 116444}, {"id": "46-2", "orderNo": "TH20260602-96-2", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-46-002", "quantity": 73710, "status": "已签收", "shippedQuantity": 73710}, {"id": "46-3", "orderNo": "TH20260602-96-3", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-46-003", "quantity": 59846, "status": "已签收", "shippedQuantity": 59846}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-02 09:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-02 11:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-02 11:30", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-02 11:30", "detail": "通知供应商"}],
  },
  { id: '47', orderNo: 'TH20260528-64', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 60000, status: '生产中',
    createdAt: '2026-05-28 08:00', shippingAddress: '浙江省常熟市工业园区476号', contact: '孙婷', phone: '132****9486',
    subOrders: [{"id": "47-1", "orderNo": "TH20260528-64-1", "supplierName": "温州正邦印务有限公司", "sku": "SKU-47-001", "quantity": 41709, "status": "生产中", "shippedQuantity": 0}, {"id": "47-2", "orderNo": "TH20260528-64-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-47-002", "quantity": 9843, "status": "生产中", "shippedQuantity": 0}, {"id": "47-3", "orderNo": "TH20260528-64-3", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-47-003", "quantity": 8448, "status": "生产中", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-05-28 08:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-28 10:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-28 10:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-28 10:15", "detail": "通知供应商"}],
  },
  { id: '48', orderNo: 'TH20260531-91', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 180000, status: '已发货',
    createdAt: '2026-05-31 12:15', shippingAddress: '浙江省常熟市工业园区642号', contact: '周明', phone: '138****8939',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "48-1", "orderNo": "TH20260531-91-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "SKU-48-001", "quantity": 77019, "status": "已发货", "shippedQuantity": 77019}, {"id": "48-2", "orderNo": "TH20260531-91-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-48-002", "quantity": 102981, "status": "已发货", "shippedQuantity": 102981}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-31 12:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-31 14:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-31 14:30", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-31 14:30", "detail": "通知供应商"}],
  },
  { id: '49', orderNo: 'TH20260527-63', brandName: '雪中飞（Snow Flying）', factoryName: '无锡成衣六厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 60000, status: '已签收',
    createdAt: '2026-05-27 11:00', shippingAddress: '浙江省无锡市工业园区478号', contact: '郑强', phone: '135****9890',
    subOrders: [{"id": "49-1", "orderNo": "TH20260527-63-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-49-001", "quantity": 38561, "status": "已签收", "shippedQuantity": 38561}, {"id": "49-2", "orderNo": "TH20260527-63-2", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-49-002", "quantity": 12997, "status": "已签收", "shippedQuantity": 12997}, {"id": "49-3", "orderNo": "TH20260527-63-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-49-003", "quantity": 8442, "status": "已签收", "shippedQuantity": 8442}],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-27 11:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-27 13:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-27 13:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-27 13:15", "detail": "通知供应商"}],
  },
  { id: '50', orderNo: 'TH20260525-72', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 150000, status: '已签收',
    createdAt: '2026-05-25 14:15', shippingAddress: '浙江省江阴市工业园区498号', contact: '孙婷', phone: '134****8140',
    templateName: '标准吊牌模板 v3',
    subOrders: [{"id": "50-1", "orderNo": "TH20260525-72-1", "supplierName": "温州正邦印务有限公司", "sku": "SKU-50-001", "quantity": 99415, "status": "已签收", "shippedQuantity": 99415}, {"id": "50-2", "orderNo": "TH20260525-72-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-50-002", "quantity": 27151, "status": "已签收", "shippedQuantity": 27151}, {"id": "50-3", "orderNo": "TH20260525-72-3", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-50-003", "quantity": 13244, "status": "已签收", "shippedQuantity": 13244}, {"id": "50-4", "orderNo": "TH20260525-72-4", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-50-004", "quantity": 10190, "status": "已签收", "shippedQuantity": 10190}],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-05-25 14:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-05-25 16:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-05-25 16:30", "detail": "拆分为 4 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-05-25 16:30", "detail": "通知供应商"}],
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
    subOrders: [{"id": "52-1", "orderNo": "TH20260607-93-1", "supplierName": "温州正邦印务有限公司", "sku": "SKU-52-001", "quantity": 97884, "status": "生产完成", "shippedQuantity": 0}, {"id": "52-2", "orderNo": "TH20260607-93-2", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-52-002", "quantity": 102116, "status": "生产完成", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-07 13:15", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-07 15:15", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-07 15:30", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-07 15:30", "detail": "通知供应商"}],
  },
  { id: '53', orderNo: 'TH20260605-30', brandName: '雪中飞（Snow Flying）', factoryName: '杭州童装二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 120000, status: '已签收',
    createdAt: '2026-06-05 17:00', shippingAddress: '浙江省杭州市工业园区952号', contact: '周明', phone: '131****1420',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "53-1", "orderNo": "TH20260605-30-1", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-53-001", "quantity": 64420, "status": "已签收", "shippedQuantity": 64420}, {"id": "53-2", "orderNo": "TH20260605-30-2", "supplierName": "温州正邦印务有限公司", "sku": "SKU-53-002", "quantity": 35139, "status": "已签收", "shippedQuantity": 35139}, {"id": "53-3", "orderNo": "TH20260605-30-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-53-003", "quantity": 20441, "status": "已签收", "shippedQuantity": 20441}],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-06-05 17:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-05 19:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-05 19:15", "detail": "拆分为 3 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-05 19:15", "detail": "通知供应商"}],
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
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "周明", "time": "2026-05-27 10:45", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-27 12:45", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '56', orderNo: 'TH20260524-69', brandName: '森马（Semir）', factoryName: '温州成衣一厂',
    type: '免费单', tagType: '吊牌标签', totalQuantity: 100000, status: '待审核',
    createdAt: '2026-05-24 15:15', shippingAddress: '浙江省温州市工业园区507号', contact: '郑强', phone: '135****1470',
    templateName: '洗麦基础模板 v1',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "郑强", "time": "2026-05-24 15:15", "detail": "订单提交"}],
  },
  { id: '57', orderNo: 'TH20260530-20', brandName: '森马（Semir）', factoryName: '嘉兴成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 100000, status: '已驳回',
    createdAt: '2026-05-30 08:15', shippingAddress: '浙江省嘉兴市工业园区569号', contact: '孙婷', phone: '136****9004',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-05-30 08:15", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-05-30 10:15", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '58', orderNo: 'TH20260601-94', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 80000, status: '已发货',
    createdAt: '2026-06-01 11:30', shippingAddress: '浙江省江阴市工业园区353号', contact: '吴芳', phone: '137****9698',
    templateName: '洗麦基础模板 v1',
    subOrders: [{"id": "58-1", "orderNo": "TH20260601-94-1", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-58-001", "quantity": 32669, "status": "已发货", "shippedQuantity": 32669}, {"id": "58-2", "orderNo": "TH20260601-94-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-58-002", "quantity": 47331, "status": "已发货", "shippedQuantity": 47331}],
    statusLog: [{"status": "待审核", "operator": "吴芳", "time": "2026-06-01 11:30", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-01 13:30", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-01 13:45", "detail": "拆分为 2 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-01 13:45", "detail": "通知供应商"}],
  },
  { id: '59', orderNo: 'TH20260606-34', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '补单', tagType: '吊牌标签', totalQuantity: 120000, status: '已驳回',
    createdAt: '2026-06-06 16:15', shippingAddress: '浙江省苏州市工业园区742号', contact: '孙婷', phone: '137****5530',
    templateName: '洗麦基础模板 v1',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-06-06 16:15", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-06 18:15", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '60', orderNo: 'TH20260605-78', brandName: '波司登（Bosideng）', factoryName: '宁波成衣二厂',
    type: '大货单', tagType: '吊牌标签', totalQuantity: 120000, status: '部分发货',
    createdAt: '2026-06-05 12:00', shippingAddress: '浙江省宁波市工业园区998号', contact: '赵刚', phone: '134****1745',
    subOrders: [{"id": "60-1", "orderNo": "TH20260605-78-1", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-60-001", "quantity": 63555, "status": "部分发货", "shippedQuantity": 37321}, {"id": "60-2", "orderNo": "TH20260605-78-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-60-002", "quantity": 24625, "status": "已发货", "shippedQuantity": 24625}, {"id": "60-3", "orderNo": "TH20260605-78-3", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-60-003", "quantity": 12759, "status": "部分发货", "shippedQuantity": 4701}, {"id": "60-4", "orderNo": "TH20260605-78-4", "supplierName": "嘉兴恒达标识制作有限公司", "sku": "SKU-60-004", "quantity": 19061, "status": "已发货", "shippedQuantity": 19061}],
    statusLog: [{"status": "待审核", "operator": "赵刚", "time": "2026-06-05 12:00", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-05 14:00", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-05 14:15", "detail": "拆分为 4 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-05 14:15", "detail": "通知供应商"}],
  },
  { id: '61', orderNo: 'TH20260605-20', brandName: '海澜之家', factoryName: '江阴成衣一厂',
    type: '补单', tagType: '洗麦标签', totalQuantity: 30000, status: '已驳回',
    createdAt: '2026-06-05 10:30', shippingAddress: '浙江省江阴市工业园区621号', contact: '孙婷', phone: '131****7818',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "孙婷", "time": "2026-06-05 10:30", "detail": "订单提交"}, {"status": "已驳回", "operator": "运营-陈芳", "time": "2026-06-05 12:30", "detail": "模板信息不完整，请补充后重新提交"}],
  },
  { id: '62', orderNo: 'TH20260603-88', brandName: '海澜之家', factoryName: '常熟成衣二厂',
    type: '大货单', tagType: '洗麦标签', totalQuantity: 150000, status: '待审核',
    createdAt: '2026-06-03 17:00', shippingAddress: '浙江省常熟市工业园区271号', contact: '李娜', phone: '133****4457',
    templateName: '标准吊牌模板 v3',
    subOrders: [],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-03 17:00", "detail": "订单提交"}],
  },
  { id: '63', orderNo: 'TH20260531-39', brandName: '雪中飞（Snow Flying）', factoryName: '苏州成衣五厂',
    type: '大货单', tagType: '不干胶贴纸标签', totalQuantity: 250000, status: '已驳回',
    createdAt: '2026-05-31 12:00', shippingAddress: '浙江省苏州市工业园区73号', contact: '周明', phone: '134****8438',
    templateName: '不干胶通用模板 v2',
    subOrders: [],
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
    subOrders: [{"id": "65-1", "orderNo": "TH20260603-66-1", "supplierName": "杭州信达标签印刷有限公司", "sku": "SKU-65-001", "quantity": 150000, "status": "已发货", "shippedQuantity": 150000}],
    statusLog: [{"status": "待审核", "operator": "李娜", "time": "2026-06-03 16:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-03 18:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-03 19:00", "detail": "拆分为 1 个子订单"}, {"status": "待接单", "operator": "系统", "time": "2026-06-03 19:00", "detail": "通知供应商"}],
  },
  { id: '66', orderNo: 'TH20260607-76', brandName: '波司登（Bosideng）', factoryName: '杭州成衣二厂',
    type: '免费单', tagType: '不干胶贴纸标签', totalQuantity: 250000, status: '生产中',
    createdAt: '2026-06-07 10:45', shippingAddress: '浙江省杭州市工业园区600号', contact: '钱华', phone: '134****3973',
    templateName: '不干胶通用模板 v2',
    subOrders: [{"id": "66-1", "orderNo": "TH20260607-76-1", "supplierName": "宁波华美印刷包装有限公司", "sku": "SKU-66-001", "quantity": 107105, "status": "生产中", "shippedQuantity": 0}, {"id": "66-2", "orderNo": "TH20260607-76-2", "supplierName": "绍兴天成标签科技有限公司", "sku": "SKU-66-002", "quantity": 48847, "status": "生产中", "shippedQuantity": 0}, {"id": "66-3", "orderNo": "TH20260607-76-3", "supplierName": "义乌丰源包装印刷有限公司", "sku": "SKU-66-003", "quantity": 94048, "status": "生产中", "shippedQuantity": 0}],
    statusLog: [{"status": "待审核", "operator": "钱华", "time": "2026-06-07 10:45", "detail": "订单提交"}, {"status": "已审核", "operator": "运营-刘洋", "time": "2026-06-07 12:45", "detail": "审核通过"}, {"status": "已拆分", "operator": "运营-刘洋", "time": "2026-06-07 13:00", "detail": "拆分为 3 个子订单"}],
  },
  { id: '67', orderNo: 'TH20260528-68', brandName: '森马（Semir）', factoryName: '嘉兴成衣二厂',
    type: '补单', tagType: '不干胶贴纸标签', totalQuantity: 100000, status: '生产完成',
    createdAt: '2026-05-28 14:00', shippingAddress: '浙江省嘉兴市工业园区332号', contact: '李娜', phone: '135****5135',
    subOrders: [{"id": "67-1", "orderNo": "TH20260528-68-1", "supplierName": "上海启明不干胶制品厂", "sku": "SKU-67-001", "quantity": 100000, "status": "生产完成", "shippedQuantity": 0}],
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
    key:'1', billingNo:'BILL-202606-001', period:'2026-05-01 ~ 2026-06-30',
    totalAmount:119500, status:'待确认', invoiceUploaded:false,
    paymentDueDate:'—', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20260601", "subOrderNo": "TH20260601-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20260601-1-1", "quantity": 19500, "shippedAt": "2026-06-05", "supTrackingNo": "SF260645678000", "platformTrackingNo": "PT260645678000", "signedAt": "2026-06-08", "signedDocNo": "ESIGN-BTH20260601-1-1"}]}, {"parentOrderNo": "TH20260601", "subOrderNo": "TH20260601-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20260601-2-1", "quantity": 26000, "shippedAt": "2026-06-05", "supTrackingNo": "SF260645678010", "platformTrackingNo": "PT260645678010", "signedAt": "2026-06-08", "signedDocNo": "ESIGN-BTH20260601-2-1"}]}, {"parentOrderNo": "TH20260601", "subOrderNo": "TH20260601-3", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 50000, "unitPrice": 1.2, "amount": 60000, "batches": [{"batchNo": "BTH20260601-3-1", "quantity": 32500, "shippedAt": "2026-06-05", "supTrackingNo": "SF260645678020", "platformTrackingNo": "PT260645678020", "signedAt": "2026-06-08", "signedDocNo": "ESIGN-BTH20260601-3-1"}, {"batchNo": "BTH20260601-3-2", "quantity": 17500, "shippedAt": "2026-06-20", "supTrackingNo": "SF260645678021", "platformTrackingNo": "PT260645678021", "signedAt": "2026-06-23", "signedDocNo": ""}]}],
  },
  {
    key:'2', billingNo:'BILL-202605-002', period:'2026-04-01 ~ 2026-05-30',
    totalAmount:155000, status:'已确认', invoiceUploaded:true,
    paymentDueDate:'2026-07-15', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20260501", "subOrderNo": "TH20260501-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20260501-1-1", "quantity": 19500, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678000", "platformTrackingNo": "PT260545678000", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260501-1-1"}]}, {"parentOrderNo": "TH20260501", "subOrderNo": "TH20260501-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20260501-2-1", "quantity": 26000, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678010", "platformTrackingNo": "PT260545678010", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260501-2-1"}]}, {"parentOrderNo": "TH20260502", "subOrderNo": "TH20260502-1", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 40000, "unitPrice": 1.2, "amount": 48000, "batches": [{"batchNo": "BTH20260502-1-1", "quantity": 26000, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678100", "platformTrackingNo": "PT260545678100", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260502-1-1"}]}, {"parentOrderNo": "TH20260502", "subOrderNo": "TH20260502-2", "sku": "BSD-SS25-POL-004", "productName": "珠地棉翻领Polo", "quantity": 50000, "unitPrice": 0.95, "amount": 47500, "batches": [{"batchNo": "BTH20260502-2-1", "quantity": 32500, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678110", "platformTrackingNo": "PT260545678110", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260502-2-1"}, {"batchNo": "BTH20260502-2-2", "quantity": 17500, "shippedAt": "2026-05-20", "supTrackingNo": "SF260545678111", "platformTrackingNo": "PT260545678111", "signedAt": "2026-05-23", "signedDocNo": ""}]}],
  },
  {
    key:'3', billingNo:'BILL-202604-003', period:'2026-03-01 ~ 2026-04-30',
    totalAmount:119500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-06-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20260401", "subOrderNo": "TH20260401-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20260401-1-1", "quantity": 19500, "shippedAt": "2026-04-05", "supTrackingNo": "SF260445678000", "platformTrackingNo": "PT260445678000", "signedAt": "2026-04-08", "signedDocNo": "ESIGN-BTH20260401-1-1"}]}, {"parentOrderNo": "TH20260401", "subOrderNo": "TH20260401-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20260401-2-1", "quantity": 26000, "shippedAt": "2026-04-05", "supTrackingNo": "SF260445678010", "platformTrackingNo": "PT260445678010", "signedAt": "2026-04-08", "signedDocNo": "ESIGN-BTH20260401-2-1"}]}, {"parentOrderNo": "TH20260401", "subOrderNo": "TH20260401-3", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 50000, "unitPrice": 1.2, "amount": 60000, "batches": [{"batchNo": "BTH20260401-3-1", "quantity": 32500, "shippedAt": "2026-04-05", "supTrackingNo": "SF260445678020", "platformTrackingNo": "PT260445678020", "signedAt": "2026-04-08", "signedDocNo": "ESIGN-BTH20260401-3-1"}, {"batchNo": "BTH20260401-3-2", "quantity": 17500, "shippedAt": "2026-04-20", "supTrackingNo": "SF260445678021", "platformTrackingNo": "PT260445678021", "signedAt": "2026-04-23", "signedDocNo": ""}]}],
  },
  {
    key:'4', billingNo:'BILL-202603-004', period:'2026-02-01 ~ 2026-03-30',
    totalAmount:119500, status:'超期未付', invoiceUploaded:true,
    paymentDueDate:'2026-05-01', overdue:true,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20260301", "subOrderNo": "TH20260301-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20260301-1-1", "quantity": 19500, "shippedAt": "2026-03-05", "supTrackingNo": "SF260345678000", "platformTrackingNo": "PT260345678000", "signedAt": "2026-03-08", "signedDocNo": "ESIGN-BTH20260301-1-1"}]}, {"parentOrderNo": "TH20260301", "subOrderNo": "TH20260301-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20260301-2-1", "quantity": 26000, "shippedAt": "2026-03-05", "supTrackingNo": "SF260345678010", "platformTrackingNo": "PT260345678010", "signedAt": "2026-03-08", "signedDocNo": "ESIGN-BTH20260301-2-1"}]}, {"parentOrderNo": "TH20260301", "subOrderNo": "TH20260301-3", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 50000, "unitPrice": 1.2, "amount": 60000, "batches": [{"batchNo": "BTH20260301-3-1", "quantity": 32500, "shippedAt": "2026-03-05", "supTrackingNo": "SF260345678020", "platformTrackingNo": "PT260345678020", "signedAt": "2026-03-08", "signedDocNo": "ESIGN-BTH20260301-3-1"}, {"batchNo": "BTH20260301-3-2", "quantity": 17500, "shippedAt": "2026-03-20", "supTrackingNo": "SF260345678021", "platformTrackingNo": "PT260345678021", "signedAt": "2026-03-23", "signedDocNo": ""}]}],
  },
  {
    key:'5', billingNo:'BILL-202602-005', period:'2026-01-01 ~ 2026-02-28',
    totalAmount:119500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-04-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20260201", "subOrderNo": "TH20260201-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20260201-1-1", "quantity": 19500, "shippedAt": "2026-02-05", "supTrackingNo": "SF260245678000", "platformTrackingNo": "PT260245678000", "signedAt": "2026-02-08", "signedDocNo": "ESIGN-BTH20260201-1-1"}]}, {"parentOrderNo": "TH20260201", "subOrderNo": "TH20260201-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20260201-2-1", "quantity": 26000, "shippedAt": "2026-02-05", "supTrackingNo": "SF260245678010", "platformTrackingNo": "PT260245678010", "signedAt": "2026-02-08", "signedDocNo": "ESIGN-BTH20260201-2-1"}]}, {"parentOrderNo": "TH20260201", "subOrderNo": "TH20260201-3", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 50000, "unitPrice": 1.2, "amount": 60000, "batches": [{"batchNo": "BTH20260201-3-1", "quantity": 32500, "shippedAt": "2026-02-05", "supTrackingNo": "SF260245678020", "platformTrackingNo": "PT260245678020", "signedAt": "2026-02-08", "signedDocNo": "ESIGN-BTH20260201-3-1"}, {"batchNo": "BTH20260201-3-2", "quantity": 17500, "shippedAt": "2026-02-20", "supTrackingNo": "SF260245678021", "platformTrackingNo": "PT260245678021", "signedAt": "2026-02-23", "signedDocNo": ""}]}],
  },
  {
    key:'6', billingNo:'BILL-202601-006', period:'2025-12-01 ~ 2026-01-30',
    totalAmount:59500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-03-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20260101", "subOrderNo": "TH20260101-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20260101-1-1", "quantity": 19500, "shippedAt": "2026-01-05", "supTrackingNo": "SF260145678000", "platformTrackingNo": "PT260145678000", "signedAt": "2026-01-08", "signedDocNo": "ESIGN-BTH20260101-1-1"}]}, {"parentOrderNo": "TH20260101", "subOrderNo": "TH20260101-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20260101-2-1", "quantity": 26000, "shippedAt": "2026-01-05", "supTrackingNo": "SF260145678010", "platformTrackingNo": "PT260145678010", "signedAt": "2026-01-08", "signedDocNo": "ESIGN-BTH20260101-2-1"}]}],
  },
  {
    key:'7', billingNo:'BILL-202512-007', period:'2025-11-01 ~ 2025-12-30',
    totalAmount:119500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-02-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20251201", "subOrderNo": "TH20251201-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20251201-1-1", "quantity": 19500, "shippedAt": "2025-12-05", "supTrackingNo": "SF251245678000", "platformTrackingNo": "PT251245678000", "signedAt": "2025-12-08", "signedDocNo": "ESIGN-BTH20251201-1-1"}]}, {"parentOrderNo": "TH20251201", "subOrderNo": "TH20251201-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20251201-2-1", "quantity": 26000, "shippedAt": "2025-12-05", "supTrackingNo": "SF251245678010", "platformTrackingNo": "PT251245678010", "signedAt": "2025-12-08", "signedDocNo": "ESIGN-BTH20251201-2-1"}]}, {"parentOrderNo": "TH20251201", "subOrderNo": "TH20251201-3", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 50000, "unitPrice": 1.2, "amount": 60000, "batches": [{"batchNo": "BTH20251201-3-1", "quantity": 32500, "shippedAt": "2025-12-05", "supTrackingNo": "SF251245678020", "platformTrackingNo": "PT251245678020", "signedAt": "2025-12-08", "signedDocNo": "ESIGN-BTH20251201-3-1"}, {"batchNo": "BTH20251201-3-2", "quantity": 17500, "shippedAt": "2025-12-20", "supTrackingNo": "SF251245678021", "platformTrackingNo": "PT251245678021", "signedAt": "2025-12-23", "signedDocNo": ""}]}],
  },
  {
    key:'8', billingNo:'BILL-202511-008', period:'2025-10-01 ~ 2025-11-30',
    totalAmount:59500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-01-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20251101", "subOrderNo": "TH20251101-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20251101-1-1", "quantity": 19500, "shippedAt": "2025-11-05", "supTrackingNo": "SF251145678000", "platformTrackingNo": "PT251145678000", "signedAt": "2025-11-08", "signedDocNo": "ESIGN-BTH20251101-1-1"}]}, {"parentOrderNo": "TH20251101", "subOrderNo": "TH20251101-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20251101-2-1", "quantity": 26000, "shippedAt": "2025-11-05", "supTrackingNo": "SF251145678010", "platformTrackingNo": "PT251145678010", "signedAt": "2025-11-08", "signedDocNo": "ESIGN-BTH20251101-2-1"}]}],
  },
  {
    key:'9', billingNo:'BILL-202510-009', period:'2025-09-01 ~ 2025-10-30',
    totalAmount:119500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-12-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20251001", "subOrderNo": "TH20251001-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20251001-1-1", "quantity": 19500, "shippedAt": "2025-10-05", "supTrackingNo": "SF251045678000", "platformTrackingNo": "PT251045678000", "signedAt": "2025-10-08", "signedDocNo": "ESIGN-BTH20251001-1-1"}]}, {"parentOrderNo": "TH20251001", "subOrderNo": "TH20251001-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20251001-2-1", "quantity": 26000, "shippedAt": "2025-10-05", "supTrackingNo": "SF251045678010", "platformTrackingNo": "PT251045678010", "signedAt": "2025-10-08", "signedDocNo": "ESIGN-BTH20251001-2-1"}]}, {"parentOrderNo": "TH20251001", "subOrderNo": "TH20251001-3", "sku": "BSD-SS25-JKT-003", "productName": "防风连帽夹克", "quantity": 50000, "unitPrice": 1.2, "amount": 60000, "batches": [{"batchNo": "BTH20251001-3-1", "quantity": 32500, "shippedAt": "2025-10-05", "supTrackingNo": "SF251045678020", "platformTrackingNo": "PT251045678020", "signedAt": "2025-10-08", "signedDocNo": "ESIGN-BTH20251001-3-1"}, {"batchNo": "BTH20251001-3-2", "quantity": 17500, "shippedAt": "2025-10-20", "supTrackingNo": "SF251045678021", "platformTrackingNo": "PT251045678021", "signedAt": "2025-10-23", "signedDocNo": ""}]}],
  },
  {
    key:'10', billingNo:'BILL-202509-010', period:'2025-08-01 ~ 2025-09-30',
    totalAmount:59500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-11-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20250901", "subOrderNo": "TH20250901-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20250901-1-1", "quantity": 19500, "shippedAt": "2025-09-05", "supTrackingNo": "SF250945678000", "platformTrackingNo": "PT250945678000", "signedAt": "2025-09-08", "signedDocNo": "ESIGN-BTH20250901-1-1"}]}, {"parentOrderNo": "TH20250901", "subOrderNo": "TH20250901-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20250901-2-1", "quantity": 26000, "shippedAt": "2025-09-05", "supTrackingNo": "SF250945678010", "platformTrackingNo": "PT250945678010", "signedAt": "2025-09-08", "signedDocNo": "ESIGN-BTH20250901-2-1"}]}],
  },
  {
    key:'11', billingNo:'BILL-202508-011', period:'2025-07-01 ~ 2025-08-30',
    totalAmount:59500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-10-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20250801", "subOrderNo": "TH20250801-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20250801-1-1", "quantity": 19500, "shippedAt": "2025-08-05", "supTrackingNo": "SF250845678000", "platformTrackingNo": "PT250845678000", "signedAt": "2025-08-08", "signedDocNo": "ESIGN-BTH20250801-1-1"}]}, {"parentOrderNo": "TH20250801", "subOrderNo": "TH20250801-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20250801-2-1", "quantity": 26000, "shippedAt": "2025-08-05", "supTrackingNo": "SF250845678010", "platformTrackingNo": "PT250845678010", "signedAt": "2025-08-08", "signedDocNo": "ESIGN-BTH20250801-2-1"}]}],
  },
  {
    key:'12', billingNo:'BILL-202507-012', period:'2025-06-01 ~ 2025-07-30',
    totalAmount:59500, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-09-01', overdue:false,
    brandName:'波司登（Bosideng）', dimension:'factory', dimensionName:'波司登（Bosideng）',
    items: [{"parentOrderNo": "TH20250701", "subOrderNo": "TH20250701-1", "sku": "BSD-SS25-TEE-001", "productName": "经典圆领短袖T恤", "quantity": 30000, "unitPrice": 0.85, "amount": 25500, "batches": [{"batchNo": "BTH20250701-1-1", "quantity": 19500, "shippedAt": "2025-07-05", "supTrackingNo": "SF250745678000", "platformTrackingNo": "PT250745678000", "signedAt": "2025-07-08", "signedDocNo": "ESIGN-BTH20250701-1-1"}]}, {"parentOrderNo": "TH20250701", "subOrderNo": "TH20250701-2", "sku": "BSD-SS25-TEE-002", "productName": "宽松落肩短袖T恤", "quantity": 40000, "unitPrice": 0.85, "amount": 34000, "batches": [{"batchNo": "BTH20250701-2-1", "quantity": 26000, "shippedAt": "2025-07-05", "supTrackingNo": "SF250745678010", "platformTrackingNo": "PT250745678010", "signedAt": "2025-07-08", "signedDocNo": "ESIGN-BTH20250701-2-1"}]}],
  },
  {
    key:'13', billingNo:'BILL-202606-013', period:'2026-05-01 ~ 2026-06-30',
    totalAmount:70000, status:'待确认', invoiceUploaded:false,
    paymentDueDate:'—', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20260601", "subOrderNo": "TH20260601-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20260601-1-1", "quantity": 19500, "shippedAt": "2026-06-05", "supTrackingNo": "SF260645678000", "platformTrackingNo": "PT260645678000", "signedAt": "2026-06-08", "signedDocNo": "ESIGN-BTH20260601-1-1"}]}, {"parentOrderNo": "TH20260601", "subOrderNo": "TH20260601-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20260601-2-1", "quantity": 26000, "shippedAt": "2026-06-05", "supTrackingNo": "SF260645678010", "platformTrackingNo": "PT260645678010", "signedAt": "2026-06-08", "signedDocNo": "ESIGN-BTH20260601-2-1"}]}],
  },
  {
    key:'14', billingNo:'BILL-202605-014', period:'2026-04-01 ~ 2026-05-30',
    totalAmount:110000, status:'已确认', invoiceUploaded:true,
    paymentDueDate:'2026-07-15', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20260501", "subOrderNo": "TH20260501-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20260501-1-1", "quantity": 19500, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678000", "platformTrackingNo": "PT260545678000", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260501-1-1"}]}, {"parentOrderNo": "TH20260501", "subOrderNo": "TH20260501-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20260501-2-1", "quantity": 26000, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678010", "platformTrackingNo": "PT260545678010", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260501-2-1"}]}, {"parentOrderNo": "TH20260501", "subOrderNo": "TH20260501-3", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 50000, "unitPrice": 0.8, "amount": 40000, "batches": [{"batchNo": "BTH20260501-3-1", "quantity": 32500, "shippedAt": "2026-05-05", "supTrackingNo": "SF260545678020", "platformTrackingNo": "PT260545678020", "signedAt": "2026-05-08", "signedDocNo": "ESIGN-BTH20260501-3-1"}, {"batchNo": "BTH20260501-3-2", "quantity": 17500, "shippedAt": "2026-05-20", "supTrackingNo": "SF260545678021", "platformTrackingNo": "PT260545678021", "signedAt": "2026-05-23", "signedDocNo": ""}]}],
  },
  {
    key:'15', billingNo:'BILL-202604-015', period:'2026-03-01 ~ 2026-04-30',
    totalAmount:110000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-06-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20260401", "subOrderNo": "TH20260401-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20260401-1-1", "quantity": 19500, "shippedAt": "2026-04-05", "supTrackingNo": "SF260445678000", "platformTrackingNo": "PT260445678000", "signedAt": "2026-04-08", "signedDocNo": "ESIGN-BTH20260401-1-1"}]}, {"parentOrderNo": "TH20260401", "subOrderNo": "TH20260401-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20260401-2-1", "quantity": 26000, "shippedAt": "2026-04-05", "supTrackingNo": "SF260445678010", "platformTrackingNo": "PT260445678010", "signedAt": "2026-04-08", "signedDocNo": "ESIGN-BTH20260401-2-1"}]}, {"parentOrderNo": "TH20260401", "subOrderNo": "TH20260401-3", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 50000, "unitPrice": 0.8, "amount": 40000, "batches": [{"batchNo": "BTH20260401-3-1", "quantity": 32500, "shippedAt": "2026-04-05", "supTrackingNo": "SF260445678020", "platformTrackingNo": "PT260445678020", "signedAt": "2026-04-08", "signedDocNo": "ESIGN-BTH20260401-3-1"}, {"batchNo": "BTH20260401-3-2", "quantity": 17500, "shippedAt": "2026-04-20", "supTrackingNo": "SF260445678021", "platformTrackingNo": "PT260445678021", "signedAt": "2026-04-23", "signedDocNo": ""}]}],
  },
  {
    key:'16', billingNo:'BILL-202603-016', period:'2026-02-01 ~ 2026-03-30',
    totalAmount:70000, status:'超期未付', invoiceUploaded:true,
    paymentDueDate:'2026-05-01', overdue:true,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20260301", "subOrderNo": "TH20260301-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20260301-1-1", "quantity": 19500, "shippedAt": "2026-03-05", "supTrackingNo": "SF260345678000", "platformTrackingNo": "PT260345678000", "signedAt": "2026-03-08", "signedDocNo": "ESIGN-BTH20260301-1-1"}]}, {"parentOrderNo": "TH20260301", "subOrderNo": "TH20260301-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20260301-2-1", "quantity": 26000, "shippedAt": "2026-03-05", "supTrackingNo": "SF260345678010", "platformTrackingNo": "PT260345678010", "signedAt": "2026-03-08", "signedDocNo": "ESIGN-BTH20260301-2-1"}]}],
  },
  {
    key:'17', billingNo:'BILL-202602-017', period:'2026-01-01 ~ 2026-02-28',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-04-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20260201", "subOrderNo": "TH20260201-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20260201-1-1", "quantity": 19500, "shippedAt": "2026-02-05", "supTrackingNo": "SF260245678000", "platformTrackingNo": "PT260245678000", "signedAt": "2026-02-08", "signedDocNo": "ESIGN-BTH20260201-1-1"}]}, {"parentOrderNo": "TH20260201", "subOrderNo": "TH20260201-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20260201-2-1", "quantity": 26000, "shippedAt": "2026-02-05", "supTrackingNo": "SF260245678010", "platformTrackingNo": "PT260245678010", "signedAt": "2026-02-08", "signedDocNo": "ESIGN-BTH20260201-2-1"}]}],
  },
  {
    key:'18', billingNo:'BILL-202601-018', period:'2025-12-01 ~ 2026-01-30',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-03-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20260101", "subOrderNo": "TH20260101-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20260101-1-1", "quantity": 19500, "shippedAt": "2026-01-05", "supTrackingNo": "SF260145678000", "platformTrackingNo": "PT260145678000", "signedAt": "2026-01-08", "signedDocNo": "ESIGN-BTH20260101-1-1"}]}, {"parentOrderNo": "TH20260101", "subOrderNo": "TH20260101-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20260101-2-1", "quantity": 26000, "shippedAt": "2026-01-05", "supTrackingNo": "SF260145678010", "platformTrackingNo": "PT260145678010", "signedAt": "2026-01-08", "signedDocNo": "ESIGN-BTH20260101-2-1"}]}],
  },
  {
    key:'19', billingNo:'BILL-202512-019', period:'2025-11-01 ~ 2025-12-30',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-02-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20251201", "subOrderNo": "TH20251201-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20251201-1-1", "quantity": 19500, "shippedAt": "2025-12-05", "supTrackingNo": "SF251245678000", "platformTrackingNo": "PT251245678000", "signedAt": "2025-12-08", "signedDocNo": "ESIGN-BTH20251201-1-1"}]}, {"parentOrderNo": "TH20251201", "subOrderNo": "TH20251201-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20251201-2-1", "quantity": 26000, "shippedAt": "2025-12-05", "supTrackingNo": "SF251245678010", "platformTrackingNo": "PT251245678010", "signedAt": "2025-12-08", "signedDocNo": "ESIGN-BTH20251201-2-1"}]}],
  },
  {
    key:'20', billingNo:'BILL-202511-020', period:'2025-10-01 ~ 2025-11-30',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2026-01-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20251101", "subOrderNo": "TH20251101-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20251101-1-1", "quantity": 19500, "shippedAt": "2025-11-05", "supTrackingNo": "SF251145678000", "platformTrackingNo": "PT251145678000", "signedAt": "2025-11-08", "signedDocNo": "ESIGN-BTH20251101-1-1"}]}, {"parentOrderNo": "TH20251101", "subOrderNo": "TH20251101-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20251101-2-1", "quantity": 26000, "shippedAt": "2025-11-05", "supTrackingNo": "SF251145678010", "platformTrackingNo": "PT251145678010", "signedAt": "2025-11-08", "signedDocNo": "ESIGN-BTH20251101-2-1"}]}],
  },
  {
    key:'21', billingNo:'BILL-202510-021', period:'2025-09-01 ~ 2025-10-30',
    totalAmount:110000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-12-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20251001", "subOrderNo": "TH20251001-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20251001-1-1", "quantity": 19500, "shippedAt": "2025-10-05", "supTrackingNo": "SF251045678000", "platformTrackingNo": "PT251045678000", "signedAt": "2025-10-08", "signedDocNo": "ESIGN-BTH20251001-1-1"}]}, {"parentOrderNo": "TH20251001", "subOrderNo": "TH20251001-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20251001-2-1", "quantity": 26000, "shippedAt": "2025-10-05", "supTrackingNo": "SF251045678010", "platformTrackingNo": "PT251045678010", "signedAt": "2025-10-08", "signedDocNo": "ESIGN-BTH20251001-2-1"}]}, {"parentOrderNo": "TH20251001", "subOrderNo": "TH20251001-3", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 50000, "unitPrice": 0.8, "amount": 40000, "batches": [{"batchNo": "BTH20251001-3-1", "quantity": 32500, "shippedAt": "2025-10-05", "supTrackingNo": "SF251045678020", "platformTrackingNo": "PT251045678020", "signedAt": "2025-10-08", "signedDocNo": "ESIGN-BTH20251001-3-1"}, {"batchNo": "BTH20251001-3-2", "quantity": 17500, "shippedAt": "2025-10-20", "supTrackingNo": "SF251045678021", "platformTrackingNo": "PT251045678021", "signedAt": "2025-10-23", "signedDocNo": ""}]}],
  },
  {
    key:'22', billingNo:'BILL-202509-022', period:'2025-08-01 ~ 2025-09-30',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-11-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20250901", "subOrderNo": "TH20250901-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20250901-1-1", "quantity": 19500, "shippedAt": "2025-09-05", "supTrackingNo": "SF250945678000", "platformTrackingNo": "PT250945678000", "signedAt": "2025-09-08", "signedDocNo": "ESIGN-BTH20250901-1-1"}]}, {"parentOrderNo": "TH20250901", "subOrderNo": "TH20250901-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20250901-2-1", "quantity": 26000, "shippedAt": "2025-09-05", "supTrackingNo": "SF250945678010", "platformTrackingNo": "PT250945678010", "signedAt": "2025-09-08", "signedDocNo": "ESIGN-BTH20250901-2-1"}]}],
  },
  {
    key:'23', billingNo:'BILL-202508-023', period:'2025-07-01 ~ 2025-08-30',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-10-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20250801", "subOrderNo": "TH20250801-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20250801-1-1", "quantity": 19500, "shippedAt": "2025-08-05", "supTrackingNo": "SF250845678000", "platformTrackingNo": "PT250845678000", "signedAt": "2025-08-08", "signedDocNo": "ESIGN-BTH20250801-1-1"}]}, {"parentOrderNo": "TH20250801", "subOrderNo": "TH20250801-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20250801-2-1", "quantity": 26000, "shippedAt": "2025-08-05", "supTrackingNo": "SF250845678010", "platformTrackingNo": "PT250845678010", "signedAt": "2025-08-08", "signedDocNo": "ESIGN-BTH20250801-2-1"}]}],
  },
  {
    key:'24', billingNo:'BILL-202507-024', period:'2025-06-01 ~ 2025-07-30',
    totalAmount:70000, status:'已付款', invoiceUploaded:true,
    paymentDueDate:'2025-09-01', overdue:false,
    brandName:'雪中飞（Snow Flying）', dimension:'factory', dimensionName:'雪中飞（Snow Flying）',
    items: [{"parentOrderNo": "TH20250701", "subOrderNo": "TH20250701-1", "sku": "XZF-SS25-TEE-001", "productName": "冰感速干T恤", "quantity": 30000, "unitPrice": 0.8, "amount": 24000, "batches": [{"batchNo": "BTH20250701-1-1", "quantity": 19500, "shippedAt": "2025-07-05", "supTrackingNo": "SF250745678000", "platformTrackingNo": "PT250745678000", "signedAt": "2025-07-08", "signedDocNo": "ESIGN-BTH20250701-1-1"}]}, {"parentOrderNo": "TH20250701", "subOrderNo": "TH20250701-2", "sku": "XZF-SS25-JKT-002", "productName": "轻薄防晒外套", "quantity": 40000, "unitPrice": 1.15, "amount": 46000, "batches": [{"batchNo": "BTH20250701-2-1", "quantity": 26000, "shippedAt": "2025-07-05", "supTrackingNo": "SF250745678010", "platformTrackingNo": "PT250745678010", "signedAt": "2025-07-08", "signedDocNo": "ESIGN-BTH20250701-2-1"}]}],
  },
];
export const supplierBillings: BillingItem[] = [
  {
    key: '1', billingNo: 'BILL-S-202606-001', period: '2026-06-01 ~ 2026-06-30',
    totalAmount: 235000, status: '待确认', invoiceUploaded: false,
    paymentDueDate: '2026-08-15', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '杭州信达标签印刷有限公司',
    items: [
      { parentOrderNo: 'TH20260601', subOrderNo: 'TH20260601-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 80000, unitPrice: 0.85, amount: 68000, batches: [{ batchNo: 'SH20260605-001', quantity: 50000, shippedAt: '2026-06-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2026-06-08', signedDocNo: 'ESIGN-BTH20260601-1-1' }, { batchNo: 'SH20260610-002', quantity: 30000, shippedAt: '2026-06-10', supTrackingNo: 'SF1234567891', platformTrackingNo: 'PT1234567891', signedAt: '2026-06-13', signedDocNo: 'ESIGN-BTH20260601-1-2' }] },
      { parentOrderNo: 'TH20260601', subOrderNo: 'TH20260601-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 45000, unitPrice: 1.20, amount: 54000, batches: [{ batchNo: 'SH20260605-003', quantity: 45000, shippedAt: '2026-06-05', supTrackingNo: 'SF1244567891', platformTrackingNo: 'PT1244567891', signedAt: '2026-06-08', signedDocNo: 'ESIGN-BTH20260601-2-1' }] },
      { parentOrderNo: 'TH20260602', subOrderNo: 'TH20260602-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 50000, unitPrice: 0.98, amount: 49000, batches: [{ batchNo: 'SH20260608-001', quantity: 30000, shippedAt: '2026-06-08', supTrackingNo: 'SF1244567892', platformTrackingNo: 'PT1244567892', signedAt: '2026-06-11', signedDocNo: 'ESIGN-BTH20260602-1-1' }, { batchNo: 'SH20260612-002', quantity: 20000, shippedAt: '2026-06-12', supTrackingNo: 'SF1244567893', platformTrackingNo: 'PT1244567893', signedAt: '2026-06-15', signedDocNo: '' }] },
      { parentOrderNo: 'TH20260602', subOrderNo: 'TH20260602-2', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 80000, unitPrice: 0.80, amount: 64000, batches: [{ batchNo: 'SH20260608-003', quantity: 80000, shippedAt: '2026-06-08', supTrackingNo: 'SF1244567894', platformTrackingNo: 'PT1244567894', signedAt: '', signedDocNo: '' }] },
    ],
  },
  {
    key: '2', billingNo: 'BILL-S-202605-002', period: '2026-05-01 ~ 2026-05-31',
    totalAmount: 103000, status: '已确认', invoiceUploaded: true,
    paymentDueDate: '2026-07-15', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '杭州信达标签印刷有限公司',
    items: [
      { parentOrderNo: 'TH20260501', subOrderNo: 'TH20260501-1', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 45000, unitPrice: 1.20, amount: 54000, batches: [{ batchNo: 'SH20260505-001', quantity: 45000, shippedAt: '2026-05-05', supTrackingNo: 'SF1244567891', platformTrackingNo: 'PT1244567891', signedAt: '2026-05-08', signedDocNo: 'ESIGN-BTH20260501-1-1' }] },
      { parentOrderNo: 'TH20260501', subOrderNo: 'TH20260501-2', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 50000, unitPrice: 0.98, amount: 49000, batches: [{ batchNo: 'SH20260510-001', quantity: 50000, shippedAt: '2026-05-10', supTrackingNo: 'SF1244567892', platformTrackingNo: 'PT1244567892', signedAt: '2026-05-13', signedDocNo: 'ESIGN-BTH20260501-2-1' }] },
    ],
  },
  {
    key: '3', billingNo: 'BILL-S-202604-003', period: '2026-04-01 ~ 2026-04-30',
    totalAmount: 87500, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-06-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'supplier', dimensionName: '温州正邦印务有限公司',
    items: [
      { parentOrderNo: 'TH20260401', subOrderNo: 'TH20260401-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 70000, unitPrice: 0.80, amount: 56000, batches: [{ batchNo: 'SH20260405-001', quantity: 70000, shippedAt: '2026-04-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2026-04-08', signedDocNo: 'ESIGN-BTH20260401-1-1' }] },
      { parentOrderNo: 'TH20260401', subOrderNo: 'TH20260401-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 35000, unitPrice: 0.90, amount: 31500, batches: [{ batchNo: 'SH20260410-001', quantity: 35000, shippedAt: '2026-04-10', supTrackingNo: 'SF1234567891', platformTrackingNo: 'PT1234567891', signedAt: '2026-04-13', signedDocNo: 'ESIGN-BTH20260401-2-1' }] },
    ],
  },
  {
    key: '4', billingNo: 'BILL-S-202603-004', period: '2026-03-01 ~ 2026-03-31',
    totalAmount: 152000, status: '超期未付', invoiceUploaded: true,
    paymentDueDate: '2026-05-01', overdue: true,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '宁波华美印刷包装有限公司',
    items: [
      { parentOrderNo: 'TH20260301', subOrderNo: 'TH20260301-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 60000, unitPrice: 0.85, amount: 51000, batches: [{ batchNo: 'SH20260305-001', quantity: 60000, shippedAt: '2026-03-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2026-03-08', signedDocNo: 'ESIGN-BTH20260301-1-1' }] },
      { parentOrderNo: 'TH20260301', subOrderNo: 'TH20260301-2', sku: 'BSD-SS25-JKT-003', productName: '防风连帽夹克', quantity: 40000, unitPrice: 1.20, amount: 48000, batches: [{ batchNo: 'SH20260305-002', quantity: 40000, shippedAt: '2026-03-05', supTrackingNo: 'SF1244567891', platformTrackingNo: 'PT1244567891', signedAt: '2026-03-08', signedDocNo: 'ESIGN-BTH20260301-2-1' }] },
      { parentOrderNo: 'TH20260302', subOrderNo: 'TH20260302-1', sku: 'BSD-SS25-POL-004', productName: '珠地棉翻领Polo', quantity: 50000, unitPrice: 1.06, amount: 53000, batches: [{ batchNo: 'SH20260310-001', quantity: 50000, shippedAt: '2026-03-10', supTrackingNo: 'SF1244567892', platformTrackingNo: 'PT1244567892', signedAt: '2026-03-13', signedDocNo: 'ESIGN-BTH20260302-1-1' }] },
    ],
  },
  {
    key: '5', billingNo: 'BILL-S-202602-005', period: '2026-02-01 ~ 2026-02-28',
    totalAmount: 76000, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-04-01', overdue: false,
    brandName: '雪中飞（Snow Flying）', dimension: 'supplier', dimensionName: '义乌丰源包装印刷有限公司',
    items: [
      { parentOrderNo: 'TH20260201', subOrderNo: 'TH20260201-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 50000, unitPrice: 0.80, amount: 40000, batches: [{ batchNo: 'SH20260205-001', quantity: 50000, shippedAt: '2026-02-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2026-02-08', signedDocNo: 'ESIGN-BTH20260201-1-1' }] },
      { parentOrderNo: 'TH20260201', subOrderNo: 'TH20260201-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 40000, unitPrice: 0.90, amount: 36000, batches: [{ batchNo: 'SH20260205-002', quantity: 40000, shippedAt: '2026-02-05', supTrackingNo: 'SF1234567891', platformTrackingNo: 'PT1234567891', signedAt: '2026-02-08', signedDocNo: 'ESIGN-BTH20260201-2-1' }] },
    ],
  },
  {
    key: '6', billingNo: 'BILL-S-202601-006', period: '2026-01-01 ~ 2026-01-31',
    totalAmount: 45000, status: '待确认', invoiceUploaded: false,
    paymentDueDate: '2026-03-15', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '绍兴天成标签科技有限公司',
    items: [
      { parentOrderNo: 'TH20260101', subOrderNo: 'TH20260101-1', sku: 'BSD-SS25-TEE-002', productName: '宽松落肩短袖T恤', quantity: 50000, unitPrice: 0.80, amount: 40000, batches: [{ batchNo: 'SH20260105-001', quantity: 50000, shippedAt: '2026-01-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2026-01-08', signedDocNo: 'ESIGN-BTH20260101-1-1' }] },
      { parentOrderNo: 'TH20260102', subOrderNo: 'TH20260102-1', sku: 'BSD-SS25-SWT-005', productName: '抓绒圆领卫衣', quantity: 5000, unitPrice: 1.00, amount: 5000, batches: [{ batchNo: 'SH20260110-001', quantity: 5000, shippedAt: '2026-01-10', supTrackingNo: 'SF1234567891', platformTrackingNo: 'PT1234567891', signedAt: '', signedDocNo: '' }] },
    ],
  },
  {
    key: '7', billingNo: 'BILL-S-202512-007', period: '2025-12-01 ~ 2025-12-31',
    totalAmount: 195000, status: '超期未付', invoiceUploaded: true,
    paymentDueDate: '2026-02-01', overdue: true,
    brandName: '雪中飞（Snow Flying）', dimension: 'supplier', dimensionName: '温州正邦印务有限公司',
    items: [
      { parentOrderNo: 'TH20251201', subOrderNo: 'TH20251201-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 100000, unitPrice: 0.80, amount: 80000, batches: [{ batchNo: 'SH20251205-001', quantity: 100000, shippedAt: '2025-12-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2025-12-08', signedDocNo: 'ESIGN-BTH20251201-1-1' }] },
      { parentOrderNo: 'TH20251201', subOrderNo: 'TH20251201-2', sku: 'XZF-SS25-JKT-002', productName: '轻薄防晒外套', quantity: 80000, unitPrice: 0.90, amount: 72000, batches: [{ batchNo: 'SH20251205-002', quantity: 80000, shippedAt: '2025-12-05', supTrackingNo: 'SF1234567891', platformTrackingNo: 'PT1234567891', signedAt: '2025-12-08', signedDocNo: 'ESIGN-BTH20251201-2-1' }] },
      { parentOrderNo: 'TH20251202', subOrderNo: 'TH20251202-1', sku: 'XZF-SS25-TEE-001', productName: '冰感速干T恤', quantity: 50000, unitPrice: 0.86, amount: 43000, batches: [{ batchNo: 'SH20251210-001', quantity: 50000, shippedAt: '2025-12-10', supTrackingNo: 'SF1234567892', platformTrackingNo: 'PT1234567892', signedAt: '2025-12-13', signedDocNo: 'ESIGN-BTH20251202-1-1' }] },
    ],
  },
  {
    key: '8', billingNo: 'BILL-S-202511-008', period: '2025-11-01 ~ 2025-11-30',
    totalAmount: 68000, status: '已付款', invoiceUploaded: true,
    paymentDueDate: '2026-01-01', overdue: false,
    brandName: '波司登（Bosideng）', dimension: 'supplier', dimensionName: '杭州信达标签印刷有限公司',
    items: [
      { parentOrderNo: 'TH20251101', subOrderNo: 'TH20251101-1', sku: 'BSD-SS25-TEE-001', productName: '经典圆领短袖T恤', quantity: 80000, unitPrice: 0.85, amount: 68000, batches: [{ batchNo: 'SH20251105-001', quantity: 80000, shippedAt: '2025-11-05', supTrackingNo: 'SF1234567890', platformTrackingNo: 'PT1234567890', signedAt: '2025-11-08', signedDocNo: 'ESIGN-BTH20251101-1-1' }] },
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
