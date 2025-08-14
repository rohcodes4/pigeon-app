import React, { useState, useEffect } from "react";
import CustomCheckbox from "./CustomCheckbox";
import {
  FaDiscord,
  FaTelegramPlane,
  FaEdit,
  FaTrash,
  FaCheck,
  FaStar,
  FaBellSlash,
  FaArrowDown,
  FaArrowRight,
  FaExchangeAlt,
  FaPlus,
} from "react-icons/fa";
import { BellOff, CalendarCogIcon, Check, CheckCheck, ChevronDown, ChevronUp, MessageCircleMoreIcon, MoreHorizontal, Plus } from "lucide-react";
import todoIcon2 from "@/assets/images/todoIcon2.png";
import reminderIcon from "@/assets/images/reminderIcon.png";
import { FaCalendarAlt, FaTag, FaFlag } from "react-icons/fa";
import { Button } from "./ui/button";

const TASK_SECTIONS = [
    {
      title: "!! URGENT ACTIONS REQUIRED",
      status: "urgent",
      color: "red",
      textColor: "#F68989",
      bgColor: "#f03d3d12",
    },
    {
      title: "🔥 TODAY'S OPPORTUNITIES",
      status: "today",
      color: "yellow",
      textColor: "#FDD868",
      bgColor: "#FCBF0412",
    },
    {
      title: "🚀 THIS WEEK'S PREP",
      status: "week",
      color: "green",
      textColor: "#7CF6A6",
      bgColor: "#00ff0012",
    },
    {
        title: "🎉 DONE",
        status: "done",
        color: "blue",
        textColor: "#7DD3FC",
        bgColor: "#0ea5e912",
      },
  ];

const TIME_FILTERS = [
  "30 mins",
  "6 hr",
  "12 hr",
  "24 hr",
  "3 days",
  "1 week",
];

const platformIcon = (platform) =>
  platform === "discord" ? (
    <FaDiscord className="text-indigo-500" />
  ) : (
    <FaTelegramPlane className="text-blue-400" />
  );

const getUniqueTags = (tasks) => {
  const tagSet = new Set();
  tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
};

