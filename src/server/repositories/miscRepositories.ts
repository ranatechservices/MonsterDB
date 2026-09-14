import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface SubscriptionRecord {
  id: string;
  user_id?: string;
  org_id?: string;
  target_name: string;
  plan: 'Individual Vital' | 'Family Shield 360' | 'Corporate Enterprise Care' | 'Institutional Hospital AI Suite';
  status: 'Active' | 'Expiring' | 'Grace Period' | 'Cancelled';
  amount: number;
  billing_cycle: 'Monthly' | 'Annual';
  renewal_date: string;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id?: string;
  title: string;
  body: string;
  type: 'general' | 'emergency' | 'advisory' | 'system';
  severity: 'info' | 'warning' | 'urgent';
  read: boolean;
  created_at: string;
}

export interface SupportTicketRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  category: 'Billing' | 'ABDM Linkage' | 'Report Analysis' | 'Video Call Issue' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  messages: Array<{
    sender: 'user' | 'admin' | 'support';
    text: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessageRecord {
  id: string;
  user_id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageUrl?: string;
  feedback?: 'like' | 'dislike';
  suggestedAction?: 'book_appointment' | 'check_medicines' | 'log_vitals' | 'emergency_sos';
  created_at: string;
}

export class SubscriptionRepository {
  async list(): Promise<SubscriptionRecord[]> {
    return unifiedStore.getTable<SubscriptionRecord>('subscriptions');
  }

  async findByUserId(userId: string): Promise<SubscriptionRecord | null> {
    return unifiedStore.getTable<SubscriptionRecord>('subscriptions').find(s => s.user_id === userId) || null;
  }

  async create(data: Partial<SubscriptionRecord> & { target_name: string; plan: SubscriptionRecord['plan'] }): Promise<SubscriptionRecord> {
    const now = new Date().toISOString();
    const sub: SubscriptionRecord = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: data.user_id,
      org_id: data.org_id,
      target_name: data.target_name,
      plan: data.plan,
      status: data.status || 'Active',
      amount: data.amount || 0,
      billing_cycle: data.billing_cycle || 'Monthly',
      renewal_date: data.renewal_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: now
    };
    const list = unifiedStore.getTable<SubscriptionRecord>('subscriptions');
    list.unshift(sub);
    unifiedStore.updateTable('subscriptions', list);
    return sub;
  }
}

export class NotificationRepository {
  async listByUserId(userId: string): Promise<NotificationRecord[]> {
    return unifiedStore.getTable<NotificationRecord>('notifications')
      .filter(n => !n.user_id || n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async create(data: Omit<NotificationRecord, 'id' | 'created_at'>): Promise<NotificationRecord> {
    const notif: NotificationRecord = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...data,
      created_at: new Date().toISOString()
    };
    const list = unifiedStore.getTable<NotificationRecord>('notifications');
    list.unshift(notif);
    unifiedStore.updateTable('notifications', list);
    return notif;
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const list = unifiedStore.getTable<NotificationRecord>('notifications');
    const item = list.find(n => n.id === id && (!n.user_id || n.user_id === userId));
    if (item) {
      item.read = true;
      unifiedStore.updateTable('notifications', list);
      return true;
    }
    return false;
  }
}

export class SupportTicketRepository {
  async listByUserId(userId?: string): Promise<SupportTicketRecord[]> {
    const list = unifiedStore.getTable<SupportTicketRecord>('support_tickets');
    if (userId) return list.filter(t => t.user_id === userId);
    return list;
  }

  async findById(id: string): Promise<SupportTicketRecord | null> {
    return unifiedStore.getTable<SupportTicketRecord>('support_tickets').find(t => t.id === id) || null;
  }

  async create(data: Partial<SupportTicketRecord> & { user_id: string; user_name: string; user_email: string; subject: string }): Promise<SupportTicketRecord> {
    const now = new Date().toISOString();
    const ticket: SupportTicketRecord = {
      id: 'tkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      subject: data.subject,
      category: data.category || 'General',
      priority: data.priority || 'Medium',
      status: data.status || 'Open',
      messages: data.messages || [],
      created_at: now,
      updated_at: now
    };
    const list = unifiedStore.getTable<SupportTicketRecord>('support_tickets');
    list.unshift(ticket);
    unifiedStore.updateTable('support_tickets', list);
    return ticket;
  }

  async addMessage(ticketId: string, message: { sender: 'user' | 'admin' | 'support'; text: string }): Promise<SupportTicketRecord | null> {
    const list = unifiedStore.getTable<SupportTicketRecord>('support_tickets');
    const t = list.find(x => x.id === ticketId);
    if (!t) return null;
    t.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    t.updated_at = new Date().toISOString();
    unifiedStore.updateTable('support_tickets', list);
    return t;
  }
}

export class ChatRepository {
  async listByUserId(userId: string): Promise<ChatMessageRecord[]> {
    return unifiedStore.getTable<ChatMessageRecord>('chat_messages')
      .filter(m => m.user_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async save(data: Omit<ChatMessageRecord, 'id' | 'created_at'> & { id?: string }): Promise<ChatMessageRecord> {
    const now = new Date().toISOString();
    const msg: ChatMessageRecord = {
      id: data.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: data.user_id,
      sender: data.sender,
      text: data.text,
      timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: data.imageUrl,
      feedback: data.feedback,
      suggestedAction: data.suggestedAction,
      created_at: now
    };
    const list = unifiedStore.getTable<ChatMessageRecord>('chat_messages');
    list.push(msg);
    unifiedStore.updateTable('chat_messages', list);
    return msg;
  }

  async clear(userId: string): Promise<void> {
    const list = unifiedStore.getTable<ChatMessageRecord>('chat_messages').filter(m => m.user_id !== userId);
    unifiedStore.updateTable('chat_messages', list);
  }

  async updateFeedback(id: string, userId: string, feedback?: 'like' | 'dislike'): Promise<boolean> {
    const list = unifiedStore.getTable<ChatMessageRecord>('chat_messages');
    const msg = list.find(m => m.id === id && m.user_id === userId);
    if (!msg) return false;
    msg.feedback = feedback;
    unifiedStore.updateTable('chat_messages', list);
    return true;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
export const notificationRepository = new NotificationRepository();
export const supportTicketRepository = new SupportTicketRepository();
export const chatRepository = new ChatRepository();
