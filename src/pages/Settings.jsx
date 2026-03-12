import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Database, ListChecks, Server, ShieldCheck, CheckCircle, Building2, User, Lock, RefreshCw , XCircle } from 'lucide-react';
import { authService } from '../services/api';
import { unidadeService } from '../services/unidadeService';

export function Settings() {
    const [activeTab, setActiveTab] = useState('conexao');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const [unidades, setUnidades] = useState([]);
    const [unidadeSelecionada, setUnidadeSelecionada] = useState(() => {
        return localStorage.getItem('unidadeSelecionada') || '';
    });
    const [servicos, setServicos] = useState([]);

    // Estado para Dados de Conexão
    const [dadosConexao, setDadosConexao] = useState(() => {
        const dadosSalvos = localStorage.getItem('dadosConexao');
        return dadosSalvos ? JSON.parse(dadosSalvos) : {
            servidor: '',
            usuario: '',
            senha: '',
            clienteId: '',
            clienteSecret: '',
        };
    });

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDadosConexao(prev => ({ ...prev, [name]: value }));
    };

    const handleSalvar = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        localStorage.setItem('dadosConexao', JSON.stringify(dadosConexao));

        try {
            await authService.getToken();
            setStatus({ 
                type: 'success', 
                message: 'Conexão estabelecida e autenticada com sucesso!' 
            });
        } catch (error) {
            console.log (error);
            setStatus({ 
                type: 'error', 
                message: 'Falha ao estabelecer conexão com o servidor.' 
            });
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        async function carregarUnidades() {
            if (activeTab === 'servicos') {
                setLoading(true);
                try {
                    const data = await unidadeService.listarUnidades();
                    setUnidades(data);
                    
                    const salva = localStorage.getItem('unidadeSelecionada');
                    if (data.length > 0 && !salva) {
                        setUnidadeSelecionada(data[0].id);
                        localStorage.setItem('unidadeSelecionada', data[0].id);
                    }
                } catch (error) {
                    console.error("Erro ao buscar unidades:", error);
                } finally {
                    setLoading(false);
                }
            }
        }
        carregarUnidades();
    }, [activeTab]);

    React.useEffect(() => {
        async function carregarServicos() {
            if (activeTab === 'servicos' && unidadeSelecionada) {
                try {
                    const data = await unidadeService.listarServicosAtivos(unidadeSelecionada);

                    const salvos = JSON.parse(
                        localStorage.getItem(`servicosSelecionados_${unidadeSelecionada}`) || '[]'
                    );

                    const atualizados = data.map(item => ({
                        ...item,
                        selecionado: salvos.includes(item.servico.id)
                    }));

                    setServicos(atualizados);
                } catch (error) {
                    console.error("Erro ao buscar serviços:", error);
                }
            }
        }
        carregarServicos();
    }, [unidadeSelecionada, activeTab]);

    const handleUnidadeChange = (e) => {
        const novaUnidade = e.target.value;
        setUnidadeSelecionada(novaUnidade);
        localStorage.setItem('unidadeSelecionada', novaUnidade);

        setServicos([]); 
    };

    const handleToggleServico = (id) => {
        setServicos(prev => {
            const atualizados = prev.map(item => {
                if (item.servico.id === id) {
                    return { ...item, selecionado: !item.selecionado };
                }
                return item;
            });

            const selecionados = atualizados
                .filter(item => item.selecionado)
                .map(item => item.servico.id);

            localStorage.setItem(
                `servicosSelecionados_${unidadeSelecionada}`,
                JSON.stringify(selecionados)
            );

            return atualizados;
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
                    <p className="text-slate-500">Gerencie a conexão com o servidor e os serviços ativos na triagem.</p>
                </header>

                {/* Navegação por Abas */}
                <div className="flex gap-4 mb-6 border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('conexao')}
                        className={`pb-4 px-4 flex items-center gap-2 font-medium transition-all ${activeTab === 'conexao' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Database size={20} /> Conexão API
                    </button>
                    <button 
                        onClick={() => setActiveTab('servicos')}
                        className={`pb-4 px-4 flex items-center gap-2 font-medium transition-all ${activeTab === 'servicos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ListChecks size={20} /> Serviços e Unidades
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    
                    {/* ABA: CONEXÃO */}
                    {activeTab === 'conexao' && (
                        <form onSubmit={handleSalvar} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Server size={16} /> Endereço do Servidor
                                    </label>
                                    <input 
                                        type="text" 
                                        name="servidor" 
                                        value={dadosConexao.servidor} 
                                        onChange={handleInputChange}
                                        placeholder="https://api.crmpa.org.br"
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <ShieldCheck size={16} /> Client ID
                                    </label>
                                    <input 
                                        type="text" 
                                        name="clienteId"
                                        value={dadosConexao.clienteId} 
                                        onChange={handleInputChange}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <ShieldCheck size={16} /> Client Secret
                                    </label>
                                    <input 
                                        type="password" 
                                        name="clienteSecret" 
                                        value={dadosConexao.clienteSecret} 
                                        onChange={handleInputChange}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <User size={16} /> Usuário</label>
                                    <input 
                                        type="text" 
                                        name="usuario" 
                                        value={dadosConexao.usuario} 
                                        onChange={handleInputChange}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Lock size={16} /> Senha
                                    </label>
                                    <input 
                                        type="password" 
                                        name="senha" 
                                        value={dadosConexao.senha} 
                                        onChange={handleInputChange}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:bg-slate-300"
                                >
                                    {loading ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                                    {loading ? 'Testando Conexão...' : 'Salvar e Conectar'}
                                </button>
                                
                                {status.type === 'success' && (
                                    <div className="flex items-center gap-2 text-green-600 font-medium animate-in fade-in">
                                        <CheckCircle size={20} /> {status.message}
                                    </div>
                                )}
                                {status.type === 'error' && (
                                    <div className="flex items-center gap-2 text-red-600 font-medium animate-in shake">
                                        <XCircle size={20} /> {status.message}
                                    </div>
                                )}
                            </div>
                        </form>
                    )}

                    {activeTab === 'servicos' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Seletor de Unidade */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Building2 size={20} className="text-blue-600" /> Selecione a Unidade
                                    </h3>
                                    <p className="text-sm text-slate-500">Escolha a unidade onde este totem está localizado.</p>
                                </div>
                                <select 
                                    value={unidadeSelecionada}
                                    onChange={handleUnidadeChange}
                                    className="bg-white border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px] font-medium text-slate-700 shadow-sm"
                                >
                                    <option value="" disabled>Selecione uma unidade...</option>
                                    {unidades.map(u => (
                                        <option key={u.id} value={u.id}>{u.nome}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Grade de Serviços */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <ListChecks size={20} className="text-blue-600" />
                                    <h3 className="font-bold text-slate-800">Serviços Disponíveis</h3>
                                </div>
                                
                                {servicos.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {servicos.map(servico => (
                                            <label 
                                                key={servico.servico.id}
                                                className={`group flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                                    // A cor do card agora depende de 'selecionado'
                                                    servico.selecionado 
                                                    ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-900/5' 
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${servico.selecionado ? 'text-blue-700' : 'text-slate-600'}`}>
                                                        {servico.servico.nome}
                                                    </span>

                                                </div>

                                                {/* Checkbox Visual */}
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    servico.selecionado ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                                }`}>
                                                    {servico.selecionado && <CheckCircle size={14} className="text-white" />}
                                                </div>

                                                <input 
                                                    type="checkbox" 
                                                    className="hidden"
                                                    checked={!!servico.selecionado}
                                                    onChange={() => handleToggleServico(servico.servico.id)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400">Nenhum serviço encontrado para esta unidade.</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-sm text-slate-400 text-center bg-slate-50 py-3 rounded-lg">
                                * As alterações nos serviços são salvas automaticamente para este terminal.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}