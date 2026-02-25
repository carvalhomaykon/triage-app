import React, { useState, useEffect } from 'react';
import { unidadeService } from '../services/unidadeService';
import { 
  User, 
  Award, 
  Stethoscope, 
  Activity, 
  ClipboardList, 
  ChevronLeft, 
  Printer, 
  CheckCircle2,
} from 'lucide-react';

import logoCrm from '../assets/logo-crm.png';

// Componente Wrapper para as etapas
const StepWrapper = ({ title, children, onBack }) => (
  <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center mb-8">
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors mr-4">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
      )}
      <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
    </div>
    {children}
  </div>
);

const PainelTriagem = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    tipo: '',
    servico: '',
    nome: ''
  });

  const [senhaGerada, setSenhaGerada] = useState(null);
  const [servicosDisponiveis, setServicosDisponiveis] = useState([]);

  useEffect(() => {
    async function carregar() {
      const unidadeId = localStorage.getItem('unidadeSelecionada');
      if (!unidadeId) return;
        
      const todos = await unidadeService.listarServicosAtivos(unidadeId);
      
      const selecionados = JSON.parse(
        localStorage.getItem(`servicosSelecionados_${unidadeId}`) || '[]'
      );

      const filtrados = todos.filter(item =>
        selecionados.includes(item.servico.id)
      );

      setServicosDisponiveis(filtrados);
    }

    carregar();
  }, []);

  const resetarFluxo = () => {
    setStep(1);
    setDados({ tipo: '', servico: '', nome: '' });
    setSenhaGerada(null);
  };

  const finalizarTriagem = () => {
    setLoading(true);
    setTimeout(() => {
      const prefixo = dados.tipo === 'prioritario' ? 'P' : 'N';
      const numero = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      setSenhaGerada(`${prefixo}-${numero}`);
      setStep(4);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {step === 1 && (
        <>
          <div className="text-center mb-12">
            <div className="bg-primary p-6 rounded-3xl inline-block mb-10 shadow-lg">
              <img src={logoCrm} alt="Logo CRM" className="h-16 w-auto mx-auto" />
            </div>
            <p className="text-slate-500 text-lg">Selecione o tipo de atendimento para continuar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <button 
              onClick={() => { setDados({...dados, tipo: 'normal'}); setStep(2); }}
              className="group bg-white border-2 border-transparent hover:border-blue-500 p-8 rounded-3xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
            >
              <div className="bg-blue-100 p-6 rounded-full mb-6 group-hover:bg-blue-600 transition-colors">
                <User className="w-12 h-12 text-blue-600 group-hover:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Atendimento Normal</h2>
              <p className="text-slate-400 text-center mt-2">Consultas e procedimentos de rotina</p>
            </button>

            <button 
              onClick={() => { setDados({...dados, tipo: 'prioritario'}); setStep(2); }}
              className="group bg-white border-2 border-transparent hover:border-red-500 p-8 rounded-3xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
            >
              <div className="bg-red-100 p-6 rounded-full mb-6 group-hover:bg-red-500 transition-colors">
                <Award className="w-12 h-12 text-red-600 group-hover:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">Prioritário</h2>
              <p className="text-slate-400 text-center mt-2">Idosos, gestantes e pessoas com deficiência</p>
            </button>
          </div>
        </>
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
                    servico: item.servico.nome
                  }); 
                  setStep(3); 
                }}
                className="w-full bg-white p-6 rounded-2xl shadow hover:shadow-md hover:bg-slate-50 flex items-center justify-between group transition-all border border-slate-100"
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
            <label className="block text-sm font-medium text-slate-500 mb-2">Nome do Usuário</label>
            <input 
              autoFocus
              type="text"
              placeholder="Digite seu nome completo"
              className="w-full text-2xl p-4 border-b-4 border-slate-200 focus:border-blue-500 outline-none transition-colors mb-8"
              value={dados.nome}
              onChange={(e) => setDados({...dados, nome: e.target.value})}
            />
            <button 
              disabled={!dados.nome || loading}
              onClick={finalizarTriagem}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Processando..." : "Gerar Minha Senha"}
            </button>
          </div>
        </StepWrapper>
      )}

      {/* Etapa 4: Sucesso / Impressão */}
      {step === 4 && (
        <div className="text-center animate-in zoom-in duration-300">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-t-[12px] border-green-500 max-w-sm mx-auto">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h3 className="text-slate-500 uppercase tracking-widest font-bold">Olá, {dados.nome.split(' ')[0]}!</h3>
            <p className="text-slate-400 mt-2">Setor: {dados.servico}</p>
            <div className="my-8">
              <span className="text-7xl font-black text-slate-800 tracking-tighter">{senhaGerada}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-8 font-medium">
              <Printer size={20} className="animate-pulse" />
              <span>Imprimindo ticket...</span>
            </div>
            <button 
              onClick={resetarFluxo}
              className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Finalizar e Voltar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PainelTriagem;