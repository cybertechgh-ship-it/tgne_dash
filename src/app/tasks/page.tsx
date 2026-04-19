"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import { 
  CheckSquare, 
  Clock, 
  Plus, 
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Circle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { data, addTask, updateTask } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    clientId: '',
    description: '',
    status: 'Pending' as any,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    addTask(newTask);
    setIsAddOpen(false);
    setNewTask({ clientId: '', description: '', status: 'Pending', dueDate: new Date().toISOString().split('T')[0] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'In Progress': return <Clock className="text-accent" size={20} />;
      default: return <Circle className="text-muted-foreground" size={20} />;
    }
  };

  const activeTasks = data.tasks.filter(t => t.status !== 'Completed');
  const completedTasks = data.tasks.filter(t => t.status === 'Completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Track actions and deliverables per client.</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus size={18} />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTask} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select onValueChange={v => setNewTask({...newTask, clientId: v})} required>
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
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Due Date</Label>
                  <Input id="date" type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                </div>
                <Button type="submit" className="w-full">Add to List</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-white/50 border mb-4">
            <TabsTrigger value="active" className="gap-2">
              Active
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{activeTasks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeTasks.map((task) => {
              const client = data.clients.find(c => c.id === task.clientId);
              return (
                <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => updateTask(task.id, 'Completed')}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      <div>
                        <p className="font-semibold text-sm">{task.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{client?.businessName}</span>
                          <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                            <Calendar size={12} />
                            {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select 
                        defaultValue={task.status} 
                        onValueChange={(v) => updateTask(task.id, v as any)}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {activeTasks.length === 0 && (
              <div className="text-center py-20 bg-white/30 rounded-xl border border-dashed">
                <CheckSquare size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground font-medium">All caught up! No active tasks.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
             {completedTasks.map((task) => {
              const client = data.clients.find(c => c.id === task.clientId);
              return (
                <Card key={task.id} className="border-none shadow-sm opacity-60">
                  <CardContent className="p-4 flex items-center gap-4">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <div>
                      <p className="font-semibold text-sm line-through">{task.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Completed for {client?.businessName}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}