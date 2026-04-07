import React, { useState, useEffect } from 'react';
import { Megaphone, Reply, Send, Trash2, AlertCircle, X, MessageSquare } from 'lucide-react';
import { noticeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NoticeBoard = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    priority: 'medium',
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await noticeAPI.getNotices();
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await noticeAPI.createNotice(newNotice);
      setNewNotice({ title: '', message: '', targetRole: 'all', priority: 'medium' });
      setShowCreateForm(false);
      fetchNotices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyingTo || !replyMessage.trim()) return;

    setSubmitting(true);
    try {
      await noticeAPI.replyToNotice({
        noticeId: replyingTo,
        message: replyMessage,
      });
      setReplyMessage('');
      setReplyingTo(null);
      fetchNotices();
    } catch (error) {
      console.error('Error replying:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      await noticeAPI.deleteNotice(id);
      fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="text-primary-600" size={28} />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Notice Board</h2>
            <p className="text-sm text-gray-500">
              {user?.role === 'principal' 
                ? 'Send notices to staff and HODs' 
                : 'View notices from Principal and reply'}
            </p>
          </div>
        </div>
        {user?.role === 'principal' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={18} />
            Send Notice
          </button>
        )}
      </div>

      {/* Create Notice Form */}
      {showCreateForm && user?.role === 'principal' && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary-800">Create New Notice</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                className="input-field"
                placeholder="Enter notice title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={newNotice.message}
                onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="Enter your message..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                <select
                  value={newNotice.targetRole}
                  onChange={(e) => setNewNotice({ ...newNotice, targetRole: e.target.value })}
                  className="input-field"
                >
                  <option value="all">All</option>
                  <option value="hod">HOD Only</option>
                  <option value="staff">Staff Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newNotice.priority}
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Sending...' : 'Send Notice'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices List */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="card text-center py-12">
            <Megaphone className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No notices yet</p>
            {user?.role === 'principal' && (
              <p className="text-gray-400 text-sm mt-1">Click "Send Notice" to create one</p>
            )}
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="card">
              {/* Notice Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800">{notice.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{notice.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>From: {notice.sender?.name} ({notice.sender?.role})</span>
                    <span>To: {notice.targetRole === 'all' ? 'All' : notice.targetRole}</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {user?.role === 'principal' && notice.senderId === user?.id && (
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Replies Section */}
              {notice.replies && notice.replies.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Replies ({notice.replies.length})
                  </h4>
                  <div className="space-y-3">
                    {notice.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 text-sm">
                            {reply.user?.name} ({reply.user?.role})
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              {user?.role !== 'principal' && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  {replyingTo === notice.id ? (
                    <form onSubmit={handleReply} className="space-y-3">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="Type your reply..."
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn-primary text-sm py-2 px-4"
                        >
                          {submitting ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyMessage('');
                          }}
                          className="btn-secondary text-sm py-2 px-4"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(notice.id)}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Reply size={16} />
                      Reply to this notice
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;
