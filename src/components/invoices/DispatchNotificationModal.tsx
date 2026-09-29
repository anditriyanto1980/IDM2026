import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { sendDispatchNotification } from '../../services/invoiceService';
import { useToast } from '../../hooks/useToast';
import { Send, MessageSquare, Mail, CheckCircle2, Phone, AlertCircle } from 'lucide-react';

interface DispatchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
  shipmentNumber?: string;
  defaultRecipientName?: string;
  defaultContact?: string;
}

export const DispatchNotificationModal: React.FC<DispatchNotificationModalProps> = ({
  isOpen,
  onClose,
  onSent,
  shipmentNumber = 'SJ-202609-0001',
  defaultRecipientName = 'Dedi Kurniawan (PIC DC)',
  defaultContact = '0812-3456-7890',
}) => {
  const { showToast } = useToast();

  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [recipientContact, setRecipientContact] = useState(defaultContact);
  const [title, setTitle] = useState(`Pemberitahuan Dispatch Surat Jalan ${shipmentNumber}`);
  const [message, setMessage] = useState(
    `Halo Bpk/Ibu,\n\nArmada pengiriman kurma Akram dengan No Surat Jalan *${shipmentNumber}* telah diberangkatkan dari Gudang Pusat Cikarang menuju Distribution Center Anda.\n\nEstimasi ketibaan sesuai jadwal normal. Mohon dipersiapkan tim bongkar muat dan petugas penerima untuk pemeriksaan fisik BAST.\n\nTerima kasih,\nLogistics PT Akram Niaga Nusantara`
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientContact.trim()) {
      showToast('error', 'Masukkan nomor WhatsApp atau email penerima');
      return;
    }

    setSubmitting(true);
    try {
      await sendDispatchNotification({
        referenceNumber: shipmentNumber,
        recipientName,
        recipientContact,
        channel,
        title,
        message,
      });

      showToast('success', `Notifikasi ${channel} berhasil dikirim ke ${recipientName}!`);
      onSent();
      onClose();
    } catch (e: any) {
      showToast('error', e.message || 'Gagal mengirim notifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kirim Notifikasi Dispatch Armada (WhatsApp / Email)" size="md">
      <form onSubmit={handleSend} className="space-y-4">
        {/* Channel Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setChannel('WHATSAPP');
              if (recipientContact.includes('@')) setRecipientContact('0812-3456-7890');
            }}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              channel === 'WHATSAPP'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChannel('EMAIL');
              if (!recipientContact.includes('@')) setRecipientContact('pic-dc@indogrosir.co.id');
            }}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              channel === 'EMAIL'
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Email Alert</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Penerima / Jabatan:
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {channel === 'WHATSAPP' ? 'Nomor WhatsApp (Contoh: 0812xxxx):' : 'Alamat Email Tujuan:'}
          </label>
          <input
            type="text"
            value={recipientContact}
            onChange={(e) => setRecipientContact(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Isi Pesan Notifikasi:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            required
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              channel === 'WHATSAPP' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-800 hover:bg-sky-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Mengirim...' : 'Kirim Notifikasi Sekarang'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
