import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, Input, Select, Typography, Space, Tag, message, Modal, Tooltip,
  Divider, Segmented, InputNumber, Switch, Collapse, Slider, Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, EyeOutlined, DownloadOutlined,
  PlusOutlined, DeleteOutlined, CopyOutlined, UndoOutlined, RedoOutlined,
  ZoomInOutlined, ZoomOutOutlined, UploadOutlined,
  FontSizeOutlined, BarcodeOutlined, QrcodeOutlined,
  PictureOutlined, LineOutlined, BorderOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  VerticalAlignTopOutlined, VerticalAlignMiddleOutlined, VerticalAlignBottomOutlined,
  ColumnWidthOutlined, ColumnHeightOutlined, CompressOutlined,
  SettingOutlined, EyeInvisibleOutlined, LockOutlined, UnlockOutlined,
  AimOutlined, DragOutlined, ItalicOutlined,
  RotateRightOutlined, BgColorsOutlined, MinusOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

type TagType = '吊牌标签' | '不干胶贴纸标签' | '洗麦标签';
type ElementType = 'text' | 'barcode' | 'qrcode' | 'image' | 'line' | 'rect' | 'circle';

interface DesignElement {
  id: string; type: ElementType;
  x: number; y: number; width: number; height: number;
  rotation?: number; opacity?: number; locked?: boolean; visible?: boolean;
  text?: string; fontSize?: number; fontWeight?: string; fontFamily?: string;
  color?: string; align?: 'left' | 'center' | 'right';
  lineHeight?: number; letterSpacing?: number; italic?: boolean;
  barcodeType?: string;
  fillColor?: string; strokeColor?: string; strokeWidth?: number; borderRadius?: number;
  imageUrl?: string;
  fieldKey?: string;
}

interface GuideLine { id: string; orientation: 'h' | 'v'; position: number; }
interface TemplateDesign { id: number; name: string; type: TagType; width: number; height: number; elements: DesignElement[]; version: number; createdAt: string; }

const SIZE_PRESETS: Record<TagType, { width: number; height: number }> = {
  '吊牌标签': { width: 40, height: 90 }, '不干胶贴纸标签': { width: 55, height: 75 }, '洗麦标签': { width: 30, height: 65 },
};

const ELEMENT_DEFAULTS: Record<ElementType, Partial<DesignElement>> = {
  text: { width: 28, height: 8, text: '文本', fontSize: 9, fontWeight: 'normal', fontFamily: 'sans-serif', color: '#333333', align: 'left', opacity: 1, lineHeight: 1.3, letterSpacing: 0 },
  barcode: { width: 32, height: 10, barcodeType: 'code128', opacity: 1 },
  qrcode: { width: 14, height: 14, opacity: 1 },
  image: { width: 22, height: 22, opacity: 1 },
  line: { width: 30, height: 1, opacity: 1 },
  rect: { width: 18, height: 12, fillColor: '#ffffff', strokeColor: '#cccccc', strokeWidth: 1, borderRadius: 0, opacity: 1 },
  circle: { width: 16, height: 16, fillColor: '#ffffff', strokeColor: '#cccccc', strokeWidth: 1, opacity: 1 },
};

