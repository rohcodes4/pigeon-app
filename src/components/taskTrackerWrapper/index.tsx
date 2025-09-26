import React, { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
};

// const testData = [

//     {
//         "id": "68cff3b03803025a01decc3c",
//         "chat_id": 5832109451,
//         "chat_title": "Raj",
//         "message_id": null,
//         "originator_id": null,
//         "originator_name": null,
//         "text": "Meet at 7pm today",
//         "type": "event",
//         "priority": "HIGH",
//         "status": "done",
//         "tags": [
//             "meeting"
//         ],
//         "due": "2025-09-21T20:01:00",
//         "due_date": "2025-09-21T20:01:00",
//         "source": "automatic_telegram",
//         "platform": "telegram",
//         "is_favorite": false,
//         "is_muted": false,
//         "category": "URGENT"
//     }
// ]

const TaskTrackerWrapper = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const location = useLocation();


//   console.log(location.pathname, "path");

  async function fetchTasks() {
    try {
      const response = await fetch(`${BACKEND_URL}/tasks`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setTasks(data);
    //   setTasks(testData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch tasks initially
  useEffect(() => {
    fetchTasks();
  }, [location.pathname]);

  // Check every 10 seconds for due tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();

      tasks.forEach((task) => {
        const dueTime = new Date(task.due); 

        const timeDiff = Math.abs(now.getTime() - dueTime.getTime());
        if (timeDiff <= 30000 && !notified.has(task.id)) {
          toast({
            title: `Reminder: ${task.text}`,
            description: `${task.chat_title || "Task"} is due now.`,
          });
          setNotified((prev) => new Set(prev).add(task.id));
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [tasks, notified]);

  return <>{children}</>;
};

export default TaskTrackerWrapper;