function formatDueText(due) {
    if (!due || due === "Done") return "Done";
    if (/Due in \d+/.test(due)) return due;
  
    const dueDate = new Date(due);
    if (isNaN(dueDate.getTime())) return due;
  
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Now";
  
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
  
    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}hr`;
    } else {
      return `${diffMins}min`;
    }
  }

const getUniqueChannels = (tasks) => {
  const channelSet = new Set();
  tasks.forEach((t) => channelSet.add(t.channel));
  return Array.from(channelSet);
};

const getUniqueServers = (tasks) => {
  const serverSet = new Set();
  tasks.forEach((t) => serverSet.add(t.server));
  return Array.from(serverSet);
};

const getDueDate = (due) => {
    if (!due || due === "Done") return null;
    const now = new Date();
    const match = due.match(/Due in (\d+)\s*(Days?|hr|mins?)/i);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    if (due.includes("Day")) {
      now.setDate(now.getDate() + value);
    } else if (due.includes("hr")) {
      now.setHours(now.getHours() + value);
    } else if (due.includes("min")) {
      now.setMinutes(now.getMinutes() + value);
    }
    return now;
  };

const isWithinTimeFilter = (due, filter) => {
if (filter === "all" || !due || due === "Done") return true;
const dueDate = getDueDate(due);
if (!dueDate) return false;
const now = new Date();
const diffMs = dueDate.getTime() - now.getTime();
const diffMins = diffMs / (1000 * 60);
switch (filter) {
    case "30 mins":
    return diffMins <= 30;
    case "6 hr":
    return diffMins <= 6 * 60;
    case "12 hr":
    return diffMins <= 12 * 60;
    case "24 hr":
    return diffMins <= 24 * 60;
    case "3 days":
    return diffMins <= 3 * 24 * 60;
    case "1 week":
    return diffMins <= 7 * 24 * 60;
    default:
    return true;
}
};

const TasksPanel = () => {
    const [tasks, setTasks] = useState([]);
    const [hoveredTask, setHoveredTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [collapsed, setCollapsed] = useState({
      urgent: false,
      today: true,
      week: true,
      done: true,
    });

    const [openModal, setOpenModal] = useState(null);
    const [openMoreMenu, setOpenMoreMenu] = useState(null);

    // Filters
    const [sourceFilter, setSourceFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

    // Create Task State
    const [newTask, setNewTask] = useState({
      name: "",
      tags: [],
      due: "",
      description: "",
      platform: "discord",
      channel: "",
      server: "",
      priority: "HIGH",
      status: "urgent",
      type: "todo",
    });
    const [newTagInput, setNewTagInput] = useState("");

    // Edit states
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({
      name: '',
      priority: 'HIGH',
      due: '',
    });

    const uniqueTags = getUniqueTags(tasks);
    const uniqueChannels = getUniqueChannels(tasks);
    const uniqueServers = getUniqueServers(tasks);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const getAuthHeaders = () => {
      const token = localStorage.getItem("access_token");
      return {
        'Authorization': `Bearer ${token}`
      };
    };
      
    async function fetchTasks(chat_id) {
      const params = new URLSearchParams();
      if (chat_id) params.append("chat_id", chat_id.toString());

      const response = await fetch(`${BACKEND_URL}/tasks?${params.toString()}`, {
        method: "GET",
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      return response.json();
    }

    async function toggleTask(taskId) {
      const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/toggle`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle task: ${response.status}`);
      }

      return response.json();
    }

    async function updateTask(taskId, updates) {
      if (!taskId) {
        throw new Error('Task ID is required for update');
      }
      
      const formData = new FormData();
      if (updates.text !== undefined) formData.append('text', updates.text);
      if (updates.priority !== undefined) formData.append('priority', updates.priority);
      if (updates.status !== undefined) formData.append('status', updates.status);
      if (updates.tags !== undefined) {
        formData.append('tags', Array.isArray(updates.tags) ? updates.tags.join(',') : updates.tags);
      }

      console.log('Updating task:', taskId, 'with data:', Object.fromEntries(formData));

      const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to update task: ${response.status} - ${errorText}`);
      }

      return response.json();
    }

    const loadTasks = async (chatId = null) => {
      try {
        setLoading(true);
        const fetchedTasks = await fetchTasks(chatId);
        
        console.log('Fetched tasks:', fetchedTasks);
        
        const transformedTasks = fetchedTasks.map(task => {
          const taskId = task._id || task.id;
          if (!taskId) {
            console.error('Task missing ID:', task);
          }
          
          return {
            id: taskId,
            name: task.text || 'Untitled Task',
            tags: task.tags || [],
            due: "3d",
            description: "",
            platform: "discord",
            channel: "GENERAL",
            server: "MAIN",
            priority: task.priority || "MEDIUM",
            status: task.status === "open" ? "urgent" : task.status,
            type: "todo",
            chat_id: task.chat_id,
            chat_title: task.chat_title,
            originator_id: task.originator_id,
            originator_name: task.originator_name,
            created_at: task.created_at
          };
        });
        
        console.log('Transformed tasks:', transformedTasks);
        setTasks(transformedTasks);
        setError(null);
      } catch (err) {
        setError('Failed to load tasks');
        console.error('Error loading tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    const markTaskDone = async (id) => {
      try {
        await toggleTask(id);
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
      } catch (error) {
        console.error('Error marking task as done:', error);
        setError('Failed to update task');
      }
    };

    async function createTask(taskData) {
      const formData = new FormData();
      formData.append('text', taskData.name);
      if (taskData.priority) formData.append('priority', taskData.priority);
      if (taskData.status) formData.append('status', taskData.status);
      if (taskData.tags && taskData.tags.length > 0) {
        formData.append('tags', taskData.tags.join(','));
      }
      if (taskData.chat_id) formData.append('chat_id', taskData.chat_id.toString());
      if (taskData.chat_title) formData.append('chat_title', taskData.chat_title);
      if (taskData.originator_id) formData.append('originator_id', taskData.originator_id.toString());
      if (taskData.originator_name) formData.append('originator_name', taskData.originator_name);

      const response = await fetch(`${BACKEND_URL}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status}`);
      }

      return response.json();
    }

    const toggleTaskSelection = (id) => {
      setSelectedTasks((prev) =>
        prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
      );
    };

    useEffect(() => {
      loadTasks();
    }, []);

    const deleteTaskHandler = async (id) => {
      if (!id) {
        console.error('Task ID is undefined');
        return;
      }
      
      try {
        console.log('Deleting task with ID:', id);
        await deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setOpenMoreMenu(null);
      } catch (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
      }
    };

    const handleEditSubmit = async () => {
      if (!editingTask || !editForm.name.trim()) return;
      
      try {
        await updateTask(editingTask, { text: editForm.name });
        
        const currentTask = tasks.find(t => t.id === editingTask);
        if (currentTask && editForm.priority !== currentTask.priority) {
          await updateTask(editingTask, { priority: editForm.priority });
        }
        
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask 
              ? { 
                  ...t, 
                  name: editForm.name,
                  priority: editForm.priority,
                  due: editForm.due
                } 
              : t
          )
        );
        
        setEditingTask(null);
        setEditForm({ name: '', priority: 'HIGH', due: '' });
      } catch (error) {
        console.error('Error updating task:', error);
        setError('Failed to update task');
      }
    };

    const handleCancelEdit = () => {
      setEditingTask(null);
      setEditForm({ name: '', priority: 'HIGH', due: '' });
    };

    async function deleteTask(taskId) {
      const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      return response.json();
    }

    const markAllDone = async (status) => {
      try {
        const tasksToUpdate = tasks.filter(t => t.status === status);
        await Promise.all(tasksToUpdate.map(task => toggleTask(task.id)));
        setTasks((prev) =>
          prev.map((t) => (t.status === status ? { ...t, status: "done" } : t))
        );
      } catch (error) {
        console.error('Error marking all tasks as done:', error);
        setError('Failed to update tasks');
      }
    };

    const changePriority = async (id, priority) => {
      if (!id) {
        console.error('Task ID is undefined for priority change');
        return;
      }
      
      try {
        console.log('Changing priority for task ID:', id, 'to:', priority);
        
        const result = await updateTask(id, { priority: priority });
        console.log('Priority change result:', result);
        
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, priority: priority } : t
          )
        );
      } catch (error) {
        console.error('Error changing priority:', error);
        setError('Failed to update priority');
      }
    };

    const moveTask = (id, newStatus) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    };

    const handleCreateTask = async () => {
      if (!newTask.name.trim()) return;
      
      try {
        const backendTask = await createTask({
          name: newTask.name,
          priority: newTask.priority,
          status: newTask.status === "urgent" ? "open" : newTask.status,
          tags: newTask.tags,
        });
        
        const transformedTask = {
          id: backendTask._id,
          name: backendTask.text,
          tags: backendTask.tags || [],
          due: newTask.due || "3d",
          description: newTask.description,
          platform: newTask.platform,
          channel: newTask.channel,
          server: newTask.server,
          priority: backendTask.priority,
          status: newTask.status,
          type: newTask.type,
        };
        
        setTasks((prev) => [transformedTask, ...prev]);
        setNewTask({
          name: "",
          tags: [],
          due: "",
          description: "",
          platform: "discord",
          channel: "",
          server: "",
          priority: "HIGH",
          status: "urgent",
          type: 'todo'
        });
        setNewTagInput("");
      } catch (error) {
        console.error('Error creating task:', error);
        setError('Failed to create task');
      }
    };

    const handleTagToggle = (tag) => {
      setNewTask((prev) => ({
        ...prev,
        tags: prev.tags.includes(tag)
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      }));
    };

    const handleAddNewTag = () => {
      if (
        newTagInput.trim() &&
        !uniqueTags.includes(newTagInput.trim()) &&
        !newTask.tags.includes(newTagInput.trim())
      ) {
        setNewTask((prev) => ({
          ...prev,
          tags: [...prev.tags, newTagInput.trim()],
        }));
        setNewTagInput("");
      }
    };

    const filteredTasks = tasks.filter((t) => {
      let sourceOk =
        sourceFilter === "all" ||
        (sourceFilter === "discord" && t.platform === "discord") ||
        (sourceFilter === "telegram" && t.platform === "telegram");
      let priorityOk =
        priorityFilter === "all" || t.priority === priorityFilter.toUpperCase();
      let timeOk = isWithinTimeFilter(t.due, timeFilter);
      return sourceOk && priorityOk && timeOk;
    });

    const totalTasks = filteredTasks.length;
    const sectionCounts = TASK_SECTIONS.map(
      (section) => filteredTasks.filter((t) => t.status === section.status).length
    );

    const selectAllTasks = () => {
      const allTaskIds = tasks.map((task) => task.id);
      setSelectedTasks(allTaskIds);
    };

    const markSelectedAsDone = async () => {
      try {
        await Promise.all(selectedTasks.map(id => toggleTask(id)));
        setTasks((prev) =>
          prev.map((task) =>
            selectedTasks.includes(task.id) ? { ...task, status: "done" } : task
          )
        );
        setSelectedTasks([]);
      } catch (error) {
        console.error('Error marking selected tasks as done:', error);
        setError('Failed to update selected tasks');
      }
    };

    if (loading) {
      return (
        <div className="bg-[#171717] text-white flex items-center justify-center h-[calc(100vh-121px)]">
          <div className="text-[#ffffff72]">Loading tasks...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[#171717] text-white flex items-center justify-center h-[calc(100vh-121px)]">
          <div className="text-red-400">{error}</div>
          <button 
            onClick={() => loadTasks()} 
            className="ml-4 bg-[#3474FF] px-4 py-2 rounded text-white"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="bg-[#171717] text-white flex flex-col h-[calc(100vh-121px)] overflow-y-scroll">
        <div className=" flex items-center justify-between gap-4 p-4 border-b border-gray-700">
          <div className="flex gap-4 items-center text-sm">
          <div className="border-r border-r-[#ffffff32] 2xl:pr-4 pr-0">
                  <p className="uppercase text-[#ffffff32] font-[200] mb-1">Source</p>
            <select
              className="bg-[#2d2d2d] text-xs rounded-[8px] pl-1 pr-3 py-3 mr-3 text-[#ffffff72]"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
            </select>
            </div>

            <div className="border-r border-r-[#ffffff32] 2xl:pr-4 pr-2 text-xs ">
            <p className="uppercase text-[#ffffff32] font-[200] mb-1">Priority</p>

            <div className="flex gap-1 ">

            {["HIGH", "MEDIUM", "LOW"].map((level) => {
        let selected =
        priorityFilter === level
          ? level === "HIGH"
            ? "bg-[#f03d3d12] text-[#F68989] border-[#f03d3d12]"
            : level === "MEDIUM"
            ? "bg-[#FCBF0412] text-[#FDD868] border-[#FCBF0412]"
            : "bg-[#00ff0012] text-[#7CF6A6] border-[#00ff0012]"
          : "bg-[#2d2d2d] text-[#ffffff32] ";
        return (
          <button
            key={level}
            className={`px-3 py-1 text-xs font-semibold border transition rounded-[8px] py-3 mr-1 ${selected}`}
            onClick={() =>
              setPriorityFilter(priorityFilter === level ? "all" : level)
            }
            type="button"
          >
            {level}
          </button>
        );
      })}
            </div>
            </div>
            <div>
            <p className="text-xs  uppercase text-[#ffffff32] font-[200] mb-1">Due</p>

            <select
              className="text-xs  bg-[#2d2d2d] rounded-[8px] pl-1 pr-3 py-3 mr-3 text-[#ffffff72]"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="all">All Times</option>
              {TIME_FILTERS.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
            </div>
          </div>
          <div className="text-xs 2xl:text-sm text-[#ffffff48] uppercase self-end flex gap-2 max-2xl:flex-col">
            <Button variant="ghost" onClick={selectAllTasks}>
              Select All
            </Button>
            <Button variant="default" className="text-xs 2xl:text-sm bg-[#3474FF60] hover:text-[#3474FF] text-[#B8D1Ff]"
            onClick={markSelectedAsDone}>
              Mark as Done
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {TASK_SECTIONS.map((section) => (
            <div key={section.status} className="py-2 border border-transparent border-b-[#ffffff09]">
              <div
                  className="flex items-center justify-between font-bold cursor-pointer"
                  style={{              
                    padding: "8px 16px"
                  }}
                  onClick={() => {
                      if (!collapsed[section.status]) {
                        setCollapsed(
                          TASK_SECTIONS.reduce((acc, s) => ({ ...acc, [s.status]: true }), {})
                        );
                      } else {
                        setCollapsed(
                          TASK_SECTIONS.reduce(
                            (acc, s) => ({
                              ...acc,
                              [s.status]: s.status !== section.status,
                            }),
                            {}
                          )
                        );
                      }
                    }}
              >
                <div className="flex items-center gap-2">
                  {collapsed[section.status] ? (
                    <ChevronDown />
                  ) : (
                    <ChevronUp />
                  )}
                  <span  className="font-[400]" style={{
                    color: section.textColor,
                    background: section.bgColor,
                    borderRadius: 8,
                    padding: "4px 10px"
                  }}>
                  {section.title} ({filteredTasks.filter((t) => t.status === section.status).length})
                  </span>
                </div>
                {section.status !== "done" && (
                  <button
                    className="text-xs text-[#ffffff48] hover:text-[#ffffff] rounded px-2 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllDone(section.status);
                    }}
                  >
                      <CheckCheck className="w-4 h-4"/>
                  </button>
                )}
              </div>
              {!collapsed[section.status] && (
                <div className="space-y-2 ">
                  {filteredTasks.filter((t) => t.status === section.status).length === 0 && (
                    <div className="text-gray-500 text-sm">No tasks</div>
                  )}
                  {filteredTasks
                    .filter((t) => t.status === section.status)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="relative flex gap-5 items-center hover:bg-[#212121] rounded-[16px] p-3 hover:bg-[#2A2D36] transition group"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        <CustomCheckbox
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                        />
                        <div className="flex-1 grow flex flex-col">
                          {editingTask === task.id ? (
                            <div className="flex flex-col gap-2 p-2 bg-[#2A2D36] rounded-[8px]">
                              <input
                                className="bg-[#1a1a1a] text-white px-3 py-2 rounded text-sm"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Task name"
                              />
                              
                              <div className="flex gap-2">
                                <select
                                  className="bg-[#1a1a1a] text-white px-2 py-1 rounded text-xs flex-1"
                                  value={editForm.priority}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                                >
                                  <option value="HIGH">HIGH</option>
                                  <option value="MEDIUM">MEDIUM</option>
                                  <option value="LOW">LOW</option>
                                </select>
                                
                                <input
                                  type="datetime-local"
                                  className="bg-[#1a1a1a] text-white px-2 py-1 rounded text-xs flex-1"
                                  value={editForm.due}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, due: e.target.value }))}
                                />
                              </div>
                              
                              <div className="flex gap-2 justify-end">
                                <button
                                  className="px-3 py-1 bg-[#3474FF] text-white rounded text-xs hover:bg-[#2563EB]"
                                  onClick={handleEditSubmit}
                                >
                                  Save
                                </button>
                                <button
                                  className="px-3 py-1 bg-[#6B7280] text-white rounded text-xs hover:bg-[#4B5563]"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2 items-center mb-2">
                                <span className="h-6 flex-shrink-0 flex gap-1 items-center bg-[#fafafa10] text-[#84AFFF] px-2 py-1 rounded-[6px]">
                                  <img className="h-4 w-4" src={task.type=="todo"?todoIcon2:reminderIcon}/>
                                  {task.type=="todo"?"To-do":"Reminder"}
                                </span>
                                <span className="h-6 flex-shrink-0 flex gap-1 items-center bg-[#fafafa10] text-[#ffffff72] px-2 py-1 rounded-[6px]">
                                  <CalendarCogIcon className="w-4 h-4"/>
                                  {formatDueText(task.due)}
                                </span>
                                <span className="text-[#ffffff72]">{task.name}</span>
                              </div>
                              <div className={`text-xs text-white flex gap-2 items-center mb-1 w-max rounded-[4px] px-2 py-0.5 ${task.platform=="telegram"?"bg-[#3474ff]":"bg-[#7B5CFA]"}`}>
                                <div className="">{task.platform==="telegram"?<FaTelegramPlane/>:<FaDiscord/>}</div>
                                <span>{task.channel}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="self-start">
                        {task.priority && (
      <span
        className={`
          text-xs rounded-[6px] px-2.5 py-1.5 font-semibold
          ${
            task.priority === "HIGH"
              ? "bg-[#f03d3d12] text-[#F68989]"
              : task.priority === "MEDIUM"
              ? "bg-[#FCBF0412] text-[#FDD868]"
              : task.priority === "LOW"
              ? "bg-[#00ff0012] text-[#7CF6A6]"
              : "bg-[#353945] text-[#A5B4FC]"
          }
        `}
      >
        {task.priority}
      </span>
    )}
                          </div>
                        <div
                          className={`rounded-[8px] bg-[#242429] absolute right-4 -top-4 flex gap-0 ml-4 opacity-0 group-hover:opacity-100 transition ${
                            hoveredTask === task.id ? "opacity-100" : ""
                          }`}
                        >
                          <button title="Mark as Done"
                          className="hover:text-[#84afff] border border-[#ffffff03] p-2"
                          onClick={()=>markTaskDone(task.id)}
                          >
                            <Check  className="h-4 w-4"/>
                          </button>
                          <button title="Mute"
                          className="hover:text-[#84afff] border border-[#ffffff03] p-2">
                          <BellOff className="h-4 w-4"/>
                          </button>
                          <button title="chat"
                          className="hover:text-[#84afff] border border-[#ffffff03] p-2">
                          <MessageCircleMoreIcon className="h-4 w-4"/>
                          </button>
                          <button
    title="more"
    className="relative hover:text-[#84afff] border border-[#ffffff03] p-2"
    onClick={(e) => {
      e.stopPropagation();
      setOpenMoreMenu(openMoreMenu === task.id ? null : task.id);
    }}
  >
    <MoreHorizontal className="h-4 w-4" />
  </button>
                          {openMoreMenu === task.id && (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpenMoreMenu(null)}
        style={{ background: "transparent" }}
      />
  <div
    className="absolute z-50 min-w-[180px] bg-[#111111] rounded-[10px] shadow-lg p-2 flex flex-col gap-1"
    style={{
      right: '-0',
      top: '36px',
    }}
  >
    <button
      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[#ffffff72] hover:text-[#ffffff] hover:bg-[#23262F]"
      onClick={() => {
        setEditingTask(task.id);
        setEditForm({
          name: task.name,
          priority: task.priority,
          due: task.due || '',
        });
        setOpenMoreMenu(null);
      }}
    >
      <FaEdit className="" /> Edit Task
    </button>
    <button
      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[#ffffff72] hover:text-[#ffffff] hover:bg-[#23262F]"
      onClick={() => {
        const newPriority = task.priority === "HIGH" ? "MEDIUM" : task.priority === "MEDIUM" ? "LOW" : "HIGH";
        changePriority(task.id, newPriority);
        setOpenMoreMenu(null);
      }}
    >
      <FaFlag className="" /> Change Priority
    </button>
    <button
      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[#ffffff72] hover:text-[#ffffff] hover:bg-[#23262F]"
      onClick={() => {
        setOpenMoreMenu(null);
      }}
    >
      <FaStar className="" /> Save to Favorites
    </button>
    <button
      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-red-400 hover:bg-[#23262F]"
      onClick={() => {
        deleteTaskHandler(task.id);
        setOpenMoreMenu(null);
      }}
    >
      <FaTrash /> Delete Task
    </button>
  </div>
    </>
  )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 flex flex-col gap-2">
    <div className="flex gap-2 items-center bg-[#212121] p-2 rounded-[8px]">
      <input
        className="flex-1 bg-[#212121] rounded-[10px] px-3 py-2 text-white"
        placeholder="Create a new Task / Reminder"
        value={newTask.name}
        onChange={(e) =>
          setNewTask((prev) => ({ ...prev, name: e.target.value }))
        }
      />

      <div className="relative">
        <button
          className="flex items-center gap-2 bg-[#fafafa10] rounded-[10px] px-3 py-1 text-sm text-[#ffffff]"
          onClick={() => setOpenModal(openModal === 'due' ? null : 'due')}
          type="button"
        >
          <FaCalendarAlt /> Due Date
        </button>
        {openModal === "due" && (
          <>
            <div
        className="fixed inset-0 z-40"
        onClick={() => setOpenModal(null)}
        style={{ background: "transparent" }}
      />
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#111111] rounded-[10px] p-4 min-w-[220px] shadow-lg">
            <div className=" mb-2 flex items-center gap-2">
              <FaCalendarAlt /> Select Due Date
            </div>
            <input
              type="datetime-local"
              className="bg-[#181A20] rounded px-2 py-1 text-xs text-gray-400 w-full mb-2"
              min={new Date().toISOString().slice(0, 16)}
              value={newTask.due}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, due: e.target.value }))
              }
            />
          </div>
          </>
        )}
      </div>

      <div className="relative">
        <button
          className={`flex items-center gap-2 bg-[#111111] rounded-[10px] px-3 py-1 text-xs text-white
              ${
                  newTask.priority === "HIGH"
        ? "bg-[#f03d3d12]"
        : newTask.priority === "MEDIUM"
        ? "bg-[#fcbf0412]"
        : "bg-[#00ff0010]"
              }    `}
          onClick={() => setOpenModal(openModal === 'priority' ? null : 'priority')}
                  type="button"
        >

  <span
    className={
      newTask.priority === "HIGH"
        ? "text-[#F68989]"
        : newTask.priority === "MEDIUM"
        ? "text-[#FDD868]"
        : "text-[#7CF6A6]"
    }
  >
    {newTask.priority}
  </span>      
  {openModal === "priority" ? <ChevronUp /> : <ChevronDown />}

  </button>
        {openModal === "priority" && (
          <>
            <div
        className="fixed inset-0 z-40"
        onClick={() => setOpenModal(null)}
        style={{ background: "transparent" }}
      />
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-[#111111] rounded-[10px] p-4 min-w-[180px] shadow-lg flex flex-col gap-2">
            <div className=" mb-2 flex items-center gap-2">
              <FaFlag /> Select Priority
            </div>
            {["HIGH", "MEDIUM", "LOW"].map((level) => (
              <button
                key={level}
                className={`w-full text-left px-3 py-2 rounded text-xs font-semibold mb-1 ${
                  newTask.priority === level
                    ? level === "HIGH"
                      ? "bg-[#f03d3d12] text-[#F68989]"
                      : level === "MEDIUM"
                      ? "bg-[#FCBF0412] text-[#FDD868]"
                      : "bg-[#00ff0012] text-[#7CF6A6]"
                    : "bg-[#353945] text-gray-300"
                }`}
                onClick={() => {
                  setNewTask((prev) => ({ ...prev, priority: level }));
                  setOpenModal(null);
                }}
                type="button"
              >
                {level}
              </button>
            ))}
          </div>
          </>
        )}
      </div>

      <button
        className=" rounded-full p-[3px] ml-2 border-2 border-[#fafafa60] hover:border-[#fafafa] text-[#fafafa60] hover:text-[#fafafa]"
  onClick={() => handleCreateTask()}
        title="Add Task"
      >
        <Plus className="font-[100]  w-5 h-5"/>
      </button>
    </div>
  </div>
       
        </div>
    );

};

export default TasksPanel;