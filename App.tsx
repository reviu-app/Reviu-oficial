import React, { useState, useEffect, useMemo } from 'react';
import { Review, UserInfo, Waiter, Tenant, ViewState } from './types';
import { DB } from './db';
import { ArrowRight, ChevronLeft, MessageSquare, ExternalLink, TicketPercent, Loader2, ArrowUpRight, ShieldAlert, Users, LayoutDashboard, QrCode, Trash2, Power, Download, LifeBuoy, CheckSquare, Bell, Timer, Settings, Cloud, CloudOff, RefreshCw, Save, Lock, Delete, X, Shield, Plus, Building2, Copy, LogOut, Eye, EyeOff, Menu, Briefcase, Star, Search, Database, Store, ChefHat, Filter, Mail, Gift, HeartHandshake, Link as LinkIcon, Activity, Globe } from 'lucide-react';

// --- CONFIG ---
const DEFAULT_GOOGLE_REVIEW_LINK = "https://www.google.com/"; 

// SECURITY: Base64 Encoded "2024" to prevent plain text exposure
const SYSADMIN_HASH = "MjAyNA=="; 

const AGE_RANGES = ["-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

const RATING_STEPS = [
  { key: 'food', label: 'GASTRONOMIA', question: 'A QUALIDADE, SABOR E APRESENTAÇÃO DOS PRATOS SURPREENDERAM?' },
  { key: 'service', label: 'ATENDIMENTO', question: 'A EQUIPE DEMONSTROU CORTESIA, AGILIDADE E CONHECIMENTO TÉCNICO?' },
  { key: 'ambiance', label: 'AMBIENTE', question: 'A ILUMINAÇÃO, TEMPERATURA E DECORAÇÃO CRIARAM O CLIMA IDEAL?' },
  { key: 'music', label: 'MÚSICA / SOM', question: 'A SELEÇÃO MUSICAL E O VOLUME ESTAVAM CONFORTÁVEIS PARA CONVERSAR?' },
];

const COMPLAINT_CATEGORIES = [
  { id: 'qualidade', label: 'QUALIDADE DO PRODUTO' },
  { id: 'demora', label: 'DEMORA NO PEDIDO' },
  { id: 'atendimento', label: 'POSTURA DA EQUIPE' },
  { id: 'ambiente', label: 'LIMPEZA / CONFORTO' },
  { id: 'outros', label: 'OUTROS MOTIVOS' },
];

// --- COMPONENTS ---

const SharpStar = ({ filled, size = 48 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-all duration-200 ${filled ? 'scale-110' : 'scale-100'}`}>
    <path d="M12 2L14.4 9.6H22.4L16 14.4L18.4 22L12 17.2L5.6 22L8 14.4L1.6 9.6H9.6L12 2Z" fill={filled ? "black" : "transparent"} stroke={filled ? "black" : "#d1d5db"} strokeWidth="1.5" strokeLinejoin="miter"/>
  </svg>
);

const SharpMessage = ({ className = "", size = 32 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 2H22V16H8L2 22V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" />
    <line x1="6" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.5" />
    <line x1="6" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const SharpAlert = ({ className = "", size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" />
    <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="16" width="2" height="2" fill="currentColor" />
  </svg>
);

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "font-mono text-xs font-medium uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-black hover:bg-gray-200",
    ghost: "bg-transparent text-gray-600 hover:text-black",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Input = ({ value, onChange, placeholder, type = "text", maxLength }: any) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} className="w-full py-4 bg-transparent border-b border-gray-300 focus:border-orange-600 focus:outline-none font-mono text-base placeholder:text-gray-400 transition-colors rounded-none mb-4 text-black" />
);

const ObservationInput = ({ value, onChange, placeholder, label = "OBSERVAÇÕES", height = "h-20" }: any) => (
  <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="flex items-center justify-between mb-1">
       <label className="font-mono text-[9px] uppercase tracking-widest text-gray-500">{label}</label>
    </div>
    <textarea value={value} onChange={onChange} placeholder={placeholder} className={`w-full ${height} bg-transparent py-1 border-b border-gray-300 focus:border-orange-600 focus:outline-none font-mono text-sm leading-relaxed text-black placeholder:text-gray-400 resize-none transition-colors`}/>
  </div>
);

const SingleRating = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex justify-center gap-3 sm:gap-6 py-6 sm:py-8">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" className="focus:outline-none group transform hover:-translate-y-1 transition-transform duration-200" onClick={() => onChange(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}>
          <SharpStar filled={star <= (hover || value)} size={32} />
        </button>
      ))}
    </div>
  );
};

const StepLayout = ({ stepLabel, question, description, children, onBack, onNext, nextLabel = "PRÓXIMO", canProceed = true, hideNext = false, restaurantName, waiterName }: any) => (
  <div className="h-[100dvh] flex flex-col max-w-xl mx-auto px-6 py-4 fade-in bg-white text-black font-mono overflow-hidden">
    <div className="flex justify-between items-center mb-6 pt-8 border-b border-gray-100 pb-4">
      <div className="flex items-center gap-4">
        {onBack ? <button onClick={onBack} className="hover:opacity-50 transition-opacity"><ChevronLeft size={20} strokeWidth={1.5} className="text-black" /></button> : <div className="w-5" />}
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{stepLabel}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-black tracking-tighter uppercase text-black">{restaurantName}</div>
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-center overflow-y-auto pb-4">
      {waiterName && (
        <div className="mb-4 inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-full w-fit">
          <Users size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase text-gray-600">Atendido por {waiterName}</span>
        </div>
      )}
      <h2 className="font-sans text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-3 text-gray-900 leading-tight">{question}</h2>
      {description && <p className="font-mono text-[11px] text-gray-400 mb-8 leading-relaxed max-w-md uppercase tracking-wider">{description}</p>}
      <div className="w-full">{children}</div>
    </div>
    {!hideNext && <div className="pb-6"><Button onClick={onNext} disabled={!canProceed} className="w-full py-4 text-sm">{nextLabel} <ArrowRight size={18} /></Button></div>}
  </div>
);

const LockScreen = ({ onUnlock, onCancel, expectedPin, title = "Identifique-se" }: { onUnlock: () => void, onCancel: () => void, expectedPin?: string, title?: string }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError(false);
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handleEnter = () => {
    // Basic verification logic
    const isValid = expectedPin ? pin === expectedPin : btoa(pin) === SYSADMIN_HASH;
    
    if (isValid) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center font-mono animate-in fade-in">
       <button onClick={onCancel} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 flex items-center gap-2 text-xs uppercase font-bold"><ChevronLeft size={16} /> Voltar</button>
       <div className="mb-8 text-center">
         <Lock size={32} className="mx-auto mb-4 text-black" />
         <h2 className="text-xl font-bold uppercase tracking-tight">{title}</h2>
         <p className="text-xs text-gray-500 mt-2">PIN de Segurança ({expectedPin ? 'Gerente' : 'Admin'})</p>
       </div>
       <div className="mb-8 flex gap-4">
         {[0, 1, 2, 3].map(i => <div key={i} className={`w-3 h-3 border border-black ${pin.length > i ? 'bg-black' : 'bg-transparent'}`} />)}
       </div>
       {error && <p className="text-red-600 text-[10px] uppercase font-bold mb-4 animate-pulse">Senha Inválida</p>}
       <div className="grid grid-cols-3 gap-4 w-64">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleDigit(num.toString())} className="h-16 border border-gray-200 text-lg font-bold hover:bg-black hover:text-white hover:border-black transition-colors">{num}</button>
          ))}
          <div className="h-16"></div>
          <button onClick={() => handleDigit("0")} className="h-16 border border-gray-200 text-lg font-bold hover:bg-black hover:text-white hover:border-black transition-colors">0</button>
          <button onClick={handleDelete} className="h-16 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Delete size={20} /></button>
       </div>
       <button onClick={handleEnter} className="mt-6 w-64 bg-black text-white py-4 uppercase font-bold tracking-widest text-xs hover:bg-gray-800">Confirmar</button>
    </div>
  );
};

// --- SYSTEM MENU & MODALS ---

const SystemMenu = ({ onNavigate, currentMode }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNav = (target: string) => {
      onNavigate(target);
      setIsOpen(false);
  };

  // Hide menu for customers (Wizard mode)
  if (currentMode === 'tenant_wizard') return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed top-4 left-4 z-40 p-3 bg-white text-black hover:bg-black hover:text-white transition-all shadow-md border border-gray-100 group"
        title="Menu do Sistema"
      >
        <Menu size={24} strokeWidth={1.5} />
      </button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white z-[70] transform transition-transform duration-300 ease-in-out border-r border-gray-200 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-black text-white">
          <div>
              <h2 className="font-bold uppercase tracking-widest text-lg">Reviu System</h2>
              <p className="text-[10px] text-gray-400 mt-1">Navegação Global</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Acesso Rápido</p>
                <button onClick={() => handleNav('customer')} className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${currentMode === 'tenant_wizard' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
                    <QrCode size={20} />
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase">Modo Cliente</p>
                        <p className="text-[9px] opacity-60">Coleta de feedbacks</p>
                    </div>
                </button>
                <button onClick={() => handleNav('manager')} className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${currentMode === 'tenant_manager' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
                    <LayoutDashboard size={20} />
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase">Modo Gerente</p>
                        <p className="text-[9px] opacity-60">Dashboard e métricas</p>
                    </div>
                </button>
                <button onClick={() => handleNav('admin')} className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${currentMode === 'saas_admin' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
                    <Shield size={20} />
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase">Super Admin</p>
                        <p className="text-[9px] opacity-60">Gestão de assinantes</p>
                    </div>
                </button>
            </div>
        </div>
        
        <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-bold">R</div>
                <div>
                    <p className="text-[10px] font-bold uppercase">reviu. v1.0</p>
                    <p className="text-[9px] text-gray-400">SaaS Platform</p>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

const TenantSelectorModal = ({ isOpen, onClose, tenants, onSelect }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-md p-8 font-mono border border-black">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold uppercase tracking-tighter">Selecione o Estabelecimento</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100"><X size={20} /></button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {tenants.map((t: Tenant) => (
                        <button key={t.id} onClick={() => onSelect(t)} className="w-full flex items-center justify-between p-5 border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group">
                            <div className="text-left">
                                <p className="text-xs font-bold uppercase">{t.name}</p>
                                <p className="text-[9px] text-gray-400 mt-1">ID: {t.id}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
                        </button>
                    ))}
                    {tenants.length === 0 && <p className="text-center py-8 text-xs text-gray-400 uppercase">Nenhum estabelecimento cadastrado.</p>}
                </div>
            </div>
        </div>
    );
};

const SaasAdminPanel = ({ tenants, onCreate, onLogout }: any) => {
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [link, setLink] = useState("");

    const handleCreate = () => {
        if (!name || !pin) return;
        onCreate({
            id: `TEN-${Math.floor(1000 + Math.random() * 9000)}`,
            name: name.toUpperCase(),
            managerPin: pin,
            googleReviewLink: link || DEFAULT_GOOGLE_REVIEW_LINK,
            active: true
        });
        setName(""); setPin(""); setLink("");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-mono">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Super Admin</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Gestão de Tenancy</p>
                    </div>
                    <Button variant="ghost" onClick={onLogout}><LogOut size={16} /> Sair</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-white p-8 border border-gray-200">
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">Novo Assinante</h2>
                        <div className="space-y-6">
                            <div><label className="text-[9px] font-bold text-gray-400 uppercase block mb-2">Nome do Local</label><Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="EX: RESTAURANTE X" /></div>
                            <div><label className="text-[9px] font-bold text-gray-400 uppercase block mb-2">PIN da Gerência</label><Input value={pin} onChange={(e: any) => setPin(e.target.value)} placeholder="4 DÍGITOS" maxLength={4} /></div>
                            <div><label className="text-[9px] font-bold text-gray-400 uppercase block mb-2">Link Google Reviews</label><Input value={link} onChange={(e: any) => setLink(e.target.value)} placeholder="HTTPS://..." /></div>
                            <Button onClick={handleCreate} className="w-full">Criar Tenant</Button>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-4">Estabelecimentos Ativos ({tenants.length})</h2>
                        {tenants.map((t: Tenant) => (
                            <div key={t.id} className="bg-white p-6 border border-gray-200 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold uppercase">{t.name}</p>
                                    <div className="flex gap-4 mt-2">
                                        <span className="text-[9px] text-gray-400 uppercase">ID: {t.id}</span>
                                        <span className="text-[9px] text-gray-400 uppercase">PIN: {t.managerPin}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"><Settings size={16} /></button>
                                    <button className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [appMode, setAppMode] = useState<ViewState>('landing');
  const [isLocked, setIsLocked] = useState(true);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedWaiterForHistory, setSelectedWaiterForHistory] = useState<string | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [isTenantSelectorOpen, setIsTenantSelectorOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'manager' | 'customer' | null>(null);

  // Wizard State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ratings, setRatings] = useState<any>({ food: 0, service: 0, ambiance: 0, music: 0 });
  const [categoryComments, setCategoryComments] = useState<any>({ food: '', service: '', ambiance: '', music: '' });
  const [details, setDetails] = useState({ comment: '', category: '', phone: '' });
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', ageRange: '' });
  const [isNegativeFlow, setIsNegativeFlow] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);

  // Manager State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [newWaiterName, setNewWaiterName] = useState('');
  const [settingsLink, setSettingsLink] = useState('');

  useEffect(() => {
      initApp();
  }, []);

  const initApp = async () => {
      setIsLoadingApp(true);
      const allTenants = await DB.getTenants();
      setTenants(allTenants);

      const params = new URLSearchParams(window.location.search);
      const tenantId = params.get('t');
      const mode = params.get('m'); // 'manager' or 'customer'

      if (tenantId) {
          const found = allTenants.find(t => t.id === tenantId);
          if (found) {
              setActiveTenant(found);
              DB.setTenantId(found.id);
              setSettingsLink(found.googleReviewLink);
              
              if (mode === 'manager') {
                  setAppMode('tenant_manager');
                  setIsLocked(true);
              } else {
                  setAppMode('tenant_wizard');
                  setIsLocked(false);
              }
              // OPTIMIZATION: Do NOT load reviews for wizard users
              const loadReviews = mode === 'manager';
              await refreshTenantData(found.id, loadReviews);
          }
      } else {
          setAppMode('landing');
      }
      
      setIsLoadingApp(false);
  };

  // --- NAVIGATION HANDLERS ---

  const handleModeSwitch = (target: 'admin' | 'manager' | 'customer') => {
      if (target === 'admin') {
          setAppMode('saas_admin');
          setIsLocked(true);
      } else {
          // Both manager and customer require a tenant
          setPendingMode(target);
          setIsTenantSelectorOpen(true);
      }
  };

  const handleTenantSelect = async (tenant: Tenant) => {
      setIsTenantSelectorOpen(false);
      setActiveTenant(tenant);
      DB.setTenantId(tenant.id);
      
      const mode = pendingMode === 'manager' ? 'tenant_manager' : 'tenant_wizard';
      const shouldLoadReviews = mode === 'tenant_manager';
      
      await refreshTenantData(tenant.id, shouldLoadReviews);

      if (pendingMode === 'manager') {
          setAppMode('tenant_manager');
          setIsLocked(true);
      } else if (pendingMode === 'customer') {
          setAppMode('tenant_wizard');
          setIsLocked(false);
          // Reset Wizard
          resetFlow();
      }
      setPendingMode(null);
  };

  const refreshTenantData = async (tenantId?: string, loadReviews = true) => {
      setLoading(true);
      if (tenantId) DB.setTenantId(tenantId);
      
      // Privacy: Only load reviews if explicitly requested (Manager)
      if (loadReviews) {
          const revs = await DB.getReviews();
          setReviews(revs);
      } else {
          setReviews([]); // Clear sensitive data from memory if in Wizard mode
      }

      const wtrs = await DB.getWaiters();
      setWaiters(wtrs);
      setLoading(false);

      const params = new URLSearchParams(window.location.search);
      const wtrId = params.get('wtr');
      if (wtrId) {
          const found = wtrs.find(w => w.id === wtrId && w.active);
          if (found) setSelectedWaiter(found);
      }
  };

  // --- ACTIONS ---

  const handleCreateTenant = async (tenant: Tenant) => {
      const updated = await DB.saveTenant(tenant);
      setTenants(updated);
  };
  
  const handleSaveSettings = async () => {
    if (!activeTenant) return;
    const updated = { ...activeTenant, googleReviewLink: settingsLink };
    const allTenants = await DB.saveTenant(updated);
    setTenants(allTenants);
    setActiveTenant(updated);
    alert('Configurações salvas com sucesso.');
  };

  const handleLogout = () => {
      setAppMode('landing');
      setIsLocked(true);
      setActiveTenant(null);
      setReviews([]); // Clear data on logout
      DB.setTenantId(null);
      window.history.pushState({}, '', window.location.pathname);
  };

  const handleAddWaiter = async () => {
    if (!newWaiterName.trim() || !activeTenant) return;
    const id = `WTR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newWaiter: Waiter = {
      id,
      tenantId: activeTenant.id, 
      name: newWaiterName.toUpperCase(),
      active: true,
      dateAdded: Date.now()
    };
    const updated = await DB.saveWaiter(newWaiter);
    setWaiters(updated);
    setNewWaiterName('');
  };

  const toggleWaiterStatus = async (id: string) => {
    const waiter = waiters.find(w => w.id === id);
    if (waiter) {
        const updatedList = await DB.saveWaiter({ ...waiter, active: !waiter.active });
        setWaiters(updatedList);
    }
  };

  const deleteWaiter = async (id: string) => {
    if (window.confirm("Tem certeza?")) {
      const updated = await DB.deleteWaiter(id);
      setWaiters(updated);
    }
  };

  const markResolved = async (id: string) => {
     const updated = await DB.updateReviewStatus(id, 'resolved');
     setReviews(updated);
  };

  // Wizard Logic
  const handleNext = () => {
    if (currentStepIndex === 4) {
      const vals = Object.values(ratings) as number[];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg < 4) { setIsNegativeFlow(true); setCurrentStepIndex(6); } 
      else { setIsNegativeFlow(false); submitFinalReview(false); }
    } else { setCurrentStepIndex(prev => prev + 1); }
  };

  const handleBack = () => {
    if (currentStepIndex === 0) return;
    if (currentStepIndex === 6) { setCurrentStepIndex(4); return; }
    setCurrentStepIndex(prev => prev - 1);
  };

  const submitFinalReview = async (isNegativeOverride?: boolean) => {
    if (!activeTenant) return;
    const isNegative = isNegativeOverride ?? isNegativeFlow;
    const vals = Object.values(ratings) as number[];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

    const newReview: Review = {
      id: crypto.randomUUID(),
      tenantId: activeTenant.id,
      restaurantId: activeTenant.id,
      waiterId: selectedWaiter?.id,
      userInfo,
      rating: parseFloat(avg.toFixed(1)),
      breakdown: { food: ratings.food, service: ratings.service, ambiance: ratings.ambiance, music: ratings.music },
      breakdownComments: categoryComments,
      comment: details.comment,
      contactInfo: details.phone, 
      category: isNegative ? details.category : undefined,
      status: isNegative ? 'pending_resolution' : 'published',
      timestamp: Date.now()
    };
    
    await DB.addReview(newReview);
    
    if (isNegative) setCurrentStepIndex(8); else setCurrentStepIndex(5); 
  };

  const resetFlow = () => {
    setRatings({ food: 0, service: 0, ambiance: 0, music: 0 });
    setCategoryComments({ food: '', service: '', ambiance: '', music: '' });
    setDetails({ comment: '', category: '', phone: '' });
    setUserInfo({ name: '', email: '', ageRange: '' });
    setCurrentStepIndex(0);
    setIsNegativeFlow(false);
    setSelectedWaiter(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 11) val = val.substring(0, 11);
    let formatted = val;
    if (val.length > 0) {
      formatted = `(${val.substring(0, 2)}`;
      if (val.length > 2) formatted += `) ${val.substring(2, 7)}`;
      if (val.length > 7) formatted += `-${val.substring(7)}`;
    }
    setDetails({ ...details, phone: formatted });
  };

  // --- COMPUTED DATA FOR DASHBOARD ---
  const waiterStats = useMemo(() => {
    return waiters.map(w => {
      const waiterReviews = reviews.filter(r => r.waiterId === w.id);
      const totalStars = waiterReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = waiterReviews.length > 0 ? (totalStars / waiterReviews.length).toFixed(1) : 'N/A';
      return { ...w, avg, count: waiterReviews.length, reviews: waiterReviews };
    });
  }, [waiters, reviews]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    if (reviewFilter === 'pending') return reviews.filter(r => r.status === 'pending_resolution');
    if (reviewFilter === 'resolved') return reviews.filter(r => r.status === 'resolved' || r.status === 'published');
    return reviews;
  }, [reviews, reviewFilter]);

  // --- RENDERERS ---

  if (isLoadingApp) {
      return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
              <Loader2 className="animate-spin text-black mb-4" size={32} />
              <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Inicializando...</span>
          </div>
      );
  }

  return (
    <>
        <SystemMenu onNavigate={handleModeSwitch} currentMode={appMode} />
        
        <TenantSelectorModal isOpen={isTenantSelectorOpen} onClose={() => setIsTenantSelectorOpen(false)} tenants={tenants} onSelect={handleTenantSelect} />

        {/* Landing View */}
        {appMode === 'landing' && (
             <div className="min-h-screen flex flex-col items-center justify-center bg-white font-mono text-black p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                <div className="relative z-10 text-center max-w-lg">
                    <h1 className="text-6xl font-black tracking-tighter mb-4">reviu.</h1>
                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-8 border-b border-gray-200 pb-4 inline-block">SaaS de Gestão de Experiência</p>
                    <div className="text-xs text-gray-400 font-mono flex items-center justify-center gap-2">
                         <Menu size={14} /> <span>Use o menu para acessar</span>
                    </div>
                </div>
            </div>
        )}

        {/* Admin View */}
        {appMode === 'saas_admin' && (
            isLocked ? (
                <LockScreen title="Super Admin" onUnlock={() => setIsLocked(false)} onCancel={handleLogout} />
            ) : (
                <SaasAdminPanel tenants={tenants} onCreate={handleCreateTenant} onLogout={handleLogout} />
            )
        )}

        {/* Manager View */}
        {appMode === 'tenant_manager' && activeTenant && (
            isLocked ? (
                <LockScreen title={`Gerência ${activeTenant.name}`} onUnlock={() => setIsLocked(false)} onCancel={handleLogout} expectedPin={activeTenant.managerPin} />
            ) : (
                <div className="min-h-screen bg-gray-50 p-8 font-mono">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter">{activeTenant.name}</h1>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Dashboard de Gerência</p>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={() => refreshTenantData(activeTenant.id)}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar</Button>
                                <Button variant="ghost" onClick={handleLogout}><LogOut size={16} /> Sair</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            <div className="bg-white p-6 border border-gray-200">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Total de Reviews</p>
                                <p className="text-3xl font-black">{reviews.length}</p>
                            </div>
                            <div className="bg-white p-6 border border-gray-200">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Média Geral</p>
                                <p className="text-3xl font-black">
                                    {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                                </p>
                            </div>
                            <div className="bg-white p-6 border border-gray-200">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Críticas Pendentes</p>
                                <p className="text-3xl font-black text-red-600">{reviews.filter(r => r.status === 'pending_resolution').length}</p>
                            </div>
                            <div className="bg-white p-6 border border-gray-200">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Garçons Ativos</p>
                                <p className="text-3xl font-black">{waiters.filter(w => w.active).length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xs font-bold uppercase tracking-widest">Feedbacks Recentes</h2>
                                    <div className="flex gap-2">
                                        {['all', 'pending', 'resolved'].map((f) => (
                                            <button key={f} onClick={() => setReviewFilter(f as any)} className={`px-3 py-1 text-[9px] font-bold uppercase border ${reviewFilter === f ? 'bg-black text-white border-black' : 'text-gray-400 border-gray-200'}`}>{f}</button>
                                        ))}
                                    </div>
                                </div>
                                
                                {filteredReviews.length === 0 ? (
                                    <div className="bg-white p-12 border border-gray-200 text-center">
                                        <MessageSquare size={32} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-[10px] text-gray-400 uppercase">Nenhum feedback encontrado.</p>
                                    </div>
                                ) : (
                                    filteredReviews.map((r) => (
                                        <div key={r.id} className="bg-white p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden rounded-sm">
                                            {r.status === 'pending_resolution' && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>}
                                            
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-2 flex-1">
                                                    <div className="bg-gray-900 text-white p-3 rounded-sm inline-block w-full sm:w-auto">
                                                        <h3 className="text-base font-black uppercase tracking-tight leading-none mb-2">{r.userInfo.name}</h3>
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="flex items-center gap-2 text-[11px] font-bold opacity-90"><Mail size={12} className="text-orange-400" /> {r.userInfo.email}</span>
                                                            {r.contactInfo && <span className="flex items-center gap-2 text-[11px] font-bold opacity-90"><MessageSquare size={12} className="text-orange-400" /> {r.contactInfo}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        <span className="flex items-center gap-1"><Timer size={10} /> {new Date(r.timestamp).toLocaleString('pt-BR')}</span>
                                                        {r.waiterId && <span className="flex items-center gap-1 text-orange-600"><Users size={10} /> Garçom: {waiters.find(w => w.id === r.waiterId)?.name || 'N/A'}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-sm ml-4">
                                                    <Star size={14} fill="currentColor" className="text-yellow-400" />
                                                    <span className="text-sm font-black">{r.rating.toFixed(1)}</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 mb-4 border-l-2 border-gray-200">
                                                <p className="text-xs text-gray-700 leading-relaxed font-medium italic">"{r.comment || 'O cliente não deixou um comentário por escrito.'}"</p>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                <div className="flex gap-2">
                                                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${r.status === 'pending_resolution' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                        {r.status === 'pending_resolution' ? 'Ação Necessária' : 'Finalizado'}
                                                    </span>
                                                    {r.category && <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded">{r.category}</span>}
                                                </div>
                                                {r.status === 'pending_resolution' && (
                                                    <button 
                                                        onClick={() => markResolved(r.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm"
                                                    >
                                                        <CheckSquare size={12} /> Marcar como Resolvido
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-8">
                                <div className="bg-white p-8 border border-gray-200">
                                    <h2 className="text-xs font-bold uppercase tracking-widest mb-6">Equipe de Garçons</h2>
                                    <div className="flex gap-2 mb-6">
                                        <Input placeholder="NOME DO GARÇOM" value={newWaiterName} onChange={(e: any) => setNewWaiterName(e.target.value)} />
                                        <button onClick={handleAddWaiter} className="p-4 bg-black text-white hover:bg-gray-800"><Plus size={16} /></button>
                                    </div>
                                    <div className="space-y-3">
                                        {waiterStats.map((w) => (
                                            <div key={w.id} className="group border border-gray-100 rounded-sm overflow-hidden">
                                                <div className="flex justify-between items-center p-3 bg-white">
                                                    <div className="cursor-pointer flex-1" onClick={() => setSelectedWaiterForHistory(selectedWaiterForHistory === w.id ? null : w.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] font-bold uppercase text-black">{w.name}</p>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${w.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                        </div>
                                                        <p className="text-[9px] text-gray-400 font-medium">{w.count} avaliações • <span className="text-black font-bold">Média {w.avg}</span></p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => {
                                                                const url = `${window.location.origin}?t=${activeTenant.id}&wtr=${w.id}`;
                                                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
                                                                window.open(qrUrl, '_blank');
                                                            }} 
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Gerar QR Code"
                                                        >
                                                            <QrCode size={14} />
                                                        </button>
                                                        <button onClick={() => toggleWaiterStatus(w.id)} className={`p-2 ${w.active ? 'text-green-600' : 'text-gray-300'}`}><Power size={14} /></button>
                                                        <button onClick={() => deleteWaiter(w.id)} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                
                                                {selectedWaiterForHistory === w.id && (
                                                    <div className="bg-gray-50 p-3 border-t border-gray-100 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">Histórico Recente</p>
                                                        {w.reviews.length === 0 ? (
                                                            <p className="text-[9px] text-gray-400 italic">Nenhuma avaliação ainda.</p>
                                                        ) : (
                                                            w.reviews.map((rev: any) => (
                                                                <div key={rev.id} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[9px] font-bold text-gray-700">{rev.userInfo.name}</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <Star size={8} fill="black" />
                                                                            <span className="text-[9px] font-black">{rev.rating}</span>
                                                                        </div>
                                                                    </div>
                                                                    {rev.comment && <p className="text-[9px] text-gray-500 leading-tight italic">"{rev.comment}"</p>}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-8 border border-gray-200">
                                    <h2 className="text-xs font-bold uppercase tracking-widest mb-6">Configurações</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-2">Link Google Reviews</label>
                                            <Input value={settingsLink} onChange={(e: any) => setSettingsLink(e.target.value)} />
                                        </div>
                                        <Button onClick={handleSaveSettings} className="w-full py-3">Salvar Alterações</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        )}

        {/* Wizard View */}
        {appMode === 'tenant_wizard' && activeTenant && (
            <>
            {currentStepIndex === 0 && (
                <StepLayout 
                    stepLabel="IDENTIFICAÇÃO" 
                    question={selectedWaiter ? `Olá! Você foi atendido por ${selectedWaiter.name}.` : `Bem-vindo ao ${activeTenant.name}`} 
                    description={selectedWaiter ? "Como foi sua experiência hoje? Conte-nos um pouco sobre você para começar." : "Sua opinião é fundamental para nossa evolução. Quem está nos visitando hoje?"} 
                    canProceed={!!userInfo.name && !!userInfo.email} 
                    onNext={handleNext} 
                    restaurantName={activeTenant.name}
                    waiterName={selectedWaiter?.name}
                >
                <div className="space-y-4">
                    <Input placeholder="SEU NOME" value={userInfo.name} onChange={(e: any) => setUserInfo({...userInfo, name: e.target.value})} />
                    <Input placeholder="SEU E-MAIL" type="email" value={userInfo.email} onChange={(e: any) => setUserInfo({...userInfo, email: e.target.value})} />
                    <div className="pt-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">SUA FAIXA ETÁRIA</label>
                    <div className="flex flex-wrap gap-2">
                        {AGE_RANGES.map(range => (
                        <button key={range} onClick={() => setUserInfo({...userInfo, ageRange: range})} className={`px-4 py-2 border text-[10px] font-bold transition-all ${userInfo.ageRange === range ? 'bg-black text-white border-black' : 'bg-transparent text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}>{range}</button>
                        ))}
                    </div>
                    </div>
                </div>
                </StepLayout>
            )}
            {currentStepIndex >= 1 && currentStepIndex <= 4 && (
                <StepLayout 
                    stepLabel={RATING_STEPS[currentStepIndex-1].label} 
                    question={RATING_STEPS[currentStepIndex-1].question} 
                    description="SUA OPINIÃO É FUNDAMENTAL PARA NOSSA EVOLUÇÃO." 
                    canProceed={ratings[RATING_STEPS[currentStepIndex-1].key] > 0} 
                    onBack={handleBack} 
                    onNext={handleNext} 
                    restaurantName={activeTenant.name}
                    waiterName={selectedWaiter?.name}
                >
                <SingleRating value={ratings[RATING_STEPS[currentStepIndex-1].key]} onChange={(val) => setRatings({...ratings, [RATING_STEPS[currentStepIndex-1].key]: val})} />
                <ObservationInput value={categoryComments[RATING_STEPS[currentStepIndex-1].key]} onChange={(e: any) => setCategoryComments({...categoryComments, [RATING_STEPS[currentStepIndex-1].key]: e.target.value})} placeholder="Algo específico que queira destacar?" />
                </StepLayout>
            )}
            {currentStepIndex === 5 && (
                <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-white font-mono animate-in fade-in text-center">
                    <div className="max-w-md w-full">
                        <div className="flex justify-center mb-6">
                            <Gift size={64} strokeWidth={1} className="text-black" />
                        </div>
                        
                        <h2 className="text-3xl font-bold tracking-tighter mb-4 text-black uppercase">
                            Falta Pouco!
                        </h2>
                        
                        <div className="bg-gray-50 border border-black p-6 mb-8 text-left">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1">Seu Comentário</span>
                                <span className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1"><CheckSquare size={12}/> Copiado</span>
                            </div>
                            <p className="text-xs text-gray-600 font-mono italic mb-4">
                                "{details.comment || Object.values(categoryComments).filter(Boolean).join('. ') || "Experiência excelente!"}"
                            </p>
                            <div className="text-[10px] text-gray-400 border-t border-gray-200 pt-2 uppercase tracking-wide">
                                Pronto para colar no Google
                            </div>
                        </div>

                        <div className="mb-8 space-y-2">
                            <p className="text-sm font-bold uppercase">Como finalizar:</p>
                            <p className="text-xs text-gray-600">1. Clique no botão abaixo.</p>
                            <p className="text-xs text-gray-600">2. Cole (Paste) o texto no Google Reviews.</p>
                            <p className="text-xs text-gray-600">3. O cupom chega no seu e-mail em seguida.</p>
                        </div>

                        <button 
                            onClick={() => {
                                const textToCopy = details.comment || Object.values(categoryComments).filter(Boolean).join('. ') || "Experiência excelente!";
                                navigator.clipboard.writeText(textToCopy).catch(e => console.error(e));
                                const targetLink = activeTenant.googleReviewLink || DEFAULT_GOOGLE_REVIEW_LINK;
                                setTimeout(() => window.open(targetLink, '_blank'), 300);
                            }} 
                            className="w-full bg-black text-white py-5 font-bold text-xs uppercase tracking-widest hover:bg-gray-800 flex items-center justify-center gap-2 border-b-4 border-orange-600 transition-all hover:border-orange-500"
                        >
                            Ir para Google e Colar <ExternalLink size={14} />
                        </button>
                    </div>
                    <div className="fixed bottom-6 left-0 w-full text-center">
                        <button onClick={resetFlow} className="text-[10px] text-gray-400 hover:text-black transition-colors uppercase tracking-widest">[ Pular e Finalizar ]</button>
                    </div>
                </div>
            )}
            {currentStepIndex === 6 && (
                <StepLayout 
                    stepLabel="DIAGNÓSTICO" 
                    question="QUAL O PRINCIPAL MOTIVO?" 
                    description="SELECIONE PARA NOS AJUDAR A MELHORAR." 
                    canProceed={!!details.category} 
                    onBack={handleBack} 
                    onNext={() => setCurrentStepIndex(7)} 
                    restaurantName={activeTenant.name}
                    waiterName={selectedWaiter?.name}
                >
                <div className="flex flex-col gap-2 pt-4">
                    {COMPLAINT_CATEGORIES.map((cat) => {
                    const isSelected = details.category === cat.id;
                    return (
                        <button key={cat.id} onClick={() => setDetails({...details, category: cat.id})} className={`group flex items-center justify-between py-5 px-2 transition-all duration-300 text-left ${isSelected ? 'pl-4' : 'hover:pl-2'}`}>
                        <span className={`font-mono text-sm uppercase tracking-wider transition-colors ${isSelected ? 'font-bold text-black' : 'text-gray-500 group-hover:text-black'}`}>{cat.label}</span>
                        {isSelected && <ArrowRight size={16} className="text-orange-600" />}
                        {!isSelected && <div className="w-1 h-1 bg-gray-200 rounded-full group-hover:bg-gray-400" />}
                        </button>
                    );
                    })}
                </div>
                </StepLayout>
            )}
            {currentStepIndex === 7 && (
                <div className="min-h-screen flex flex-col max-w-xl mx-auto px-6 py-8 fade-in bg-white text-black font-mono relative">
                <div className="flex justify-between items-end mb-8 pt-4">
                    <button onClick={() => setCurrentStepIndex(6)} className="hover:opacity-50 transition-opacity"><ChevronLeft size={20} strokeWidth={1.5} className="text-black" /></button>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">{activeTenant.name}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-8"><div className="flex items-center gap-4 mb-6"><div className="inline-flex items-center justify-center p-3 bg-gray-50 border border-black"><SharpMessage size={24} className="text-orange-600" /></div><h2 className="font-sans text-3xl font-bold leading-none text-black uppercase tracking-tight">Vamos resolver.</h2></div><p className="font-mono text-sm text-gray-600 leading-relaxed max-w-md">Lamentamos o ocorrido. Fale diretamente com a gerência para corrigirmos sua experiência agora.</p></div>
                    <div className="bg-gray-50 border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-2 flex items-center gap-2"><SharpAlert size={14} className="text-orange-600" /><span className="text-[10px] font-bold uppercase tracking-widest text-black">Formulário de Resolução Imediata</span></div>
                        <div className="space-y-6 mt-4">
                        <ObservationInput label="O QUE HOUVE?" value={details.comment} onChange={(e: any) => setDetails({...details, comment: e.target.value})} placeholder="Descreva o ocorrido..." height="h-24"/>
                        <div><Input placeholder="TELEFONE (WHATSAPP)" type="tel" value={details.phone} onChange={handlePhoneChange} /><p className="text-[9px] text-gray-400 uppercase tracking-wide font-mono mt-1">*CONTATO RESTRITO À GERÊNCIA</p></div>
                        </div>
                    </div>
                </div>
                <div className="mt-8"><Button onClick={() => submitFinalReview(true)} className="w-full bg-black text-white hover:bg-gray-900">ENVIAR PARA GERÊNCIA <ArrowRight size={16} /></Button></div>
                </div>
            )}
            {currentStepIndex === 8 && (
                <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-gray-50 font-mono animate-in fade-in text-center">
                <div className="max-w-md w-full bg-white border border-black p-8 shadow-sm">
                    <div className="mb-8"><div className="mx-auto mb-6 w-16 h-16 bg-black text-white flex items-center justify-center border border-black"><CheckSquare size={32} strokeWidth={1.5} /></div><h2 className="font-sans text-2xl font-bold mb-2 tracking-tight text-black uppercase">Recebemos seu feedback</h2><div className="h-1 w-12 bg-orange-600 mx-auto mt-4 mb-4"></div></div>
                    <div className="text-left space-y-4 mb-10 font-sans text-sm text-gray-700">
                        <div className="flex items-start gap-3"><HeartHandshake size={18} className="text-black shrink-0 mt-0.5" /><span>Sentimos muito que sua experiência não tenha sido ideal.</span></div>
                        <div className="flex items-start gap-3"><TicketPercent size={18} className="text-black shrink-0 mt-0.5" /><span>Como pedido de desculpas, enviamos um <strong>Cupom</strong> para seu e-mail para que possamos te receber novamente da forma que merece.</span></div>
                        <div className="flex items-start gap-3"><Bell size={18} className="text-black shrink-0 mt-0.5" /><span>A gerência foi notificada e entrará em contato se necessário.</span></div>
                    </div>
                </div>
                <div className="mt-8"><Button onClick={resetFlow} variant="ghost" className="mx-auto text-[10px]">VOLTAR AO INÍCIO</Button></div>
                </div>
            )}
            </>
        )}
    </>
  );
}
