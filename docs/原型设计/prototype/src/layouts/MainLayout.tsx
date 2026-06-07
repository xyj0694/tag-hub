import { useState } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Popover, List, Button, Typography, Space, Segmented, theme } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined, AppstoreOutlined, ShoppingCartOutlined,
  AuditOutlined, BellOutlined, UserOutlined, KeyOutlined, LogoutOutlined,
  UploadOutlined, TagsOutlined, TeamOutlined, BankOutlined,
  FileTextOutlined, SendOutlined, PrinterOutlined, DollarOutlined,
  SettingOutlined, ProfileOutlined, GlobalOutlined, ShopOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useLang, type Lang } from '../i18n/LanguageContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface Brand {
  id: number; name: string;
}

interface Props {
  role: 'brand' | 'ops' | 'supplier';
  roleName: string;
  brands?: Brand[];
  currentBrandId?: number;
  allowBrandSwitch?: boolean;
  onBrandChange?: (id: number) => void;
}

// 模拟通知数据
const mockNotifications: Record<string, { id: number; title: string; time: string; read: boolean }[]> = {
  brand: [
    { id: 1, title: '订单 TH20260601-001 已审核通过', time: '10分钟前', read: false },
    { id: 2, title: '供应商甲已完成 EPC 数据上传', time: '1小时前', read: false },
    { id: 3, title: '发货通知：订单 TH20260520-003 已发货', time: '3小时前', read: false },
    { id: 4, title: '系统升级通知：6月8日凌晨维护', time: '昨天', read: true },
  ],
  ops: [
    { id: 1, title: '新订单 TH20260603-005 待审核', time: '5分钟前', read: false },
    { id: 2, title: '品牌方「某服装集团」提交了新模板', time: '30分钟前', read: false },
    { id: 3, title: '供应商乙资质即将过期，请确认', time: '2小时前', read: false },
    { id: 4, title: 'EPC 规则冲突：2条规则需要手动处理', time: '4小时前', read: false },
    { id: 5, title: '对账单 TH202605-汇总 已生成', time: '昨天', read: false },
    { id: 6, title: '系统升级通知：6月8日凌晨维护', time: '昨天', read: true },
    { id: 7, title: '新供应商注册申请：杭州成衣三厂', time: '2天前', read: false },
  ],
  supplier: [
    { id: 1, title: '新订单 TH20260603-005 待接单', time: '5分钟前', read: false },
    { id: 2, title: '订单 TH20260520-003 已签收', time: '1小时前', read: false },
    { id: 3, title: 'EPC 数据校验完成：通过率 98.5%', time: '3小时前', read: false },
    { id: 4, title: '对账单生成提醒：请确认5月数据', time: '昨天', read: false },
    { id: 5, title: '系统升级通知：6月8日凌晨维护', time: '昨天', read: true },
  ],
};

const notificationCounts: Record<string, number> = { brand: 3, ops: 7, supplier: 5 };

const langLabels: Record<Lang, string> = { zh: '中文', en: 'English', ja: '日本語' };
const langFlags: Record<Lang, string> = { zh: '🇨🇳', en: '🇺🇸', ja: '🇯🇵' };

