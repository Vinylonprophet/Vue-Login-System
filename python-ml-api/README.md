# Python机器学习API服务

这个Python API服务为Vue前端系统提供高级机器学习功能，包括神经网络训练、SHAP模型解释、PCA降维分析等。

## 🚀 快速启动

### 方法1：使用启动脚本（推荐）
```bash
cd python-ml-api
./start.sh
```

### 方法2：手动启动
```bash
cd python-ml-api

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```

## 📋 功能列表

### 1. 神经网络训练
- **接口**: `POST /api/neural-network/train`
- **功能**: 训练高级神经网络模型，进行IP评分预测
- **特色**: 包含Dropout层、学习率调度、特征重要性分析

### 2. SHAP模型解释
- **接口**: `POST /api/shap/explain`
- **功能**: 使用SHAP解释神经网络模型的预测结果
- **特色**: 提供每个特征对预测结果的贡献度分析

### 3. PCA降维分析
- **接口**: `POST /api/pca/analysis`
- **功能**: 对高维IP数据进行主成分分析
- **特色**: 方差解释比例、主成分载荷分析

### 4. 高级聚类分析
- **接口**: `POST /api/clustering/advanced`
- **功能**: K-means聚类 + 凸包计算 + 聚类质量评估
- **特色**: 包含轮廓系数、Calinski-Harabasz指数

### 5. 高级可视化
- **接口**: `POST /api/visualization/advanced-plot`
- **功能**: 生成带凸包的聚类图、PCA双标图等
- **特色**: 返回base64编码的高质量图片

### 6. 体育动态推送
- **接口**: `GET /api/sports-news/daily`
- **功能**: 模拟每日新疆体育动态信息
- **特色**: 随机生成真实感的体育新闻

## 🔗 与前端集成

前端Vue应用会自动调用这些API，前提是：

1. **Python API服务运行在**: `http://localhost:5001`
2. **Node.js后端服务运行在**: `http://localhost:3001`
3. **Vue前端服务运行在**: `http://localhost:5173`

## 🎯 使用场景

### 在Vue前端中使用高级功能：

1. **神经网络训练**：点击"神经网络训练"按钮
   - 要求：至少5个IP
   - 结果：预测评分、置信度、特征重要性

2. **SHAP模型解释**：点击"SHAP模型解释"按钮
   - 要求：至少2个IP
   - 结果：特征贡献度、模型解释性分析

3. **PCA降维分析**：点击"PCA降维分析"按钮
   - 要求：至少2个IP
   - 结果：降维坐标、方差解释比例

4. **高级聚类**：点击"高级聚类"按钮
   - 要求：至少2个IP
   - 结果：聚类结果、凸包、质量指标

5. **体育动态**：点击"体育动态"按钮
   - 结果：每日新疆体育新闻推送

## 🛠 技术栈

- **框架**: Flask + Flask-CORS
- **机器学习**: PyTorch, scikit-learn, SHAP
- **数据处理**: NumPy, Pandas
- **可视化**: Matplotlib
- **数学计算**: SciPy

## 📊 API响应格式

所有API都返回JSON格式：

```json
{
  "success": true,
  "data": {
    // 具体数据内容
  },
  "error": null  // 错误信息（如果有）
}
```

## 🔧 故障排除

### 常见问题：

1. **导入错误**：确保所有依赖都已安装
2. **端口冲突**：确保5001端口未被占用
3. **跨域问题**：已配置Flask-CORS，应该不会有问题
4. **内存不足**：神经网络训练可能需要较多内存

### 检查服务状态：
```bash
curl http://localhost:5001/api/health
```

应该返回：
```json
{
  "status": "healthy",
  "service": "Python ML API",
  "version": "1.0.0"
}
```

## 🎉 完整功能演示流程

1. 启动Python ML API服务（端口5001）
2. 启动Node.js后端服务（端口3001）
3. 启动Vue前端服务（端口5173）
4. 在前端生成测试数据
5. 依次体验所有高级AI功能
6. 查看计算日志中的详细结果 