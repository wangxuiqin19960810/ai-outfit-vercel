// 前端调用同域 API（Vercel 或本地代理）
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const locationInput = document.getElementById('location');
const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    generateBtn.disabled = !locationInput.value.trim();
  }
});

locationInput.addEventListener('input', () => {
  generateBtn.disabled = !(preview.src && locationInput.value.trim());
});

generateBtn.addEventListener('click', async () => {
  const city = locationInput.value.trim();

  // Mock 用户画像（真实项目可替换为图像识别结果）
  const gender = '女性';
  const ageRange = '20-30岁';

  // 获取天气（使用 wttr.in，支持 CORS）
  let weather = '晴朗';
  try {
    // TODO: 替换为你的和风天气API Key
    const heWeatherKey = 'd4bc9c5f3e1a43c3884abfc4f3f7becd';
    
    const res = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${city}&key=${heWeatherKey}`, {
      mode: 'cors'
    });
    
    if (!res.ok) {
      throw new Error('天气API请求失败');
    }
    
    const weatherData = await res.json();
    
    if (weatherData.code === '200' && weatherData.now) {
      weather = weatherData.now.text || '晴朗';
    } else {
      console.warn('天气API返回异常:', weatherData);
    }
  } catch (e) {
    console.warn('天气获取失败，使用默认值:', e);
  }

  // 构造 Prompt
  const prompt = `你是一位专业时尚顾问。用户是${gender}，年龄约${ageRange}岁，今天所在地（${city}）天气为“${weather}”。请推荐一套适合今天的穿搭，包括上衣、下装、鞋子和配饰建议。语气亲切简洁，不超过100字。`;

  resultDiv.innerHTML = '<div class="loading">AI 正在思考穿搭方案...</div>';
  resultDiv.style.display = 'block';

  try {
    // 调用部署在 /api/recommend 的 Serverless 函数
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (data.output?.choices?.[0]?.message?.content) {
      resultDiv.innerHTML = `<p><strong>✨ AI 推荐：</strong>${data.output.choices[0].message.content}</p>`;
    } else {
      throw new Error(data.message || 'AI 返回格式异常');
    }
  } catch (error) {
    console.error('请求失败:', error);
    resultDiv.innerHTML = `<p style="color:red">❌ ${error.message || '生成失败，请重试'}</p>`;
  }
});