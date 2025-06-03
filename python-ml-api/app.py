from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
import shap
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from scipy.spatial import ConvexHull
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import io
import base64
import json
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 设置中文字体
def setup_chinese_font():
    """设置中文字体，优先使用系统可用字体"""
    chinese_fonts = [
        'PingFang SC',      # macOS 默认中文字体
        'Heiti SC',         # 黑体-简
        'STHeiti',          # 华文黑体
        'Arial Unicode MS', # 支持中文的 Arial
        'SimHei',           # Windows 黑体
        'Microsoft YaHei',  # 微软雅黑
        'WenQuanYi Micro Hei' # Linux 文泉驿字体
    ]
    
    available_fonts = [f.name for f in fm.fontManager.ttflist]
    
    for font in chinese_fonts:
        if font in available_fonts:
            plt.rcParams['font.sans-serif'] = [font]
            break
    else:
        plt.rcParams['font.sans-serif'] = ['PingFang SC', 'Heiti SC', 'STHeiti', 'Arial Unicode MS']
    
    plt.rcParams['axes.unicode_minus'] = False

setup_chinese_font()

# 神经网络模型定义
class AdvancedNN(nn.Module):
    def __init__(self, input_size):
        super(AdvancedNN, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(0.2)
        self.fc2 = nn.Linear(64, 32)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.2)
        self.fc3 = nn.Linear(32, 16)
        self.relu3 = nn.ReLU()
        self.fc4 = nn.Linear(16, 1)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu1(x)
        x = self.dropout1(x)
        x = self.fc2(x)
        x = self.relu2(x)
        x = self.dropout2(x)
        x = self.fc3(x)
        x = self.relu3(x)
        x = self.fc4(x)
        return x

def train_nn(model, data, targets, epochs=500):
    """训练神经网络模型"""
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=50)
    
    losses = []
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        outputs = model(data)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        scheduler.step(loss)
        losses.append(loss.item())
        
        if epoch % 100 == 0:
            print(f'Epoch [{epoch}/{epochs}], Loss: {loss.item():.4f}')
    
    return losses

