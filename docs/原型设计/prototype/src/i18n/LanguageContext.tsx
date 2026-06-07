import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'zh' | 'en' | 'ja';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    'nav.dashboard': '工作台',
    'nav.orders': '订单管理',
    'nav.orderCreate': '创建订单',
    'nav.orderList': '订单列表',
    'nav.templates': '模板管理',
    'nav.customerMgmt': '客户管理',
    'nav.customerCompanies': '客户公司',
    'nav.brandCustomers': '客户品牌',
    'nav.factoryCustomers': '工厂客户',
    'nav.factories': '工厂管理',
    'nav.billings': '对账管理',
    'nav.audit': '订单管理',
    'nav.suppliers': '供应商管理',
    'nav.epcRules': 'EPC规则配置',
    'nav.supplierBillings': '供应商对账',
    'nav.orderDetail': '订单详情与接单',
    'nav.epcUpload': 'EPC数据上传',
    'nav.shipment': '发货管理',
    'nav.deliveryNote': '送货单',
    'nav.labels': '包装贴下载',
    'nav.profile': '个人中心',
    'nav.changePassword': '修改密码',
    'nav.logout': '退出登录',
    'notification.title': '消息中心',
    'notification.empty': '暂无消息',
    'notification.markRead': '全部已读',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.orders': 'Orders',
    'nav.orderCreate': 'Create Order',
    'nav.orderList': 'Order List',
    'nav.templates': 'Templates',
    'nav.customerMgmt': 'Customer Mgmt',
    'nav.customerCompanies': 'Companies',
    'nav.brandCustomers': 'Brands',
    'nav.factoryCustomers': 'Factory Clients',
    'nav.factories': 'Factories',
    'nav.billings': 'Billings',
    'nav.audit': 'Order Mgmt',
    'nav.suppliers': 'Suppliers',
    'nav.epcRules': 'EPC Rules',
    'nav.supplierBillings': 'Supplier Billings',
    'nav.orderDetail': 'Order Detail',
    'nav.epcUpload': 'EPC Upload',
    'nav.shipment': 'Shipment',
    'nav.deliveryNote': 'Delivery Note',
    'nav.labels': 'Labels',
    'nav.profile': 'Profile',
    'nav.changePassword': 'Change Password',
    'nav.logout': 'Logout',
    'notification.title': 'Notifications',
    'notification.empty': 'No notifications',
    'notification.markRead': 'Mark all read',
  },
  ja: {
    'nav.dashboard': 'ダッシュボード',
    'nav.orders': '注文管理',
    'nav.orderCreate': '注文作成',
    'nav.orderList': '注文一覧',
    'nav.templates': 'テンプレート',
    'nav.customerMgmt': '顧客管理',
    'nav.customerCompanies': '企業',
    'nav.brandCustomers': 'ブランド',
    'nav.factoryCustomers': '工場顧客',
    'nav.factories': '工場管理',
    'nav.billings': '精算管理',
    'nav.audit': '注文管理',
    'nav.suppliers': 'サプライヤー管理',
    'nav.epcRules': 'EPCルール設定',
    'nav.supplierBillings': 'サプライヤー精算',
    'nav.orderDetail': '注文詳細',
    'nav.epcUpload': 'EPCアップロード',
    'nav.shipment': '出荷管理',
    'nav.deliveryNote': '納品書',
    'nav.labels': 'ラベル',
    'nav.profile': '個人設定',
    'nav.changePassword': 'パスワード変更',
    'nav.logout': 'ログアウト',
    'notification.title': 'お知らせ',
    'notification.empty': '通知はありません',
    'notification.markRead': 'すべて既読',
  },
};

const LangContext = createContext<LangContextType>({
  lang: 'zh',
  setLang: () => {},
  t: (key: string) => key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh');

  const t = useCallback((key: string): string => {
    return translations[lang]?.[key] || translations.zh[key] || key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
