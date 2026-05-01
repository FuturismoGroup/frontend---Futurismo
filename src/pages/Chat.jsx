import { useSearchParams } from 'react-router-dom';
import ChatContainer from '../components/chat/ChatContainer';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const guideName = searchParams.get('name');
  const isFromAgenda = searchParams.get('guide');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
        <p className="text-gray-600 mt-2">
          {isFromAgenda && guideName ?
            `Coordinación con ${decodeURIComponent(guideName)}` :
            'Comunícate con guías turísticos y clientes en tiempo real'
          }
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatContainer />
      </div>
    </div>
  );
};

export default Chat;