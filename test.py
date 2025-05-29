import numpy as np 
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import tkinter as tk
from tkinter import messagebox, scrolledtext, simpledialog, ttk
import torch
import torch.nn as nn
import torch.optim as optim
from datetime import datetime
import random
import shap  # 需要提前安装：pip install shap
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from scipy.spatial import ConvexHull  # 用于绘制凸包

# 使用内置的ggplot样式
plt.style.use('ggplot')

# 动态设置中文字体
def setup_chinese_font():
    """设置中文字体，优先使用系统可用字体"""
    import matplotlib.font_manager as fm
    
    # macOS 系统常见的中文字体
    chinese_fonts = [
        'PingFang SC',      # macOS 默认中文字体
        'Heiti SC',         # 黑体-简
        'STHeiti',          # 华文黑体
        'Arial Unicode MS', # 支持中文的 Arial
        'SimHei',           # Windows 黑体
        'Microsoft YaHei',  # 微软雅黑
        'WenQuanYi Micro Hei' # Linux 文泉驿字体
    ]
    
    # 获取系统可用字体
    available_fonts = [f.name for f in fm.fontManager.ttflist]
    
    # 找到第一个可用的中文字体
    for font in chinese_fonts:
        if font in available_fonts:
            plt.rcParams['font.sans-serif'] = [font]
            print(f"使用字体: {font}")
            break
    else:
        # 如果没有找到中文字体，使用默认字体并打印警告
        print("警告: 未找到合适的中文字体，可能无法正确显示中文")
        plt.rcParams['font.sans-serif'] = ['PingFang SC', 'Heiti SC', 'STHeiti', 'Arial Unicode MS']
    
    plt.rcParams['axes.unicode_minus'] = False

# 调用字体设置函数
setup_chinese_font()

