import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationAPI } from '../api/notification.api';
import { messageAPI } from '../api/message.api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [unreadFriendIds, setUnreadFriendIds] = useState([]);
  const [unreadGroupIds, setUnreadGroupIds] = useState([]);

  const fetchChatUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const [countRes, listRes] = await Promise.all([
        messageAPI.unreadCount(),
        messageAPI.unreadList()
      ]);
      setChatUnreadCount(countRes.data.count || 0);
      setUnreadFriendIds(listRes.data.friendIds || []);
      setUnreadGroupIds(listRes.data.groupIds || []);
    } catch(err) {}
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.count()
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchChatUnreadCount();
  }, [fetchNotifications, fetchChatUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newNotification', (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on('friendEvent', () => {
      fetchNotifications();
    });

    socket.on('newMessage', () => {
      fetchChatUnreadCount();
    });

    return () => {
      socket.off('newNotification');
      socket.off('friendEvent');
      socket.off('newMessage');
    };
  }, [socket, fetchNotifications, fetchChatUnreadCount]);

  const markAsRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, chatUnreadCount, unreadFriendIds, unreadGroupIds, markAsRead, markAllRead, fetchNotifications, fetchChatUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
