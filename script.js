// ===== 配置区（你需要填入自己的 DashScope API Key）=====
const DASHSCOPE_API_KEY = 'sk-226c8d1d727141f5a3eaa30aa8097f3f'; // ←←← 在这里填入你的 Key
// 注册地址：https://dashscope.console.aliyun.com/apiKey

// DOM 元素
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const locationInput = document.getElementById('location');
const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');

// 步骤1：上传图片预览
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.style.display = 'block';
    generateBtn.disabled = !locationInput.value.trim();
  }
});

// 步骤2：输入城市后启用按钮
locationInput.addEventListener('input', () => {
  generateBtn.disabled = !(preview.src && locationInput.value.trim());
});

// 步骤3：生成穿搭建议
generateBtn.addEventListener('click', async () => {
  const city = locationInput.value.trim();
  resultDiv.style.display = 'none';

  // === Mock 图像分析结果（真实项目中调用阿里云人体属性识别）===
  const mockHumanAnalysis = {
    gender: '女性',
    ageRange: '20-30岁'
  };

  // === 获取天气（使用和风天气免费 API，通过 CORS 代理）===
  let weather = '未知';
  try {
    const weatherRes = await fetch(`https://wttr.in/${city}?format=3`, { mode: 'cors' });
    weather = await weatherRes.text();
  } catch (err) {
    console.warn('天气获取失败，使用默认值');
    weather = '晴朗';
  }

  // === 构造 Prompt 并调用 Qwen ===
  const prompt = `你是一位专业时尚顾问。用户是${mockHumanAnalysis.gender}，年龄约${mockHumanAnalysis.ageRange}，今天所在地（${city}）天气为“${weather}”。请推荐一套适合今天的穿搭，包括上衣、下装、鞋子和配饰建议。语气亲切简洁，不超过100字。`;

  resultDiv.innerHTML = '<div class="loading">AI 正在思考穿搭方案...</div>';
  resultDiv.style.display = 'block';

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen-max",
        input: {
          messages: [{ role: "user", content: prompt }]
        },
        parameters: {
          result_format: "message"
        }
      })
    });

    const data = await response.json();
    if (data.output?.choices?.[0]?.message?.content) {
      resultDiv.innerHTML = `<p><strong>✨ AI 推荐：</strong>${data.output.choices[0].message.content}</p>`;
    } else {
      throw new Error('AI 返回格式异常');
    }
  } catch (error) {
    console.error('AI 调用失败:', error);
    resultDiv.innerHTML = '<p style="color:red">❌ 生成失败，请检查 API Key 或稍后重试。</p>';
  }
});