# ----------------------------
# 模型与算法相关函数
# ----------------------------
class AdvancedNN(nn.Module):
    def __init__(self, input_size):
        super(AdvancedNN, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(64, 32)
        self.relu2 = nn.ReLU()
        self.fc3 = nn.Linear(32, 1)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu1(x)
        x = self.fc2(x)
        x = self.relu2(x)
        x = self.fc3(x)
        return x

def train_nn(model, data, targets, epochs=500):
    """训练模型，训练轮次设为500轮"""
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        outputs = model(data)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

def genetic_algorithm_per_ip(data, weights, iterations=50):
    """
    对每个 IP 分别记录每次迭代时的适应度，返回形状为 (iterations, num_IP)
    """
    n = data.shape[0]
    fitness_history = np.zeros((iterations, n))
    for it in range(iterations):
        fitness = [np.dot(ind, weights) for ind in data]
        fitness_history[it] = fitness
        data = data + np.random.normal(0, 0.1, data.shape)
    return fitness_history

def plot_radar(ax, labels, values):
    num_vars = len(labels)
    angles = np.linspace(0, 2*np.pi, num_vars, endpoint=False).tolist()
    values = values + values[:1]
    angles = angles + angles[:1]
    ax.plot(angles, values, linewidth=2, linestyle='solid', marker='o')
    ax.fill(angles, values, alpha=0.25)

def ahp_weights(matrix):
    eig_vals, eig_vecs = np.linalg.eig(matrix)
    max_index = np.argmax(eig_vals)
    weights = eig_vecs[:, max_index].real
    return weights / np.sum(weights)

def push_daily_updates(chat_box):
    def update_chat():
        daily_update = (f"【{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}】\n"
                        "今日新疆体育动态：\n1. 新疆篮球赛季启动\n"
                        "2. 新增民族体育活动举办\n3. 民族传统体育项目更新\n")
        chat_box.insert(tk.END, daily_update)
        chat_box.yview(tk.END)
    update_chat()
    root.after(86400000, push_daily_updates, chat_box)

# ----------------------------
# 模型解释（SHAP）函数
# ----------------------------
def explain_model():
    global ips
    if not ips:
        messagebox.showwarning("警告", "没有IP数据，无法解释模型。")
        return
    X = np.array([ip[2] for ip in ips], dtype=np.float32)
    if X.shape[0] < 2:
        messagebox.showwarning("警告", "IP数量太少（<2），无法进行SHAP解释。请添加更多IP。")
        return
    if X.shape[1] < 2:
        messagebox.showwarning("警告", "当前仅选择了1个指标，无法进行多维解释。请至少选择2个指标。")
        return

    messagebox.showinfo("提示", "使用随机目标值训练模型进行SHAP解释。如有真实标签，请替换随机值。")
    Y = np.random.rand(X.shape[0], 1) * 10

    X_tensor = torch.tensor(X, dtype=torch.float32)
    Y_tensor = torch.tensor(Y, dtype=torch.float32)
    input_size = X.shape[1]
    model = AdvancedNN(input_size)
    train_nn(model, X_tensor, Y_tensor)
    model.eval()
    explainer = shap.DeepExplainer(model, X_tensor)
    shap_values = explainer.shap_values(X_tensor)
    feature_names = [f"指标{i+1}" for i in range(input_size)]
    shap.summary_plot(shap_values, X, feature_names=feature_names)

def explain_model_gui():
    explain_model()

# ----------------------------
# IP交叉分析函数（PCA+KMeans+凸包）
# ----------------------------
def cross_analysis():
    global ips
    if len(ips) < 2:
        messagebox.showwarning("警告", "至少需要2个IP进行交叉分析。")
        return
    data = np.array([ip[2] for ip in ips], dtype=np.float32)
    if data.shape[1] < 2:
        messagebox.showwarning("警告", "当前仅有1个指标，无法进行交叉分析。")
        return
    # 数据归一化处理
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)
    
    # PCA 降维到2D
    pca = PCA(n_components=2)
    data_2d = pca.fit_transform(data_scaled)

    k = simpledialog.askinteger("聚类参数", "请输入聚类数：", initialvalue=2, minvalue=2, maxvalue=len(ips))
    if k is None:
        return
    kmeans = KMeans(n_clusters=k, random_state=42)
    clusters = kmeans.fit_predict(data_2d)

    cross_window = tk.Toplevel(root)
    cross_window.title("IP交叉分析结果 - (PCA + KMeans)")
    fig, ax = plt.subplots(figsize=(8, 6))
    cmap = plt.cm.get_cmap("Spectral", k)
    # 对每个聚类绘制散点和凸包
    for cluster_id in range(k):
        cluster_indices = (clusters == cluster_id)
        points = data_2d[cluster_indices]
        if len(points) == 0:
            continue
        color = cmap(cluster_id)
        ax.scatter(points[:, 0], points[:, 1], s=120, alpha=0.8, c=[color], label=f"簇 {cluster_id+1}")
        if len(points) > 2:
            hull = ConvexHull(points)
            hull_pts = points[hull.vertices]
            hull_pts = np.concatenate([hull_pts, hull_pts[:1]], axis=0)
            ax.fill(hull_pts[:,0], hull_pts[:,1], facecolor=color, alpha=0.2)
    for i, ip in enumerate(ips):
        ax.annotate(ip[0], (data_2d[i,0], data_2d[i,1]), fontsize=10)
    ax.set_xlabel("PCA 1", fontsize=12)
    ax.set_ylabel("PCA 2", fontsize=12)
    ax.set_title("IP交叉分析（PCA + KMeans）", fontsize=14)
    ax.legend(loc="best", fontsize=10)
    canvas = FigureCanvasTkAgg(fig, master=cross_window)
    canvas.draw()
    canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

