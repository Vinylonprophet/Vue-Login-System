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
