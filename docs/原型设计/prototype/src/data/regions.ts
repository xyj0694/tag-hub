// 中国行政区划数据（省级/市级/区县级，简化版用于原型演示）

export interface RegionNode {
  value: string;
  label: string;
  children?: RegionNode[];
}

export const regionData: RegionNode[] = [
  {
    value: '110000', label: '北京市',
    children: [
      { value: '110100', label: '北京市', children: [
        { value: '110101', label: '东城区' }, { value: '110102', label: '西城区' },
        { value: '110105', label: '朝阳区' }, { value: '110106', label: '丰台区' },
        { value: '110107', label: '石景山区' }, { value: '110108', label: '海淀区' },
        { value: '110109', label: '门头沟区' }, { value: '110111', label: '房山区' },
        { value: '110112', label: '通州区' }, { value: '110113', label: '顺义区' },
        { value: '110114', label: '昌平区' }, { value: '110115', label: '大兴区' },
        { value: '110116', label: '怀柔区' }, { value: '110117', label: '平谷区' },
        { value: '110118', label: '密云区' }, { value: '110119', label: '延庆区' },
      ]},
    ],
  },
  {
    value: '310000', label: '上海市',
    children: [
      { value: '310100', label: '上海市', children: [
        { value: '310101', label: '黄浦区' }, { value: '310104', label: '徐汇区' },
        { value: '310105', label: '长宁区' }, { value: '310106', label: '静安区' },
        { value: '310107', label: '普陀区' }, { value: '310109', label: '虹口区' },
        { value: '310110', label: '杨浦区' }, { value: '310112', label: '闵行区' },
        { value: '310113', label: '宝山区' }, { value: '310114', label: '嘉定区' },
        { value: '310115', label: '浦东新区' }, { value: '310116', label: '金山区' },
        { value: '310117', label: '松江区' }, { value: '310118', label: '青浦区' },
        { value: '310120', label: '奉贤区' }, { value: '310151', label: '崇明区' },
      ]},
    ],
  },
  {
    value: '330000', label: '浙江省',
    children: [
      { value: '330100', label: '杭州市', children: [
        { value: '330102', label: '上城区' }, { value: '330105', label: '拱墅区' },
        { value: '330106', label: '西湖区' }, { value: '330108', label: '滨江区' },
        { value: '330109', label: '萧山区' }, { value: '330110', label: '余杭区' },
        { value: '330111', label: '富阳区' }, { value: '330112', label: '临安区' },
        { value: '330113', label: '临平区' }, { value: '330114', label: '钱塘区' },
        { value: '330122', label: '桐庐县' }, { value: '330127', label: '淳安县' },
        { value: '330182', label: '建德市' },
      ]},
      { value: '330200', label: '宁波市', children: [
        { value: '330203', label: '海曙区' }, { value: '330205', label: '江北区' },
        { value: '330206', label: '北仑区' }, { value: '330211', label: '镇海区' },
        { value: '330212', label: '鄞州区' }, { value: '330213', label: '奉化区' },
        { value: '330225', label: '象山县' }, { value: '330226', label: '宁海县' },
        { value: '330281', label: '余姚市' }, { value: '330282', label: '慈溪市' },
      ]},
      { value: '330300', label: '温州市', children: [
        { value: '330302', label: '鹿城区' }, { value: '330303', label: '龙湾区' },
        { value: '330304', label: '瓯海区' }, { value: '330305', label: '洞头区' },
        { value: '330324', label: '永嘉县' }, { value: '330326', label: '平阳县' },
        { value: '330327', label: '苍南县' }, { value: '330328', label: '文成县' },
        { value: '330329', label: '泰顺县' }, { value: '330381', label: '瑞安市' },
        { value: '330382', label: '乐清市' }, { value: '330383', label: '龙港市' },
      ]},
      { value: '330400', label: '嘉兴市', children: [
        { value: '330402', label: '南湖区' }, { value: '330411', label: '秀洲区' },
        { value: '330421', label: '嘉善县' }, { value: '330424', label: '海盐县' },
        { value: '330481', label: '海宁市' }, { value: '330482', label: '平湖市' },
        { value: '330483', label: '桐乡市' },
      ]},
      { value: '330500', label: '湖州市', children: [
        { value: '330502', label: '吴兴区' }, { value: '330503', label: '南浔区' },
        { value: '330521', label: '德清县' }, { value: '330522', label: '长兴县' },
        { value: '330523', label: '安吉县' },
      ]},
      { value: '330600', label: '绍兴市', children: [
        { value: '330602', label: '越城区' }, { value: '330603', label: '柯桥区' },
        { value: '330604', label: '上虞区' }, { value: '330624', label: '新昌县' },
        { value: '330681', label: '诸暨市' }, { value: '330683', label: '嵊州市' },
      ]},
      { value: '330700', label: '金华市', children: [
        { value: '330702', label: '婺城区' }, { value: '330703', label: '金东区' },
        { value: '330723', label: '武义县' }, { value: '330726', label: '浦江县' },
        { value: '330727', label: '磐安县' }, { value: '330781', label: '兰溪市' },
        { value: '330782', label: '义乌市' }, { value: '330783', label: '东阳市' },
        { value: '330784', label: '永康市' },
      ]},
      { value: '330800', label: '衢州市', children: [
        { value: '330802', label: '柯城区' }, { value: '330803', label: '衢江区' },
        { value: '330822', label: '常山县' }, { value: '330824', label: '开化县' },
        { value: '330825', label: '龙游县' }, { value: '330881', label: '江山市' },
      ]},
      { value: '330900', label: '舟山市', children: [
        { value: '330902', label: '定海区' }, { value: '330903', label: '普陀区' },
        { value: '330921', label: '岱山县' }, { value: '330922', label: '嵊泗县' },
      ]},
      { value: '331000', label: '台州市', children: [
        { value: '331002', label: '椒江区' }, { value: '331003', label: '黄岩区' },
        { value: '331004', label: '路桥区' }, { value: '331022', label: '三门县' },
        { value: '331023', label: '天台县' }, { value: '331024', label: '仙居县' },
        { value: '331081', label: '温岭市' }, { value: '331082', label: '临海市' },
        { value: '331083', label: '玉环市' },
      ]},
      { value: '331100', label: '丽水市', children: [
        { value: '331102', label: '莲都区' }, { value: '331121', label: '青田县' },
        { value: '331122', label: '缙云县' }, { value: '331123', label: '遂昌县' },
        { value: '331124', label: '松阳县' }, { value: '331125', label: '云和县' },
        { value: '331126', label: '庆元县' }, { value: '331127', label: '景宁畲族自治县' },
        { value: '331181', label: '龙泉市' },
      ]},
    ],
  },
  {
    value: '320000', label: '江苏省',
    children: [
      { value: '320100', label: '南京市', children: [
        { value: '320102', label: '玄武区' }, { value: '320104', label: '秦淮区' },
        { value: '320105', label: '建邺区' }, { value: '320106', label: '鼓楼区' },
        { value: '320111', label: '浦口区' }, { value: '320113', label: '栖霞区' },
        { value: '320114', label: '雨花台区' }, { value: '320115', label: '江宁区' },
        { value: '320116', label: '六合区' }, { value: '320117', label: '溧水区' },
        { value: '320118', label: '高淳区' },
      ]},
      { value: '320200', label: '无锡市', children: [
        { value: '320205', label: '锡山区' }, { value: '320206', label: '惠山区' },
        { value: '320211', label: '滨湖区' }, { value: '320213', label: '梁溪区' },
        { value: '320214', label: '新吴区' }, { value: '320281', label: '江阴市' },
        { value: '320282', label: '宜兴市' },
      ]},
      { value: '320500', label: '苏州市', children: [
        { value: '320505', label: '虎丘区' }, { value: '320506', label: '吴中区' },
        { value: '320507', label: '相城区' }, { value: '320508', label: '姑苏区' },
        { value: '320509', label: '吴江区' }, { value: '320581', label: '常熟市' },
        { value: '320582', label: '张家港市' }, { value: '320583', label: '昆山市' },
        { value: '320585', label: '太仓市' },
      ]},
      { value: '320600', label: '南通市', children: [
        { value: '320602', label: '崇川区' }, { value: '320611', label: '港闸区' },
        { value: '320612', label: '通州区' }, { value: '320623', label: '如东县' },
        { value: '320681', label: '启东市' }, { value: '320682', label: '如皋市' },
        { value: '320685', label: '海安市' },
      ]},
      { value: '320400', label: '常州市', children: [
        { value: '320402', label: '天宁区' }, { value: '320404', label: '钟楼区' },
        { value: '320411', label: '新北区' }, { value: '320412', label: '武进区' },
        { value: '320413', label: '金坛区' }, { value: '320481', label: '溧阳市' },
      ]},
    ],
  },
  {
    value: '440000', label: '广东省',
    children: [
      { value: '440100', label: '广州市', children: [
        { value: '440103', label: '荔湾区' }, { value: '440104', label: '越秀区' },
        { value: '440105', label: '海珠区' }, { value: '440106', label: '天河区' },
        { value: '440111', label: '白云区' }, { value: '440112', label: '黄埔区' },
        { value: '440113', label: '番禺区' }, { value: '440114', label: '花都区' },
        { value: '440115', label: '南沙区' }, { value: '440117', label: '从化区' },
        { value: '440118', label: '增城区' },
      ]},
      { value: '440300', label: '深圳市', children: [
        { value: '440303', label: '罗湖区' }, { value: '440304', label: '福田区' },
        { value: '440305', label: '南山区' }, { value: '440306', label: '宝安区' },
        { value: '440307', label: '龙岗区' }, { value: '440308', label: '盐田区' },
        { value: '440309', label: '龙华区' }, { value: '440310', label: '坪山区' },
        { value: '440311', label: '光明区' },
      ]},
      { value: '440600', label: '佛山市', children: [
        { value: '440604', label: '禅城区' }, { value: '440605', label: '南海区' },
        { value: '440606', label: '顺德区' }, { value: '440607', label: '三水区' },
        { value: '440608', label: '高明区' },
      ]},
      { value: '441900', label: '东莞市', children: [
        { value: '441901', label: '莞城街道' }, { value: '441902', label: '南城街道' },
        { value: '441903', label: '东城街道' }, { value: '441904', label: '万江街道' },
        { value: '441905', label: '长安镇' }, { value: '441906', label: '虎门镇' },
      ]},
      { value: '442000', label: '中山市', children: [
        { value: '442001', label: '石岐街道' }, { value: '442002', label: '东区街道' },
        { value: '442003', label: '西区街道' }, { value: '442004', label: '小榄镇' },
        { value: '442005', label: '古镇镇' },
      ]},
      { value: '440400', label: '珠海市', children: [
        { value: '440402', label: '香洲区' }, { value: '440403', label: '斗门区' },
        { value: '440404', label: '金湾区' },
      ]},
    ],
  },
  {
    value: '350000', label: '福建省',
    children: [
      { value: '350100', label: '福州市', children: [
        { value: '350102', label: '鼓楼区' }, { value: '350103', label: '台江区' },
        { value: '350104', label: '仓山区' }, { value: '350105', label: '马尾区' },
        { value: '350111', label: '晋安区' }, { value: '350112', label: '长乐区' },
        { value: '350181', label: '福清市' },
      ]},
      { value: '350200', label: '厦门市', children: [
        { value: '350203', label: '思明区' }, { value: '350205', label: '海沧区' },
        { value: '350206', label: '湖里区' }, { value: '350211', label: '集美区' },
        { value: '350212', label: '同安区' }, { value: '350213', label: '翔安区' },
      ]},
      { value: '350500', label: '泉州市', children: [
        { value: '350502', label: '鲤城区' }, { value: '350503', label: '丰泽区' },
        { value: '350504', label: '洛江区' }, { value: '350505', label: '泉港区' },
        { value: '350581', label: '石狮市' }, { value: '350582', label: '晋江市' },
        { value: '350583', label: '南安市' },
      ]},
    ],
  },
  {
    value: '370000', label: '山东省',
    children: [
      { value: '370100', label: '济南市', children: [
        { value: '370102', label: '历下区' }, { value: '370103', label: '市中区' },
        { value: '370104', label: '槐荫区' }, { value: '370105', label: '天桥区' },
        { value: '370112', label: '历城区' }, { value: '370113', label: '长清区' },
        { value: '370114', label: '章丘区' },
      ]},
      { value: '370200', label: '青岛市', children: [
        { value: '370202', label: '市南区' }, { value: '370203', label: '市北区' },
        { value: '370211', label: '黄岛区' }, { value: '370212', label: '崂山区' },
        { value: '370213', label: '李沧区' }, { value: '370214', label: '城阳区' },
        { value: '370215', label: '即墨区' },
      ]},
      { value: '370600', label: '烟台市', children: [
        { value: '370602', label: '芝罘区' }, { value: '370611', label: '福山区' },
        { value: '370612', label: '牟平区' }, { value: '370613', label: '莱山区' },
        { value: '370681', label: '龙口市' }, { value: '370683', label: '莱州市' },
      ]},
    ],
  },
  {
    value: '410000', label: '河南省',
    children: [
      { value: '410100', label: '郑州市', children: [
        { value: '410102', label: '中原区' }, { value: '410103', label: '二七区' },
        { value: '410104', label: '管城回族区' }, { value: '410105', label: '金水区' },
        { value: '410106', label: '上街区' }, { value: '410108', label: '惠济区' },
        { value: '410181', label: '巩义市' }, { value: '410182', label: '荥阳市' },
        { value: '410184', label: '新郑市' },
      ]},
      { value: '410300', label: '洛阳市', children: [
        { value: '410302', label: '老城区' }, { value: '410303', label: '西工区' },
        { value: '410304', label: '瀍河回族区' }, { value: '410305', label: '涧西区' },
        { value: '410311', label: '洛龙区' },
      ]},
    ],
  },
  {
    value: '420000', label: '湖北省',
    children: [
      { value: '420100', label: '武汉市', children: [
        { value: '420102', label: '江岸区' }, { value: '420103', label: '江汉区' },
        { value: '420104', label: '硚口区' }, { value: '420105', label: '汉阳区' },
        { value: '420106', label: '武昌区' }, { value: '420107', label: '青山区' },
        { value: '420111', label: '洪山区' }, { value: '420112', label: '东西湖区' },
        { value: '420114', label: '蔡甸区' }, { value: '420115', label: '江夏区' },
        { value: '420116', label: '黄陂区' },
      ]},
    ],
  },
  {
    value: '510000', label: '四川省',
    children: [
      { value: '510100', label: '成都市', children: [
        { value: '510104', label: '锦江区' }, { value: '510105', label: '青羊区' },
        { value: '510106', label: '金牛区' }, { value: '510107', label: '武侯区' },
        { value: '510108', label: '成华区' }, { value: '510112', label: '龙泉驿区' },
        { value: '510113', label: '青白江区' }, { value: '510114', label: '新都区' },
        { value: '510115', label: '双流区' }, { value: '510116', label: '郫都区' },
        { value: '510181', label: '都江堰市' },
      ]},
    ],
  },
  {
    value: '500000', label: '重庆市',
    children: [
      { value: '500100', label: '重庆市', children: [
        { value: '500101', label: '万州区' }, { value: '500102', label: '涪陵区' },
        { value: '500103', label: '渝中区' }, { value: '500104', label: '大渡口区' },
        { value: '500105', label: '江北区' }, { value: '500106', label: '沙坪坝区' },
        { value: '500107', label: '九龙坡区' }, { value: '500108', label: '南岸区' },
        { value: '500109', label: '北碚区' }, { value: '500110', label: '綦江区' },
        { value: '500112', label: '渝北区' }, { value: '500113', label: '巴南区' },
      ]},
    ],
  },
  {
    value: '120000', label: '天津市',
    children: [
      { value: '120100', label: '天津市', children: [
        { value: '120101', label: '和平区' }, { value: '120102', label: '河东区' },
        { value: '120103', label: '河西区' }, { value: '120104', label: '南开区' },
        { value: '120105', label: '河北区' }, { value: '120106', label: '红桥区' },
        { value: '120110', label: '东丽区' }, { value: '120111', label: '西青区' },
        { value: '120112', label: '津南区' }, { value: '120113', label: '北辰区' },
        { value: '120114', label: '武清区' }, { value: '120115', label: '宝坻区' },
        { value: '120116', label: '滨海新区' },
      ]},
    ],
  },
  {
    value: '340000', label: '安徽省',
    children: [
      { value: '340100', label: '合肥市', children: [
        { value: '340102', label: '瑶海区' }, { value: '340103', label: '庐阳区' },
        { value: '340104', label: '蜀山区' }, { value: '340111', label: '包河区' },
        { value: '340121', label: '长丰县' }, { value: '340181', label: '巢湖市' },
      ]},
    ],
  },
  {
    value: '430000', label: '湖南省',
    children: [
      { value: '430100', label: '长沙市', children: [
        { value: '430102', label: '芙蓉区' }, { value: '430103', label: '天心区' },
        { value: '430104', label: '岳麓区' }, { value: '430105', label: '开福区' },
        { value: '430111', label: '雨花区' }, { value: '430112', label: '望城区' },
        { value: '430181', label: '浏阳市' }, { value: '430182', label: '宁乡市' },
      ]},
    ],
  },
  {
    value: '360000', label: '江西省',
    children: [
      { value: '360100', label: '南昌市', children: [
        { value: '360102', label: '东湖区' }, { value: '360103', label: '西湖区' },
        { value: '360104', label: '青云谱区' }, { value: '360111', label: '青山湖区' },
        { value: '360112', label: '新建区' }, { value: '360113', label: '红谷滩区' },
        { value: '360121', label: '南昌县' },
      ]},
    ],
  },
  {
    value: '610000', label: '陕西省',
    children: [
      { value: '610100', label: '西安市', children: [
        { value: '610102', label: '新城区' }, { value: '610103', label: '碑林区' },
        { value: '610104', label: '莲湖区' }, { value: '610111', label: '灞桥区' },
        { value: '610112', label: '未央区' }, { value: '610113', label: '雁塔区' },
        { value: '610114', label: '阎良区' }, { value: '610115', label: '临潼区' },
        { value: '610116', label: '长安区' },
      ]},
    ],
  },
];

// 工具：根据省市区名称数组查找 Cascader 值路径
export function findRegionPath(names: string[]): string[] | null {
  const result: string[] = [];

  const findInNodes = (nodes: RegionNode[], target: string): RegionNode | null => {
    for (const node of nodes) {
      if (node.label === target || node.label.startsWith(target)) return node;
      if (node.children) {
        const found = findInNodes(node.children, target);
        if (found) return found;
      }
    }
    return null;
  };

  let currentNodes: RegionNode[] = regionData;
  for (const name of names) {
    const found = findInNodes(currentNodes, name);
    if (!found) return null;
    result.push(found.value);
    currentNodes = found.children || [];
  }

  return result;
}
