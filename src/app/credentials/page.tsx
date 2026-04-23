"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Search,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function CredentialsPage() {
  const { data, addCredential, deleteCredential, savingState } = useApp();
  const { toast } = useToast();
  const [searchTerm,        setSearchTerm]        = useState('');
  const [visiblePasswords,  setVisiblePasswords]  = useState<Record<string, boolean>>({});
  const [isAddOpen,         setIsAddOpen]         = useState(false);
  const [deletingId,        setDeletingId]        = useState<string | null>(null);

  const [newCred, setNewCred] = useState({
    clientId: '',
    type:     'WordPress Admin' as 'cPanel' | 'Hosting' | 'Domain Registrar' | 'WordPress Admin' | 'Other',
    username: '',
    password: '',
    url:      ''
  });

  const toggleVisibility = (id: string) =>
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Password copied to clipboard.' });
  };

  // Passwords are already decoded server-side by /api/data before reaching the client.
  // No additional decode needed — use cred.password directly.

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addCredential(newCred);
    setIsAddOpen(false);
    setNewCred({ clientId: '', type: 'WordPress Admin', username: '', password: '', url: '' });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteCredential(id);
    setDeletingId(null);
  };

  const filteredCreds = data.credentials.filter(c => {
    const client = data.clients.find(cl => cl.id === c.clientId);
    return `${client?.businessName} ${c.type} ${c.username}`.toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  const typeColors: Record<string, string> = {
    'cPanel':            'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'Hosting':           'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'Domain Registrar':  'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'WordPress Admin':   'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    'Other':             'bg-muted text-muted-foreground border-border',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:items-center justify-between sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credentials Vault</h1>
            <p className="text-muted-foreground mt-1">
              Secure storage for hosting, cPanel, and CMS login details.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg premium-button bg-primary text-primary-foreground">
                <Plus size={18} /> Store Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Secure Credential Storage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Client <span className="text-destructive">*</span></Label>
                  <Select onValueChange={v => setNewCred({...newCred, clientId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                    <SelectContent>
                      {data.clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newCred.type}
                    onValueChange={v => setNewCred({...newCred, type: v as typeof newCred.type})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cPanel">cPanel</SelectItem>
                      <SelectItem value="Hosting">Hosting</SelectItem>
                      <SelectItem value="Domain Registrar">Domain Registrar</SelectItem>
                      <SelectItem value="WordPress Admin">WordPress Admin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Username <span className="text-destructive">*</span></Label>
                    <Input id="user" required value={newCred.username}
                      onChange={e => setNewCred({...newCred, username: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass">Password <span className="text-destructive">*</span></Label>
                    <Input id="pass" type="password" required value={newCred.password}
                      onChange={e => setNewCred({...newCred, password: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Login URL</Label>
                  <Input id="url" type="url" placeholder="https://..."
                    value={newCred.url} onChange={e => setNewCred({...newCred, url: e.target.value})} />
                </div>
                <div className="p-3 bg-primary/5 rounded-xl flex gap-3 text-xs text-muted-foreground border">
                  <Lock size={15} className="text-primary flex-shrink-0 mt-0.5" />
                  Passwords are Base64-encoded before storage and decoded on display.
                </div>
                <Button type="submit" className="w-full"
                  disabled={!newCred.clientId || !newCred.username || !newCred.password}>
                  Securely Save
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Search + Shield ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <Input placeholder="Search credentials..."
              className="pl-10 bg-background/50"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
            <ShieldCheck size={17} />
            {filteredCreds.length} credential{filteredCreds.length !== 1 ? 's' : ''} stored
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreds.map((cred) => {
                const client    = data.clients.find(cl => cl.id === cred.clientId);
                const decoded   = cred.password;
                const isVisible = visiblePasswords[cred.id];
                const isDeleting = deletingId === cred.id && savingState === 'deleting';

                return (
                  <TableRow key={cred.id} className={cn('group transition-colors', isDeleting && 'opacity-50')}>
                    <TableCell>
                      <p className="font-semibold text-sm">{client?.businessName ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{client?.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] font-bold', typeColors[cred.type] ?? typeColors['Other'])}>
                        {cred.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cred.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded-lg select-none">
                          {isVisible ? decoded : '••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleVisibility(cred.id)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1 rounded">
                          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => copyToClipboard(decoded)} title="Copy Password">
                          <Copy size={14} />
                        </Button>
                        {cred.url && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="Open Login Page">
                            <a href={cred.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={14} />
                            </a>
                          </Button>
                        )}
                        {/* Delete — red while deleting */}
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => handleDelete(cred.id)}
                          disabled={isDeleting}
                          title="Delete credential"
                          className={cn(
                            'h-8 w-8 opacity-0 group-hover:opacity-100 transition-all',
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
              {filteredCreds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                    No credentials found. Store your first one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
