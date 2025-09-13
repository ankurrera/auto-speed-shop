import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Send, ArrowLeft, MessageCircle, Clock, Users, Search } from 'lucide-react';

interface MockMessage {
  id: string;
  message: string;
  isFromAdmin: boolean;
  timestamp: string;
  userName: string;
}

interface MockConversation {
  userId: string;
  userName: string;
  userEmail: string;
  messages: MockMessage[];
  unreadCount: number;
  lastActivity: string;
}

interface MockChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}

// Mock data for demonstration
const mockConversations: MockConversation[] = [
  {
    userId: '1',
    userName: 'John Smith',
    userEmail: 'john.smith@email.com',
    lastActivity: '2 minutes ago',
    unreadCount: 3,
    messages: [
      {
        id: '1',
        message: 'Hi, I need help finding brake pads for my 2018 Honda Civic.',
        isFromAdmin: false,
        timestamp: '10:30 AM',
        userName: 'John Smith'
      },
      {
        id: '2',
        message: 'Hello John! I\'d be happy to help you find the right brake pads. Could you provide me with your VIN number for the most accurate match?',
        isFromAdmin: true,
        timestamp: '10:32 AM',
        userName: 'Admin'
      },
      {
        id: '3',
        message: 'Sure, my VIN is 1HGBH41JXMN109186',
        isFromAdmin: false,
        timestamp: '10:35 AM',
        userName: 'John Smith'
      },
      {
        id: '4',
        message: 'Perfect! Based on your VIN, I found the exact brake pads you need. I\'ll send you a link with compatible options.',
        isFromAdmin: true,
        timestamp: '10:37 AM',
        userName: 'Admin'
      }
    ]
  },
  {
    userId: '2',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.j@email.com',
    lastActivity: '1 hour ago',
    unreadCount: 1,
    messages: [
      {
        id: '5',
        message: 'Is the oil filter I ordered in stock? Order #12345',
        isFromAdmin: false,
        timestamp: '9:15 AM',
        userName: 'Sarah Johnson'
      },
      {
        id: '6',
        message: 'Let me check on your order status. Please give me a moment.',
        isFromAdmin: true,
        timestamp: '9:16 AM',
        userName: 'Admin'
      }
    ]
  },
  {
    userId: '3',
    userName: 'Mike Wilson',
    userEmail: 'mike.wilson@email.com',
    lastActivity: '3 hours ago',
    unreadCount: 0,
    messages: [
      {
        id: '7',
        message: 'Thanks for the help with my engine parts order!',
        isFromAdmin: false,
        timestamp: 'Yesterday',
        userName: 'Mike Wilson'
      },
      {
        id: '8',
        message: 'You\'re welcome! Feel free to reach out if you need anything else.',
        isFromAdmin: true,
        timestamp: 'Yesterday',
        userName: 'Admin'
      }
    ]
  }
];

const MockChatWindow = ({ isOpen, onClose, isLoggedIn = false }: MockChatWindowProps) => {
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate loading messages when component mounts
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      // Simulate user's previous messages
      setTimeout(() => {
        setMessages([
          {
            id: 'demo-1',
            message: 'Hello, I need help with my order.',
            isFromAdmin: false,
            timestamp: '10:30 AM',
            userName: 'You'
          },
          {
            id: 'demo-2',
            message: 'Hi! I\'d be happy to help you with your order. Could you please provide your order number?',
            isFromAdmin: true,
            timestamp: '10:31 AM',
            userName: 'Support Agent'
          }
        ]);
      }, 500);
    }
  }, [isOpen, isLoggedIn]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isLoggedIn) return;

    const userMessage: MockMessage = {
      id: `user-${Date.now()}`,
      message: newMessage,
      isFromAdmin: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userName: 'You'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate admin response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const adminMessage: MockMessage = {
        id: `admin-${Date.now()}`,
        message: 'Thank you for your message. I\'m reviewing your request and will respond shortly.',
        isFromAdmin: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userName: 'Support Agent'
      };
      setMessages(prev => [...prev, adminMessage]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50 shadow-2xl">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Support Chat
          </CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {!isLoggedIn ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">Please sign in to start chatting with support.</p>
                    <Button className="mt-4" onClick={() => alert('This would redirect to login page')}>
                      Sign In to Chat
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">Loading your conversation...</p>
                    <div className="animate-pulse h-4 bg-muted rounded mt-2 mx-8"></div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex items-end gap-2 ${message.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      {message.isFromAdmin && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            SA
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[75%] ${!message.isFromAdmin ? 'order-first' : ''}`}>
                        <div className={`rounded-lg px-3 py-2 ${
                          message.isFromAdmin 
                            ? 'bg-muted' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {message.isFromAdmin && (
                            <p className="text-xs opacity-75 mb-1 font-medium">
                              {message.userName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        </div>
                        <p className={`text-xs text-muted-foreground mt-1 ${
                          !message.isFromAdmin ? 'text-right' : 'text-left'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>

                      {!message.isFromAdmin && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            You
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        SA
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">Support Agent is typing</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Textarea
                  placeholder={isLoggedIn ? 'Type your message...' : 'Sign in to chat with support...'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!isLoggedIn}
                  className="min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isLoggedIn}
                size="icon"
                className="mb-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MockAdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [conversations] = useState<MockConversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<MockConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return conv.userName.toLowerCase().includes(searchLower) || 
           conv.userEmail.toLowerCase().includes(searchLower);
  });

  const handleConversationSelect = (conversation: MockConversation) => {
    setSelectedConversation(conversation);
    setMessages([...conversation.messages]);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const adminMessage: MockMessage = {
      id: `admin-${Date.now()}`,
      message: newMessage,
      isFromAdmin: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userName: 'Admin'
    };

    setMessages(prev => [...prev, adminMessage]);
    setNewMessage('');
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  if (selectedConversation) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">{selectedConversation.userName}</CardTitle>
              <p className="text-sm text-muted-foreground">{selectedConversation.userEmail}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.isFromAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  message.isFromAdmin 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    message.isFromAdmin ? 'text-blue-100' : 'text-muted-foreground'
                  }`}>
                    {message.isFromAdmin ? 'Admin' : selectedConversation.userName} • {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Customer Support Messages</CardTitle>
            {getTotalUnreadCount() > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {getTotalUnreadCount()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {conversations.length} conversations
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y max-h-96 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.userId}
              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleConversationSelect(conversation)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{conversation.userName}</h4>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {conversation.userEmail}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.messages[conversation.messages.length - 1]?.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {conversation.lastActivity}
                  </div>
                  <Button variant="outline" size="sm">
                    Open Chat
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { MockChatWindow, MockAdminDashboard };