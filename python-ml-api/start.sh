#!/bin/bash

echo "🚀 启动Python机器学习API服务..."

# 检查是否存在虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "⚡ 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装Python依赖..."
pip install -r requirements.txt

# 启动Flask应用
echo "🌟 启动Flask应用..."
echo "API服务将在 http://localhost:5001 启动"
echo "按 Ctrl+C 停止服务"
python app.py 