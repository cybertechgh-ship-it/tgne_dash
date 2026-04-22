"use client";

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  Plus, Search, FileText, CheckCircle2, Download,
  Receipt, Trash2, Loader2, CreditCard, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { Payment } from '@/lib/types';
import { generateInvoicePDF } from '@/lib/generate-invoice-pdf';

export default function InvoicesPage() {
  const { data, addPayment, updatePayment, deletePayment, savingState } = useApp();

  const [searchTerm,      setSearchTerm]      = useState('');
  const [isAddOpen,       setIsAddOpen]        = useState(false);
  const [selectedPayment, setSelectedPayment]  = useState<Payment | null>(null);
  const [isReceiptOpen,   setIsReceiptOpen]    = useState(false);
  const [deleteTarget,    setDeleteTarget]     = useState<Payment | null>(null);
  const [deletingId,      setDeletingId]       = useState<string | null>(null);

  // ── Bulk selection ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPaying, setIsBulkPaying] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    clientId: '', amount: 0, status: 'PENDING' as 'PENDING' | 'PAID',
    description: '', invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const filteredPayments = useMemo(() =>
    data.payments
      .filter(p => {
        const client = data.clients.find(c => c.id === p.clientId);
        return `${client?.businessName} ${p.invoiceNumber} ${p.description}`.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data.payments, data.clients, searchTerm]
  );

  const pendingInvoices = filteredPayments.filter(p => p.status === 'PENDING');

  const getClientName = (id: string) => data.clients.find(c => c.id === id)?.businessName ?? 'Unknown Client';
  const totalPaid     = data.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalPending  = data.payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPayment(newInvoice);
    setIsAddOpen(false);
    setNewInvoice({ clientId: '', amount: 0, status: 'PENDING', description: '', invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, paymentDate: new Date().toISOString().split('T')[0] });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    await deletePayment(deleteTarget.id);
    setDeletingId(null);
    setDeleteTarget(null);
  };

  // ── Bulk selection helpers ──────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    const pending = pendingInvoices.map(p => p.id);
    const allSelected = pending.every(id => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(pending));
  };
  const allPendingSelected = pendingInvoices.length > 0 && pendingInvoices.every(p => selectedIds.has(p.id));

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkPaying(true);
    await Promise.all([...selectedIds].map(id => updatePayment(id, { status: 'PAID' })));
    setSelectedIds(new Set());
    setIsBulkPaying(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Financials</h1>
            <p className="text-muted-foreground mt-2">Manage invoices, payments, and agency receipts.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 premium-button bg-primary text-primary-foreground">
                <Plus size={20} /> Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Agency Invoice</DialogTitle>
                <DialogDescription>Generate a new billable item for your partners.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddInvoice} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Partner Business <span className="text-destructive">*</span></Label>
                  <Select onValueChange={v => setNewInvoice({ ...newInvoice, clientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a partner" /></SelectTrigger>
                    <SelectContent>{data.clients.map(c => <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="invNum">Invoice #</Label><Input id="invNum" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="amount">Amount (GHS) <span className="text-destructive">*</span></Label><Input id="amount" type="number" step="0.01" min="0" required value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Status</Label>
                    <Select onValueChange={v => setNewInvoice({ ...newInvoice, status: v as 'PENDING' | 'PAID' })} defaultValue="PENDING">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="PENDING">Pending Payment</SelectItem><SelectItem value="PAID">Paid</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="date">Invoice Date</Label><Input id="date" type="date" value={newInvoice.paymentDate} onChange={e => setNewInvoice({ ...newInvoice, paymentDate: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="desc">Services Rendered</Label><Textarea id="desc" placeholder="e.g. Monthly SEO Management + Hosting" value={newInvoice.description} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} /></div>
                <Button type="submit" className="w-full" disabled={!newInvoice.clientId || newInvoice.amount <= 0}>Initialize Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Invoices', value: data.payments.length, color: 'text-foreground' },
            { label: 'Paid Revenue',   value: `GHS ${totalPaid.toLocaleString()}`,    color: 'text-emerald-600' },
            { label: 'Pending Amount', value: `GHS ${totalPending.toLocaleString()}`, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl border bg-card text-center">
              <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search by invoice #, client, or services..." className="pl-10 h-11 bg-background/50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* ── Bulk action bar — appears when rows selected ───────────── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <CheckSquare size={18} className="text-primary" />
              <span className="text-sm font-bold text-primary">{selectedIds.size} invoice{selectedIds.size > 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())} className="h-8 text-xs gap-1.5">Clear</Button>
              <Button size="sm" onClick={handleBulkMarkPaid} disabled={isBulkPaying}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isBulkPaying ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Mark {selectedIds.size > 1 ? `All ${selectedIds.size}` : ''} Paid
              </Button>
            </div>
          </div>
        )}

        {/* ── Table or empty state ───────────────────────────────────── */}
        {data.payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl text-muted-foreground gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><CreditCard size={28} className="text-primary/40" /></div>
            <div className="text-center"><p className="font-semibold text-foreground text-lg">No invoices yet</p><p className="text-sm mt-1">Create your first invoice to start tracking payments.</p></div>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 mt-1"><Plus size={16} /> Create Your First Invoice</Button>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10">
                    {/* Select-all checkbox — only over pending */}
                    <button onClick={toggleSelectAll} className="flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-primary transition-colors" title="Select all pending">
                      {allPendingSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                    </button>
                  </TableHead>
                  <TableHead>Invoice / ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const isDeleting   = deletingId === payment.id && savingState === 'deleting';
                  const isSelected   = selectedIds.has(payment.id);
                  const isPending    = payment.status === 'PENDING';
                  return (
                    <TableRow key={payment.id} className={cn('group transition-colors', isDeleting && 'opacity-50', isSelected && 'bg-primary/5')}>
                      <TableCell>
                        {isPending ? (
                          <button onClick={() => toggleSelect(payment.id)} className="flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-primary transition-colors">
                            {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                          </button>
                        ) : <div className="w-5" />}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold flex items-center gap-2 text-sm"><FileText size={13} className="text-primary flex-shrink-0" />{payment.invoiceNumber}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{payment.id.slice(0, 8).toUpperCase()}</div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{getClientName(payment.clientId)}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{payment.description || '—'}</TableCell>
                      <TableCell className="font-bold text-sm">GHS {payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn('font-bold text-[10px] border',
                          payment.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {payment.status === 'PENDING' ? (
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-50 text-emerald-600" onClick={() => updatePayment(payment.id, { status: 'PAID' })}>
                              <CheckCircle2 size={13} /> Mark Paid
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs bg-primary/5 text-primary hover:bg-primary/10" onClick={() => { setSelectedPayment(payment); setIsReceiptOpen(true); }}>
                              <Receipt size={13} /> Receipt
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => { const c = data.clients.find(c => c.id === payment.clientId); if (c) generateInvoicePDF(payment, c); }}>
                            <Download size={13} /> PDF
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(payment)} disabled={isDeleting}
                            className={cn('h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all',
                              isDeleting ? 'opacity-100 bg-red-600 text-white hover:bg-red-700' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10')}>
                            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">No invoices match your search.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Receipt dialog ─────────────────────────────────────────── */}
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
            <DialogHeader className="p-6 border-b bg-muted/20">
              <DialogTitle className="flex items-center gap-2"><Receipt className="text-primary" /> Digital Agency Receipt</DialogTitle>
              <DialogDescription>Official proof of transaction for {selectedPayment && getClientName(selectedPayment.clientId)}</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="p-10 space-y-8 bg-white text-black font-sans">
                <div className="flex justify-between items-start">
                  <div><h3 className="text-2xl font-black text-primary italic">TGNE</h3><p className="text-xs text-gray-500 mt-1">Premium Web Solutions</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Receipt Number</p><p className="font-bold">RCP-{selectedPayment.invoiceNumber}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-8 py-6 border-y border-dashed">
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Billed To</p><p className="font-bold text-lg">{getClientName(selectedPayment.clientId)}</p><p className="text-sm text-gray-500 mt-1">ID: {selectedPayment.clientId.slice(0, 8).toUpperCase()}</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Payment Date</p><p className="font-bold">{selectedPayment.paymentDate}</p><span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">VERIFIED PAID</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider"><span>Description</span><span>Amount</span></div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border"><span className="text-sm font-semibold">{selectedPayment.description || 'Web Development Services'}</span><span className="font-black">GHS {selectedPayment.amount.toLocaleString()}</span></div>
                </div>
                <div className="pt-4 flex justify-between items-end border-t">
                  <div className="space-y-1"><div className="w-32 h-10 border-b-2 border-gray-200 flex items-end justify-center"><span className="text-sm italic text-gray-300">TGNE Authorized</span></div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Digital Signature</p></div>
                  <div className="text-right"><p className="text-xs text-gray-400">Total</p><p className="text-3xl font-black text-primary">GHS {selectedPayment.amount.toLocaleString()}</p></div>
                </div>
                <div className="bg-primary p-4 rounded-xl flex items-center justify-between text-white">
                  <div className="flex items-center gap-3"><div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"><Download size={18} /></div><p className="text-xs font-bold leading-tight">Secured Digital Copy<br /><span className="opacity-70 font-normal">Stored on TGNE Ledger</span></p></div>
                  <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold text-xs h-8 gap-1.5"
                    onClick={() => { const c = data.clients.find(c => c.id === selectedPayment.clientId); if (c) generateInvoicePDF(selectedPayment, c); }}>
                    <Download size={13} /> Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Confirm delete ─────────────────────────────────────────── */}
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          loading={!!deletingId}
          title="Delete this invoice?"
          description={`Invoice ${deleteTarget?.invoiceNumber ?? ''} for GHS ${deleteTarget?.amount?.toLocaleString() ?? ''} will be permanently removed.`}
          confirmLabel="Delete Invoice"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
