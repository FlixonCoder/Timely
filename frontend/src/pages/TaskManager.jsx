import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  BookOpen,
  Video,
  GraduationCap,
  Users,
  Briefcase,
  Zap,
  Trash2,
  Pencil,
  X,
  Menu,
  ChevronDown,
} from "lucide-react";
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// ===============================
// Categories
// ===============================
const CATEGORIES = [
  { name: "All", icon: Zap },
  { name: "Courses", icon: BookOpen },
  { name: "Webinar", icon: Video },
  { name: "College Tasks", icon: GraduationCap },
  { name: "Club Tasks", icon: Users },
  { name: "Ongoing Projects", icon: Briefcase },
  { name: "Upcoming Projects", icon: Circle },
];

// ===============================
// Helpers
// ===============================
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const nextPriority = (p) =>
  ({ low: "medium", medium: "high", high: "low" }[p] || "medium");

const nextStatus = (s) =>
({ pending: "on-going", "on-going": "completed", completed: "cancelled", cancelled: "pending" }[s] ||
  "pending");

const formatDate = (d) => {
  if (!d) return "Not defined";
  const dt = new Date(d);
  if (isNaN(dt)) return d; // if backend stores plain string
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Completed tasks should never be treated as overdue
const isOverdue = (deadline, status) => {
  if (status === "completed") return false;

  const d = new Date(deadline);
  if (isNaN(d)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const toLocalDateKey = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayDiffFromToday = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / MS_PER_DAY);
};

const getRelativeDeadlineLabel = (deadline) => {
  const diff = getDayDiffFromToday(deadline);
  if (diff === null) return "";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Overdue by 1 day";
  return `Overdue by ${Math.abs(diff)} days`;
};

// ===============================
// UI: Badges and small components
// ===============================
const StatusIcon = ({ status, size = 12 }) => {
  switch (status) {
    case "completed": return <CheckCircle2 size={size} />;
    case "cancelled": return <X size={size} />;
    case "on-going": return <Clock size={size} />;
    default: return <Circle size={size} />;
  }
};

const StatusBadge = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const styles = {
    pending:
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
    "on-going":
      "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40",
    completed:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    cancelled:
      "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40",
  };

  const OPTIONS = ["pending", "on-going", "completed", "cancelled"];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 capitalize ${styles[status] || styles.pending
          }`}
        title="Change status"
      >
        <StatusIcon status={status} />
        {status}
        <ChevronDown size={10} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(opt);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${status === opt
                ? "bg-slate-50 dark:bg-gray-700/50 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                }`}
            >
              <StatusIcon status={opt} size={14} />
              <span className="capitalize">{opt}</span>
              {status === opt && <CheckCircle2 size={10} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PriorityBadge = ({ priority, onCycle }) => {
  const colors = {
    high: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 ring-rose-500/20 dark:ring-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-900/40",
    medium:
      "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 ring-indigo-500/20 dark:ring-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40",
    low: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 ring-slate-500/20 dark:ring-slate-500/30 hover:bg-slate-100 dark:hover:bg-slate-700",
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCycle?.();
      }}
      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ring-1 ring-inset transition-colors ${colors[priority] || colors.medium
        }`}
      title="Cycle priority"
    >
      {priority}
    </button>
  );
};

const ProgressRing = ({
  radius = 34,
  stroke = 6,
  progress = 0,
  color = "#4f46e5",
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference -
    (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 transition-all duration-500 ease-out"
      >
        <circle
          stroke="#334155" // slate-700
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute text-xs font-bold text-slate-700 dark:text-slate-200">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// ===============================
// Modals
// ===============================
const ModalShell = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h3 id="modal-title" className="font-semibold text-slate-800 dark:text-white">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const AddTaskModal = ({ isOpen, onClose, onSubmit, categories }) => {
  const [form, setForm] = useState({
    title: "",
    category: categories[1]?.name || "Courses",
    priority: "medium",
    deadline: "",
    description: "",
    subtasks: [],
  });

  const [currentSubtask, setCurrentSubtask] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setForm({
        title: "",
        category: categories[1]?.name || "Courses",
        priority: "medium",
        deadline: "",
        description: "",
        subtasks: [],
      });
      setCurrentSubtask("");
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!currentSubtask.trim()) return;
    const newSubtask = { name: currentSubtask, status: "todo" };
    setForm((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask],
    }));
    setCurrentSubtask("");
  };

  const handleRemoveSubtask = (index) => {
    setForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit?.(form);
    if (ok) onClose?.();
  };

  return (
    <ModalShell title="Add New Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Title
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            type="text"
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            >
              {categories
                .filter((c) => c.name !== "All")
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: e.target.value }))
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Deadline
          </label>
          <input
            required
            type="date"
            value={form.deadline}
            onChange={(e) =>
              setForm((p) => ({ ...p, deadline: e.target.value }))
            }
            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Add details..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none dark:text-white"
          />
        </div>

        {/* Subtasks Section */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Subtasks
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentSubtask}
              onChange={(e) => setCurrentSubtask(e.target.value)}
              placeholder="Add a subtask..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {form.subtasks && form.subtasks.length > 0 && (
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {form.subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/50 rounded-lg border border-slate-100 dark:border-gray-700"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {subtask.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all active:scale-95"
          >
            Create Task
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const EditTaskModal = ({ isOpen, onClose, onSubmit, task, categories }) => {
  const [form, setForm] = useState(task || null);
  const [currentSubtask, setCurrentSubtask] = useState("");

  useEffect(() => {
    setForm(task || null);
    setCurrentSubtask("");
  }, [task]);

  if (!isOpen || !form) return null;

  const handleAddSubtask = () => {
    if (!currentSubtask.trim()) return;
    const newSubtask = { name: currentSubtask, status: "todo" };
    setForm((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask],
    }));
    setCurrentSubtask("");
  };

  const handleRemoveSubtask = (index) => {
    setForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit?.(form._id, {
      title: form.title,
      category: form.category,
      priority: form.priority,
      deadline: form.deadline,
      description: form.description,
      ...(form.status ? { status: form.status } : {}),
      subtasks: form.subtasks,
    });
    if (ok) onClose?.();
  };

  return (
    <ModalShell title="Edit Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Title
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            type="text"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            >
              {categories
                .filter((c) => c.name !== "All")
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: e.target.value }))
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Deadline
          </label>
          <input
            required
            type="date"
            value={form.deadline?.slice(0, 10) || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, deadline: e.target.value }))
            }
            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none dark:text-white"
          />
        </div>

        {/* Subtasks Section */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Subtasks
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentSubtask}
              onChange={(e) => setCurrentSubtask(e.target.value)}
              placeholder="Add a subtask..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {form.subtasks && form.subtasks.length > 0 && (
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {form.subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-700/50 rounded-lg border border-slate-100 dark:border-gray-700"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {subtask.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <ModalShell title="Delete Task" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to delete this task? This action cannot be
        undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </ModalShell>
  );
};

// ===============================
// Schedule row (Schedule view)
// ===============================
const ScheduleTaskRow = ({
  task,
  onCyclePriority,
  onChangeStatus,
  onEdit,
  onDelete,
  onToggleSubtask,
  hasStatus,
}) => {
  const overdue = isOverdue(task.deadline, task.status);
  const relativeLabel =
    (task.status === "completed" || task.status === "cancelled")
      ? ""
      : getRelativeDeadlineLabel(task.deadline);

  // Subtask Progress
  const subtasks = task.subtasks || [];
  const totalSub = subtasks.length;
  const completedSub = subtasks.filter(s => s.status === "done" || s.status === "completed").length; // handle inconsistencies if any
  const progressPercent = totalSub > 0 ? (completedSub / totalSub) * 100 : 0;

  return (
    <motion.div
      layout
      layoutId={task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group p-3 rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-sm transition-colors ${(task.status === "completed" || task.status === "cancelled") ? "cursor-default" : "cursor-pointer"
        }`}
      onClick={() => {
        if (task.status !== "completed" && task.status !== "cancelled") onEdit?.(task);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className={`text-sm font-semibold text-slate-800 dark:text-white truncate ${(task.status === "completed" || task.status === "cancelled") ? "line-through text-slate-400 dark:text-slate-500" : ""
                }`}
            >
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p
              className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2"
              title={task.description}
            >
              {task.description}
            </p>
          )}

          {/* Progress Bar (only if subtasks exist) */}
          {totalSub > 0 && (
            <div className="w-full max-w-[200px] mb-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Subtasks List inside the card */}
          {totalSub > 0 && (
            <div className="mt-2 space-y-1.5">
              {subtasks.map(st => (
                <div key={st._id} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (task.status !== 'completed' && task.status !== 'cancelled') {
                        onToggleSubtask?.(task._id, st._id, st.status)
                      }
                    }}
                    className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${st.status === 'done' || st.status === 'completed'
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-transparent border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                      } ${(task.status === 'completed' || task.status === 'cancelled') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={task.status === 'completed' || task.status === 'cancelled'}
                  >
                    {(st.status === 'done' || st.status === 'completed') && <CheckCircle2 size={10} />}
                  </button>
                  <span className={`text-xs ${st.status === 'done' || st.status === 'completed'
                    ? 'text-slate-400 dark:text-slate-500 line-through'
                    : 'text-slate-600 dark:text-slate-300'
                    } ${(task.status === 'completed' || task.status === 'cancelled') ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                    {st.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="px-1.5 py-0.5 rounded-full bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 text-slate-500 dark:text-slate-300">
              {task.category}
            </span>
          </div>
        </div>

        <div className={`flex flex-col items-end gap-1 shrink-0`}>
          <div className="flex items-center gap-2">
            {hasStatus && (
              <StatusBadge
                status={task.status || "pending"}
                onChange={(newStatus) =>
                  onChangeStatus?.(task._id, newStatus)
                }
              />
            )}
            <PriorityBadge
              priority={task.priority}
              onCycle={() => {
                if (task.status !== 'completed' && task.status !== 'cancelled') {
                  onCyclePriority?.(task._id, task.priority)
                }
              }}
            />
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-rose-500" : "text-slate-400 dark:text-slate-500"
              }`}
          >
            <Calendar size={12} />
            <span>{formatDate(task.deadline)}</span>
          </div>
          {relativeLabel && (
            <span
              className={`text-[11px] ${overdue ? "text-rose-500" : "text-slate-400 dark:text-slate-500"
                }`}
            >
              {relativeLabel}
            </span>
          )}

          {/* Hide Edit/Delete buttons if completed or cancelled */}
          {task.status !== "completed" && task.status !== "cancelled" && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
              <button
                className="transition-colors p-1 rounded-md text-slate-300 hover:text-slate-600 dark:hover:text-slate-200"
                title="Edit task"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(task);
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                className="transition-colors p-1 rounded-md text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
                title="Delete task"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(task._id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ===============================
// Page
// ===============================
// ===============================
// Page
// ===============================
const TaskManager = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // UI States
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [selectedDay, setSelectedDay] = useState(null); // 'YYYY-MM-DD' or null

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState({ open: false, task: null });
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const { token } = useAuth();
  const navigate = useNavigate();

  // hasStatus derived from tasks
  const hasStatus = useMemo(
    () => tasks.some((t) => Object.prototype.hasOwnProperty.call(t, "status")),
    [tasks]
  );

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadTasks();
  }, [token, navigate]);

  // Fetch tasks
  const loadTasks = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/tasks/get-tasks");
      const list = Array.isArray(data) ? data : data?.tasks || [];
      setTasks(list);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  // Add
  const handleAdd = async (payload) => {
    try {
      const { data } = await api.post("/api/tasks/add-task", payload);
      const created = data?.task || data;
      setTasks((prev) => [created, ...prev]);
      return true;
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to add task");
      return false;
    }
  };

  // Update
  const handleUpdate = async (id, patch) => {
    try {
      const { data } = await api.put(`/api/tasks/update-task/${id}`, patch);
      const updated = data?.task || data;
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      return true;
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to update task");
      return false;
    }
  };

  const handleCyclePriority = async (id, current) => {
    const priority = nextPriority(current);
    await handleUpdate(id, { priority });
  };

  // Cycle Status (now handled via dropdown)
  const handleStatusChange = async (id, status) => {
    if (!hasStatus) return;
    const ok = await handleUpdate(id, { status });
    if (ok) {
      if (status === 'completed') toast.success("Task moved to Completed section");
      if (status === 'cancelled') toast.success("Task moved to Cancelled section");
    }
  };

  // Delete (with confirm modal)
  const requestDelete = (id) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/tasks/delete-task/${deleteTargetId}`);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTargetId));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleteTargetId(null);
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (taskId, subtaskId, currentStatus) => {
    try {
      const newStatus = (currentStatus === 'done' || currentStatus === 'completed') ? 'todo' : 'done';
      const { data } = await api.put(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { status: newStatus });

      // Update local state with the updated task from backend
      // The backend returns { success: true, message: "...", subtask: {...}, task: {...}, user: {...} }
      const updatedTask = data.task;

      setTasks((prev) => prev.map(t => t._id === taskId ? updatedTask : t));

    } catch (e) {
      console.error(e);
      // alert(e?.response?.data?.message || "Failed to update subtask");
    }
  };

  // Edit
  const handleOpenEdit = (task) => setEditing({ open: true, task });
  const handleSaveEdit = async (id, patch) => {
    const ok = await handleUpdate(id, patch);
    return ok;
  };

  // Derived list (filters + sorting + day filter)
  const filteredTasks = useMemo(() => {
    let result = tasks.slice();

    if (selectedCategory !== "All") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    if (selectedDay) {
      result = result.filter((t) => {
        const key = toLocalDateKey(t.deadline);
        if (!key) return false;
        return key === selectedDay;
      });
    }

    result.sort((a, b) => {
      if (sortBy === "deadline") {
        const da = new Date(a.deadline);
        const db = new Date(b.deadline);
        const va = isNaN(da) ? Number.POSITIVE_INFINITY : da.getTime();
        const vb = isNaN(db) ? Number.POSITIVE_INFINITY : db.getTime();
        return va - vb;
      }
      if (sortBy === "priority") {
        const w = { high: 3, medium: 2, low: 1 };
        return (w[b.priority] || 0) - (w[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [tasks, selectedCategory, searchQuery, sortBy, selectedDay]);

  // Schedule groups for schedule view
  const scheduleGroups = useMemo(() => {
    const groups = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDate: [],
      completed: [], // completed section
      cancelled: [], // cancelled section
    };

    filteredTasks.forEach((task) => {
      if (task.status === "cancelled") {
        groups.cancelled.push(task);
        return;
      }
      // Completed tasks go into their own section, not overdue
      if (task.status === "completed") {
        groups.completed.push(task);
        return;
      }

      const diff = getDayDiffFromToday(task.deadline);
      if (diff === null) {
        groups.noDate.push(task);
      } else if (diff < 0) {
        groups.overdue.push(task);
      } else if (diff === 0) {
        groups.today.push(task);
      } else if (diff === 1) {
        groups.tomorrow.push(task);
      } else if (diff <= 7) {
        groups.thisWeek.push(task);
      } else {
        groups.later.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  // Stats
  const total = tasks.filter(t => t.status !== 'cancelled').length;
  const urgent = tasks.filter((t) => t.priority === "high").length;
  const completed = hasStatus
    ? tasks.filter((t) => t.status === "completed").length
    : 0;
  const progress = hasStatus
    ? total > 0
      ? (completed / total) * 100
      : 0
    : total > 0
      ? ((total - urgent) / total) * 100
      : 0;

  const scheduleStats = useMemo(() => {
    const todayTasks = [];
    const next7Tasks = [];
    const laterThisMonth = [];
    const upcoming = [];

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    tasks.forEach((t) => {
      // Exclude completed/cancelled tasks from "Upcoming/Due" counts
      if (t.status === "completed" || t.status === "cancelled") return;

      const diff = getDayDiffFromToday(t.deadline);
      if (diff === null) return;

      const d = new Date(t.deadline);
      if (!isNaN(d)) {
        if (diff === 0) todayTasks.push(t);
        if (diff > 0 && diff <= 7) next7Tasks.push(t);
        if (diff > 7 && d.getMonth() === month && d.getFullYear() === year) {
          laterThisMonth.push(t);
        }
      }

      if (diff >= 0) upcoming.push({ task: t, diff });
    });

    upcoming.sort((a, b) => a.diff - b.diff);
    const nextTask = upcoming[0]?.task || null;
    const closestDiff = upcoming[0]?.diff ?? null;

    return {
      todayCount: todayTasks.length,
      next7Count: next7Tasks.length,
      laterThisMonthCount: laterThisMonth.length,
      nextTask,
      closestDiff,
    };
  }, [tasks]);

  // Next 7 days strip data
  const daysStrip = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      const key = toLocalDateKey(d);

      const count = tasks.filter((t) => {
        if (!t.deadline) return false;
        const dt = new Date(t.deadline);
        if (isNaN(dt)) return false;
        dt.setHours(0, 0, 0, 0);
        return dt.getTime() === d.getTime();
      }).length;

      days.push({ date: d, key, count });
    }
    return days;
  }, [tasks]);

  const hasAnyFiltered = filteredTasks.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 font-sans pb-20 transition-colors duration-300">

      {/* Search & Sort Controls (Replaces Navbar) */}
      {/* Search & Sort Controls (Replaces Navbar) */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 transition-colors">
        <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center md:justify-center gap-4">

          {/* Left Side: Title */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 z-20">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white md:block">
              Task Manager
            </h1>
          </div>

          {/* Center: Controls */}
          <div className="flex w-full md:w-auto gap-3 items-center justify-center z-10">
            <div className="relative group flex-1 md:w-80">
              <Search
                className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm transition-all outline-none dark:text-white"
              />
            </div>

            <button
              onClick={() =>
                setSortBy((p) => (p === "deadline" ? "priority" : "deadline"))
              }
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm font-medium px-3 transition-all"
              title="Toggle sort"
            >
              <ArrowUpDown size={16} />
              <span className="hidden sm:inline">
                {sortBy === "deadline" ? "Deadline" : "Priority"}
              </span>
            </button>

            <button
              onClick={() => setAdding(true)}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all active:scale-95"
              title="Add task"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8">
        {/* Header cards (schedule-oriented) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Today */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Today
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {scheduleStats.todayCount} task
                {scheduleStats.todayCount !== 1 ? "s" : ""}
              </p>
              {scheduleStats.nextTask &&
                getDayDiffFromToday(scheduleStats.nextTask.deadline) === 0 && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Next:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {scheduleStats.nextTask.title}
                    </span>
                  </p>
                )}
            </div>
          </div>

          {/* Next 7 days */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Next 7 days
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {scheduleStats.next7Count} deadline
                {scheduleStats.next7Count !== 1 ? "s" : ""}
              </p>
              {scheduleStats.closestDiff !== null &&
                scheduleStats.closestDiff > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Closest in{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {scheduleStats.closestDiff} days
                    </span>
                  </p>
                )}
            </div>
          </div>

          {/* Progress / load */}
          {/* Progress / load */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between relative overflow-hidden transition-colors md:col-span-1">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                {hasStatus ? "Completion" : "Task load"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {hasStatus ? (
                  <>
                    Completed{" "}
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {completed}/{total || 0}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-rose-600">
                      {urgent}
                    </span>{" "}
                    high priority of{" "}
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {total || 0}
                    </span>
                  </>
                )}
              </p>
            </div>
            <ProgressRing radius={32} stroke={6} progress={progress} />
          </div>
        </div>

        {/* Next 7 days strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${selectedDay === null
              ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-sm"
              : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:text-indigo-600"
              }`}
          >
            All days
          </button>
          {daysStrip.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap flex items-center gap-2 transition-colors ${selectedDay === d.key
                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:text-indigo-600"
                }`}
            >
              <span className="font-semibold">
                {d.date.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span>{d.date.getDate()}</span>
              {d.count > 0 && (
                <span className="ml-1 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {d.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-hide mb-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border ${isActive
                  ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-lg shadow-slate-200 dark:shadow-none"
                  : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
              >
                <Icon size={14} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Error / Loading */}
        {err && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-sm">
            {err}
          </div>
        )}
        {loading && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-sm">
            Loading tasks...
          </div>
        )}

        {/* Content: schedule-only view */}
        {!loading &&
          (hasAnyFiltered ? (
            <div className="space-y-8">
              {/* Daily schedule heading */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {selectedDay
                    ? `Schedule for ${new Date(
                      selectedDay
                    ).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}`
                    : "Schedule"}
                </h2>
                {selectedDay && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing tasks due on this day
                  </p>
                )}
              </div>

              {[
                { key: "overdue", title: "Overdue", accent: "text-rose-600 dark:text-rose-400" },
                { key: "today", title: "Today", accent: "text-gray-800 dark:text-white" },
                { key: "tomorrow", title: "Tomorrow", accent: "text-gray-800 dark:text-white" },
                {
                  key: "thisWeek",
                  title: "This Week",
                  accent: "text-gray-800 dark:text-white",
                },
                { key: "later", title: "Later", accent: "text-gray-800 dark:text-white" },
                { key: "noDate", title: "No date", accent: "text-gray-500 dark:text-gray-400" },
                {
                  key: "completed",
                  title: "Completed",
                  accent: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  key: "cancelled",
                  title: "Cancelled",
                  accent: "text-rose-600 dark:text-rose-400",
                },
              ].map(({ key, title, accent }) => {
                const list = scheduleGroups[key];
                if (!list || list.length === 0) return null;

                // SPECIAL HANDLING FOR COMPLETED
                if (key === 'completed') {
                  return (
                    <section key={key} className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-6">
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-2 w-full text-left group"
                      >
                        <div className={`p-1 rounded-md transition-transform duration-300 ${showCompleted ? 'rotate-180' : ''}`}>
                          <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
                        </div>
                        <h3 className={`text-sm font-semibold ${accent}`}>
                          {title}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {list.length} task{list.length !== 1 ? "s" : ""}
                        </span>
                      </button>

                      <div
                        className={`grid transition-all duration-500 ease-in-out overflow-hidden ${showCompleted ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
                          }`}
                      >
                        <div className="min-h-0 space-y-2">
                          <AnimatePresence mode="popLayout">
                            {list.map((task) => (
                              <ScheduleTaskRow
                                key={task._id}
                                task={task}
                                hasStatus={hasStatus}
                                onCyclePriority={handleCyclePriority}
                                onChangeStatus={handleStatusChange}
                                onEdit={handleOpenEdit}
                                onDelete={requestDelete}
                                onToggleSubtask={handleToggleSubtask}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </section>
                  );
                }

                // SPECIAL HANDLING FOR CANCELLED
                if (key === 'cancelled') {
                  return (
                    <section key={key} className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-6">
                      <button
                        onClick={() => setShowCancelled(!showCancelled)}
                        className="flex items-center gap-2 w-full text-left group"
                      >
                        <div className={`p-1 rounded-md transition-transform duration-300 ${showCancelled ? 'rotate-180' : ''}`}>
                          <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
                        </div>
                        <h3 className={`text-sm font-semibold ${accent}`}>
                          {title}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {list.length} task{list.length !== 1 ? "s" : ""}
                        </span>
                      </button>

                      <div
                        className={`grid transition-all duration-500 ease-in-out overflow-hidden ${showCancelled ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
                          }`}
                      >
                        <div className="min-h-0 space-y-2">
                          <AnimatePresence mode="popLayout">
                            {list.map((task) => (
                              <ScheduleTaskRow
                                key={task._id}
                                task={task}
                                hasStatus={hasStatus}
                                onCyclePriority={handleCyclePriority}
                                onChangeStatus={handleStatusChange}
                                onEdit={handleOpenEdit}
                                onDelete={requestDelete}
                                onToggleSubtask={handleToggleSubtask}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </section>
                  );
                }

                // NORMAL SECTIONS
                return (
                  <section key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-semibold ${accent}`}>
                        {title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {list.length} task{list.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {list.map((task) => (
                          <ScheduleTaskRow
                            key={task._id}
                            task={task}
                            hasStatus={hasStatus}
                            onCyclePriority={handleCyclePriority}
                            onChangeStatus={handleStatusChange}
                            onEdit={handleOpenEdit}
                            onDelete={requestDelete}
                            onToggleSubtask={handleToggleSubtask}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-14 h-14 rounded-full mb-4">
                <Circle size={24} />
              </div>
              <p>No tasks match your filters.</p>
            </div>
          ))}
      </main>

      {/* Modals */}
      <AddTaskModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSubmit={handleAdd}
        categories={CATEGORIES}
      />
      <EditTaskModal
        isOpen={editing.open}
        onClose={() => setEditing({ open: false, task: null })}
        onSubmit={handleSaveEdit}
        task={editing.task}
        categories={CATEGORIES}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default TaskManager;