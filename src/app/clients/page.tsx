"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  Briefcase,
  ExternalLink,
  Trash2,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ClientsPage() {
  const { data, addClient, deleteClient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newClient, setNewClient] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    notes: ''
  });

  const filteredClients = data.clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClient(newClient);
    setIsAddOpen(false);
    setNewClient({ name: '', businessName: '', email: '', phone: '', notes: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Client Directory</h1>
            <p className="text-muted-foreground mt-1">Manage all your client relationships and their core details.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus size={18} />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName" 
                    required 
                    value={newClient.businessName} 
                    onChange={e => setNewClient({...newClient, businessName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={newClient.name} 
                    onChange={e => setNewClient({...newClient, name: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      value={newClient.email} 
                      onChange={e => setNewClient({...newClient, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={newClient.phone} 
                      onChange={e => setNewClient({...newClient, phone: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea 
                    id="notes" 
                    value={newClient.notes} 
                    onChange={e => setNewClient({...newClient, notes: e.target.value})} 
                  />
                </div>
                <Button type="submit" className="w-full">Create Client Profile</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by name or business..." 
            className="pl-10 bg-white" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientSites = data.websites.filter(w => w.clientId === client.id);
            return (
              <Card key={client.id} className="border-none shadow-sm hover:shadow-md transition-shadow group relative">
                <CardContent className="p-6">
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteClient(client.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{client.businessName}</h3>
                      <p className="text-sm text-muted-foreground">{client.name}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail size={16} className="text-primary" />
                      {client.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone size={16} className="text-primary" />
                      {client.phone}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Linked Websites</p>
                    <div className="space-y-2">
                      {clientSites.map(site => (
                        <div key={site.id} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[150px]">{site.domainName}</span>
                          <Badge variant={site.paymentStatus === 'Paid' ? 'outline' : 'destructive'} className="text-[10px]">
                            {site.paymentStatus}
                          </Badge>
                        </div>
                      ))}
                      {clientSites.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No websites registered yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}