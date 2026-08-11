import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, User, Send, CheckCircle2 } from 'lucide-react';

export const PadeIATypingCard: React.FC = () => {
  const [typedMessage, setTypedMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [typingResponse, setTypingResponse] = useState('');

  const fullQuestion = 'Qual foi meu maior desperdício este mês?';
  const fullResponse =
    'A maior perda veio dos salgados, representando R$ 1.240,00 no período. Recomendo reduzir a fornada de assados das 16h em 15% para eliminar sobras noturnas.';

  useEffect(() => {
    let qIndex = 0;
    setTypedMessage('');
    setShowResponse(false);
    setTypingResponse('');

    // Typing question
    const questionInterval = setInterval(() => {
      if (qIndex < fullQuestion.length) {
        setTypedMessage(fullQuestion.slice(0, qIndex + 1));
        qIndex++;
      } else {
        clearInterval(questionInterval);
        // Wait then show AI thinking & typing
        setTimeout(() => {
          setShowResponse(true);
          let rIndex = 0;
          const responseInterval = setInterval(() => {
            if (rIndex < fullResponse.length) {
              setTypingResponse(fullResponse.slice(0, rIndex + 1));
              rIndex++;
            } else {
              clearInterval(responseInterval);
            }
          }, 20);
        }, 600);
      }
    }, 40);

    return () => {
      clearInterval(questionInterval);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0B0F17] text-white p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6 relative overflow-hidden flex flex-col justify-between">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-2 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-black uppercase tracking-wider border border-[#FF6B00]/30">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B00] animate-pulse" />
          <span>INTELIGÊNCIA ARTIFICIAL EXCLUSIVA</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
          <span>PadeIA™</span>
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
          A inteligência que transforma seus dados em decisões.
        </p>
      </div>

      {/* Simulated Typing Chat Interface */}
      <div className="bg-[#1F2937]/80 rounded-2xl p-4 sm:p-5 border border-gray-700/80 space-y-3 relative z-10 backdrop-blur-md">
        {/* User Question Bubble */}
        <div className="flex items-start space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-700 text-gray-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="bg-gray-800 text-gray-100 text-xs p-3 rounded-2xl rounded-tl-none font-medium max-w-[85%] border border-gray-700/60 shadow-xs">
            <span>{typedMessage}</span>
            {typedMessage.length < fullQuestion.length && (
              <span className="inline-block w-1.5 h-3.5 bg-[#FF6B00] ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* AI Typing Response Bubble */}
        {showResponse && (
          <div className="flex items-start space-x-2.5 pt-2 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#111827] text-orange-50 text-xs p-3.5 rounded-2xl rounded-tl-none font-medium max-w-[90%] border border-orange-500/30 shadow-md space-y-2">
              <div className="flex items-center space-x-1.5 text-[10px] font-black text-[#FF6B00] uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>PadeIA Insights</span>
              </div>
              <p className="leading-relaxed">
                {typingResponse}
                {typingResponse.length < fullResponse.length && (
                  <span className="inline-block w-1.5 h-3.5 bg-[#FF6B00] ml-1 animate-pulse" />
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Value Note */}
      <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-semibold relative z-10">
        <span className="flex items-center space-x-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Sem formulas nem gráficos confusos</span>
        </span>
        <span className="text-[#FF6B00] font-bold">Respostas diretas em português</span>
      </div>
    </div>
  );
};