@app.route('/api/neural-network/train', methods=['POST'])
def train_neural_network():
    """训练神经网络并返回训练过程和预测结果"""
    try:
        data = request.json
        ips_data = data.get('ips', [])
        feature_names = data.get('feature_names', [])  # 接收指标名称
        
        if len(ips_data) < 5:
            return jsonify({'error': 'IP数量太少（<5），无法进行神经网络训练'}), 400
        
        # 准备数据
        X = np.array([ip['indicators'] for ip in ips_data], dtype=np.float32)
        
        if X.shape[1] < 2:
            return jsonify({'error': '指标数量太少，无法进行神经网络训练'}), 400
        
        # 生成目标值（可以基于现有评分或使用随机值）
        Y = np.random.rand(X.shape[0], 1) * 100  # 0-100分的随机评分
        
        # 数据归一化
        scaler_X = StandardScaler()
        scaler_Y = StandardScaler()
        X_scaled = scaler_X.fit_transform(X)
        Y_scaled = scaler_Y.fit_transform(Y)
        
        # 转换为PyTorch张量
        X_tensor = torch.tensor(X_scaled, dtype=torch.float32)
        Y_tensor = torch.tensor(Y_scaled, dtype=torch.float32)
        
        # 创建和训练模型
        input_size = X.shape[1]
        model = AdvancedNN(input_size)
        
        print(f"开始训练神经网络，输入维度：{input_size}, 样本数量：{X.shape[0]}")
        losses = train_nn(model, X_tensor, Y_tensor, epochs=500)
        
        # 获取预测结果
        model.eval()
        with torch.no_grad():
            predictions_scaled = model(X_tensor).numpy()
            predictions = scaler_Y.inverse_transform(predictions_scaled).flatten()
        
        # 计算特征重要性（简化版）
        feature_importance = []
        for i in range(input_size):
            X_perturbed = X_tensor.clone()
            X_perturbed[:, i] = 0  # 将第i个特征置零
            with torch.no_grad():
                pred_perturbed = model(X_perturbed)
                importance = torch.mean(torch.abs(model(X_tensor) - pred_perturbed)).item()
                feature_importance.append(importance)
        
        # 归一化特征重要性
        max_importance = max(feature_importance)
        if max_importance > 0:
            feature_importance = [imp / max_importance for imp in feature_importance]
        
        results = []
        for i, ip in enumerate(ips_data):
            results.append({
                'name': ip['project_name'],
                'group': ip['group_name'],
                'predicted_score': float(predictions[i]),
                'confidence': float(1.0 - abs(predictions[i] - Y[i, 0]) / 100)  # 简化的置信度
            })
        
        return jsonify({
            'success': True,
            'training_losses': losses,
            'predictions': results,
            'feature_importance': feature_importance,
            'model_info': {
                'input_size': input_size,
                'epochs': 500,
                'final_loss': losses[-1] if losses else 0
            }
        })
        
    except Exception as e:
        print(f"神经网络训练错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/shap/explain', methods=['POST'])
def shap_explain():
    """SHAP模型解释"""
    try:
        data = request.json
        ips_data = data.get('ips', [])
        feature_names = data.get('feature_names', [])  # 接收指标名称
        
        if len(ips_data) < 3:
            return jsonify({'error': 'SHAP解释需要至少3个IP'}), 400
        
        # 构建特征矩阵
        X = []
        for ip in ips_data:
            indicators = ip.get('indicators', [])
            if not indicators:
                return jsonify({'error': f'IP {ip.get("project_name", "未知")} 缺少指标数据'}), 400
            X.append(indicators)
        
        X = np.array(X, dtype=np.float32)
        input_size = X.shape[1]
        
        # 确保使用传入的指标名称，如果没有传入或数量不匹配则使用默认格式
        if not feature_names or len(feature_names) != input_size:
            print(f"警告：传入的指标名称数量({len(feature_names) if feature_names else 0})与特征数量({input_size})不匹配")
            feature_names = [f'指标{i+1}' for i in range(input_size)]
        else:
            print(f"使用传入的指标名称：{feature_names[:3]}...（共{len(feature_names)}个）")
        
        # 创建伪目标变量（综合评分）
        Y = np.mean(X, axis=1)
        
        # 转换为张量
        X_tensor = torch.FloatTensor(X)
        Y_tensor = torch.FloatTensor(Y).unsqueeze(1)
        
        # 构建和训练神经网络
        model = AdvancedNN(input_size)
        train_nn(model, X_tensor, Y_tensor, epochs=200)
        model.eval()
        
        # SHAP解释
        explainer = shap.DeepExplainer(model, X_tensor)
        shap_values = explainer.shap_values(X_tensor)
        
        # 处理SHAP值
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
        
        # 计算每个特征的平均SHAP值
        mean_shap_values = np.mean(np.abs(shap_values), axis=0)
        
        # 为每个IP计算SHAP值
        ip_explanations = []
        for i, ip in enumerate(ips_data):
            ip_shap = shap_values[i] if len(shap_values.shape) > 1 else shap_values
            ip_explanations.append({
                'name': ip['project_name'],
                'shap_values': ip_shap.tolist() if hasattr(ip_shap, 'tolist') else [float(ip_shap)],
                'predicted_value': float(model(X_tensor[i:i+1]).item())
            })
        
        print(f"SHAP分析完成，返回指标名称：{feature_names[:3]}...（共{len(feature_names)}个）")
        
        return jsonify({
            'success': True,
            'mean_shap_values': mean_shap_values.tolist(),
            'ip_explanations': ip_explanations,
            'feature_names': feature_names  # 返回确认的指标名称
        })
        
    except Exception as e:
        print(f"SHAP解释错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pca/analysis', methods=['POST'])
def pca_analysis():
    """执行PCA降维分析"""
    try:
        data = request.json
        ips_data = data.get('ips', [])
        n_components = data.get('n_components', 2)
        
        if len(ips_data) < 2:
            return jsonify({'error': 'IP数量太少，无法进行PCA分析'}), 400
        
        # 准备数据
        X = np.array([ip['indicators'] for ip in ips_data])
        ip_names = [ip['project_name'] for ip in ips_data]
        
        if X.shape[1] < n_components:
            return jsonify({'error': f'指标数量({X.shape[1]})少于降维目标维度({n_components})'}), 400
        
        # 数据标准化
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # PCA降维
        pca = PCA(n_components=n_components)
        X_pca = pca.fit_transform(X_scaled)
        
        # 计算贡献度
        explained_variance_ratio = pca.explained_variance_ratio_
        cumulative_variance = np.cumsum(explained_variance_ratio)
        
        # 获取主成分载荷
        components = pca.components_
        
        # 生成结果
        pca_results = []
        for i, (name, coords) in enumerate(zip(ip_names, X_pca)):
            pca_results.append({
                'name': name,
                'coordinates': coords.tolist(),
                'group': ips_data[i].get('group_name', '未知')
            })
        
        # 创建更友好的轴标签
        axis_labels = []
        for i in range(n_components):
            variance_percent = explained_variance_ratio[i] * 100
            axis_labels.append(f'主成分{i+1} ({variance_percent:.1f}%方差)')
        
        print(f"PCA分析完成：")
        print(f"- 主成分数量: {n_components}")
        print(f"- 轴标签: {axis_labels}")
        print(f"- 累计方差解释率: {cumulative_variance[-1]*100:.1f}%")
        
        return jsonify({
            'success': True,
            'pca_results': pca_results,
            'explained_variance_ratio': explained_variance_ratio.tolist(),
            'cumulative_variance': cumulative_variance.tolist(),
            'components': components.tolist(),
            'n_components': n_components,
            'total_variance_explained': float(cumulative_variance[-1]),
            'axis_labels': axis_labels,  # 新增：友好的轴标签
            'x_axis_label': axis_labels[0] if len(axis_labels) > 0 else 'PC1',
            'y_axis_label': axis_labels[1] if len(axis_labels) > 1 else 'PC2'
        })
        
    except Exception as e:
        print(f"PCA分析错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clustering/advanced', methods=['POST'])
def advanced_clustering():
    """高级聚类分析，包含凸包计算"""
    try:
        data = request.json
        ips_data = data.get('ips', [])
        n_clusters = data.get('n_clusters', 2)
        use_pca = data.get('use_pca', True)
        
        if len(ips_data) < n_clusters:
            return jsonify({'error': f'IP数量({len(ips_data)})少于聚类数量({n_clusters})'}), 400
        
        # 准备数据
        X = np.array([ip['indicators'] for ip in ips_data])
        ip_names = [ip['project_name'] for ip in ips_data]
        
        # 数据标准化
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # 可选的PCA降维
        if use_pca and X.shape[1] > 2:
            pca = PCA(n_components=2)
            X_for_clustering = pca.fit_transform(X_scaled)
            variance_explained = pca.explained_variance_ratio_
        else:
            X_for_clustering = X_scaled[:, :2] if X.shape[1] >= 2 else X_scaled
            variance_explained = None
        
        # K-means聚类
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(X_for_clustering)
        centroids = kmeans.cluster_centers_
        
        # 计算聚类质量指标
        from sklearn.metrics import silhouette_score, calinski_harabasz_score
        
        # 质量指标计算需要特殊处理
        silhouette_avg = None
        calinski_harabasz = None
        
        try:
            # 轮廓系数需要至少2个簇且每个簇至少有1个样本，但当每个样本都是单独簇时会失败
            if len(set(cluster_labels)) > 1 and len(X_for_clustering) > len(set(cluster_labels)):
                silhouette_avg = silhouette_score(X_for_clustering, cluster_labels)
            else:
                print(f"无法计算轮廓系数: 样本数={len(X_for_clustering)}, 簇数={len(set(cluster_labels))}")
        except Exception as e:
            print(f"轮廓系数计算失败: {str(e)}")
            
        try:
            # Calinski-Harabasz指数需要至少2个簇
            if len(set(cluster_labels)) > 1:
                calinski_harabasz = calinski_harabasz_score(X_for_clustering, cluster_labels)
        except Exception as e:
            print(f"Calinski-Harabasz指数计算失败: {str(e)}")
        
        # 为每个聚类计算凸包
        convex_hulls = []
        for cluster_id in range(n_clusters):
            cluster_points = X_for_clustering[cluster_labels == cluster_id]
            if len(cluster_points) >= 3:  # 至少需要3个点才能形成凸包
                try:
                    hull = ConvexHull(cluster_points)
                    hull_points = cluster_points[hull.vertices].tolist()
                    convex_hulls.append({
                        'cluster_id': cluster_id,
                        'hull_points': hull_points,
                        'area': hull.volume if hasattr(hull, 'volume') else 0
                    })
                except:
                    # 如果无法计算凸包，使用最小包围矩形
                    min_x, max_x = cluster_points[:, 0].min(), cluster_points[:, 0].max()
                    min_y, max_y = cluster_points[:, 1].min(), cluster_points[:, 1].max()
                    convex_hulls.append({
                        'cluster_id': cluster_id,
                        'hull_points': [[min_x, min_y], [max_x, min_y], [max_x, max_y], [min_x, max_y]],
                        'area': (max_x - min_x) * (max_y - min_y)
                    })
            else:
                convex_hulls.append({
                    'cluster_id': cluster_id,
                    'hull_points': cluster_points.tolist(),
                    'area': 0
                })
        
        # 生成结果
        clustering_results = []
        for i, (name, coords, label) in enumerate(zip(ip_names, X_for_clustering, cluster_labels)):
            clustering_results.append({
                'name': name,
                'group': ips_data[i].get('group_name', '未知'),
                'coordinates': coords.tolist(),
                'cluster': int(label),
                'distance_to_centroid': float(np.linalg.norm(coords - centroids[label]))
            })
        
        return jsonify({
            'success': True,
            'clustering_results': clustering_results,
            'centroids': centroids.tolist(),
            'convex_hulls': convex_hulls,
            'quality_metrics': {
                'silhouette_score': float(silhouette_avg) if silhouette_avg is not None else None,
                'calinski_harabasz_score': float(calinski_harabasz) if calinski_harabasz is not None else None
            },
            'pca_info': {
                'used': use_pca,
                'variance_explained': variance_explained.tolist() if variance_explained is not None else None,
                'x_axis_label': f'主成分1 ({variance_explained[0]*100:.1f}%方差)' if use_pca and variance_explained is not None else '维度1',
                'y_axis_label': f'主成分2 ({variance_explained[1]*100:.1f}%方差)' if use_pca and variance_explained is not None and len(variance_explained) > 1 else '维度2',
                'total_variance': f'{sum(variance_explained)*100:.1f}%' if variance_explained is not None else None
            }
        })
        
    except Exception as e:
        print(f"高级聚类分析错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/visualization/advanced-plot', methods=['POST'])
def generate_advanced_plot():
    """生成高级可视化图表"""
    try:
        data = request.json
        plot_type = data.get('plot_type', 'clustering')
        plot_data = data.get('data', {})
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        if plot_type == 'clustering_with_hull':
            # 聚类图与凸包
            clustering_results = plot_data.get('clustering_results', [])
            convex_hulls = plot_data.get('convex_hulls', [])
            pca_info = plot_data.get('pca_info', {})
            
            # 绘制散点
            colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink', 'gray']
            for result in clustering_results:
                cluster = result['cluster']
                coords = result['coordinates']
                color = colors[cluster % len(colors)]
                ax.scatter(coords[0], coords[1], c=color, s=100, alpha=0.7, 
                          label=f'簇 {cluster + 1}' if cluster < 8 else None)
                ax.annotate(result['name'], (coords[0], coords[1]), 
                           xytext=(5, 5), textcoords='offset points', fontsize=8)
            
            # 绘制凸包
            for hull_info in convex_hulls:
                hull_points = np.array(hull_info['hull_points'])
                if len(hull_points) > 2:
                    # 闭合凸包
                    hull_points = np.vstack([hull_points, hull_points[0]])
                    cluster_id = hull_info['cluster_id']
                    color = colors[cluster_id % len(colors)]
                    ax.plot(hull_points[:, 0], hull_points[:, 1], 
                           color=color, linestyle='--', linewidth=2, alpha=0.8)
                    ax.fill(hull_points[:, 0], hull_points[:, 1], 
                           color=color, alpha=0.2)
            
            # 设置友好的轴标签
            x_label = pca_info.get('x_axis_label', '维度1')
            y_label = pca_info.get('y_axis_label', '维度2')
            total_variance = pca_info.get('total_variance', '')
            
            ax.set_xlabel(x_label, fontsize=12)
            ax.set_ylabel(y_label, fontsize=12)
            
            # 设置标题，包含方差信息
            title = '聚类分析结果（含凸包）'
            if total_variance:
                title += f' - 总方差解释: {total_variance}'
            ax.set_title(title, fontsize=14)
            
            ax.legend()
            ax.grid(True, alpha=0.3)
            
        elif plot_type == 'pca_biplot':
            # PCA双标图
            pca_results = plot_data.get('pca_results', [])
            components = plot_data.get('components', [])
            pca_info = plot_data.get('pca_info', {})
            
            # 绘制数据点
            for result in pca_results:
                coords = result['coordinates']
                ax.scatter(coords[0], coords[1], s=100, alpha=0.7)
                ax.annotate(result['name'], (coords[0], coords[1]), 
                           xytext=(5, 5), textcoords='offset points', fontsize=8)
            
            # 绘制变量向量（如果有足够的成分信息）
            if len(components) >= 2:
                for i, (pc1, pc2) in enumerate(zip(components[0], components[1])):
                    ax.arrow(0, 0, pc1, pc2, head_width=0.05, head_length=0.05, 
                            fc='red', ec='red', alpha=0.7)
                    ax.text(pc1*1.1, pc2*1.1, f'指标{i+1}', fontsize=8, 
                           ha='center', va='center')
            
            # 使用友好的轴标签
            x_label = pca_info.get('x_axis_label', '主成分1')
            y_label = pca_info.get('y_axis_label', '主成分2')
            
            ax.set_xlabel(x_label, fontsize=12)
            ax.set_ylabel(y_label, fontsize=12)
            ax.set_title('PCA双标图', fontsize=14)
            ax.grid(True, alpha=0.3)
            ax.axhline(y=0, color='k', linestyle='-', alpha=0.3)
            ax.axvline(x=0, color='k', linestyle='-', alpha=0.3)
        
        # 将图表转换为base64编码的图片
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{image_base64}',
            'plot_type': plot_type
        })
        
    except Exception as e:
        print(f"生成高级图表错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sports-news/daily', methods=['GET'])
def get_daily_sports_news():
    """获取每日新疆体育动态"""
    try:
        # 模拟新疆体育动态数据
        sports_activities = [
            "新疆篮球联赛春季赛程启动",
            "和田地区举办传统摔跤比赛",
            "阿克苏地区民族体育文化节开幕",
            "喀什古城举办达瓦孜表演活动",
            "伊犁哈萨克自治州马术训练基地投入使用",
            "乌鲁木齐市举办少数民族传统体育项目展示",
            "塔城地区开展青少年体育培训计划",
            "哈密地区传统体育项目保护工作会议召开"
        ]
        
        traditional_sports = [
            "刁羊", "赛马", "达瓦孜", "押加", "摔跤", "射箭", "秋千", "顶牛"
        ]
        
        regions = [
            "乌鲁木齐市", "昌吉州", "伊犁州", "塔城地区", "阿勒泰地区",
            "博州", "巴州", "阿克苏地区", "克州", "喀什地区", "和田地区", "哈密市", "吐鲁番市"
        ]
        
        # 生成今日动态
        today_news = []
        for i in range(3):  # 生成3条今日动态
            activity = random.choice(sports_activities)
            sport = random.choice(traditional_sports)
            region = random.choice(regions)
            
            news_item = {
                'id': f'news_{datetime.now().strftime("%Y%m%d")}_{i+1}',
                'title': f'{region}{activity}',
                'content': f'{region}今日举办{sport}项目相关活动，吸引了众多民众参与，推动了民族传统体育的传承与发展。',
                'timestamp': datetime.now().isoformat(),
                'region': region,
                'sport': sport,
                'type': 'daily_update'
            }
            today_news.append(news_item)
        
        return jsonify({
            'success': True,
            'news': today_news,
            'timestamp': datetime.now().isoformat(),
            'total_count': len(today_news)
        })
        
    except Exception as e:
        print(f"获取体育动态错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'service': 'Python ML API',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    print("启动Python机器学习API服务...")
    print("可用接口:")
    print("- POST /api/neural-network/train - 神经网络训练")
    print("- POST /api/shap/explain - SHAP模型解释") 
    print("- POST /api/pca/analysis - PCA降维分析")
    print("- POST /api/clustering/advanced - 高级聚类分析")
    print("- POST /api/visualization/advanced-plot - 高级可视化")
    print("- GET /api/sports-news/daily - 每日体育动态")
    print("- GET /api/health - 健康检查")
    
    app.run(host='0.0.0.0', port=5001, debug=True) 