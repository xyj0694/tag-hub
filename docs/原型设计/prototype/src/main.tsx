import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import { LangProvider, useLang, type Lang } from './i18n/LanguageContext';
import App from './App';
import './index.css';

const antdLocales: Record<Lang, any> = {
  zh: zhCN,
  en: enUS,
  ja: jaJP,
};

// Invengo 品牌色系
const invengoTheme = {
  token: {
    colorPrimary: '#008089',
    colorInfo: '#008089',
    colorSuccess: '#29CC97',
    colorWarning: '#FFAD00',
    colorError: '#ff4d4f',
    colorLink: '#008089',
    borderRadius: 6,
    fontFamily: "'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Menu: {
      itemSelectedBg: '#e6f7f7',
      itemSelectedColor: '#008089',
      itemHoverBg: '#f0fafa',
    },
    Button: {
      colorPrimary: '#008089',
      colorPrimaryHover: '#1BB4BC',
      colorPrimaryActive: '#006670',
    },
    Tag: {
      colorPrimary: '#008089',
    },
    Table: {
      headerBg: '#f5fafa',
    },
  },
};

function AppWithLocale() {
  const { lang } = useLang();
  const locale = useMemo(() => antdLocales[lang], [lang]);

  return (
    <ConfigProvider locale={locale} theme={invengoTheme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <AppWithLocale />
    </LangProvider>
  </React.StrictMode>,
);
