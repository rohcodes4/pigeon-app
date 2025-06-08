
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckSquare, Plus, Clock, Bell, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const ActionCenter = () => {
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Review the smart contract audit report",
      completed: false,
      source: "Crypto Traders Elite",
      priority: "high",
      platform: "telegram",
      dueDate: "Tomorrow",
    },
    {
      id: 2,
      title: "Schedule team meeting for Q1 planning",
      completed: false,
      source: "Development Team",
      priority: "medium",
      platform: "discord",
      dueDate: "This week",
    },
    {
      id: 3,
      title: "Analyze market sentiment data",
      completed: false,
      source: "Alex Rodriguez",
      priority: "low",
      platform: "telegram",
      dueDate: "Next week",
    },
    {
      id: 4,
      title: "Prepare monthly report for stakeholders",
      completed: false,
      source: "Marketing Squad",
      priority: "high",
      platform: "discord",
      dueDate: "Friday",
    },
    {
      id: 5,
      title: "Update website content",
      completed: true,
      source: "Marketing Squad",
      priority: "medium",
      platform: "discord",
      dueDate: "Done",
    },
    {
      id: 6,
      title: "Follow up with design team on new mockups",
      completed: true,
      source: "Development Team",
      priority: "medium",
      platform: "discord",
      dueDate: "Done",
    },
  ]);

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const newTaskObj = {
      id: tasks.length + 1,
      title: newTask,
      completed: false,
      source: "Manual Entry",
      priority: "medium",
      platform: "manual",
      dueDate: "Not set",
    };
    
    setTasks([newTaskObj, ...tasks]);
    setNewTask("");
    toast({
      title: "Task added",
      description: "New task has been added to your list",
    });
  };

  const toggleTaskComplete = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast({
      title: "Task removed",
      description: "Task has been deleted from your list",
    });
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Action Center
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {activeTasks.length} active tasks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new task */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-task" className="sr-only">New Task</Label>
            <Input
              id="new-task"
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
          </div>
          <Button onClick={addTask} disabled={!newTask.trim()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Active ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center justify-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {activeTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No active tasks right now</p>
                    <p className="text-sm text-gray-400">Tasks from your chats will appear here</p>
                  </div>
                ) : (
                  activeTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-[#ffffff10]"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskComplete(task.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{task.title}</p>
                          <Badge variant="outline" className={
                            task.priority === "high" ? "text-red-600" :
                            task.priority === "medium" ? "text-amber-600" :
                            "text-green-600"
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {task.source}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueDate}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No completed tasks</p>
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 text-gray-500"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskComplete(task.id)}
                      />
                      <div className="flex-1">
                        <p className="line-through font-medium">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {task.source}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueDate}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
