// 🐱 AI口袋宠物后端（通义千问专用）
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-你的密钥';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 🧠 简单情绪识别
function getEmotion(text) {
  if (/开心|快乐|棒|赞|好|哈哈/.test(text)) return { label: 'happy', valence: 0.8 };
  if (/难过|伤心|累|烦|压力|哭/.test(text)) return { label: 'sad', valence: -0.7 };
  if (/爱|喜欢|抱抱|亲亲/.test(text)) return { label: 'love', valence: 0.9 };
  return { label: 'neutral', valence: 0.2 };
}

// 🤖 调用通义千问生成回复
async function callQwen(prompt) {
  try {
    const response = await axios.post(QWEN_API_URL, {
      model: 'qwen-turbo',
      input: {
        prompt: prompt
      }
    }, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data.output.text.trim();
  } catch (error) {
    console.error('Qwen调用失败:', error.message);
    throw error;
  }
}

app.post('/dialog', async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const userText = messages.length > 0 ? messages[messages.length - 1].content : '';
    
    if (!userText) {
      return res.status(400).json({ error: 'No user message provided' });
    }

    const emotion = getEmotion(userText);
    
    // 🎯 构造Prompt：让Qwen扮演温暖宠物
    const prompt = `你是一个温暖、俏皮的AI宠物伙伴，名字叫“小伴”。用户刚刚说：“${userText}”。请用50字以内回复，语气亲切，带1-2个表情符号，提供情绪支持或小建议。不要提“AI”或“模型”。`;

    const reply = await callQwen(prompt);

    res.json({
      reply: reply,
      emotion: emotion,
      ui_hint: { 
        pet_expression: emotion.label 
      },
      latency_ms: 0 // 简化版
    });

  } catch (error) {
    res.status(500).json({
      reply: '呜...我有点卡住了，但我会一直陪着你！🤗',
      emotion: { label: 'confused', valence: 0 },
      ui_hint: { pet_expression: 'confused' }
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI宠物后端运行中 🐱' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AI宠物后端启动成功！端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
});
