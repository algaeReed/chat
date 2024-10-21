import { Visibility, VisibilityOff } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Conversation, fetchAIResponseStream } from '../fetch/api';
import Bot from '../icon/Bot.svg';
import CreateNewChatBtn from '../icon/CreateNewChatBtn.svg';
import Send from '../icon/Send.svg';
import SideBar from '../icon/SideBar.svg';
const MultiChatWithAI: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(
    null
  );
  const [input, setInput] = useState<string>(''); // 实时用户输入
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false); // 用于控制 Drawer 开关
  const [typingMessage, setTypingMessage] = useState<string>(''); // 用于显示的打字机效果
  const isMobile = useMediaQuery('(max-width:600px)'); // 判断是否为移动端

  const [isAIResponding, setIsAIResponding] = useState(false); //正在响应

  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations) as Conversation[]);
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      console.log('conversations', conversations);
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = (): void => {
    const newConversation: Conversation = {
      id: Date.now(),
      messages: [],
    };
    setConversations((prevConversations) => [
      ...prevConversations,
      newConversation,
    ]);
    setActiveConversation(newConversation.id);
    if (isMobile) {
      setDrawerOpen(false); // 切换会话后在移动端关闭 Drawer
    }
  };

  const switchConversation = (id: number): void => {
    setActiveConversation(id);
    if (isMobile) {
      setDrawerOpen(false); // 切换会话后在移动端关闭 Drawer
    }
  };

  const getCurrentConversation = (): Conversation | undefined => {
    return conversations.find((conv) => conv.id === activeConversation);
  };

  const sendMessageToAI = async (): Promise<void> => {
    const currentConversation = getCurrentConversation();

    if (!currentConversation || !input) return; // 确保有当前会话并且输入不为空

    // 将当前用户输入存储到消息记录中
    setConversations((prevConversations: any) =>
      prevConversations.map((conv: any) =>
        conv.id === activeConversation
          ? {
              ...conv,
              messages: [...conv.messages, { sender: 'You', text: input }], // 用户消息存储
            }
          : conv
      )
    );

    const conversationHistory = currentConversation.messages
      .map((msg) => `${msg.sender}: ${msg.text}`)
      .join('\n');

    const fullPrompt = `${conversationHistory}\n你: ${input}\nAI:`;
    setIsAIResponding(true); //正在响应
    setTypingMessage(''); // 清空打字机效果

    let aiCompleteResponse = '';
    try {
      // 处理的流式响应
      await fetchAIResponseStream(fullPrompt, (aiResponseChunk) => {
        // 每次接收到新的响应块，更新打字机效果
        aiCompleteResponse += aiResponseChunk;
        setTypingMessage((prev) => prev + aiResponseChunk);
      });

      setIsAIResponding(false); // 完成响应后设置为 false

      setConversations((prevConversations: any) =>
        prevConversations.map((conv: any) =>
          conv.id === activeConversation
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  { sender: 'AI', text: aiCompleteResponse.trim() }, // 只添加AI的响应消息
                ],
              }
            : conv
        )
      );

      setInput(''); // 清空输入框
      // localStorage.removeItem('input'); // 清除保存的未发送输入内容
    } catch (error) {
      console.error('Failed to send message to AI:', error);
      setIsAIResponding(false); // 完成响应后设置为 false
    }
  };

  const messagesEndRef = useRef<any>(null);
  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [getCurrentConversation()?.messages, typingMessage]);

  return (
    <Container maxWidth='lg'>
      <Box display='flex' height='100vh'>
        <List>
          <Box display='flex' gap={2}>
            <img
              src={SideBar}
              alt='SideBar'
              onClick={() => {
                setDrawerOpen(true);
              }}
            />
          </Box>
        </List>

        <Drawer
          variant={
            isMobile ? 'temporary' : drawerOpen ? 'permanent' : 'temporary'
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)} // temporary 模式下关闭 Drawer
          sx={{
            width: 250,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 250, boxSizing: 'border-box' },
          }}
        >
          <List>
            <Box display='flex' gap={14} pl={2}>
              <img
                src={SideBar}
                alt='SideBar'
                onClick={() => {
                  if (isMobile) {
                    setDrawerOpen(!drawerOpen);
                  } else {
                    setDrawerOpen(false);
                  }
                }}
              />
              <img
                src={CreateNewChatBtn}
                alt='create'
                onClick={createNewConversation}
              />
            </Box>

            {conversations.map((conv) => (
              <ListItemButton
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                selected={conv.id === activeConversation}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <ListItemText primary={`会话 ${conv.id}`} />

                <ListItemSecondaryAction>
                  {hoveredId === conv.id && (
                    <IconButton
                      edge='end'
                      onClick={() =>
                        setConversations((prevConversations) =>
                          prevConversations.filter(
                            (convI) => convI.id !== conv.id
                          )
                        )
                      }
                      aria-label='删除'
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        <Box
          flexGrow={1}
          display='flex'
          flexDirection='column'
          justifyContent='space-between'
          p={1}
        >
          {activeConversation ? (
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                marginBottom: 2,
                padding: 2,
                backgroundColor: '#fff',
                borderRadius: 2,
                maxHeight: '800px', // 限制高度，内容超出时滚动
              }}
            >
              <Typography variant='h6' gutterBottom>
                会话 {activeConversation}
              </Typography>

              {/* 显示当前会话中的消息 */}
              {getCurrentConversation()?.messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    mb: 1,
                    mt: 4,
                  }}
                >
                  {msg.sender == 'AI' ? (
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        p: 1,
                        mr: 1,
                        bgcolor: '#5cc98c', // 设置橙色背景
                        color: 'white', // 设置文字颜色为白色，确保与背景对比明显
                      }}
                      src={Bot}
                    ></Avatar>
                  ) : (
                    <Avatar
                      sx={{
                        mr: 2,
                        bgcolor: '#f5c142', // 设置橙色背景
                        color: 'white', // 设置文字颜色为白色，确保与背景对比明显
                      }}
                    >
                      ∞
                    </Avatar>
                  )}

                  <div
                    style={{
                      padding: '8px',
                    }}
                  >
                    <Typography variant='body1'>
                      <strong style={{ display: 'block', textAlign: 'left' }}>
                        {msg.sender}
                      </strong>
                      <Typography variant='body2' style={{ lineHeight: 1.4 }}>
                        {msg.text}
                      </Typography>
                    </Typography>
                  </div>
                </Box>
              ))}

              {/* 打字机效果 */}
              {isAIResponding && typingMessage && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    mb: 1,
                    mt: 4,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      p: 1,
                      mr: 1,
                      mt: 2,
                      bgcolor: '#5cc98c',
                      color: 'white',
                    }}
                    src={Bot}
                  ></Avatar>

                  <div
                    style={{
                      marginTop: '24px',
                    }}
                  >
                    <Typography variant='body1'>
                      <strong style={{ display: 'block', textAlign: 'left' }}>
                        AI:
                      </strong>
                      <Typography variant='body2' style={{ lineHeight: 1.4 }}>
                        {typingMessage}
                      </Typography>
                    </Typography>
                  </div>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>
          ) : (
            <Box>
              <Typography variant='h6' p={16}>
                请选择一个会话或新建一个会话。
              </Typography>

              <TextField
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  createNewConversation();
                }}
                placeholder='Message ChatGPT...'
                variant='outlined'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: '#f4f4f4',
                    '& fieldset': {
                      borderColor: '#f4f4f4',
                    },
                    '&:hover fieldset': {
                      borderColor: '#f4f4f4',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f4f4f4',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#d7d7d7',
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onClick={() => {
                          createNewConversation();
                        }}
                      >
                        <img src={Send} alt='Send' />
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {activeConversation && (
            <Box display='flex' alignItems='center'>
              <TextField
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Message ChatGPT...'
                variant='outlined'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: '#f4f4f4',
                    '& fieldset': {
                      borderColor: '#f4f4f4',
                    },
                    '&:hover fieldset': {
                      borderColor: '#f4f4f4',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f4f4f4',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#d7d7d7',
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onClick={sendMessageToAI}
                      >
                        <img src={Send} alt='Send' />
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </Box>
        <List>
          <SettingsButton />
        </List>
      </Box>
    </Container>
  );
};

const SettingsButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [config, setConfig] = useState({ key: '', url: '' });
  const [showPassword, setShowPassword] = useState(false); // key是否可见
  const key =
    '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';
  const baseURL = 'https://openrouter.ai/api/v1';

  useEffect(() => {
    const storedConfig = localStorage.getItem('config');
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      setConfig(parsedConfig); // 有值时直接设置 config
    } else {
      // 如果没有值，则设置默认值并存入 localStorage
      const defaultConfig = { key: key, url: baseURL };
      setConfig(defaultConfig);
      localStorage.setItem('config', JSON.stringify(defaultConfig)); // 存入默认值
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('config', JSON.stringify(config));
    setDialogOpen(false);
  };

  const handleOpen = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleChange = (field: string) => (e: { target: { value: any } }) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [field]: e.target.value,
    }));
  };

  return (
    <Box display='flex' gap={2}>
      <IconButton onClick={handleOpen} aria-label='设置'>
        <SettingsIcon />
      </IconButton>
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>设置</DialogTitle>
        <DialogContent>
          <TextField
            margin='dense'
            label='URL'
            type='text'
            fullWidth
            variant='outlined'
            value={config.url}
            onChange={handleChange('url')}
            disabled
          />
          <TextField
            margin='dense'
            label='Key'
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant='outlined'
            value={config.key}
            onChange={handleChange('key')}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge='end'
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color='secondary'>
            取消
          </Button>
          <Button onClick={handleSave} color='primary'>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiChatWithAI;
