"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  CheckSquare,
  Clock,
  Plus,
  Calendar,
  Circle,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  const { data, addTask, updateTask, deleteTask, savingState } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    clientId: '',
    description: '',
    status: 'Pending' as 'Pending' | 'In Progress' | 'Completed',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.clientId || !newTask.description) return;
    addTask(newTask);
    setIsAddOpen(false);
    setNewTask({ clientId: '', description: '', status: 'Pending', dueDate: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteTask(id);
    setDeletingId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':  return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'In Progress': return <Clock className="text-amber-500" size={20} />;
      default:           return <Circle className="text-muted-foreground" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':   return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:            return 'bg-muted text-muted-foreground border-border';
    }
  };

  const activeTasks    = data.tasks.filter(t => t.status !== 'Completed');
  const completedTasks = data.tasks.filter(t => t.status === 'Completed');

  const TaskCard = ({ task, showDelete = true }: { task: typeof data.tasks[0]; showDelete?: boolean }) => {
    const client      = data.clients.find(c => c.id === task.clientId);
    const isDeleting  = deletingId === task.id && savingState === 'deleting';

    return (
      <Card className={cn(
        'group border shadow-sm hover:shadow-md transition-all duration-200',
        isDeleting && 'opacity-50 scale-[0.99]'
      )}>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => task.status !== 'Completed' && updateTask(task.id, 'Completed')}
              className={cn(
                "p-1 rounded-full transition-colors flex-shrink-0",
                task.status !== 'Completed' && "hover:bg-emerald-500/10"
              )}
              disabled={task.status === 'Completed'}
            >
              {getStatusIcon(task.status)}
            </button>

            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold text-sm", task.status === 'Completed' && 'line-through text-muted-foreground')}>
                {task.description}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {client && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{client.businessName}</span>
                )}
                {task.dueDate && (
                  <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <Calendar size={11} />
                    {task.dueDate}
                  </span>
                )}
                <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', getStatusBadge(task.status))}>
                  {task.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status dropdown — only for active tasks */}
            {task.status !== 'Completed' && (
              <Select
                value={task.status}
                onValueChange={(v) => updateTask(task.id, v as 'Pending' | 'In Progress' | 'Completed')}
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
            )}

            {/* Delete button */}
            {showDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(task.id)}
                disabled={isDeleting}
                className={cn(
                  'h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all',
                  isDeleting
                    ? 'opacity-100 bg-red-600 text-white hover:bg-red-700'
                    : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                )}
              >
                {isDeleting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Trash2 size={14} />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Track actions and deliverables per client.</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus size={18} />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTask} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Client <span className="text-destructive">*</span></Label>
                  <Select onValueChange={v => setNewTask({...newTask, clientId: v})}>
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
                  <Label htmlFor="desc">Description <span className="text-destructive">*</span></Label>
                  <Input
                    id="desc"
                    required
                    placeholder="e.g. Update homepage banner"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Due Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!newTask.clientId || !newTask.description}>
                  Add to List
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-muted/50 border mb-4 h-10 rounded-xl">
            <TabsTrigger value="active" className="gap-2 rounded-lg">
              Active
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{activeTasks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 rounded-lg">
              Completed
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{completedTasks.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeTasks.map(task => <TaskCard key={task.id} task={task} />)}
            {activeTasks.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <CheckSquare size={44} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground font-semibold">All caught up! No active tasks.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
            {completedTasks.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <CheckSquare size={44} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground font-semibold">No completed tasks yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
