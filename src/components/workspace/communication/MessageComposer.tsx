import { useState, useRef } from 'react';
import { SendMessageDTO } from '../../../types';

interface MessageComposerProps {
  onSendMessage?: (messageData: SendMessageDTO & { isPriority?: boolean }) => void;
  isSending: boolean;
  placeholder?: string;
  allowPriority?: boolean;
}

export function MessageComposer({ 
  onSendMessage, 
  isSending, 
  placeholder = "Type a message...",
  allowPriority = true 
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!onSendMessage) return;
    if (!message.trim() && attachments.length === 0) return;

    // For now, we'll handle file uploads as a simple array
    // In a real implementation, you'd upload files first and get URLs
    const messageData: SendMessageDTO & { isPriority?: boolean } = {
      content: message.trim(),
      attachments: attachments.map(file => ({
        filename: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary URL for demo
      })),
      isPriority: allowPriority ? isPriority : false,
    };

    onSendMessage(messageData);
    
    // Reset form
    setMessage('');
    setIsPriority(false);
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">📎</span>
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* File Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1"
          >
            <span>📎</span>
            <span>Attach</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Priority Toggle */}
          {allowPriority && (
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className={isPriority ? 'text-red-600 font-medium' : 'text-gray-600'}>
                🚨 Priority
              </span>
            </label>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || (!message.trim() && attachments.length === 0)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isPriority
              ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300'
          } disabled:cursor-not-allowed`}
        >
          {isSending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Send</span>
              {isPriority && <span>🚨</span>}
            </div>
          )}
        </button>
      </div>

      {/* Keyboard Shortcut Hint */}
      <p className="text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
        {isPriority && (
          <span className="text-red-500 font-medium ml-2">
            • Priority message will notify all members immediately
          </span>
        )}
      </p>
    </form>
  );
}