"use client";

import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  exportAllToExcel,
  exportClientsCSV,
  exportWebsitesCSV,
  exportPaymentsCSV,
  exportTasksCSV,
  exportRemindersCSV,
  parseCSV,
  parseExcelSheet,
} from '@/lib/export-import';
import { useToast } from '@/hooks/use-toast';
import {
  Download, Upload, FileSpreadsheet, FileText,
  CheckCircle2, AlertTriangle, Loader2, Database,
  Users, Globe, CreditCard, CheckSquare, Bell,
  ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportTarget = 'all' | 'clients' | 'websites' | 'invoices' | 'tasks' | 'reminders';
type ImportStatus = { rows: number; errors: string[]; done: boolean } | null;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DataPage() {
  const { data, addClient, addWebsite, addPayment, addTask, addReminder } = useApp();
  const { toast } = useToast();

  const [exporting,    setExporting]    = useState<ExportTarget | null>(null);
  const [importing,    setImporting]    = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [preview,      setPreview]      = useState<{ headers: string[]; rows: Record<string, string>[]; type: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const importRowsRef = useRef<{ rows: Record<string, string>[]; type: string } | null>(null);

  // ─── Export handlers ─────────────────────────────────────────────────────

  const handleExport = async (target: ExportTarget) => {
    setExporting(target);
    try {
      if (target === 'all') {
        await exportAllToExcel(data);
        toast({ title: 'Export complete', description: 'TGNE_Export.xlsx downloaded.' });
      } else if (target === 'clients') {
        exportClientsCSV(data.clients);
        toast({ title: 'Clients exported', description: 'CSV downloaded.' });
      } else if (target === 'websites') {
        exportWebsitesCSV(data.websites, data.clients);
        toast({ title: 'Websites exported', description: 'CSV downloaded.' });
      } else if (target === 'invoices') {
        exportPaymentsCSV(data.payments, data.clients);
        toast({ title: 'Invoices exported', description: 'CSV downloaded.' });
      } else if (target === 'tasks') {
        exportTasksCSV(data.tasks, data.clients);
        toast({ title: 'Tasks exported', description: 'CSV downloaded.' });
      } else if (target === 'reminders') {
        exportRemindersCSV(data.reminders);
        toast({ title: 'Reminders exported', description: 'CSV downloaded.' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Export failed', description: String(e) });
    } finally {
      setExporting(null);
    }
  };

  // ─── Import handler ───────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only .csv, .xlsx, or .xls files are supported.' });
      return;
    }

    setImporting(true);
    setImportStatus(null);
    setPreview(null);

    try {
      let rows: Record<string, string>[] = [];

      if (ext === 'csv') {
        const text = await file.text();
        rows = parseCSV(text);
      } else {
        rows = await parseExcelSheet(file);
      }

      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'Empty file', description: 'No data rows found.' });
        setImporting(false);
        return;
      }

      // Detect type from column headers
      const headers  = Object.keys(rows[0]);
      const type     = detectImportType(headers);
      const firstFew = rows.slice(0, 3);
      setPreview({ headers: headers.slice(0, 6), rows: firstFew, type });
      setImporting(false);

      // Store rows for confirm step via ref (avoids window global hack)
      importRowsRef.current = { rows, type };

    } catch (e) {
      toast({ variant: 'destructive', title: 'Parse failed', description: String(e) });
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    const stored = importRowsRef.current;
    const rows = stored?.rows;
    const type = stored?.type;
    if (!rows || !type || type === 'unknown') {
      toast({ variant: 'destructive', title: 'Cannot import', description: 'Unrecognised file format. Check column headers match the export template.' });
      return;
    }

    setImporting(true);
    const errors: string[] = [];
    let count = 0;

    for (const row of rows) {
      try {
        if (type === 'client') {
          await addClient({
            name:             row['Contact Name'] || row['name'] || 'Imported',
            businessName:     row['Business Name'] || row['businessName'] || 'Imported',
            email:            row['Email'] || row['email'] || undefined,
            phone:            row['Phone'] || row['phone'] || undefined,
            status:           (row['Status'] || 'Active') as any,
            industry:         row['Industry'] || undefined,
            businessType:     row['Business Type'] || undefined,
            currency:         row['Currency'] || 'GHS',
            vatEnabled:       (row['VAT'] || '').toLowerCase() === 'yes',
            paymentTerms:     row['Payment Terms'] || undefined,
            preferredPayment: (row['Preferred Payment'] || undefined) as any,
            country:          row['Country'] || undefined,
            city:             row['City'] || undefined,
            accountManager:   row['Account Manager'] || undefined,
            tags:             row['Tags'] || undefined,
            notes:            row['Notes'] || undefined,
          });
          count++;
        } else if (type === 'reminder') {
          await addReminder({
            title:   row['Title'] || row['title'] || 'Imported',
            type:    (row['Type'] || 'Web Management') as any,
            date:    row['Date'] || row['date'] || new Date().toISOString().split('T')[0],
            details: row['Details'] || row['details'] || '',
          });
          count++;
        } else if (type === 'task') {
          // Tasks need a clientId — skip if none found
          const client = data.clients.find(c =>
            c.businessName.toLowerCase() === (row['Client'] || '').toLowerCase()
          );
          if (!client) { errors.push(`Row skipped — client "${row['Client']}" not found`); continue; }
          await addTask({
            clientId:    client.id,
            description: row['Description'] || row['description'] || 'Imported task',
            status:      (row['Status'] || 'Pending') as any,
            dueDate:     row['Due Date'] || row['dueDate'] || undefined,
          });
          count++;
        }
      } catch (e) {
        errors.push(`Row error: ${String(e)}`);
      }
    }

    setImportStatus({ rows: count, errors, done: true });
    setPreview(null);
    setImporting(false);
    importRowsRef.current = null;

    toast({
      title: `Import complete`,
      description: `${count} records imported${errors.length > 0 ? `, ${errors.length} skipped` : ''}.`,
    });
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function detectImportType(headers: string[]): string {
    const h = headers.map(x => x.toLowerCase());
    if (h.includes('business name') || h.includes('businessname')) return 'client';
    if (h.includes('domain') || h.includes('domainname'))            return 'website';
    if (h.includes('invoice') || h.includes('invoicenumber'))        return 'payment';
    if (h.includes('description') && h.includes('due date'))         return 'task';
    if (h.includes('title') && h.includes('type') && h.includes('date')) return 'reminder';
    return 'unknown';
  }

  // ─── Export cards data ────────────────────────────────────────────────────

  const exportCards = [
    {
      target: 'all' as ExportTarget,
      label: 'Full Export — Excel',
      sub: 'All data across every sheet in one .xlsx file',
      icon: FileSpreadsheet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      count: `${data.clients.length + data.websites.length + data.payments.length + data.tasks.length + data.reminders.length} total records`,
      format: 'XLSX',
    },
    { target: 'clients'   as ExportTarget, label: 'Clients CSV',   sub: 'All client profiles and contact info',   icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-500/10 border-blue-500/20',   count: `${data.clients.length} clients`,   format: 'CSV' },
    { target: 'websites'  as ExportTarget, label: 'Websites CSV',  sub: 'All domains, hosting, expiry dates',     icon: Globe,       color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/20', count: `${data.websites.length} websites`, format: 'CSV' },
    { target: 'invoices'  as ExportTarget, label: 'Invoices CSV',  sub: 'Full payment and invoice history',       icon: CreditCard,  color: 'text-amber-600',  bg: 'bg-amber-500/10 border-amber-500/20',  count: `${data.payments.length} invoices`,format: 'CSV' },
    { target: 'tasks'     as ExportTarget, label: 'Tasks CSV',     sub: 'All tasks with status and due dates',    icon: CheckSquare, color: 'text-teal-600',   bg: 'bg-teal-500/10 border-teal-500/20',   count: `${data.tasks.length} tasks`,     format: 'CSV' },
    { target: 'reminders' as ExportTarget, label: 'Reminders CSV', sub: 'All alerts and scheduled reminders',    icon: Bell,        color: 'text-rose-600',   bg: 'bg-rose-500/10 border-rose-500/20',   count: `${data.reminders.length} reminders`, format: 'CSV' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Database className="text-primary" size={36} />
            Data Management
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Export your agency data to Excel or CSV, and import records from spreadsheets.
          </p>
        </div>

        <Tabs defaultValue="export">
          <TabsList className="bg-muted/50 border h-12 rounded-2xl p-1 gap-1">
            <TabsTrigger value="export" className="rounded-xl px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Download size={15} /> Export
            </TabsTrigger>
            <TabsTrigger value="import" className="rounded-xl px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Upload size={15} /> Import
            </TabsTrigger>
          </TabsList>

          {/* ── EXPORT TAB ───────────────────────────────────────────────── */}
          <TabsContent value="export" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportCards.map((card) => {
                const Icon     = card.icon;
                const isLoading = exporting === card.target;
                return (
                  <Card key={card.target}
                    className={cn(
                      'premium-card cursor-pointer hover:translate-y-[-2px] transition-all duration-200 border',
                      card.target === 'all' && 'sm:col-span-2 lg:col-span-3 bg-primary/5 border-primary/20'
                    )}
                    onClick={() => !exporting && handleExport(card.target)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn('p-3 rounded-2xl border flex-shrink-0', card.bg)}>
                            <Icon size={card.target === 'all' ? 24 : 20} className={card.color} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{card.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-wider">{card.count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className={cn('text-[10px] font-black', card.bg, card.color)}>
                            {card.format}
                          </Badge>
                          {isLoading
                            ? <Loader2 size={18} className="animate-spin text-primary" />
                            : <ChevronRight size={18} className="text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-6 text-center">
              Excel exports include all sheets with styled headers. CSV exports are single-entity plain-text files compatible with Google Sheets, Numbers, and any spreadsheet app.
            </p>
          </TabsContent>

          {/* ── IMPORT TAB ───────────────────────────────────────────────── */}
          <TabsContent value="import" className="mt-6 space-y-6">

            {/* Drop zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer',
                dragOver
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
              {importing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <p className="font-bold text-foreground">Parsing file…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="p-4 rounded-2xl bg-muted/50 border">
                    <Upload size={28} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">Drop a CSV or Excel file here</p>
                    <p className="text-xs mt-1">or click to browse — .csv, .xlsx, .xls supported</p>
                  </div>
                </div>
              )}
            </div>

            {/* Supported formats info */}
            <Card className="premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText size={15} className="text-primary" /> Supported Import Formats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'Clients', cols: 'Business Name, Contact Name, Email, Phone, Status, Currency…', icon: Users },
                    { label: 'Tasks',   cols: 'Client (business name), Description, Status, Due Date',        icon: CheckSquare },
                    { label: 'Reminders', cols: 'Title, Type, Date, Details',                                  icon: Bell },
                  ].map(f => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label} className="p-3 rounded-xl border bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={13} className="text-primary" />
                          <span className="font-bold text-foreground">{f.label}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{f.cols}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  💡 Tip: Export first to get a correctly formatted template, then modify and re-import.
                </p>
              </CardContent>
            </Card>

            {/* Preview */}
            {preview && (
              <Card className="premium-card border-primary/30">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-primary" />
                    Preview — {preview.rows.length} sample rows detected as
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-black ml-1 capitalize">
                      {preview.type}
                    </Badge>
                  </CardTitle>
                  <button onClick={() => { setPreview(null); importRowsRef.current = null; }}
                    className="p-1 rounded-lg hover:bg-muted transition-colors">
                    <X size={15} className="text-muted-foreground" />
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          {preview.headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className="border-t hover:bg-muted/20">
                            {preview.headers.map(h => (
                              <td key={h} className="px-3 py-2 text-foreground truncate max-w-[150px]">{row[h] ?? '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {preview.type === 'unknown' ? (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle size={15} />
                      Column headers not recognised. Export data first to get the correct template.
                    </div>
                  ) : (
                    <Button
                      className="mt-4 w-full gap-2 bg-primary text-primary-foreground"
                      onClick={confirmImport}
                      disabled={importing}
                    >
                      {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      Confirm Import ({importRowsRef.current?.rows?.length ?? 0} rows)
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Result */}
            {importStatus?.done && (
              <Card className={cn('premium-card border', importStatus.errors.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5')}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    {importStatus.errors.length === 0
                      ? <CheckCircle2 size={20} className="text-emerald-500" />
                      : <AlertTriangle size={20} className="text-amber-500" />}
                    <p className="font-bold text-foreground">
                      {importStatus.rows} record{importStatus.rows !== 1 ? 's' : ''} imported successfully
                      {importStatus.errors.length > 0 && `, ${importStatus.errors.length} skipped`}
                    </p>
                  </div>
                  {importStatus.errors.length > 0 && (
                    <div className="space-y-1">
                      {importStatus.errors.slice(0, 5).map((e, i) => (
                        <p key={i} className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">{e}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
