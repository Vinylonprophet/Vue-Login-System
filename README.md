# 少数民族民俗体育IP综合评估与排序系统

这是一个前后端分离的Web应用系统，用于评估和排序少数民族民俗体育IP项目。

## 项目架构

### 前端 (Vue.js)
- **技术栈**: Vue 3 + TypeScript + Vite
- **功能**: 用户界面、数据可视化、交互操作
- **路径**: 根目录

### 后端 (Node.js)
- **技术栈**: Node.js + Express + JavaScript
- **功能**: API服务、数据处理、算法计算
- **路径**: `data-regulus/`

## 主要功能

### 1. IP管理
- 添加、编辑、删除IP项目
- 按组别筛选和管理
- 批量导入/导出数据

### 2. 指标评估
- 三级指标体系（一级→二级→三级）
- 动态指标筛选
- AHP权重计算

### 3. 评估算法
- 遗传算法适应度仿真
- 综合评分计算
- 误差分析

### 4. 数据分析
- K-means聚类分析
- 评估历史记录
- 统计信息展示

### 5. 可视化展示
- 适应度变化曲线
- IP评分分布图
- 雷达图分析
- 聚类结果展示

## 安装和运行

### 前置要求
- Node.js (版本 16+)
- npm 或 yarn

### 后端启动

```bash
# 进入后端目录
cd data-regulus

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或者启动生产服务器
npm start
```

后端服务将在 `http://localhost:3001` 启动

### 前端启动

```bash
# 在根目录安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

前端服务将在 `http://localhost:5173` 启动

## API文档

### 基础URL
```
http://localhost:3001/api/ip
```

### 主要端点

#### 指标管理
- `GET /indicators` - 获取指标结构
- `POST /indicators/filtered` - 获取筛选后的指标

#### IP管理
- `GET /ips` - 获取所有IP
- `POST /ips` - 添加IP
- `PUT /ips/:id` - 更新IP
- `DELETE /ips/:id` - 删除IP
- `POST /ips/batch` - 批量添加IP

#### 评估分析
- `POST /evaluate` - 执行IP评估
- `POST /clustering` - 执行聚类分析

#### 数据管理
- `GET /history` - 获取评估历史
- `GET /statistics` - 获取统计信息
- `GET /export` - 导出数据
- `POST /import` - 导入数据
- `POST /test-data` - 生成测试数据

## 数据结构

### IP对象
```json
{
  "id": "string",
  "name": "string",
  "group": "string", 
  "indicators": [number],
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### 评估结果
```json
{
  "scores": [number],
  "weights": [number],
  "fitnessHistory": [[number]],
  "errors": [number],
  "evaluation": [
    {
      "name": "string",
      "group": "string", 
      "score": number,
      "error": number,
      "rank": number
    }
  ]
}
```

## 指标体系

### 一级指标
- 文化价值
- 市场潜力
- 社会效益
- 创新性

### 二级指标
- 历史继承性、民族特色、文化传播力、社会认同感
- 市场需求、竞争环境、商业化路径
- 文化传承、社会影响力
- 技术创新、模式创新、传播创新

### 三级指标
总共31个具体评估指标，详见API文档。

## 算法说明

### AHP权重计算
使用层次分析法计算各指标权重，通过特征值分解得到权重向量。

### 遗传算法仿真
- 迭代次数：50次
- 变异方式：高斯噪声
- 适应度函数：加权线性组合

### K-means聚类
- 最大迭代次数：100次
- 距离度量：欧几里得距离
- 初始化：随机选择质心

## 开发说明

### 前端开发
- 使用Composition API
- TypeScript类型检查
- 响应式设计支持

### 后端开发
- RESTful API设计
- 错误处理中间件
- CORS跨域支持

### 数据持久化
当前版本使用内存存储，生产环境建议集成数据库。

## 许可证
ISC

## 贡献
欢迎提交Issue和Pull Request。

## 功能特色

### 📊 全面分析仪表盘
- **多维度分析**: 遗传算法优化、神经网络训练、SHAP模型解释、PCA降维分析等
- **实时可视化**: 8种专业图表展示分析结果
- **智能筛选**: 支持指标层级筛选和IP组别筛选
- **📄 PDF导出**: 一键导出分析报告，包含所有图表和分析结果

### 💾 数据管理
- **智能录入**: 支持手动录入和Excel批量导入
- **多专家评分**: 自动聚合多位专家评分数据
- **实时更新**: 智能模式检测（创建/更新/编辑）

### 🔬 高级分析功能
- **遗传算法优化**: 自动寻找最佳指标权重
- **神经网络分析**: 深度学习特征重要性分析
- **SHAP模型解释**: 特征贡献度可解释性分析
- **PCA降维可视化**: 多维数据的二维展示
- **聚类分析**: 带凸包的高级聚类可视化

## 新增功能：PDF导出

### 使用方法
1. 在Dashboard页面进行全面分析
2. 分析完成后，点击页面右上角的"导出PDF"按钮
3. 系统将自动生成包含以下内容的PDF报告：
   - 分析概况（IP数量、指标数量、生成时间）
   - 适应度变化曲线
   - IP评分分布图
   - 重要指标权重雷达图
   - 神经网络训练损失曲线
   - 特征重要性分析图
   - SHAP特征贡献度蜂群图
   - PCA降维可视化图
   - 聚类分析图（含凸包）

### 功能特点
- **智能过滤**: 只导出有数据的图表
- **专业布局**: A4格式，自动分页
- **高清图表**: 使用高分辨率图像导出
- **完整信息**: 包含页眉、页脚、时间戳等信息
- **自动命名**: 文件名包含日期和时间
- **英文标题**: 使用标准英文标题，确保全平台兼容性，避免字体乱码

## 项目启动

```bash
# 前端开发服务器
npm install
npm run dev

# 后端API服务器
cd data-regulus
npm install
npm start

# Python机器学习API
cd python-ml-api
pip install -r requirements.txt
python app.py
```

## 技术栈

### 前端
- Vue 3 + TypeScript
- Chart.js (图表渲染)
- jsPDF + html2canvas (PDF导出)
- Element Plus UI组件

### 后端
- Node.js + Express
- MongoDB + Mongoose
- Python + Flask (机器学习API)
- scikit-learn, pandas, numpy (数据分析)

## 更新日志

### v2.1.0 (最新)
- ✨ 新增PDF导出功能
- 🎨 优化Dashboard界面布局
- 🔧 完善图表渲染机制
- 🐛 修复多专家评分显示问题

### v2.0.0
- ✨ 完成多专家评分管理
- ✨ 实现智能操作模式检测
- 🔧 修复数据格式兼容性问题
- 🎯 优化唯一性约束（名称+组别）

### v1.0.0
- ✨ 基础IP评估功能
- ✨ 遗传算法优化
- ✨ 数据管理系统
