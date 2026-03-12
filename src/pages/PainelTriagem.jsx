import React, { useState, useEffect } from 'react';
import { unidadeService } from '../services/unidadeService';
import { 
  User, 
  AlertTriangle, 
  ChevronLeft, 
  Printer, 
  CheckCircle2,
} from 'lucide-react';
import { prioridadeService } from '../services/prioridadeService';
import { senhaService } from '../services/senhaService';
import logoCrm from '../assets/logo-crm.png';
import { authService } from '../services/api';

// Componente Wrapper para as etapa
const StepWrapper = ({ title, children, onBack }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
    <header className="bg-primary border-b border-slate-200 shadow-sm px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          {onBack && (
            <button 
              onClick={onBack} 
              className="group p-3 hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 shadow-sm"
            >
              <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}
          <div>
            <h2 className="text-4xl font-black text-white leading-tight">{title}</h2>
          </div>
        </div>

        {/* Logo no Header */}
        <div className="hidden md:block p-3 rounded-2xl">
          <img src={logoCrm} alt="Logo CRM" className="h-20 w-auto object-contain" />
        </div>
      </div>
    </header>

    {/* Conteúdo Central */}
    <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
      <div className="w-full">
        {children}
      </div>
    </main>

    {/* Footer Decorativo / Informativo */}
    <footer className="bg-primary text-white py-4 px-8 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm">Conselho Regional de Medicina</span>
      </div>
      <p className="text-xs">
        {new Date().toLocaleDateString('pt-BR')}
      </p>
    </footer>
  </div>
);

