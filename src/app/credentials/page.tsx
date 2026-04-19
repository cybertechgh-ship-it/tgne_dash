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
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function CredentialsPage() {
  const { data, addCredential } = useApp();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newCred, setNewCred] = useState({
    clientId: '',
    type: 'WordPress Admin' as any,
    username: '',
    password: '',
    url: ''
  });

  const toggleVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Password copied to clipboard.",
    });
  };

  const decodePassword = (base64: string) => {
    try {
      return atob(base64);
    } catch (e) {
      return "Error decoding";
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addCredential(newCred);
    setIsAddOpen(false);
    setNewCred({ clientId: '', type: 'WordPress Admin', username: '', password: '', url: '' });
  };

  const filteredCreds = data.credentials.filter(c => {
    const client = data.clients.find(cl => cl.id === c.clientId);
    const searchStr = `${client?.businessName} ${c.type} ${c.username}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:items-center justify-between sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Credentials Vault</h1>
            <p className="text-muted-foreground mt-1">Secure storage for hosting, cPanel, and CMS login details.</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus size={18} />
                Store Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Secure Credential Storage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select onValueChange={v => setNewCred({...newCred, clientId: v})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select onValueChange={v => setNewCred({...newCred, type: v as any})} defaultValue="WordPress Admin">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <Label htmlFor="user">Username</Label>
                    <Input id="user" required value={newCred.username} onChange={e => setNewCred({...newCred, username: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass">Password</Label>
                    <Input id="pass" type="password" required value={newCred.password} onChange={e => setNewCred({...newCred, password: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Login URL</Label>
                  <Input id="url" type="url" placeholder="https://..." value={newCred.url} onChange={e => setNewCred({...newCred, url: e.target.value})} />
                </div>
                <div className="p-3 bg-primary/5 rounded-lg flex gap-3 text-xs text-muted-foreground">
                  <Lock size={16} className="text-primary shrink-0" />
                  Passwords are encrypted before local storage using browser-standard Base64 simulation.
                </div>
                <Button type="submit" className="w-full">Securely Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search credentials..." 
              className="pl-10 bg-white" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <ShieldCheck size={18} />
            Encrypted with simulated Base64
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Client / Business</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreds.map((cred) => {
                const client = data.clients.find(cl => cl.id === cred.clientId);
                const decoded = decodePassword(cred.password);
                const isVisible = visiblePasswords[cred.id];

                return (
                  <TableRow key={cred.id}>
                    <TableCell>
                      <div className="font-medium">{client?.businessName}</div>
                      <div className="text-xs text-muted-foreground">{client?.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cred.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cred.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-muted px-2 py-1 rounded">
                          {isVisible ? decoded : '••••••••••••'}
                        </span>
                        <button onClick={() => toggleVisibility(cred.id)} className="text-muted-foreground hover:text-primary">
                          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Button size="icon" variant="ghost" onClick={() => copyToClipboard(decoded)} title="Copy Password">
                          <Copy size={16} />
                        </Button>
                        {cred.url && (
                          <Button size="icon" variant="ghost" asChild title="Open Login Page">
                            <a href={cred.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCreds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No credentials found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}