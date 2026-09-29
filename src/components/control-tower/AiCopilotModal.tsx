import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ControlTowerKPI, WarehouseInventory, Shipment } from '../../types';
import { askAiCopilot } from '../../services/aiControlTowerService';
import { Bot, Sparkles, Send, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: ControlTowerKPI;
  inventory: WarehouseInventory[];
  shipments: Shipment[];
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  kpis,
  inventory,
  shipments,
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Halo! Saya Akram AI Logistics Copilot. Saya menganalisis telemetri 6 koridor pengiriman nasional, status stok multi-gudang (Cikarang, Marunda, Surabaya), dan SLA pemenuhan DC Indomarco & Indogrosir. Apa yang ingin Anda ketahui atau konsultasikan hari ini?',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Strategi persiapan lonjakan demand Peak Season Ramadhan',
    'Analisis stok kritis di Gudang Transit Surabaya',
    'Evaluasi SLA & klaim kerusakan ekspedisi Kalog vs Dakota',
    'Rangkuman status armada logistik aktif saat ini',
  ];

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || query;
    if (!textToSend.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    if (!userPrompt) setQuery('');
    setLoading(true);

    try {
      const response = await askAiCopilot(textToSend, { kpis, inventory, shipments });
      setMessages((prev) => [...prev, { sender: 'ai', text: response }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Maaf, terjadi gangguan dalam memproses rekomendasi logistik. Mohon coba sesaat lagi.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Akram AI Supply Chain Copilot & Optimizer" size="xl">
      <div className="flex flex-col h-[520px] max-h-[75vh]">
        {/* Header Prompt Helper */}
        <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Model AI terintegrasi dengan data real-time: <strong>{kpis.active_shipments_in_transit} truk aktif</strong>,{' '}
            <strong>OTIF {kpis.national_otif_rate}%</strong>, dan <strong>{kpis.central_warehouse_atp_boxes.toLocaleString('id-ID')} boxes</strong> stok bebas.
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-sky-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4 text-emerald-300" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl whitespace-pre-line shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-sky-800 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-lg bg-sky-800 text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs text-slate-500 italic">
                AI sedang menganalisis rantai pasok dan menghitung rekomendasi optimasi...
              </div>
            </div>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Query Input Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanyakan analisis stok, armada, rute tol, atau evaluasi DC..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-sky-800 hover:bg-sky-900 disabled:bg-slate-300 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
