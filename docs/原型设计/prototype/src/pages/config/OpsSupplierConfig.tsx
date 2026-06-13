import { useState } from 'react';
import { Card, Typography, Table, Tag, Switch, Space, Input, Select, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const mockSuppliers = [
  { id: 1, name: '杭州信达标签印刷有限公司', type: '吊牌标签', status: 'ACTIVE', contact: '王厂长', phone: '138****5678', rating: 'A' },
  { id: 2, name: '温州正邦印务有限公司', type: '吊牌标签', status: 'ACTIVE', contact: '李经理', phone: '139****6789', rating: 'A' },
  { id: 3, name: '宁波华美印刷包装有限公司', type: '洗麦标签', status: 'ACTIVE', contact: '张总', phone: '137****7890', rating: 'B' },
  { id: 4, name: '绍兴天成标签科技有限公司', type: '吊牌标签', status: 'INACTIVE', contact: '陈工', phone: '136****8901', rating: 'C' },
  { id: 5, name: '义乌丰源包装印刷有限公司', type: '不干胶贴纸标签', status: 'ACTIVE', contact: '赵主管', phone: '135****9012', rating: 'A' },
  { id: 6, name: '嘉兴恒达标识制作有限公司', type: '洗麦标签', status: 'ACTIVE', contact: '周经理', phone: '134****0123', rating: 'B' },
  { id: 7, name: '上海启明不干胶制品厂', type: '不干胶贴纸标签', status: 'ACTIVE', contact: '吴老板', phone: '133****1234', rating: 'A' },
];

const ratingColors: Record<string, string> = { A: 'green', B: 'blue', C: 'orange' };

export default function OpsSupplierConfig() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = mockSuppliers.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>供应商配置</Title>

      <Card style={{ borderRadius: 8 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          管理供应商的标签类型资质、接单能力与评级，修改后实时生效。
        </Text>

        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索供应商名称"
            style={{ width: 260 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
          />
          <Select
            placeholder="全部类型"
            style={{ width: 180 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: '全部标签类型' },
              { value: '吊牌标签', label: '吊牌标签' },
              { value: '不干胶贴纸标签', label: '不干胶贴纸标签' },
              { value: '洗麦标签', label: '洗麦标签' },
            ]}
          />
        </Space>

        <Table
          dataSource={filtered}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个供应商` }}
          columns={[
            { title: '供应商名称', dataIndex: 'name', width: 220, ellipsis: true },
            { title: '标签类型', dataIndex: 'type', width: 130, render: (t: string) => <Tag>{t}</Tag> },
            {
              title: '评级', dataIndex: 'rating', width: 70,
              render: (r: string) => <Tag color={ratingColors[r]}>{r}</Tag>,
            },
            { title: '联系人', dataIndex: 'contact', width: 80 },
            { title: '手机号', dataIndex: 'phone', width: 120 },
            {
              title: '状态', dataIndex: 'status', width: 80,
              render: (s: string) => s === 'ACTIVE' ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
            },
            {
              title: '操作',
              render: () => (
                <Space>
                  <Button size="small" type="link" onClick={() => message.info('编辑供应商配置（演示）')}>编辑</Button>
                  <Button size="small" type="link" onClick={() => message.info('资质详情（演示）')}>资质</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
