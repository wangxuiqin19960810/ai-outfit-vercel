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
  let weather = '';
  let temperature = '';
  // 天气代码映射表 (英文转中文)
  const weatherMap = {
      0: "晴",
      1: "晴转多云",
      2: "多云",
      3: "阴",
      45: "雾",
      48: "冻雾",
      51: "小雨",
      53: "中雨",
      55: "大雨",
      61: "小雨",
      63: "中雨",
      65: "大雨",
      71: "小雪",
      73: "中雪",
      75: "大雪",
      95: "雷阵雨",
      96: "雷阵雨伴小冰雹",
      99: "雷阵雨伴大冰雹"
  };
  // 1. 第一步：根据城市名获取经纬度
  async function getCoordinates(cityName) {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&&language=zh`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
          // 返回第一个匹配结果的经纬度
          return {
              latitude: data.results[0].latitude,
              longitude: data.results[0].longitude,
              city: data.results[0].name
          };
      } else {
          throw new Error("未找到该城市");
      }
  }
  // 2. 第二步：根据经纬度获取天气
  async function fetchWeather(latitude, longitude) {
      const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      return await response.json();
  }

  try {
      // 获取经纬度
      const location = await getCoordinates(city);
      console.log('定位信息:', location);
      // 获取天气
      const weatherData = await fetchWeather(location.latitude, location.longitude);
      console.log('天气信息:', weatherData);
      
      if (weatherData.current_weather) {
        const code = weatherData.current_weather.weathercode;
        weather = weatherMap[code] || "未知";
        temperature = weatherData.current_weather.temperature;
      } else {
        console.warn('天气数据异常:', weatherData);
      }
  } catch (e) {
    console.warn('天气获取失败，使用默认值:', e);
  }

  // 构造 Prompt
  const prompt = `你是一位专业时尚顾问。用户是${gender}，年龄约${ageRange}岁，今天所在地（${city}）天气为“${weather}，当前温度为${temperature}℃”。请推荐一套适合今天的穿搭，包括上衣、下装、鞋子和配饰建议。语气亲切简洁，不超过100字。`;

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