export default function MainLayout({ role, roleName, brands, currentBrandId, allowBrandSwitch, onBrandChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications[role] || []);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { lang, setLang, t } = useLang();

  const navs: MenuProps['items'] = (() => {
    const items: Record<string, MenuProps['items']> = {
      brand: [
        { key: '/brand/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
        {
          key: 'orders-group', icon: <ShoppingCartOutlined />, label: t('nav.orders'),
          children: [
            { key: '/brand/order-create', label: t('nav.orderCreate') },
            { key: '/brand/orders', label: t('nav.orderList') },
          ],
        },
        { key: '/brand/templates', icon: <AppstoreOutlined />, label: t('nav.templates') },
        { key: '/brand/factories', icon: <TeamOutlined />, label: t('nav.factories') },
        { key: '/brand/billings', icon: <DollarOutlined />, label: t('nav.billings') },
      ],
      ops: [
        { key: '/ops/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
        { key: '/ops/audit', icon: <AuditOutlined />, label: t('nav.audit') },
        { type: 'divider' },
        {
          key: 'customer-group',
          icon: <ShopOutlined />,
          label: t('nav.customerMgmt'),
          children: [
            { key: '/ops/customers', icon: <BankOutlined />, label: t('nav.customerCompanies') },
            { key: '/ops/brands', icon: <BankOutlined />, label: t('nav.brandCustomers') },
            { key: '/ops/factories', icon: <TeamOutlined />, label: t('nav.factoryCustomers') },
          ],
        },
        { type: 'divider' },
        { key: '/ops/suppliers', icon: <TeamOutlined />, label: t('nav.suppliers') },
        { key: '/ops/epc-rules', icon: <SettingOutlined />, label: t('nav.epcRules') },
        { key: '/ops/billings', icon: <DollarOutlined />, label: t('nav.supplierBillings') },
      ],
      supplier: [
        { key: '/supplier/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
        { key: '/supplier/orders', icon: <ShoppingCartOutlined />, label: t('nav.orderList') },
        { key: '/supplier/detail', icon: <FileTextOutlined />, label: t('nav.orderDetail') },
        { key: '/supplier/epc', icon: <UploadOutlined />, label: t('nav.epcUpload') },
        { key: '/supplier/shipment', icon: <SendOutlined />, label: t('nav.shipment') },
        { key: '/supplier/delivery-note', icon: <PrinterOutlined />, label: t('nav.deliveryNote') },
        { key: '/supplier/labels', icon: <TagsOutlined />, label: t('nav.labels') },
        { key: '/supplier/billings', icon: <DollarOutlined />, label: t('nav.billings') },
      ],
    };
    return items[role] || [];
  })();

  const selectedKey = location.pathname;
  const openKeys: string[] = [];
  navs.forEach((n: any) => {
    if (n.children?.some((c: any) => c.key === selectedKey)) {
      openKeys.push(n.key as string);
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const notifContent = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>{t('notification.title')}</Text>
        <Button type="link" size="small" onClick={markAllRead}>{t('notification.markRead')}</Button>
      </div>
      {notifications.length === 0 ? (
        <Text type="secondary">{t('notification.empty')}</Text>
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={item => (
            <List.Item
              style={{ cursor: 'pointer', opacity: item.read ? 0.5 : 1, padding: '8px 0' }}
              onClick={() => {
                setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                const t = item.title;
                if (t.includes('待审核') || t.includes('新订单')) navigate(`/${role}/audit`);
                else if (t.includes('模板')) navigate(`/${role}/brands`);
                else if (t.includes('供应商') && (t.includes('资质') || t.includes('过期'))) navigate(`/${role}/suppliers`);
                else if (t.includes('EPC') || t.includes('规则')) navigate(`/${role}/epc-rules`);
                else if (t.includes('对账单')) navigate(`/${role}/billings`);
                else if (t.includes('注册') || t.includes('申请')) navigate(`/${role}/suppliers`);
                else if (t.includes('校验') || t.includes('EPC')) navigate(`/${role}/orders`);
              }}
            >
              <List.Item.Meta
                avatar={!item.read ? <span style={{ width: 6, height: 6, borderRadius: 3, background: token.colorPrimary, display: 'inline-block', marginTop: 6 }} /> : <span style={{ width: 6, display: 'inline-block' }} />}
                title={<Text style={{ fontSize: 13 }}>{item.title}</Text>}
                description={<Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  const langMenuItems: MenuProps['items'] = (Object.keys(langLabels) as Lang[]).map(l => ({
    key: l,
    label: `${langFlags[l]} ${langLabels[l]}`,
    onClick: () => setLang(l),
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}
        theme="light"
      >
        <div
          style={{
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 16px', cursor: 'pointer',
          }}
          onClick={() => navigate(`/${role}/dashboard`)}
        >
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 700, color: '#008089' }}>🏷️</span>
          ) : (
            <img src="/logo.png" alt="Invengo" style={{ height: 36, maxWidth: '100%' }} />
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={navs}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: token.colorBgContainer, padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorBorderSecondary}`, height: 56,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{roleName}</span>
            {allowBrandSwitch && brands && brands.length > 1 && (
              <Segmented
                size="small"
                value={currentBrandId}
                onChange={(val) => onBrandChange?.(val as number)}
                options={[
                  { label: '全部', value: 0 },
                  ...brands.map(b => ({ label: b.name, value: b.id })),
                ]}
                style={{ background: token.colorFillSecondary }}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 语言切换 */}
            <Dropdown menu={{ items: langMenuItems, selectedKeys: [lang] }} trigger={['click']}>
              <Button type="text" icon={<GlobalOutlined />} style={{ fontSize: 14 }}>
                {langFlags[lang]}
              </Button>
            </Dropdown>

            {/* 消息中心 */}
            <Popover
              content={notifContent}
              title={null}
              trigger="click"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
            >
              <Badge count={unreadCount} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
            </Popover>

            {/* 用户菜单 */}
            <Dropdown menu={{ items: [
                { key: 'profile', icon: <ProfileOutlined />, label: t('user.profile'), onClick: () => navigate(`/${role}/profile`) },
                { key: 'change-password', icon: <KeyOutlined />, label: t('user.changePassword'), onClick: () => navigate(`/${role}/change-password`) },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: t('user.logout'), onClick: () => navigate('/') },
              ] }}>
              <Avatar size={32} icon={<UserOutlined />} style={{ cursor: 'pointer', background: token.colorPrimary }} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 24, background: token.colorBgLayout, minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
