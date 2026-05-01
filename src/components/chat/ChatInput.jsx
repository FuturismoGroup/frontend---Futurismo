import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatInput = ({ message, setMessage, onSendMessage, onTyping }) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        onTyping?.(false);
        onSendMessage(e);
      }
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (newValue.length > 0) {
      onTyping?.(true);
    } else {
      onTyping?.(false);
    }
  };

  return (
    <div className="relative bg-white border-t border-slate-200">
      <form onSubmit={onSendMessage} className="px-4 py-3">
        <div className={`flex items-end gap-2 bg-slate-50 rounded-2xl px-4 py-2 transition-all duration-200 ${
          isFocused ? 'ring-2 ring-blue-500 ring-opacity-50 bg-white shadow-sm' : ''
        }`}>
          {/* Campo de texto */}
          <div className="flex-1 min-w-0">
            <textarea
              value={message}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onTyping?.(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.typeMessage')}
              rows={1}
              className="w-full bg-transparent resize-none focus:outline-none text-slate-700 placeholder-slate-400 py-1.5 text-[15px] leading-relaxed max-h-32"
              style={{
                minHeight: '24px',
                height: 'auto'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>

          {/* Botón de enviar */}
          {message.trim() && (
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              aria-label={t('chat.sendMessage')}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Indicador de escritura */}
        <div className="flex items-center justify-between px-2 mt-1.5">
          <p className="text-[10px] text-slate-400 font-medium">
            {t('chat.enterToSend')}
          </p>
          {message.length > 0 && (
            <span className={`text-[10px] font-medium transition-colors ${
              message.length > 500 ? 'text-amber-500' : 'text-slate-400'
            }`}>
              {message.length}/1000
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

ChatInput.propTypes = {
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onTyping: PropTypes.func
};

export default ChatInput;
