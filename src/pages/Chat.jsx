import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatContainer from '../components/chat/ChatContainer';

const Chat = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const guideName = searchParams.get('name');
  const isFromAgenda = searchParams.get('guide');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 5rem)' }}>
      <div className="flex-shrink-0 mb-3 sm:mb-4 lg:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">{t('chat.pageTitle')}</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2 break-words">
          {isFromAgenda && guideName
            ? t('chat.coordinationWith', { name: decodeURIComponent(guideName) })
            : t('chat.subtitle')}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatContainer />
      </div>
    </div>
  );
};

export default Chat;