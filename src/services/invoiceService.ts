import {
  TransporterInvoice,
  TransporterInvoiceStatus,
  LogisticsNotification,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStored, setStored, STORAGE_KEYS } from '../lib/storage';
import { INITIAL_TRANSPORTER_INVOICES, INITIAL_NOTIFICATIONS } from '../constants/initialData';
import { logActivity } from './auditLogService';
import * as XLSX from 'xlsx';

export const getTransporterInvoices = async (filters?: {
  transporter?: string;
  status?: string;
  month?: string;
}): Promise<TransporterInvoice[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('transporter_invoices').select('*').order('created_at', { ascending: false });
      if (filters?.transporter && filters.transporter !== 'all') {
        query = query.eq('transporter_name', filters.transporter);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as TransporterInvoice[];
      }
    } catch (e) {
      console.warn('Supabase transporter invoices read failed, fallback to local storage', e);
    }
  }

  let invoices = getStored<TransporterInvoice[]>(
    STORAGE_KEYS.TRANSPORTER_INVOICES,
    []
  );

  if (filters?.transporter && filters.transporter !== 'all') {
    invoices = invoices.filter((i) => i.transporter_name === filters.transporter);
  }
  if (filters?.status && filters.status !== 'all') {
    invoices = invoices.filter((i) => i.status === filters.status);
  }
  if (filters?.month && filters.month !== 'all') {
    invoices = invoices.filter((i) => i.period_month === filters.month);
  }

  return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateInvoiceStatus = async (
  invoiceId: string,
  newStatus: TransporterInvoiceStatus,
  paymentReference?: string,
  actorName = 'Finance Logistics'
): Promise<TransporterInvoice | null> => {
  const currentInvoices = getStored<TransporterInvoice[]>(
    STORAGE_KEYS.TRANSPORTER_INVOICES,
    []
  );

  let updatedTarget: TransporterInvoice | null = null;
  const now = new Date().toISOString();

  const updatedInvoices = currentInvoices.map((inv) => {
    if (inv.id === invoiceId) {
      updatedTarget = {
        ...inv,
        status: newStatus,
        payment_reference: paymentReference || inv.payment_reference,
        payment_date: newStatus === 'PAID' ? now : inv.payment_date,
        updated_at: now,
      };
      return updatedTarget;
    }
    return inv;
  });

  if (!updatedTarget) return null;

  const targetInvoice: TransporterInvoice = updatedTarget;

  setStored(STORAGE_KEYS.TRANSPORTER_INVOICES, updatedInvoices);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('transporter_invoices')
        .update({
          status: newStatus,
          payment_reference: paymentReference || null,
          payment_date: newStatus === 'PAID' ? now : null,
          updated_at: now,
        })
        .eq('id', invoiceId);
    } catch (e) {
      console.warn('Supabase invoice status update failed', e);
    }
  }

  await logActivity({
    action: 'UPDATE',
    module: 'INVOICES',
    recordId: invoiceId,
    description: `${actorName} updated status invoice ${targetInvoice.invoice_number} to ${newStatus}${paymentReference ? ` (Ref: ${paymentReference})` : ''}`,
  });

  return targetInvoice;
};

export const getLogisticsNotifications = async (): Promise<LogisticsNotification[]> => {
  return getStored<LogisticsNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
};

export const sendDispatchNotification = async (payload: {
  referenceNumber: string;
  recipientName: string;
  recipientContact: string;
  channel: 'WHATSAPP' | 'EMAIL';
  title: string;
  message: string;
}): Promise<LogisticsNotification> => {
  const currentNotifs = getStored<LogisticsNotification[]>(
    STORAGE_KEYS.NOTIFICATIONS,
    INITIAL_NOTIFICATIONS
  );

  const newNotif: LogisticsNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    event_type: 'SHIPMENT_DISPATCHED',
    title: payload.title,
    message: payload.message,
    channel: payload.channel,
    recipient_name: payload.recipientName,
    recipient_contact: payload.recipientContact,
    status: 'DELIVERED',
    reference_type: 'SHIPMENT',
    reference_id: payload.referenceNumber,
    reference_number: payload.referenceNumber,
    sent_at: new Date().toISOString(),
  };

  const updated = [newNotif, ...currentNotifs];
  setStored(STORAGE_KEYS.NOTIFICATIONS, updated);

  await logActivity({
    action: 'CREATE',
    module: 'DISPATCH',
    recordId: newNotif.id,
    description: `Sent ${payload.channel} dispatch notification for ${payload.referenceNumber} to ${payload.recipientName} (${payload.recipientContact})`,
  });

  return newNotif;
};

export const exportInvoicesToExcel = (invoices: TransporterInvoice[]) => {
  const rows = invoices.map((inv, idx) => ({
    No: idx + 1,
    'No Faktur': inv.invoice_number,
    'Nama Ekspedisi': inv.transporter_name,
    'Periode Tagihan': inv.period_month,
    'Tanggal Terbit': inv.invoice_date,
    'Jatuh Tempo': inv.due_date,
    'Total Surat Jalan': inv.total_shipments,
    'Ongkos Bruto (Rp)': inv.gross_freight_amount,
    'Potongan Klaim / Retur (Rp)': inv.claim_deductions,
    'Total Bersih Dibayar (Rp)': inv.net_payable_amount,
    Status: inv.status,
    'Ref Pembayaran': inv.payment_reference || '-',
    'Tanggal Bayar': inv.payment_date ? inv.payment_date.slice(0, 10) : '-',
    Keterangan: inv.notes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Faktur Ekspedisi');

  const fileName = `Rekap_Faktur_Ongkir_Ekspedisi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
