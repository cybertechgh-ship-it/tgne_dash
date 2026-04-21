"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Download,
  Receipt,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Payment } from '@/lib/types';
import { generateInvoicePDF } from '@/lib/generate-invoice-pdf';

export default function InvoicesPage() {
  const { data, addPayment, updatePayment, deletePayment, savingState } = useApp();
  const [searchTerm,     setSearchTerm]     = useState('');
  const [isAddOpen,      setIsAddOpen]      = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptOpen,  setIsReceiptOpen]  = useState(false);
  const [deletingId,     setDeletingId]     = useState<string | null>(null);

  const [newInvoice, setNewInvoice] = useState({
    clientId:      '',
    amount:        0,
    status:        'PENDING' as 'PENDING' | 'PAID',
    description:   '',
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    paymentDate:   new Date().toISOString().split('T')[0]
  });

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    addPayment(newInvoice);
    setIsAddOpen(false);
    setNewInvoice({
      clientId: '', amount: 0, status: 'PENDING', description: '',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deletePayment(id);
    setDeletingId(null);
  };

  const filteredPayments = data.payments
    .filter(p => {
      const client = data.clients.find(c => c.id === p.clientId);
      const searchStr = `${client?.businessName} ${p.invoiceNumber} ${p.description}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getClientName = (id: string) =>
    data.clients.find(c => c.id === id)?.businessName || 'Unknown Client';

  // Summary stats
  const totalPaid    = data.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalPending = data.payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
                  <Select onValueChange={v => setNewInvoice({...newInvoice, clientId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select a partner" /></SelectTrigger>
                    <SelectContent>
                      {data.clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invNum">Invoice #</Label>
                    <Input id="invNum" value={newInvoice.invoiceNumber}
                      onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (GHS) <span className="text-destructive">*</span></Label>
                    <Input id="amount" type="number" step="0.01" min="0" required
                      value={newInvoice.amount}
                      onChange={e => setNewInvoice({...newInvoice, amount: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select onValueChange={v => setNewInvoice({...newInvoice, status: v as 'PENDING' | 'PAID'})} defaultValue="PENDING">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending Payment</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input id="date" type="date" value={newInvoice.paymentDate}
                      onChange={e => setNewInvoice({...newInvoice, paymentDate: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Services Rendered</Label>
                  <Textarea id="desc" placeholder="e.g. Monthly SEO Management + Hosting"
                    value={newInvoice.description}
                    onChange={e => setNewInvoice({...newInvoice, description: e.target.value})} />
                </div>
                <Button type="submit" className="w-full" disabled={!newInvoice.clientId || newInvoice.amount <= 0}>
                  Initialize Invoice
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Invoices',  value: data.payments.length,                  color: 'text-foreground' },
            { label: 'Paid Revenue',    value: `GHS ${totalPaid.toLocaleString()}`,   color: 'text-emerald-600' },
            { label: 'Pending Amount',  value: `GHS ${totalPending.toLocaleString()}`, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl border bg-card text-center">
              <p className={cn('text-xl font-black', s.color)}>{s.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search by invoice #, client, or services..."
            className="pl-10 h-11 bg-background/50"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
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
                const isDeleting = deletingId === payment.id && savingState === 'deleting';
                return (
                  <TableRow key={payment.id} className={cn('group transition-colors', isDeleting && 'opacity-50')}>
                    <TableCell>
                      <div className="font-bold flex items-center gap-2 text-sm">
                        <FileText size={13} className="text-primary flex-shrink-0" />
                        {payment.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {payment.id.slice(0, 8).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{getClientName(payment.clientId)}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {payment.description || '—'}
                    </TableCell>
                    <TableCell className="font-bold text-sm">GHS {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'font-bold text-[10px] border',
                        payment.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      )}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">

                        {/* Mark Paid / View Receipt */}
                        {payment.status === 'PENDING' ? (
                          <Button size="sm" variant="outline"
                            className="h-8 gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-50 text-emerald-600"
                            onClick={() => updatePayment(payment.id, { status: 'PAID' })}>
                            <CheckCircle2 size={13} /> Mark Paid
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary"
                            className="h-8 gap-1.5 text-xs bg-primary/5 text-primary hover:bg-primary/10"
                            onClick={() => { setSelectedPayment(payment); setIsReceiptOpen(true); }}>
                            <Receipt size={13} /> Receipt
                          </Button>
                        )}

                        {/* PDF Download */}
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                          onClick={() => {
                            const client = data.clients.find(c => c.id === payment.clientId);
                            if (client) generateInvoicePDF(payment, client);
                          }}>
                          <Download size={13} /> PDF
                        </Button>

                        {/* Delete — red while deleting */}
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(payment.id)}
                          disabled={isDeleting}
                          className={cn(
                            'h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all',
                            isDeleting
                              ? 'opacity-100 bg-red-600 text-white hover:bg-red-700'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          )}>
                          {isDeleting
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No financial records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Receipt Dialog ─────────────────────────────────────────────── */}
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
            <DialogHeader className="p-6 border-b bg-muted/20">
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="text-primary" /> Digital Agency Receipt
              </DialogTitle>
              <DialogDescription>
                Official proof of transaction for {selectedPayment && getClientName(selectedPayment.clientId)}
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="p-10 space-y-8 bg-white text-black font-sans">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-primary italic">TGNE</h3>
                    <p className="text-xs text-gray-500 mt-1">Premium Web Solutions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Receipt Number</p>
                    <p className="font-bold">RCP-{selectedPayment.invoiceNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6 border-y border-dashed">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Billed To</p>
                    <p className="font-bold text-lg">{getClientName(selectedPayment.clientId)}</p>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedPayment.clientId.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Payment Date</p>
                    <p className="font-bold">{selectedPayment.paymentDate}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      VERIFIED PAID
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <span>Description</span><span>Amount</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                    <span className="text-sm font-semibold">{selectedPayment.description || 'Web Development Services'}</span>
                    <span className="font-black">GHS {selectedPayment.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-end border-t">
                  <div className="space-y-1">
                    <div className="w-32 h-10 border-b-2 border-gray-200 flex items-end justify-center">
                      <span className="text-sm italic text-gray-300">TGNE Authorized</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Digital Signature</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-3xl font-black text-primary">GHS {selectedPayment.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-primary p-4 rounded-xl flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                      <Download size={18} />
                    </div>
                    <p className="text-xs font-bold leading-tight">
                      Secured Digital Copy<br />
                      <span className="opacity-70 font-normal">Stored on TGNE Ledger</span>
                    </p>
                  </div>
                  <Button variant="outline"
                    className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold text-xs h-8 gap-1.5"
                    onClick={() => {
                      const client = data.clients.find(c => c.id === selectedPayment.clientId);
                      if (client) generateInvoicePDF(selectedPayment, client);
                    }}>
                    <Download size={13} /> Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