const PainelTriagem = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    unidade: parseInt(localStorage.getItem('unidadeSelecionada'), 10) || 0,
    servico: '',
    prioridade: '',
    cliente: {
      nome: '',
      documento: '',
    }
  });

  const [ticketGerado, setTicketGerado] = useState(null);
  const [senhaGerada, setSenhaGerada] = useState(null);
  const [servicosDisponiveis, setServicosDisponiveis] = useState([]);

  const [prioridadeNormal, setPrioridadeNormal] = useState(null);
  const [listaPrioridades, setListaPrioridades] = useState([]);

  const [timer, setTimer] = useState(10);

  useEffect(() => {
    async function carregar() {
      const unidadeId = localStorage.getItem('unidadeSelecionada');
      if (!unidadeId) return;
      
      let todos = await unidadeService.listarServicosAtivos(unidadeId);
      if (todos.length === 0) {
        await authService.getToken();
        todos = await unidadeService.listarServicosAtivos(unidadeId);
      }

      const selecionados = JSON.parse(
        localStorage.getItem(`servicosSelecionados_${unidadeId}`)
      );

      const filtrados = todos.filter(item =>
        selecionados.includes(item.servico.id)
      );

      const todasPrioridades = await prioridadeService.getPrioridades();
      const normal = todasPrioridades.find(p => p.peso === 0);
      const prioritarias = todasPrioridades.filter(p => p.peso > 0);

      setPrioridadeNormal(normal.id);
      setListaPrioridades(prioritarias);
      setServicosDisponiveis(filtrados);
    }
    carregar();
  }, []);

  useEffect(() => {
    let interval = null;
    if (step === 4) {
      setTimer(10); // Reseta o cronômetro ao entrar na tela
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            resetarFluxo();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const resetarFluxo = () => {
    setStep(1);
    setDados({ 
        ...dados, 
        servico: '', 
        prioridade: '', 
        cliente: { nome: '', documento: '' } 
    });
    setSenhaGerada(null);
  };

  const handleNomeChange = (e) => {
    setDados({
      ...dados,
      cliente: { ...dados.cliente, nome: e.target.value }
    });
  };

  const finalizarTriagem = async () => {
    setLoading(true);
    try {
      dados.cliente.documento = dados.unidade + '-' + Date.now();

      const ticketGerado = await senhaService.gerarSenha(dados);
      setTicketGerado(ticketGerado);

      try {
        const senhaData = await senhaService.exibirSenha(ticketGerado);
        setSenhaGerada(ticketGerado.senha.format);
        setStep(4);
      } catch (printError) {
        console.error("Erro na impressão, mas a senha foi gerada:", ticketGerado);
        setSenhaGerada(ticketGerado.senha.format);
        setStep(4);
      }
    } catch (error) {
      console.error("Erro ao gerar senha:", error);
      alert("Erro ao processar atendimento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {step === 1 && (
        <StepWrapper title="Selecione o Tipo de Atendimento">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl flex-1 mx-auto">
            <button 
              onClick={() => { setDados({...dados, prioridade: prioridadeNormal}); setStep(2); }}
              className="group bg-white border-2 border-blue-500 p-8 rounded-3xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
            >
              <div className="bg-blue-100 p-6 rounded-full mb-6 group-hover:bg-blue-600 transition-colors">
                <User className="w-12 h-12 text-blue-600 group-hover:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Atendimento Normal</h2>
              <p className="text-slate-400 text-center mt-2">Consultas e procedimentos de rotina</p>
            </button>

            <button 
              onClick={() => { setDados({...dados, prioridade: listaPrioridades[0].id}); setStep(2); }}
              className="group bg-white border-2 border-red-500 p-8 rounded-3xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
            >
              <div className="bg-red-100 p-6 rounded-full mb-6 group-hover:bg-red-500 transition-colors">
                <AlertTriangle className="w-12 h-12 text-red-600 group-hover:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Atendimento Prioritário</h2>
              <p className="text-slate-400 text-center mt-2">Idosos, gestantes e pessoas com deficiência</p>
            </button>
          </div>
        </StepWrapper>
      )}
      
      {/* Etapa 2: Seleção de Serviço */}
      {step === 2 && (
        <StepWrapper title="Selecione o Serviço" onBack={() => setStep(1)}>
          <div className="space-y-4">
            {servicosDisponiveis.map((item) => (
              <button
                key={item.servico.id}
                onClick={() => { 
                  setDados({
                    ...dados, 
                    servico: item.servico.id
                  }); 
                  setStep(3); 
                }}
                className="w-full bg-white p-6 rounded-2xl shadow hover:shadow-md hover:bg-slate-50 flex items-center justify-between group transition-all border-2 border-primary"
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-slate-700">
                    {item.servico.nome}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  →
                </div>
              </button>
            ))}
          </div>
        </StepWrapper>
      )}

      {/* Etapa 3: Identificação */}
      {step === 3 && (
        <StepWrapper title="Identificação" onBack={() => setStep(2)}>
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
            <label className="block text-sm font-medium text-slate-500 mb-2">Nome do Cliente</label>
            <input 
              autoFocus
              type="text"
              value={dados.cliente.nome}
              onChange={handleNomeChange}
              placeholder="Digite nome e sobrenome"
              className="w-full text-2xl p-4 border-b-4 border-slate-200 focus:border-blue-500 outline-none transition-colors mb-8"
            />
            <button 
              disabled={!dados.cliente.nome.trim() || loading}
              onClick={finalizarTriagem}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Processando..." : "Gerar Minha Senha"}
            </button>
          </div>
        </StepWrapper>
      )}

      {/* Etapa 4: Sucesso / Impressão */}
      {step === 4 && ticketGerado && (
        <div className="text-center animate-in zoom-in duration-300">
          <div className="relative bg-white p-8 rounded-lg shadow-2xl border-t-[12px] border-blue-600 max-w-sm mx-auto overflow-hidden">
            {/* Detalhe estético de "picote" de papel no fundo */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,_#f1f5f9_20%,_transparent_20%)] bg-[length:15px_15px] bg-repeat-x"></div>
            
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            
            <div className="border-b border-dashed border-slate-200 pb-4 mb-4">
              <h3 className="text-slate-500 text-sm uppercase tracking-[0.2em] font-bold mb-1">
                Atendimento Confirmado
              </h3>
              <p className="text-2xl font-bold text-slate-800">
                Olá, {dados.cliente.nome.split(' ')[0]}!
              </p>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-slate-400 text-sm font-medium uppercase">
                {ticketGerado.prioridade.nome}
              </p>
              <div className="py-4">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {ticketGerado.senha.format}
                </span>
              </div>
              <p className="text-blue-600 font-bold bg-blue-50 py-1 px-3 rounded-full inline-block">
                {ticketGerado.servico.nome}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 mb-8 font-medium">
              <div className="flex items-center gap-2">
                <Printer size={20} className="animate-bounce" />
                <span>Retire seu ticket...</span>
              </div>
              {/* Barra de progresso visual do tempo */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(timer / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs">Reiniciando em {timer}s</span>
            </div>

            <button 
              onClick={resetarFluxo}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-transform active:scale-95 shadow-lg"
            >
              Voltar Agora
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PainelTriagem;