const STORAGE_KEY = 'tag_template_designs';
function loadDesigns(): TemplateDesign[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveDesigns(designs: TemplateDesign[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(designs)); }
let _idCounter = Date.now(); function uid(): string { return 'el_' + (_idCounter++); }

// ===== Canvas =====
function Canvas({
  design, elements, setElements, selectedIds, setSelectedIds, scale, snapToGrid, setScale,
  hoveredId, setHoveredId, guides, setGuides,
}: {
  design: TemplateDesign; elements: DesignElement[]; setElements: (els: DesignElement[]) => void;
  selectedIds: string[]; setSelectedIds: (ids: string[]) => void;
  scale: number; snapToGrid: boolean; setScale: (s: number|((s:number)=>number)) => void;
  hoveredId: string | null; setHoveredId: (id: string | null) => void;
  guides: GuideLine[]; setGuides: (g: GuideLine[]) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ ids: string[]; sx: number; sy: number; elements: DesignElement[] } | null>(null);
  const resizeRef = useRef<{ elId: string; sx: number; sy: number; ow: number; oh: number; ox: number; oy: number; handle: string } | null>(null);
  const rotateRef = useRef<{ elId: string; sx: number; sy: number; or: number; cx: number; cy: number } | null>(null);
  const panRef = useRef<{ sx: number; sy: number } | null>(null);
  const [panX, setPanX] = useState(0); const [panY, setPanY] = useState(0);
  const cw = design.width * scale; const ch = design.height * scale;
  const snap = (v: number) => snapToGrid ? Math.round(v) : v;
  const getPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  }, [scale]);

  const getAlignGuides = (ex: number, ey: number, ew: number, eh: number, skipId: string) => {
    const g: { x?: number; y?: number } = {}; const t = 1;
    if (Math.abs(ex + ew/2 - design.width/2) < t) g.x = design.width/2 - ew/2;
    if (Math.abs(ey + eh/2 - design.height/2) < t) g.y = design.height/2 - eh/2;
    for (const o of elements) { if (o.id === skipId) continue;
      if (Math.abs(ex - o.x) < t) g.x = o.x; if (Math.abs(ex + ew - o.x - o.width) < t) g.x = o.x + o.width - ew;
      if (Math.abs(ey - o.y) < t) g.y = o.y; if (Math.abs(ey + eh - o.y - o.height) < t) g.y = o.y + o.height - eh; }
    return g;
  };

  const startDrag = (e: React.MouseEvent, el: DesignElement) => {
    if (el.locked) return; e.stopPropagation(); e.preventDefault();
    const p = getPos(e);
    const ids = selectedIds.includes(el.id) ? selectedIds : [el.id];
    setSelectedIds(ids);
    dragRef.current = { ids, sx: p.x, sy: p.y, elements: elements.map(e => ({...e})) };
    const onMove = (ev: MouseEvent) => { if (!dragRef.current) return;
      const cp = getPos(ev); const dx = cp.x - dragRef.current.sx; const dy = cp.y - dragRef.current.sy;
      setElements(dragRef.current.elements.map(e => {
        if (!dragRef.current!.ids.includes(e.id)) return e;
        const orig = dragRef.current!.elements.find(o=>o.id===e.id)!;
        let nx = snap(Math.max(0, Math.min(orig.x + dx, design.width - e.width)));
        let ny = snap(Math.max(0, Math.min(orig.y + dy, design.height - e.height)));
        const g = getAlignGuides(nx,ny,e.width,e.height,e.id); if(g.x!==undefined)nx=g.x; if(g.y!==undefined)ny=g.y;
        return {...e, x:nx, y:ny};
      }));
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  const startResize = (e: React.MouseEvent, el: DesignElement, handle: string) => {
    if (el.locked) return; e.stopPropagation(); e.preventDefault();
    const p = getPos(e);
    resizeRef.current = { elId: el.id, sx: p.x, sy: p.y, ow: el.width, oh: el.height, ox: el.x, oy: el.y, handle };
    const onMove = (ev: MouseEvent) => { if (!resizeRef.current) return;
      const cp = getPos(ev); const dx = cp.x - resizeRef.current.sx; const dy = cp.y - resizeRef.current.sy;
      let nw = resizeRef.current.ow, nh = resizeRef.current.oh;
      let nx = resizeRef.current.ox, ny = resizeRef.current.oy;
      const h = resizeRef.current.handle;
      if (h.includes('e')) nw = Math.max(4, resizeRef.current.ow + dx);
      if (h.includes('w')) { nw = Math.max(4, resizeRef.current.ow - dx); nx = resizeRef.current.ox + resizeRef.current.ow - nw; }
      if (h.includes('s')) nh = Math.max(4, resizeRef.current.oh + dy);
      if (h.includes('n')) { nh = Math.max(4, resizeRef.current.oh - dy); ny = resizeRef.current.oy + resizeRef.current.oh - nh; }
      nw = snap(Math.round(nw)); nh = snap(Math.round(nh)); nx = Math.max(0, Math.round(nx)); ny = Math.max(0, Math.round(ny));
      setElements(elements.map(e => e.id === el.id ? {...e, x:nx, y:ny, width:nw, height:nh} : e));
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  const startRotate = (e: React.MouseEvent, el: DesignElement) => {
    if (el.locked) return; e.stopPropagation(); e.preventDefault();
    const cx = el.x + el.width/2; const cy = el.y + el.height/2;
    const p = getPos(e); const sa = Math.atan2(p.y - cy, p.x - cx);
    rotateRef.current = { elId: el.id, sx: p.x, sy: p.y, or: el.rotation || 0, cx, cy };
    const onMove = (ev: MouseEvent) => { if (!rotateRef.current) return;
      const cp = getPos(ev);
      let deg = rotateRef.current.or + ((Math.atan2(cp.y - rotateRef.current.cy, cp.x - rotateRef.current.cx) - sa) * 180 / Math.PI);
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      setElements(elements.map(e => e.id === el.id ? {...e, rotation: Math.round(deg)} : e));
    };
    const onUp = () => { rotateRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  useEffect(() => { const el = canvasRef.current; if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); setScale((s: number) => Math.max(0.5, Math.min(12, s + (e.deltaY > 0 ? -0.5 : 0.5)))); };
    el.addEventListener('wheel', h, { passive: false }); return () => el.removeEventListener('wheel', h);
  }, []);

  const rulerMarks = useMemo(() => {
    const m: { pos: number; label: string; isMajor: boolean }[] = [];
    for (let i = 0; i <= design.width; i += snapToGrid ? 1 : 5) m.push({ pos: i, label: i % 10 === 0 ? String(i) : '', isMajor: i % 10 === 0 });
    return m;
  }, [design.width, snapToGrid]);

  const addGuideH = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const pos = snap((e.clientY - rect.top) / scale);
    setGuides([...guides, { id: uid(), orientation: 'h', position: Math.max(0, Math.min(pos, design.height)) }]);
  };
  const addGuideV = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const pos = snap((e.clientX - rect.left) / scale);
    setGuides([...guides, { id: uid(), orientation: 'v', position: Math.max(0, Math.min(pos, design.width)) }]);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', transform: 'translate(' + panX + 'px, ' + panY + 'px)' }}>
      <div onClick={addGuideV} style={{ height: 16, marginLeft: 16, position: 'relative', borderBottom: '1px solid #d9d9d9', cursor: 'crosshair' }}>
        {rulerMarks.filter(m => m.pos % 5 === 0).map(m => (
          <div key={m.pos} style={{ position: 'absolute', left: m.pos * scale, bottom: 0, height: m.isMajor ? 10 : 6, width: 1, background: m.isMajor ? '#999' : '#ccc' }}>
            {m.isMajor && <span style={{ position: 'absolute', top: -11, left: -6, fontSize: 8, color: '#999', width: 16, textAlign: 'center' }}>{m.label}</span>}
          </div>))}
      </div>
      <div style={{ display: 'flex' }}>
        <div onClick={addGuideH} style={{ width: 16, borderRight: '1px solid #d9d9d9', position: 'relative', flexShrink: 0, cursor: 'crosshair' }}>
          {Array.from({ length: Math.floor(design.height / 5) + 1 }, (_, i) => i * 5).map(y => (
            <div key={y} style={{ position: 'absolute', top: y * scale, right: 0, width: y % 10 === 0 ? 10 : 6, height: 1, background: y % 10 === 0 ? '#999' : '#ccc' }}>
              {y % 10 === 0 && <span style={{ position: 'absolute', top: -5, right: 12, fontSize: 8, color: '#999' }}>{y}</span>}
            </div>))}
        </div>
        <div ref={canvasRef}
          onMouseDown={(e) => {
            if (e.shiftKey) return;
            if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true') {
              setSelectedIds([]);
              panRef.current = { sx: e.clientX, sy: e.clientY };
              const onMove = (ev: MouseEvent) => { if (!panRef.current) return;
                setPanX(x => x + (ev.clientX - panRef.current!.sx)); setPanY(y => y + (ev.clientY - panRef.current!.sy));
                panRef.current = { sx: ev.clientX, sy: ev.clientY };
              };
              const onUp = () => { panRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
            }
          }}
          style={{ width: cw, height: ch, position: 'relative', cursor: 'grab', background: 'white',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            backgroundImage: 'radial-gradient(circle, #e0e0e0 0.5px, transparent 0.5px)',
            backgroundSize: scale + 'px ' + scale + 'px' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#f0f0f0', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 0, top: '50%', width: '100%', height: 1, background: '#f0f0f0', pointerEvents: 'none' }} />
          {guides.map(g => (
            <div key={g.id} onDoubleClick={() => setGuides(guides.filter(x => x.id !== g.id))}
              style={{ position: 'absolute', pointerEvents: 'auto', zIndex: 20,
                cursor: g.orientation === 'h' ? 'ns-resize' : 'ew-resize',
                ...(g.orientation === 'h' ? { left: 0, top: g.position * scale, width: '100%', height: 1, borderTop: '1px solid #ff4d4f' } :
                  { top: 0, left: g.position * scale, height: '100%', width: 1, borderLeft: '1px solid #ff4d4f' }) }} />))}
          {elements.map(el => {
            if (el.visible === false) return null;
            const sel = selectedIds.includes(el.id); const hov = hoveredId === el.id && !sel;
            const rot = el.rotation || 0;
            return (
              <div key={el.id}
                onMouseDown={(e) => { if (e.shiftKey) { e.stopPropagation(); setSelectedIds(selectedIds.includes(el.id) ? selectedIds.filter(x=>x!==el.id) : [...selectedIds, el.id]); return; } startDrag(e, el); }}
                onMouseEnter={() => setHoveredId(el.id)} onMouseLeave={() => setHoveredId(null)}
                style={{ position: 'absolute', left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale,
                  cursor: el.locked ? 'not-allowed' : 'move', boxSizing: 'border-box',
                  border: sel ? '2px solid #008089' : hov ? '1.5px dashed #91d5ff' : '1px solid transparent',
                  opacity: (el.opacity ?? 1) * (el.locked ? 0.7 : 1),
                  transform: rot ? 'rotate(' + rot + 'deg)' : undefined, transformOrigin: 'center center',
                  transition: 'border-color 0.15s' }}>
                {el.type === 'text' && (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                    fontSize: (el.fontSize || 9) * scale, fontWeight: el.fontWeight || 'normal',
                    fontFamily: el.fontFamily || 'sans-serif', color: el.color || '#333',
                    fontStyle: el.italic ? 'italic' : 'normal',
                    lineHeight: el.lineHeight || 1.3, letterSpacing: (el.letterSpacing || 0) * scale,
                    justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
                    padding: '0 2px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {el.text || (el.fieldKey ? '{' + el.fieldKey + '}' : '')}
                  </div>)}
                {el.type === 'barcode' && <div style={{ width:'100%',height:'100%',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <svg width={el.width*scale*0.9} height={el.height*scale*0.6}>
                    {[...Array(Math.max(1,Math.floor(el.width*2)))].map((_,i)=>(<line key={i} x1={i*(el.width*scale*0.9)/Math.floor(el.width*2)} y1={1} x2={i*(el.width*scale*0.9)/Math.floor(el.width*2)} y2={el.height*scale*0.6-1} stroke={i%3===0?'#333':i%3===1?'#555':'#999'} strokeWidth={i%4===0?1.8:0.7}/>))}
                  </svg></div>}
                {el.type === 'qrcode' && <div style={{ width:'100%',height:'100%',background:'#f9f9f9',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <div style={{ width:Math.min(el.width,el.height)*scale*0.78,height:Math.min(el.width,el.height)*scale*0.78,display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(7,1fr)',gap:0.8 }}>
                    {[0,1,2,3,4,5,6,7,8,9,14,15,16,17,18,19,20,21,22,23,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48].map(i=>(<div key={i} style={{background:'#444',borderRadius:1}}/>))}
                    {[10,12,24,26,11,13,25,27].map(i=>(<div key={i} style={{border:'1px solid #444',background:'white',borderRadius:1}}/>))}
                  </div></div>}
                {el.type === 'image' && <div style={{ width:'100%',height:'100%',background:'linear-gradient(135deg,#f5f5f5 25%,#eee 25%,#eee 50%,#f5f5f5 50%,#f5f5f5 75%,#eee 75%)',backgroundSize:'12px 12px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Text type="secondary" style={{ fontSize: Math.min(10,el.height*0.4)*scale }}>IMG</Text></div>}
                {el.type === 'line' && <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center' }}>
                  <div style={{ width:'100%',height:Math.max(1,el.height*scale),background:'#aaa'}}/></div>}
                {el.type === 'rect' && <div style={{ width:'100%',height:'100%',background:el.fillColor||'transparent',
                  border: (el.strokeWidth||1)*scale + 'px solid ' + (el.strokeColor||'#ccc'), borderRadius:(el.borderRadius||0)*scale}}/>}
                {el.type === 'circle' && <div style={{ width:'100%',height:'100%',borderRadius:'50%',
                  background:el.fillColor||'transparent', border: (el.strokeWidth||1)*scale + 'px solid ' + (el.strokeColor||'#ccc')}}/>}
                {el.locked && <div style={{ position:'absolute',top:-1,right:-1,background:'#faad14',borderRadius:'0 0 0 4px',padding:'0 3px' }}>
                  <LockOutlined style={{fontSize:8,color:'#fff'}}/></div>}
                {sel && !el.locked && <>
                  {['nw','n','ne','e','se','s','sw','w'].map(h=>(<div key={h} onMouseDown={(e)=>startResize(e,el,h)}
                    style={{ position:'absolute',width:7,height:7,background:'white',border:'1.5px solid #008089',zIndex:10,
                      cursor:h==='nw'||h==='se'?'nwse-resize':h==='ne'||h==='sw'?'nesw-resize':h==='n'||h==='s'?'ns-resize':'ew-resize',
                      ...(h.includes('n')?{top:-4}:h.includes('s')?{bottom:-4}:{top:'50%',marginTop:-4}),
                      ...(h.includes('w')?{left:-4}:h.includes('e')?{right:-4}:{left:'50%',marginLeft:-4}) }}/>))}
                  <div onMouseDown={(e)=>startRotate(e,el)} style={{ position:'absolute',top:-20,left:'50%',marginLeft:-5,width:10,height:10,
                    borderRadius:'50%',background:'white',border:'1.5px solid #008089',cursor:'grab',zIndex:10}}>
                    <RotateRightOutlined style={{fontSize:6,color:'#008089',position:'absolute',top:1,left:1}}/></div>
                  <div style={{ position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',background:'#008089',color:'#fff',
                    fontSize:9,padding:'1px 6px',borderRadius:3,whiteSpace:'nowrap',pointerEvents:'none'}}>
                    {el.width}x{el.height}{rot ? ' ' + rot + 'deg' : ''}</div>
                </>}
              </div>);
          })}
          {elements.length === 0 && <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',color:'#ccc',pointerEvents:'none' }}>
            <DragOutlined style={{fontSize:32,marginBottom:8}}/><div style={{fontSize:13}}>从左侧面板添加元素</div></div>}
        </div>
      </div>
    </div>
  );
}

// ===== PropertiesPanel =====
function PropertiesPanel({
  el, elements, setElements, design, selectedIds,
}: {
  el: DesignElement | null; elements: DesignElement[]; setElements: (els: DesignElement[]) => void;
  design: TemplateDesign; selectedIds: string[];
}) {
  if (!el) {
    const count = selectedIds.length;
    if (count > 1) {
      const sels = elements.filter(e => selectedIds.includes(e.id));
      return (
        <div style={{ padding: 16 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>已选中 {count} 个元素</Text>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>对齐</Text>
            <Space wrap size={4}>
              {[
                { icon: <AlignLeftOutlined />, label: '左对齐', fn: () => { const minX = Math.min(...sels.map(s => s.x)); setElements(elements.map(e => selectedIds.includes(e.id) ? {...e, x: minX} : e)); } },
                { icon: <AlignCenterOutlined />, label: '水平居中', fn: () => { const cx = design.width/2; setElements(elements.map(e => selectedIds.includes(e.id) ? {...e, x: Math.round(cx - e.width/2)} : e)); } },
                { icon: <AlignRightOutlined />, label: '右对齐', fn: () => { const maxR = Math.max(...sels.map(s => s.x + s.width)); setElements(elements.map(e => selectedIds.includes(e.id) ? {...e, x: maxR - e.width} : e)); } },
                { icon: <VerticalAlignTopOutlined />, label: '顶对齐', fn: () => { const minY = Math.min(...sels.map(s => s.y)); setElements(elements.map(e => selectedIds.includes(e.id) ? {...e, y: minY} : e)); } },
                { icon: <VerticalAlignMiddleOutlined />, label: '垂直居中', fn: () => { const cy = design.height/2; setElements(elements.map(e => selectedIds.includes(e.id) ? {...e, y: Math.round(cy - e.height/2)} : e)); } },
                { icon: <VerticalAlignBottomOutlined />, label: '底对齐', fn: () => { const maxB = Math.max(...sels.map(s => s.y + s.height)); setElements(elements.map(e => selectedIds.includes(e.id) ? {...e, y: maxB - e.height} : e)); } },
              ].map(a => (
                <Tooltip key={a.label} title={a.label}><Button size="small" icon={a.icon} onClick={a.fn} /></Tooltip>
              ))}
            </Space>
          </div>
          <Button block size="small" danger icon={<DeleteOutlined />} onClick={() => setElements(elements.filter(e => !selectedIds.includes(e.id)))}>删除选中 ({count})</Button>
        </div>
      );
    }
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <AimOutlined style={{ fontSize: 36, color: '#d9d9d9', marginBottom: 12 }} />
        <div><Text type="secondary">选择画布元素以编辑属性</Text></div>
      </div>
    );
  }

  const update = (patch: Partial<DesignElement>) => {
    setElements(elements.map(e => e.id === el.id ? { ...e, ...patch } : e));
  };

  const typeLabel: Record<ElementType, string> = { text: '文本', barcode: '条码', qrcode: '二维码', image: '图片', line: '分割线', rect: '矩形', circle: '圆形' };

  const items = [
    { key: 'pos', label: <Text strong style={{fontSize:12}}>位置与尺寸</Text>, children: (
      <div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>X</Text><InputNumber size="small" value={el.x} min={0} max={design.width-el.width} style={{width:'100%'}} onChange={v=>v!==null&&update({x:v})}/></div>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>Y</Text><InputNumber size="small" value={el.y} min={0} max={design.height-el.height} style={{width:'100%'}} onChange={v=>v!==null&&update({y:v})}/></div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>宽</Text><InputNumber size="small" value={el.width} min={4} max={design.width} style={{width:'100%'}} onChange={v=>v!==null&&update({width:v})}/></div>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>高</Text><InputNumber size="small" value={el.height} min={4} max={design.height} style={{width:'100%'}} onChange={v=>v!==null&&update({height:v})}/></div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>旋转</Text><InputNumber size="small" value={el.rotation||0} min={-360} max={360} style={{width:'100%'}} onChange={v=>v!==null&&update({rotation:v})} suffix="°"/></div>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>透明度</Text><InputNumber size="small" value={el.opacity??1} min={0.1} max={1} step={0.1} style={{width:'100%'}} onChange={v=>v!==null&&update({opacity:v})}/></div>
        </div>
        <Space>
          <Tooltip title={el.locked?'解锁':'锁定'}><Button size="small" type={el.locked?'primary':'default'} icon={el.locked?<LockOutlined/>:<UnlockOutlined/>} onClick={()=>update({locked:!el.locked})} danger={el.locked}>{el.locked?'已锁定':'锁定'}</Button></Tooltip>
          <Tooltip title={el.visible===false?'显示':'隐藏'}><Button size="small" icon={<EyeInvisibleOutlined/>} onClick={()=>update({visible:!(el.visible===false)})} type={el.visible===false?'default':'text'}/></Tooltip>
        </Space>
      </div>
    )},
  ];

  if (el.type === 'text') {
    items.push({ key: 'textStyle', label: <Text strong style={{fontSize:12}}>文本样式</Text>, children: (
      <div>
        <div style={{marginBottom:8}}><Text type="secondary" style={{fontSize:10,display:'block'}}>内容</Text><Input size="small" value={el.text||''} placeholder="输入文本..." onChange={e=>update({text:e.target.value})}/></div>
        <div style={{marginBottom:8}}><Text type="secondary" style={{fontSize:10,display:'block'}}>绑定字段</Text><Input size="small" value={el.fieldKey||''} placeholder="如 productName" onChange={e=>update({fieldKey:e.target.value||undefined})}/></div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>字号</Text><InputNumber size="small" value={el.fontSize||9} min={3} max={72} style={{width:'100%'}} onChange={v=>v!==null&&update({fontSize:v})}/></div>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>字重</Text><Segmented size="small" value={el.fontWeight||'normal'} onChange={v=>update({fontWeight:v as string})} options={[{label:'常规',value:'normal'},{label:'粗体',value:'bold'}]}/></div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>行高</Text><InputNumber size="small" value={el.lineHeight||1.3} min={0.5} max={3} step={0.1} style={{width:'100%'}} onChange={v=>v!==null&&update({lineHeight:v})}/></div>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>字间距</Text><InputNumber size="small" value={el.letterSpacing||0} min={0} max={10} style={{width:'100%'}} onChange={v=>v!==null&&update({letterSpacing:v})}/></div>
        </div>
        <div style={{marginBottom:8}}><Text type="secondary" style={{fontSize:10,display:'block'}}>对齐</Text>
          <Segmented size="small" block value={el.align||'left'} onChange={v=>update({align:v as 'left'|'center'|'right'})}
            options={[{label:<><AlignLeftOutlined/>左</>,value:'left'},{label:<><AlignCenterOutlined/>中</>,value:'center'},{label:<><AlignRightOutlined/>右</>,value:'right'}]}/></div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>颜色</Text><Input size="small" value={el.color||'#333333'}
            prefix={<span style={{width:14,height:14,background:el.color||'#333',borderRadius:3,display:'inline-block'}}/>}
            onChange={e=>update({color:e.target.value})} style={{fontFamily:'monospace',fontSize:11}}/></div>
          <div style={{flex:1,display:'flex',alignItems:'flex-end'}}>
            <Tooltip title="斜体"><Button size="small" type={el.italic?'primary':'default'} icon={<ItalicOutlined/>} onClick={()=>update({italic:!el.italic})}/></Tooltip>
          </div>
        </div>
        <div style={{marginBottom:8}}><Text type="secondary" style={{fontSize:10,display:'block'}}>字体</Text>
          <Select size="small" value={el.fontFamily||'sans-serif'} style={{width:'100%'}} onChange={v=>update({fontFamily:v})}
            options={[{value:'sans-serif',label:'默认黑体'},{value:'serif',label:'宋体'},{value:'monospace',label:'等宽'}]}/></div>
      </div>
    )});
  }

  if (el.type === 'barcode') {
    items.push({ key: 'bc', label: <Text strong style={{fontSize:12}}>条码设置</Text>, children: (
      <div><Select size="small" value={el.barcodeType||'code128'} style={{width:'100%'}} onChange={v=>update({barcodeType:v})} options={[{value:'code128',label:'Code 128'},{value:'ean13',label:'EAN-13'}]}/></div>
    )});
  }

  if (el.type === 'rect' || el.type === 'circle') {
    items.push({ key: 'shapeStyle', label: <Text strong style={{fontSize:12}}>样式</Text>, children: (
      <div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>填充色</Text><Input size="small" value={el.fillColor||'#ffffff'}
            prefix={<span style={{width:14,height:14,background:el.fillColor||'#fff',borderRadius:3,display:'inline-block',border:'1px solid #d9d9d9'}}/>}
            onChange={e=>update({fillColor:e.target.value})} style={{fontFamily:'monospace',fontSize:11}}/></div>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>边框色</Text><Input size="small" value={el.strokeColor||'#cccccc'}
            prefix={<span style={{width:14,height:14,background:el.strokeColor||'#ccc',borderRadius:3,display:'inline-block'}}/>}
            onChange={e=>update({strokeColor:e.target.value})} style={{fontFamily:'monospace',fontSize:11}}/></div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>线宽</Text><InputNumber size="small" value={el.strokeWidth||1} min={0} max={10} style={{width:'100%'}} onChange={v=>v!==null&&update({strokeWidth:v})}/></div>
          {el.type==='rect'&&<div style={{flex:1}}><Text type="secondary" style={{fontSize:10,display:'block'}}>圆角</Text><InputNumber size="small" value={el.borderRadius||0} min={0} max={30} style={{width:'100%'}} onChange={v=>v!==null&&update({borderRadius:v})}/></div>}
        </div>
      </div>
    )});
  }

  items.push({ key: 'actions', label: <Text strong style={{fontSize:12}}>操作</Text>, children: (
    <Space direction="vertical" style={{width:'100%'}}>
      <Button block size="small" icon={<CopyOutlined/>} onClick={()=>{const newEl:DesignElement={...el,id:uid(),x:Math.min(el.x+5,design.width-el.width),y:Math.min(el.y+5,design.height-el.height)};setElements([...elements,newEl]);}}>复制元素</Button>
      <Button block size="small" danger icon={<DeleteOutlined/>} onClick={()=>setElements(elements.filter(e=>e.id!==el.id))}>删除元素</Button>
    </Space>
  )});

  return (
    <div style={{padding:'8px 0'}}>
      <div style={{padding:'0 12px',marginBottom:8}}>
        <Text strong style={{fontSize:13}}>{typeLabel[el.type]}</Text>
        <Text type="secondary" style={{fontSize:10,marginLeft:8,fontFamily:'monospace'}}>{el.id.slice(-6)}</Text>
      </div>
      <Collapse ghost size="small" defaultActiveKey={['pos','textStyle','bc','shapeStyle','actions']} items={items}/>
    </div>
  );
}

// ===== LayerPanel =====
function LayerPanel({ elements, selectedIds, setSelectedIds, setElements }: {
  elements: DesignElement[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void;
  setElements: (els: DesignElement[]) => void;
}) {
  const typeIcons: Record<ElementType, string> = { text: 'T', barcode: '||', qrcode: 'QR', image: 'IMG', line: '--', rect: '[]', circle: '()' };
  const dragItem = useRef<number>(0);
  const dragOverItem = useRef<number>(0);

  const handleSort = () => {
    const els = [...elements];
    const dragged = els.splice(dragItem.current, 1)[0];
    els.splice(dragOverItem.current, 0, dragged);
    setElements(els);
  };

  return (
    <div style={{padding:8}}>
      <Text strong style={{fontSize:12,display:'block',marginBottom:8}}>图层 ({elements.length})</Text>
      {elements.length===0?<Text type="secondary" style={{fontSize:11}}>暂无元素</Text>:(
        <div style={{maxHeight:200,overflowY:'auto'}}>
          {[...elements].reverse().map((el,idx)=>{
            const actualIdx = elements.length - 1 - idx;
            const isSel = selectedIds.includes(el.id);
            return (
              <div key={el.id} draggable
                onDragStart={()=>{dragItem.current=actualIdx;}}
                onDragEnter={()=>{dragOverItem.current=actualIdx;}}
                onDragEnd={handleSort}
                onDragOver={e=>e.preventDefault()}
                onClick={(e)=>{if(e.shiftKey)setSelectedIds(isSel?selectedIds.filter(x=>x!==el.id):[...selectedIds,el.id]);else setSelectedIds([el.id]);}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',borderRadius:4,cursor:'pointer',
                  background:isSel?'#e6f7ff':'transparent',border:isSel?'1px solid #91d5ff':'1px solid transparent',
                  opacity:el.visible===false?0.4:1,fontSize:11,marginBottom:2}}>
                <span style={{fontSize:10,fontWeight:600,width:18,textAlign:'center'}}>{typeIcons[el.type]}</span>
                <span style={{flex:1}}>{el.type==='text'?(el.text||'').slice(0,10)||'文本':el.type}</span>
                {el.locked&&<LockOutlined style={{fontSize:10,color:'#faad14'}}/>}
                {el.visible===false&&<EyeInvisibleOutlined style={{fontSize:10,color:'#999'}}/>}
                <Button type="text" size="small" danger icon={<MinusOutlined style={{fontSize:10}}/>}
                  onClick={(e)=>{e.stopPropagation();setElements(elements.filter(x=>x.id!==el.id));}}
                  style={{padding:0,width:18,height:18,minWidth:18}}/>
              </div>);
          })}
        </div>)}
    </div>
  );
}

// ===== Main =====
export default function TemplateDesigner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const initType = (searchParams.get('type') as TagType) || '吊牌标签';
  const initName = searchParams.get('name') || '';
  const initWidth = Number(searchParams.get('w')) || SIZE_PRESETS[initType].width;
  const initHeight = Number(searchParams.get('h')) || SIZE_PRESETS[initType].height;

  const [designs, setDesigns] = useState<TemplateDesign[]>(loadDesigns);
  const [design, setDesign] = useState<TemplateDesign>(() => {
    if (editId) { const ex = loadDesigns().find(d => d.id === Number(editId)); if (ex) return ex; }
    return { id: Date.now(), name: initName || '未命名' + initType, type: initType,
      width: initWidth, height: initHeight, elements: [], version: 1,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ') };
  });

  const [elements, setElements] = useState<DesignElement[]>(design.elements);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [scale, setScale] = useState(3);
  const [manualZoom, setManualZoom] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [name, setName] = useState(design.name);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [history, setHistory] = useState<DesignElement[][]>([elements]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const clipboardRef = useRef<DesignElement[]>([]);

  const selectedEl = elements.find(e => selectedIds.length === 1 && e.id === selectedIds[0]) || null;

  const autoScale = useMemo(() => {
    const availW = containerSize.w - 64; const availH = containerSize.h - 64;
    const raw = Math.min(availW / design.width, availH / design.height);
    return Math.max(0.5, Math.min(12, Math.round(raw * 2) / 2));
  }, [containerSize, design.width, design.height]);

  useEffect(() => { if (!manualZoom) setScale(autoScale); }, [autoScale, manualZoom]);

  useEffect(() => { const el = canvasContainerRef.current; if (!el) return;
    const ro = new ResizeObserver(entries => { for (const e of entries) setContainerSize({ w: e.contentRect.width, h: e.contentRect.height }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const pushHistory = useCallback((els: DesignElement[]) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), [...els]]); setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const updateElements = useCallback((newEls: DesignElement[]) => {
    setElements(newEls); pushHistory(newEls);
  }, [pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (historyIdx > 0) { const i = historyIdx - 1; setHistoryIdx(i); setElements([...history[i]]); } }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); if (historyIdx < history.length - 1) { const i = historyIdx + 1; setHistoryIdx(i); setElements([...history[i]]); } }
      if (mod && e.key === 'c') { e.preventDefault(); clipboardRef.current = elements.filter(el => selectedIds.includes(el.id)).map(el => ({...el})); message.info('已复制 ' + clipboardRef.current.length + ' 个元素'); }
      if (mod && e.key === 'v') {
        e.preventDefault();
        if (clipboardRef.current.length === 0) return;
        const pasted = clipboardRef.current.map(el => ({...el, id: uid(), x: el.x + 5, y: el.y + 5}));
        updateElements([...elements, ...pasted]); setSelectedIds(pasted.map(p => p.id));
        message.success('已粘贴 ' + pasted.length + ' 个元素');
      }
      if (mod && e.key === 'a') { e.preventDefault(); setSelectedIds(elements.map(el => el.id)); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) { updateElements(elements.filter(el => !selectedIds.includes(el.id))); setSelectedIds([]); }
      }
      if ((e.key === 'Escape')) { setSelectedIds([]); }
      if (selectedEl && !selectedEl.locked) {
        const step = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); updateElements(elements.map(el => el.id === selectedIds[0] ? {...el, x: Math.max(0, el.x - step)} : el)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); updateElements(elements.map(el => el.id === selectedIds[0] ? {...el, x: Math.min(design.width - el.width, el.x + step)} : el)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); updateElements(elements.map(el => el.id === selectedIds[0] ? {...el, y: Math.max(0, el.y - step)} : el)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); updateElements(elements.map(el => el.id === selectedIds[0] ? {...el, y: Math.min(design.height - el.height, el.y + step)} : el)); }
      }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [elements, selectedIds, selectedEl, design, historyIdx, history]);

  const addElement = (type: ElementType) => {
    const def = ELEMENT_DEFAULTS[type];
    const newEl: DesignElement = { id: uid(), type,
      x: Math.round((design.width - (def.width || 20)) / 2), y: Math.round((design.height - (def.height || 10)) / 2), ...def } as DesignElement;
    updateElements([...elements, newEl]); setSelectedIds([newEl.id]);
  };

  const handleSave = () => {
    const updated: TemplateDesign = {...design, name, elements, version: design.version + 1};
    const idx = designs.findIndex(d => d.id === updated.id);
    const nd = idx >= 0 ? designs.map(d => d.id === updated.id ? updated : d) : [...designs, updated];
    setDesigns(nd); setDesign(updated); saveDesigns(nd);
    message.success(name + ' 已保存 (v' + updated.version + ')');
  };

  const handleDownload = () => {
    const json = JSON.stringify({...design, name, elements}, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.json'; a.click();
    URL.revokeObjectURL(a.href); message.success('模板已下载');
  };


  // Generate SVG markup from elements
  const generateSVG = useCallback((): string => {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + design.width + 'mm" height="' + design.height + 'mm" viewBox="0 0 ' + design.width + ' ' + design.height + '">');
    lines.push('<rect width="100%" height="100%" fill="white"/>');
    for (const el of elements) {
      if (el.visible === false) continue;
      const rot = el.rotation ? ' transform="rotate(' + el.rotation + ' ' + (el.x + el.width/2) + ' ' + (el.y + el.height/2) + ')"' : '';
      const op = (el.opacity ?? 1) < 1 ? ' opacity="' + el.opacity + '"' : '';
      if (el.type === 'text') {
        const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
        const ax = el.align === 'center' ? el.x + el.width/2 : el.align === 'right' ? el.x + el.width : el.x;
        lines.push('<text x="' + ax + '" y="' + (el.y + el.height * 0.75) + '" font-size="' + (el.fontSize||9) + '" font-weight="' + (el.fontWeight||'normal') + '" font-family="' + (el.fontFamily||'sans-serif') + '" fill="' + (el.color||'#333') + '" text-anchor="' + anchor + '" font-style="' + (el.italic?'italic':'normal') + '"' + op + rot + '>' + (el.text || (el.fieldKey ? '{' + el.fieldKey + '}' : '')) + '</text>');
      } else if (el.type === 'barcode') {
        lines.push('<g' + rot + op + '>');
        for (let i = 0; i < el.width * 2; i++) {
          lines.push('<line x1="' + (el.x + i * 0.5) + '" y1="' + el.y + '" x2="' + (el.x + i * 0.5) + '" y2="' + (el.y + el.height) + '" stroke="' + (i%3===0?'#333':i%3===1?'#555':'#999') + '" stroke-width="' + (i%4===0?0.8:0.3) + '"/>');
        }
        lines.push('</g>');
      } else if (el.type === 'qrcode') {
        const s = Math.min(el.width, el.height) / 7;
        lines.push('<g' + rot + op + '>');
        [0,1,2,3,4,5,6,7,8,9,14,15,16,17,18,19,20,21,22,23,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48].forEach(i => {
          const rx = i % 7, ry = Math.floor(i / 7);
          lines.push('<rect x="' + (el.x + rx * s) + '" y="' + (el.y + ry * s) + '" width="' + s + '" height="' + s + '" fill="#444"/>');
        });
        lines.push('</g>');
      } else if (el.type === 'line') {
        lines.push('<line x1="' + el.x + '" y1="' + (el.y + el.height/2) + '" x2="' + (el.x + el.width) + '" y2="' + (el.y + el.height/2) + '" stroke="#aaa" stroke-width="1"' + op + rot + '/>');
      } else if (el.type === 'rect') {
        lines.push('<rect x="' + el.x + '" y="' + el.y + '" width="' + el.width + '" height="' + el.height + '" fill="' + (el.fillColor||'none') + '" stroke="' + (el.strokeColor||'#ccc') + '" stroke-width="' + (el.strokeWidth||1) + '" rx="' + (el.borderRadius||0) + '"' + op + rot + '/>');
      } else if (el.type === 'circle') {
        const cx = el.x + el.width/2, cy = el.y + el.height/2, r = Math.min(el.width, el.height)/2;
        lines.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (el.fillColor||'none') + '" stroke="' + (el.strokeColor||'#ccc') + '" stroke-width="' + (el.strokeWidth||1) + '"' + op + rot + '/>');
      } else if (el.type === 'image') {
        lines.push('<rect x="' + el.x + '" y="' + el.y + '" width="' + el.width + '" height="' + el.height + '" fill="#f0f0f0" stroke="#ddd"' + op + rot + '/>');
        lines.push('<text x="' + (el.x + el.width/2) + '" y="' + (el.y + el.height/2 + 3) + '" text-anchor="middle" font-size="6" fill="#999">IMG</text>');
      }
    }
    lines.push('</svg>');
    return lines.join('\n');
  }, [design, elements]);

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => { const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { try {
        const imported = JSON.parse(reader.result as string);
        const nd: TemplateDesign = {...imported, id: Date.now(), name: (imported.name||'导入') + '（导入）', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')};
        setName(nd.name); setDesign(nd); setElements(nd.elements||[]); setHistory([nd.elements||[]]); setHistoryIdx(0);
        const nds = [...designs, nd]; setDesigns(nds); saveDesigns(nds); message.success('模板已导入');
      } catch { message.error('文件格式不正确'); }};
      reader.readAsText(file);
    };
    input.click();
  };

  const handleZoomIn = () => { setManualZoom(true); setScale(s => Math.min(12, s + 0.5)); };
  const handleZoomOut = () => { setManualZoom(true); setScale(s => Math.max(0.5, s - 0.5)); };
  const handleZoomFit = () => { setManualZoom(false); setScale(autoScale); };

  return (
    <div style={{ height: 'calc(100vh - 56px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 16px',background:'#fff',borderBottom:'1px solid #f0f0f0',flexShrink:0,flexWrap:'wrap',gap:8 }}>
        <Space size={8} wrap>
          <Button type="text" icon={<ArrowLeftOutlined/>} onClick={()=>navigate('/brand/templates')}>返回</Button>
          <Input size="small" value={name} onChange={e=>setName(e.target.value)} style={{width:180,fontWeight:600}} placeholder="模板名称"/>
          <Tag color="blue">v{design.version}</Tag><Tag>{design.type}</Tag>
          <Space size={4}>
            <InputNumber size="small" value={design.width} min={10} max={200} style={{width:52}} onChange={v=>v!==null&&setDesign(p=>({...p,width:v}))}/>
            <Text style={{fontSize:10,color:'#999'}}>x</Text>
            <InputNumber size="small" value={design.height} min={10} max={300} style={{width:52}} onChange={v=>v!==null&&setDesign(p=>({...p,height:v}))}/>
            <Text style={{fontSize:10,color:'#999'}}>mm</Text>
          </Space>
        </Space>
        <Space size={4} wrap>
          <Tooltip title="撤销 Cmd+Z"><Button size="small" icon={<UndoOutlined/>} disabled={historyIdx===0} onClick={()=>{const i=historyIdx-1;setHistoryIdx(i);setElements([...history[i]]);}}/></Tooltip>
          <Tooltip title="重做 Cmd+Shift+Z"><Button size="small" icon={<RedoOutlined/>} disabled={historyIdx===history.length-1} onClick={()=>{const i=historyIdx+1;setHistoryIdx(i);setElements([...history[i]]);}}/></Tooltip>
          <Divider type="vertical"/>
          <Tooltip title="吸附网格"><Switch size="small" checked={snapToGrid} onChange={setSnapToGrid}/></Tooltip>
          <Button size="small" icon={<ZoomOutOutlined/>} disabled={scale<=0.5} onClick={handleZoomOut}/>
          <Text style={{fontSize:11,minWidth:36,textAlign:'center'}}>{scale % 1 === 0 ? scale * 100 : (scale * 100).toFixed(0)}%</Text>
          <Button size="small" icon={<ZoomInOutlined/>} disabled={scale>=12} onClick={handleZoomIn}/>
          <Tooltip title="适应窗口"><Button size="small" icon={<CompressOutlined/>} onClick={handleZoomFit}/></Tooltip>
          <Divider type="vertical"/>
          <Tooltip title="导入 JSON"><Button size="small" icon={<UploadOutlined/>} onClick={handleImport}/></Tooltip>
          <Tooltip title="预览"><Button size="small" icon={<EyeOutlined/>} onClick={()=>setPreviewOpen(true)}>预览</Button></Tooltip>
          <Dropdown menu={{ items: [
            { key:'json', label:'下载 JSON（编辑用）', icon:<DownloadOutlined/>, onClick:handleDownload },
            { key:'svg', label:'下载 SVG（矢量图）', icon:<DownloadOutlined/>, onClick:()=>{
              const svg = generateSVG();
              const blob = new Blob([svg], {type:'image/svg+xml'});
              const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name+'.svg'; a.click();
              URL.revokeObjectURL(a.href); message.success('SVG 已下载');
            }},
            { key:'pdf', label:'导出 PDF（打印用）', icon:<DownloadOutlined/>, onClick:()=>{
              const svg = generateSVG();
              const w = window.open('','_blank','width=900,height=700');
              if(w){ w.document.write('<!DOCTYPE html><html><head><title>'+name+'</title><style>body{margin:0;display:flex;justify-content:center;padding:20px}svg{max-width:100%;height:auto}@media print{body{margin:0;padding:0}@page{size:'+design.width+'mm '+design.height+'mm;margin:0}}</style></head><body>'+svg+'<script>setTimeout(()=>{window.print();window.close();},500);<\/script></body></html>'); w.document.close(); }
            }},
          ]}} trigger={['click']}>
            <Button size="small" icon={<DownloadOutlined/>}>下载</Button>
          </Dropdown>
          <Button type="primary" size="small" icon={<SaveOutlined/>} onClick={handleSave}>保存</Button>
        </Space>
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Left: palette + layers */}
        <div style={{width:200,flexShrink:0,background:'#fafafa',borderRight:'1px solid #f0f0f0',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:12,overflowY:'auto',flex:1}}>
            <Text strong style={{fontSize:12,display:'block',marginBottom:4}}>元素面板</Text>
            <Text type="secondary" style={{fontSize:10,display:'block',marginBottom:10}}>点击添加到画布</Text>
            <Space direction="vertical" style={{width:'100%'}} size={4}>
              {[
                {type:'text' as ElementType,icon:<FontSizeOutlined/>,label:'文本',desc:'文字/字段绑定'},
                {type:'barcode' as ElementType,icon:<BarcodeOutlined/>,label:'条码',desc:'一维条形码'},
                {type:'qrcode' as ElementType,icon:<QrcodeOutlined/>,label:'二维码',desc:'EPC二维码'},
                {type:'image' as ElementType,icon:<PictureOutlined/>,label:'图片',desc:'Logo/图稿'},
                {type:'line' as ElementType,icon:<LineOutlined/>,label:'分割线',desc:'水平线'},
                {type:'rect' as ElementType,icon:<BorderOutlined/>,label:'矩形',desc:'边框/色块'},
                {type:'circle' as ElementType,icon:<BarcodeOutlined style={{borderRadius:'50%',border:'1px solid'}}/>,label:'圆形',desc:'挂孔/标记'},
              ].map(item=>(
                <Tooltip key={item.type} title={'添加'+item.label} placement="right">
                  <Button block size="small" style={{height:42,textAlign:'left',justifyContent:'flex-start',padding:'4px 10px'}} onClick={()=>addElement(item.type)}>
                    <span style={{marginRight:8,fontSize:16}}>{item.icon}</span>
                    <div style={{lineHeight:1.2}}><div style={{fontSize:12,fontWeight:500}}>{item.label}</div><div style={{fontSize:10,color:'#999'}}>{item.desc}</div></div>
                  </Button>
                </Tooltip>
              ))}
            </Space>
          </div>
          <Divider style={{margin:0}}/>
          <LayerPanel elements={elements} selectedIds={selectedIds} setSelectedIds={setSelectedIds} setElements={updateElements}/>
          <div style={{padding:'4px 12px 8px',borderTop:'1px solid #f0f0f0'}}>
            <Text type="secondary" style={{fontSize:9}}>Cmd+Z 撤销 · Cmd+V 粘贴 · Shift 多选 · Delete 删除 · 方向键微调 · 标尺点击加参考线</Text>
          </div>
        </div>

        {/* Center: canvas */}
        <div ref={canvasContainerRef} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#e8e8e8',overflow:'auto',padding:24}}>
          <Canvas design={design} elements={elements} setElements={updateElements}
            selectedIds={selectedIds} setSelectedIds={setSelectedIds}
            scale={scale} snapToGrid={snapToGrid} setScale={setScale}
            hoveredId={hoveredId} setHoveredId={setHoveredId}
            guides={guides} setGuides={setGuides}/>
        </div>

        {/* Right: properties */}
        <div style={{width:280,flexShrink:0,background:'#fafafa',borderLeft:'1px solid #f0f0f0',overflowY:'auto'}}>
          <div style={{padding:'10px 12px',borderBottom:'1px solid #f0f0f0'}}><Text strong style={{fontSize:12}}><SettingOutlined/> 属性</Text></div>
          <PropertiesPanel el={selectedEl} elements={elements} setElements={updateElements} design={design} selectedIds={selectedIds}/>
        </div>
      </div>

      {/* Preview modal */}
      <Modal title={'预览 - ' + name} open={previewOpen} onCancel={()=>setPreviewOpen(false)} footer={null} width={700}>
        <div style={{display:'flex',justifyContent:'center',padding:24,background:'#f5f5f5',borderRadius:8}}>
          <Canvas design={design} elements={elements} setElements={()=>{}}
            selectedIds={[]} setSelectedIds={()=>{}}
            scale={Math.min(4,Math.floor(360/Math.max(design.width,design.height)))}
            snapToGrid={false} setScale={()=>{}}
            hoveredId={null} setHoveredId={()=>{}}
            guides={guides} setGuides={()=>{}}/>
        </div>
        <div style={{textAlign:'center',marginTop:16}}>
          <Space><Tag>{design.type}</Tag><Text type="secondary">{design.width}x{design.height}mm</Text><Text type="secondary">{elements.length}个元素</Text><Text type="secondary">v{design.version}</Text></Space>
        </div>
      </Modal>
    </div>
  );
}