# ----------------------------
# GUI主函数
# ----------------------------
def start_simulation():
    global root, ips, history
    root = tk.Tk()
    root.title("少数民族民俗体育IP综合评估与排序模拟器")
    root.geometry("1600x900")
    root.style = ttk.Style()
    root.style.theme_use('clam')
    root.style.configure("TFrame", background="#f7f7f7")
    root.style.configure("TLabel", background="#f7f7f7", font=("Segoe UI", 10))
    root.style.configure("TButton", font=("Segoe UI", 10, "bold"))
    root.style.configure("Red.TButton", foreground="white", background="red", font=("Segoe UI", 10, "bold"))

    # 定义各级指标映射
    first_level = ["文化价值", "市场潜力", "社会效益", "创新性"]
    second_level = ["历史继承性", "民族特色", "文化传播力", "社会认同感",
                    "市场需求", "竞争环境", "商业化路径", "文化传承",
                    "社会影响力", "技术创新", "模式创新", "传播创新"]
    first_to_second = {
        "文化价值": ["历史继承性", "民族特色", "文化传播力", "社会认同感"],
        "市场潜力": ["市场需求", "竞争环境", "商业化路径"],
        "社会效益": ["文化传承", "社会影响力"],
        "创新性": ["技术创新", "模式创新", "传播创新"]
    }
    second_to_third = {
        "历史继承性": ["历史渊源", "文化象征性", "民族记忆"],
        "民族特色": ["独特性", "跨民族文化联系", "跨民族文化认同"],
        "文化传播力": ["传播渠道", "媒体关注度", "跨平台传播"],
        "社会认同感": ["社会关注度", "民众参与度", "政府支持度"],
        "市场需求": ["消费者需求", "市场成熟度"],
        "竞争环境": ["市场增长潜力", "竞争者数量", "竞争者创新能力"],
        "商业化路径": ["竞争壁垒", "商业模式多样性", "品牌价值", "合作机会"],
        "文化传承": ["民族文化传承", "民族文化融合", "民族自豪感"],
        "社会影响力": ["教育意义", "社会和谐"],
        "技术创新": ["规则创新", "场地设备创新"],
        "模式创新": ["商业化创新", "跨界合作创新"],
        "传播创新": ["媒体传播创新", "社交平台创新"]
    }
    all_third = ["历史渊源", "文化象征性", "民族记忆", "独特性", "跨民族文化联系", "跨民族文化认同",
                 "传播渠道", "媒体关注度", "跨平台传播", "社会关注度", "民众参与度", "政府支持度",
                 "消费者需求", "市场成熟度", "市场增长潜力", "竞争者数量", "竞争者创新能力",
                 "竞争壁垒", "商业模式多样性", "品牌价值", "合作机会", "民族文化传承", "民族文化融合",
                 "民族自豪感", "教育意义", "社会和谐", "规则创新", "场地设备创新", "商业化创新",
                 "跨界合作创新", "媒体传播创新", "社交平台创新"]

    global ips, history
    ips = [
    ('刁羊', '莎车县', [87.2, 8.2, 87.2, 87.2, 87.2, 84.2, 84.2, 88.0, 84.0, 81.8, 80.6, 83.5, 83.7, 87.9, 85.0, 86.8, 82.1, 8.5, 90.2, 85.0, 84.9, 86.5, 82.9, 87.6, 85.8, 87.3, 86.0, 85.8, 83.4, 85.9, 82.9, 85.6]),
    ('赛马', '莎车县', [87.2, 87.2, 8.2, 87.2, 87.2, 84.2, 84.2, 88.0, 84.0, 81.8, 80.6, 83.5, 83.7, 87.9, 85.0, 86.8, 8.1, 84.5, 90.2, 85.0, 84.9, 86.5, 82.9, 87.6, 85.8, 87.3, 86.0, 85.8, 83.4, 85.9, 82.9, 85.6]),
    ('达瓦孜', '莎车县', [89.3, 89.3, 89.3, 89.3, 89.3, 86.8, 85.0, 88.3, 88.4, 85.5, 86.0, 87.4, 84.6, 85.0, 86.2, 84.3, 8.0, 88.9, 86.3, 86.4, 88.2, 85.1, 84.9, 86.0, 88.1, 88.5, 87.4, 86.1, 86.0, 87.0, 87.2, 86.5]),
    ('赛马', '莎车县', [87.8, 8.6, 88.0, 86.2, 87.2, 85.4, 83.9, 89.2, 86.3, 84.1, 85.9, 86.5, 83.7, 85.2, 84.7, 83.4, 87.0, 84.3, 88.4, 86.9, 89.2, 85.6, 87.0, 86.3, 85.8, 87.6, 88.0, 87.5, 88.3, 87.9, 88.3, 85.9]),
    ('刁羊', '泽普县', [87.2, 8.2, 87.2, 87.2, 87.2, 83.9, 85.1, 83.4, 82.5, 82.5, 83.3, 85.4, 83.6, 84.4, 83.1, 85.6, 82.6, 84.3, 84.1, 81.9, 84.6, 84.6, 83.6, 83.4, 87.0, 85.1, 86.2, 84.6, 86.0, 87.7, 81.8, 86.3]),
    ('赛马', '泽普县', [86.8, 8.0, 87.3, 86.9, 87.1, 85.7, 85.9, 86.1, 86.4, 85.5, 86.3, 86.2, 85.4, 85.8, 86.1, 85.9, 86.3, 86.4, 86.2, 85.8, 86.0, 85.7, 86.4, 85.5, 85.9, 85.8, 86.3, 85.6, 8.9, 86.0, 85.3, 86.1]),
    ('押加', '泽普县', [87.2, 8.2, 87.2, 87.2, 87.2, 84.1, 84.3, 83.7, 85.5, 85.3, 84.9, 85.1, 85.0, 85.8, 85.1, 85.2, 85.3, 85.7, 85.2, 85.0, 85.3, 85.4, 85.5, 85.7, 85.1, 85.0, 84.8, 85.6, 85.8, 85.2, 8.3, 85.7]),
    ('刁羊', '叶城县', [89.3, 8.3, 89.3, 89.3, 89.3, 86.0, 85.5, 84.3, 85.2, 85.3, 84.7, 86.0, 83.9, 85.0, 84.8, 85.6, 85.0, 85.2, 86.1, 85.7, 85.9, 85.2, 84.9, 85.5, 86.0, 85.8, 86.2, 86.0, 85.8, 86.3, 86.0, 86.1]),
    ('赛马', '叶城县', [88.0, 8.1, 87.9, 88.0, 87.8, 85.7, 86.3, 86.1, 86.4, 86.0, 86.3, 86.5, 86.1, 86.2, 86.3, 86.4, 86.2, 8.0, 86.1, 86.3, 86.5, 86.2, 86.1, 86.0, 86.3, 86.4, 86.2, 86.3, 86.4, 86.3, 86.4, 86.3]),
    ('押加', '叶城县', [87.5, 87.7, 8.9, 87.6, 87.8, 86.3, 86.2, 86.1, 86.4, 86.0, 86.1, 86.3, 85.9, 86.0, 86.1, 86.2, 86.4, 8.3, 86.2, 86.1, 86.5, 86.3, 86.2, 86.0, 86.3, 86.4, 86.2, 86.3, 86.5, 86.4, 86.2, 86.3]),
    ('刁羊', '巴楚县', [89.3, 89.3, 89.3, 89.3, 89.3, 87.6, 84.9, 82.3, 87.7, 85.1, 87.1, 81.0, 81.5, 86.1, 84.3, 84.6, 83.8, 8.7, 83.6, 82.8, 84.7, 85.2, 88.1, 80.9, 85.2, 82.1, 84.6, 86.2, 87.5, 85.1, 85.2, 85.1]),
    ('赛骆驼', '巴楚县', [90.3, 89.3, 89.3, 89.3, 89.3, 87.6, 85.9, 83.4, 85.5, 86.0, 86.1, 85.2, 85.3, 85.6, 85.5, 85.1, 85.2, 85.3, 85.1, 84.9, 85.2, 85.5, 85.3, 85.2, 85.4, 85.6, 85.5, 85.3, 85.1, 85.0, 85.3, 85.4]),
    ('押加', '巴楚县', [87.9, 87.7, 87.8, 87.9, 87.8, 86.3, 86.2, 85.6, 85.9, 86.0, 86.2, 85.8, 86.1, 85.7, 85.5, 8.6, 85.7, 85.5, 85.8, 85.7, 86.0, 85.9, 85.7, 86.1, 86.3, 86.0, 86.2, 86.1, 86.4, 86.1, 86.2, 86.3])

    # 你可以继续添加其他县的数据
]

    history = []

    main_frame = ttk.Frame(root)
    main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
    main_frame.columnconfigure(0, weight=0)
    main_frame.columnconfigure(1, weight=0)
    main_frame.columnconfigure(2, weight=1)

    # ----------------------
    # 左侧控制面板
    # ----------------------
    control_frame = ttk.Frame(main_frame)
    control_frame.grid(row=0, column=0, sticky="nswe", padx=5, pady=5)
    control_frame.columnconfigure(0, weight=1)

    filter_frame = ttk.LabelFrame(control_frame, text="筛选条件（一级 & 二级指标）", padding=(10, 10))
    filter_frame.grid(row=0, column=0, sticky="we", pady=5)
    filter_vars = {}
    row_idx = 0
    ttk.Label(filter_frame, text="一级指标：", font=("Segoe UI", 10, "bold")).grid(row=row_idx, column=0, sticky="w", pady=2)
    row_idx += 1
    for fl in first_level:
        var = tk.BooleanVar()
        chk = ttk.Checkbutton(filter_frame, text=fl, variable=var)
        chk.grid(row=row_idx, column=0, sticky="w", padx=10)
        filter_vars[fl] = var
        row_idx += 1
    row_idx += 1
    ttk.Label(filter_frame, text="二级指标：", font=("Segoe UI", 10, "bold")).grid(row=row_idx, column=0, sticky="w", pady=2)
    row_idx += 1
    for sl in second_level:
        var = tk.BooleanVar()
        chk = ttk.Checkbutton(filter_frame, text=sl, variable=var)
        chk.grid(row=row_idx, column=0, sticky="w", padx=10)
        filter_vars[sl] = var
        row_idx += 1

    input_frame = ttk.LabelFrame(control_frame, text="数据输入（三级指标）", padding=(10, 10))
    input_frame.grid(row=1, column=0, sticky="nswe", pady=5)
    canvas_input = tk.Canvas(input_frame)
    scrollbar_input = ttk.Scrollbar(input_frame, orient="vertical", command=canvas_input.yview)
    scrollable_input = ttk.Frame(canvas_input)
    scrollable_input.bind("<Configure>", lambda e: canvas_input.configure(scrollregion=canvas_input.bbox("all")))
    canvas_input.create_window((0, 0), window=scrollable_input, anchor="nw")
    canvas_input.configure(yscrollcommand=scrollbar_input.set)
    canvas_input.pack(side="left", fill=tk.BOTH, expand=True)
    scrollbar_input.pack(side="right", fill="y")

    third_entries = {}
    current_third_list = list(all_third)

    def updateThirdInputs(*args):
        nonlocal current_third_list
        saved_values = {}
        for key, entry in third_entries.items():
            saved_values[key] = entry.get()
        for widget in scrollable_input.winfo_children():
            widget.destroy()
        third_entries.clear()
        allowed_second = set()
        for fl in first_level:
            if filter_vars[fl].get():
                allowed_second.update(first_to_second[fl])
        for sl in second_level:
            if filter_vars[sl].get():
                allowed_second.add(sl)
        if not allowed_second:
            allowed_second.update(second_level)
        allowed_third = []
        for sl in second_level:
            if sl in allowed_second:
                allowed_third.extend(second_to_third[sl])
        current_third_list = [ind for ind in all_third if ind in allowed_third]
        for i, label_text in enumerate(current_third_list):
            ttk.Label(scrollable_input, text=label_text, font=("Segoe UI", 10)).grid(row=i, column=0, padx=5, pady=5, sticky='w')
            entry = ttk.Entry(scrollable_input, font=("Segoe UI", 10))
            entry.grid(row=i, column=1, padx=5, pady=5)
            if label_text in saved_values:
                entry.insert(0, saved_values[label_text])
            third_entries[label_text] = entry

    for var in filter_vars.values():
        var.trace_add("write", updateThirdInputs)
    updateThirdInputs()

    button_frame = ttk.Frame(control_frame)
    button_frame.grid(row=2, column=0, sticky="we", pady=5)

    list_frame = ttk.LabelFrame(control_frame, text="IP 列表", padding=(10, 10))
    list_frame.grid(row=3, column=0, sticky="nswe", pady=5)
    ip_list = tk.Listbox(list_frame, selectmode="extended", width=30, height=8, font=("Segoe UI", 10))
    ip_list.pack(fill=tk.BOTH, expand=True)

    def check_third_entries():
        for key, entry in third_entries.items():
            if entry.get().strip() == "":
                return False, key
        return True, ""

    def add_ip():
        valid, missing = check_third_entries()
        if not valid:
            messagebox.showerror("输入错误", f"请填写所有三级指标，缺少：{missing}")
            return
        try:
            indicators = [float(third_entries[ind].get()) for ind in current_third_list]
            if len(indicators) < 2:
                messagebox.showwarning("提示", "当前仅选择了1个指标，交叉分析和SHAP解释将无意义，请至少选择2个指标。")
            name = simpledialog.askstring("输入", "请为该IP输入名称：")
            if not name:
                return
            group = simpledialog.askstring("输入", "请为该IP输入组别：")
            if not group:
                group = "默认"
            if name in [ip[0] for ip in ips]:
                messagebox.showwarning("警告", "该名称已存在，请输入唯一名称。")
                return
            ips.append((name, group, indicators))
            update_ip_list()
            messagebox.showinfo("添加成功", f"IP '{name}' (组别：{group}) 已添加。")
        except ValueError:
            messagebox.showerror("输入错误", "请确保所有评分为数字格式。")

    def update_ip_list():
        ip_list.delete(0, tk.END)
        for name, group, data in ips:
            ip_list.insert(tk.END, f"{name} ({group}): {data}")

    def delete_ip():
        selected = ip_list.curselection()
        if not selected:
            messagebox.showwarning("警告", "请选择要删除的IP。")
            return
        index = selected[0]
        del ips[index]
        update_ip_list()
        evaluate_ips()

    def modify_ip():
        selected = ip_list.curselection()
        if not selected:
            messagebox.showwarning("警告", "请选择要修改的IP。")
            return
        valid, missing = check_third_entries()
        if not valid:
            messagebox.showerror("输入错误", f"请填写所有三级指标，缺少：{missing}")
            return
        index = selected[0]
        try:
            indicators = [float(third_entries[ind].get()) for ind in current_third_list]
            name, group, _ = ips[index]
            ips[index] = (name, group, indicators)
            update_ip_list()
            messagebox.showinfo("修改成功", "IP已修改。")
        except ValueError:
            messagebox.showerror("输入错误", "请确保所有评分为数字格式。")
            return

    def test_program():
        for i in range(10):
            for key in current_third_list:
                third_entries[key].delete(0, tk.END)
                third_entries[key].insert(0, str(round(random.uniform(0, 10), 2)))
            name = f"TestIP_{i+1}"
            group = f"组{i+1}"
            try:
                indicators = [float(third_entries[ind].get()) for ind in current_third_list]
            except ValueError:
                continue
            ips.append((name, group, indicators))
            update_ip_list()
        res = messagebox.askyesno("测试完成", "已自动生成10组测试数据，是否展示可视化测试结果？")
        if res:
            evaluate_ips()

    def explain_model_gui():
        explain_model()

    # 中间组别筛选区域
    group_frame = ttk.Frame(main_frame, width=150)
    group_frame.grid(row=0, column=1, sticky="n", padx=5, pady=5)
    group_frame.grid_propagate(False)
    ttk.Label(group_frame, text="选择组别：", font=("Segoe UI", 12, "bold")).pack(padx=5, pady=5)
    group_var = tk.StringVar()
    group_combobox = ttk.Combobox(group_frame, textvariable=group_var, state="readonly", width=12)
    group_combobox['values'] = ["全部"]
    group_combobox.current(0)
    group_combobox.pack(padx=5, pady=5)
    def update_group_options():
        groups = set([group for (_, group, _) in ips])
        options = ["全部"] + sorted(groups)
        group_combobox['values'] = options
    def filter_by_group():
        evaluate_ips(filtered_group=group_combobox.get())
    red_button = ttk.Button(group_frame, text="筛选组别", style="Red.TButton", command=filter_by_group)
    red_button.pack(padx=5, pady=5)

    # 右侧展示区域（2×2网格）
    display_frame = ttk.Frame(main_frame)
    display_frame.grid(row=0, column=2, sticky="nsew", padx=5, pady=5)
    display_frame.rowconfigure(0, weight=1)
    display_frame.rowconfigure(1, weight=1)
    display_frame.columnconfigure(0, weight=1)
    display_frame.columnconfigure(1, weight=1)

    # 图表1：适应度变化曲线
    chart_frame1 = ttk.LabelFrame(display_frame, text="适应度变化曲线", padding=(10, 10))
    chart_frame1.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
    fig1, ax1 = plt.subplots(figsize=(5, 3))
    ax1.set_xlabel('迭代次数', fontsize=12)
    ax1.set_ylabel('适应度', fontsize=12)
    ax1.set_title('适应度变化曲线', fontsize=14)
    canvas_chart1 = FigureCanvasTkAgg(fig1, master=chart_frame1)
    canvas_chart1.draw()
    canvas_chart1.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    # 图表2：IP评分分布（带误差条）
    chart_frame2 = ttk.LabelFrame(display_frame, text="IP评分分布", padding=(10, 10))
    chart_frame2.grid(row=0, column=1, sticky="nsew", padx=5, pady=5)
    fig2, ax2 = plt.subplots(figsize=(5, 3))
    ax2.set_xlabel('IP项目', fontsize=12)
    ax2.set_ylabel('评分', fontsize=12)
    ax2.set_title('IP评分分布', fontsize=14)
    canvas_chart2 = FigureCanvasTkAgg(fig2, master=chart_frame2)
    canvas_chart2.draw()
    canvas_chart2.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    # 图表3：重要指标影响（雷达图）
    chart_frame3 = ttk.LabelFrame(display_frame, text="重要指标影响", padding=(10, 10))
    chart_frame3.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)
    fig3, ax3 = plt.subplots(figsize=(5, 3), subplot_kw=dict(polar=True))
    ax3.set_title("重要指标影响", fontsize=14)
    canvas_chart3 = FigureCanvasTkAgg(fig3, master=chart_frame3)
    canvas_chart3.draw()
    canvas_chart3.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    # 计算日志区域
    log_frame = ttk.LabelFrame(display_frame, text="计算过程日志", padding=(10, 10))
    log_frame.grid(row=1, column=1, sticky="nsew", padx=5, pady=5)
    log_box = scrolledtext.ScrolledText(log_frame, wrap=tk.WORD, font=("Segoe UI", 10))
    log_box.tag_configure("center", justify='center')
    log_box.pack(fill=tk.BOTH, expand=True)

    # 顶部每日更新区域
    top_chat_frame = ttk.LabelFrame(root, text="每日新疆体育咨询", padding=(10, 10))
    top_chat_frame.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
    chat_box = scrolledtext.ScrolledText(top_chat_frame, height=4, wrap=tk.WORD, font=("Segoe UI", 10))
    chat_box.tag_configure("center", justify='center')
    chat_box.pack(fill=tk.BOTH, expand=True)
    push_daily_updates(chat_box)

    # 评估函数：更新图表和日志，支持筛选组别
    def evaluate_ips(filtered_group="全部"):
        if filtered_group == "全部":
            ip_subset = ips
        else:
            ip_subset = [ip for ip in ips if ip[1] == filtered_group]
        if len(ip_subset) < 2:
            messagebox.showwarning("警告", "IP数量太少（<2），请添加更多IP再评估。")
            return

        dim = len(ip_subset[0][2])
        ahp_matrix = np.ones((dim, dim))
        weights = ahp_weights(ahp_matrix)

        data = np.array([ip[2] for ip in ip_subset], dtype=np.float32)
        iterations = 50
        fitness_history = genetic_algorithm_per_ip(data.copy(), weights, iterations=iterations)
        history.append((ip_subset.copy(), fitness_history.copy()))

        # (1) 适应度变化曲线
        ax1.clear()
        for i in range(fitness_history.shape[1]):
            ax1.plot(range(iterations), fitness_history[:, i],
                     label=ip_subset[i][0],
                     marker='o', linestyle='-')
        ax1.set_xlabel('迭代次数', fontsize=12)
        ax1.set_ylabel('适应度', fontsize=12)
        ax1.set_title('适应度变化曲线', fontsize=14)
        ax1.legend(loc='upper right', bbox_to_anchor=(1.3, 1))
        ax1.grid(True)
        canvas_chart1.draw()

        # (2) IP评分分布（带误差条）
        ax2.clear()
        scores = [np.dot(ip[2], weights) for ip in ip_subset]
        errors = [np.std(fitness_history[:, i]) for i in range(len(ip_subset))]
        ax2.bar(range(len(ip_subset)),
                scores,
                yerr=errors,
                capsize=5,
                tick_label=[ip[0] for ip in ip_subset],
                color='skyblue',
                edgecolor='black')
        ax2.set_xlabel('IP项目', fontsize=12)
        ax2.set_ylabel('评分', fontsize=12)
        ax2.set_title('IP评分分布', fontsize=14)
        ax2.grid(True, axis='y')
        canvas_chart2.draw()

        # (3) 重要指标影响雷达图
        ax3.clear()
        angles = np.linspace(0, 2*np.pi, len(first_level), endpoint=False).tolist()
        angles += angles[:1]
        for ip_name, _, ip_data in ip_subset:
            aggregated = []
            for f in first_level:
                indices = []
                for s in first_to_second[f]:
                    if s in second_to_third:
                        for t in second_to_third[s]:
                            if t in current_third_list:
                                indices.append(current_third_list.index(t))
                if indices:
                    aggregated.append(np.mean([ip_data[i] for i in indices]))
                else:
                    aggregated.append(0)
            aggregated = aggregated + aggregated[:1]
            ax3.plot(angles, aggregated, label=ip_name, marker='o')
            ax3.fill(angles, aggregated, alpha=0.25)
        ax3.set_xticks(angles[:-1])
        ax3.set_xticklabels(first_level, fontsize=10)
        ax3.set_yticklabels([])
        ax3.set_title("重要指标影响", fontsize=14)
        ax3.legend(loc='upper right', bbox_to_anchor=(1.3, 1))
        ax3.grid(True)
        canvas_chart3.draw()

        # (4) 更新日志
        log_box.delete('1.0', tk.END)
        log_box.insert(tk.END, f"使用AHP计算权重（维度={dim}）：\n{weights}\n", "center")
        log_box.insert(tk.END, f"初始数据：\n{data}\n", "center")
        log_box.insert(tk.END, "遗传算法适应度变化过程如下：\n", "center")
        for i in range(fitness_history.shape[0]):
            log_box.insert(tk.END, f"迭代 {i+1}: {fitness_history[i]}\n", "center")
        result_text = "IP评估结果:\n"
        for name, score in zip([ip[0] for ip in ip_subset], scores):
            result_text += f"{name}: 综合评分 = {score:.2f}\n"
        log_box.insert(tk.END, result_text, "center")
        update_group_options()

    def optimize_with_nn():
        if len(ips) < 10:
            messagebox.showwarning("警告", "至少需要10个IP进行优化。")
            return
        try:
            data = np.array([ip[2] for ip in ips], dtype=np.float32)
            data_tensor = torch.tensor(data, dtype=torch.float32)
            actual_scores = np.random.rand(len(ips), 1) * 10
            targets_tensor = torch.tensor(actual_scores, dtype=torch.float32)
            input_size = data.shape[1]
            model = AdvancedNN(input_size)
            train_nn(model, data_tensor, targets_tensor)
            model.eval()
            with torch.no_grad():
                predicted_scores = model(data_tensor).numpy().flatten()
            log_box.insert(tk.END, "神经网络优化完成，预测评分如下：\n", "center")
            for name, score in zip([ip[0] for ip in ips], predicted_scores):
                log_box.insert(tk.END, f"{name}: 预测评分 = {score:.2f}\n", "center")
            messagebox.showinfo("优化完成", "神经网络优化已完成，详情请见计算过程日志。")
        except Exception as e:
            messagebox.showerror("错误", f"优化过程中出现问题：{e}")

    def view_history():
        if not history:
            messagebox.showinfo("无记录", "没有历史记录可供查看。")
            return
        def select_history():
            selected_index = history_listbox.curselection()
            if not selected_index:
                messagebox.showinfo("提示", "请选择一个历史记录。")
                return
            idx = selected_index[0]
            previous_ips, previous_fitness = history[idx]
            ax1.clear()
            ax1.plot(previous_fitness, label=f'历史适应度变化 (记录 {idx+1})')
            ax1.set_xlabel('迭代次数', fontsize=12)
            ax1.set_ylabel('适应度', fontsize=12)
            ax1.set_title(f'历史适应度变化曲线 - 记录 {idx+1}', fontsize=14)
            ax1.legend()
            canvas_chart1.draw()
            history_window.destroy()
        history_window = tk.Toplevel(root)
        history_window.title("查看历史记录")
        history_listbox = tk.Listbox(history_window, width=50, height=10)
        history_listbox.pack(fill=tk.BOTH, expand=True)
        for idx, (ips_data, _) in enumerate(history):
            history_listbox.insert(tk.END, f"记录 {idx+1}: {len(ips_data)} 个IP")
        select_button = ttk.Button(history_window, text="选择", command=select_history)
        select_button.pack(pady=5)

    # 左侧操作按钮
    ttk.Button(button_frame, text="添加IP", command=add_ip).grid(row=0, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="修改IP", command=modify_ip).grid(row=1, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="删除IP", command=delete_ip).grid(row=2, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="评估IP", command=lambda: evaluate_ips()).grid(row=3, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="优化评分", command=lambda: optimize_with_nn()).grid(row=4, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="查看历史", command=lambda: view_history()).grid(row=5, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="测试程序", command=test_program).grid(row=6, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="解释模型", command=explain_model_gui).grid(row=7, column=0, padx=5, pady=3, sticky="we")
    ttk.Button(button_frame, text="交叉分析", command=cross_analysis).grid(row=8, column=0, padx=5, pady=3, sticky="we")

    root.mainloop()

def main():
    start_simulation()

if __name__ == "__main__":
    main()
