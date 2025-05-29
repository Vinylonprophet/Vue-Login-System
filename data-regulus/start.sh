#!/bin/bash

echo "正在启动少数民族民俗体育IP评估系统后端..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    echo "请先安装 Node.js (推荐版本 16+)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "server.js" ]; then
    echo "错误: 请在 data-regulus 目录下运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 启动服务器
echo "启动后端服务器..."
echo "服务地址: http://localhost:3001"
echo "API文档: http://localhost:3001/api/ip"
echo "按 Ctrl+C 停止服务器"
echo ""

node server.js 