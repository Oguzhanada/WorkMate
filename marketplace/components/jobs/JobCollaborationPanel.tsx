'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload, RealtimePostgresDeletePayload } from '@supabase/realtime-js';
import styles from './job-collaboration-panel.module.css';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  message: string;
  message_type: 'text' | 'file' | 'system';
  file_url: string | null;
  file_name: string | null;
  visibility: string;
  created_at: string;
  sender?: { full_name: string | null; avatar_url: string | null } | null;
};

type Todo = {
  id: string;
  job_id: string;
  description: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  creator?: { full_name: string | null } | null;
  assignee?: { full_name: string | null } | null;
};

type Props = {
  jobId: string;
  currentUserId: string;
  otherUserName?: string;
};

export default function JobCollaborationPanel({ jobId, currentUserId, otherUserName }: Props) {
  const [activeTab, setActiveTab] = useState<'messages' | 'todos'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
  useEffect(() => {
    setLoadingMessages(true);
    fetch(`/api/jobs/${jobId}/messages`)
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages ?? []); setLoadingMessages(false); })
      .catch(() => { setError('Failed to load messages'); setLoadingMessages(false); });
  }, [jobId]);

  // Load todos
  useEffect(() => {
    setLoadingTodos(true);
    fetch(`/api/jobs/${jobId}/todos`)
      .then((r) => r.json())
      .then((d) => { setTodos(d.todos ?? []); setLoadingTodos(false); })
      .catch(() => { setError('Failed to load todos'); setLoadingTodos(false); });
  }, [jobId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (activeTab === 'messages') scrollToBottom();
  }, [messages, activeTab]);

  // Supabase Realtime
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`job-collab-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_messages', filter: `job_id=eq.${jobId}` },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_todos', filter: `job_id=eq.${jobId}` },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const newTodoRow = payload.new as Todo;
          setTodos((prev) => {
            if (prev.some((t) => t.id === newTodoRow.id)) return prev;
            return [...prev, newTodoRow];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'job_todos', filter: `job_id=eq.${jobId}` },
        (payload: RealtimePostgresUpdatePayload<Record<string, unknown>>) => {
          const updated = payload.new as Todo;
          setTodos((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'job_todos', filter: `job_id=eq.${jobId}` },
        (payload: RealtimePostgresDeletePayload<Record<string, unknown>>) => {
          const deleted = payload.old as { id: string };
          setTodos((prev) => prev.filter((t) => t.id !== deleted.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, message_type: 'text' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send'); return; }
      setNewMessage('');
      // Realtime will add the message, but also add locally for instant feedback
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, { ...data.message, sender: { full_name: 'You', avatar_url: null } }];
      });
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${jobId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(path, file, { upsert: false });

      if (uploadError) { setError('Upload failed: ' + uploadError.message); return; }

      const { data: urlData } = supabase.storage.from('job-files').getPublicUrl(path);

      const res = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Shared a file: ${file.name}`,
          message_type: 'file',
          file_url: urlData.publicUrl,
          file_name: file.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to attach file'); return; }

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, { ...data.message, sender: { full_name: 'You', avatar_url: null } }];
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) return;

    setAddingTodo(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add todo'); return; }
      setNewTodo('');
      setTodos((prev) => {
        if (prev.some((t) => t.id === data.todo.id)) return prev;
        return [...prev, data.todo];
      });
    } finally {
      setAddingTodo(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)));
    const res = await fetch(`/api/jobs/${jobId}/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    if (!res.ok) {
      // Revert
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: todo.completed } : t)));
      setError('Failed to update todo');
    }
  };

  const deleteTodo = async (todoId: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    const res = await fetch(`/api/jobs/${jobId}/todos/${todoId}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Failed to delete todo');
      // Reload
      fetch(`/api/jobs/${jobId}/todos`).then((r) => r.json()).then((d) => setTodos(d.todos ?? []));
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IE', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'messages' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages {messages.length > 0 ? `(${messages.length})` : ''}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'todos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          To-do List {todos.length > 0 ? `(${todos.filter((t) => !t.completed).length} open)` : ''}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {activeTab === 'messages' ? (
        <div className={styles.messagesPane}>
          <div className={styles.messageList}>
            {loadingMessages ? (
              <p className={styles.muted}>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className={styles.muted}>No messages yet. Start the conversation{otherUserName ? ` with ${otherUserName}` : ''}.</p>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}>
                    <div className={styles.bubble}>
                      {!isMine ? (
                        <span className={styles.senderName}>{msg.sender?.full_name ?? 'User'}</span>
                      ) : null}
                      {msg.message_type === 'file' && msg.file_url ? (
                        <a href={msg.file_url} target="_blank" rel="noreferrer" className={styles.fileLink}>
                          📎 {msg.file_name ?? 'File attachment'}
                        </a>
                      ) : (
                        <p className={styles.messageText}>{msg.message}</p>
                      )}
                      <span className={styles.timestamp}>{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className={styles.sendForm}>
            <input
              className={styles.messageInput}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || uploading}
              maxLength={4000}
            />
            <input
              ref={fileInputRef}
              type="file"
              className={styles.fileHidden}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
            <button
              type="button"
              className={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              title="Attach file"
            >
              {uploading ? '...' : '📎'}
            </button>
            <button type="submit" className={styles.sendBtn} disabled={sending || !newMessage.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.todosPane}>
          {loadingTodos ? (
            <p className={styles.muted}>Loading to-dos...</p>
          ) : (
            <ul className={styles.todoList}>
              {todos.length === 0 ? (
                <li className={styles.muted}>No to-do items yet.</li>
              ) : (
                todos.map((todo) => (
                  <li key={todo.id} className={`${styles.todoItem} ${todo.completed ? styles.todoDone : ''}`}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo)}
                      className={styles.todoCheck}
                    />
                    <span className={styles.todoDesc}>{todo.description}</span>
                    {todo.assignee?.full_name ? (
                      <span className={styles.todoAssignee}>{todo.assignee.full_name}</span>
                    ) : null}
                    {todo.due_date ? (
                      <span className={styles.todoDue}>{new Date(todo.due_date).toLocaleDateString('en-IE')}</span>
                    ) : null}
                    {todo.created_by === currentUserId ? (
                      <button
                        type="button"
                        className={styles.todoDelete}
                        onClick={() => deleteTodo(todo.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          )}

          <form onSubmit={addTodo} className={styles.addTodoForm}>
            <input
              className={styles.todoInput}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a to-do item..."
              disabled={addingTodo}
              maxLength={500}
            />
            <button type="submit" className={styles.sendBtn} disabled={addingTodo || !newTodo.trim()}>
              {addingTodo ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
