# Excel导入功能使用说明

## 功能概述

Excel导入功能支持导入专家评分数据，自动为每个专家创建独立的IP记录。**🆕 新增地址字段支持：可以导入province、city、district字段，系统会自动拼接完整地址。**

## Excel文件格式要求

### 必需列

1. **expert**：专家名称列
   - 包含专家的姓名或标识

2. **project_name**：项目名称列
   - 包含IP项目的名称

3. **group_name**：组别名称列
   - 指定IP所属的组别

4. **指标评分列**：各指标的评分数据
   - 列名应为系统中定义的32个三级指标的英文属性名
   - 评分范围建议：0-100

### 可选地址列（🆕 新增功能）

5. **province**：省份列
   - 项目所在的省份，如：广东省、新疆维吾尔自治区

6. **city**：城市列  
   - 项目所在的城市，如：广州市、乌鲁木齐市

7. **district**：区县列
   - 项目所在的区县，如：越秀区、天山区

8. **full_address**：完整地址列（可选）
   - 如果提供此列，将直接使用该地址
   - 如果未提供，系统会自动拼接 province + city + district

### 🎯 地址处理逻辑

- **自动拼接**：如果没有 `full_address` 列，系统会自动将 `province`、`city`、`district` 拼接成完整地址
- **智能过滤**：空白的地址字段会被自动忽略
- **示例拼接**：
  - 输入：province="广东省", city="广州市", district="越秀区"
  - 输出：full_address="广东省 广州市 越秀区"

### 示例格式

```csv
expert,project_name,group_name,province,city,district,historicalOrigin,culturalSymbolism,ethnicMemory,...
张教授,足球,测试组_3,广东省,广州市,越秀区,79,96,38,...
李专家,篮球,测试组_1,新疆维吾尔自治区,乌鲁木齐市,天山区,85,87,84,...
王研究员,乒乓球,测试组_2,,,天山区,90,88,92,...
```

## 支持的数据格式

系统支持多种Excel数据格式：

### 1. 新格式（推荐）：专家-项目-指标格式
每行包含一个专家对一个项目的完整评分数据，支持地址信息。

### 2. 混合格式：项目-指标-专家矩阵格式  
每行包含一个项目的一个指标，多个专家的评分在不同列中。

### 3. 项目基础格式
每行包含一个项目，多个专家评分在不同列中。

### 4. 传统格式：指标基础格式
每行包含一个指标，多个专家评分在不同列中。

## 系统支持的32个三级指标

### 文化价值类
1. historicalOrigin (历史渊源)
2. culturalSymbolism (文化象征性)
3. ethnicMemory (民族记忆)
4. uniqueness (独特性)
5. interEthnicCulturalConnection (跨民族文化联系)
6. interEthnicCulturalIdentity (跨民族文化认同)
7. communicationChannels (传播渠道)
8. mediaAttention (媒体关注度)
9. crossPlatformCommunication (跨平台传播)
10. socialAttention (社会关注度)
11. publicParticipation (民众参与度)
12. governmentSupport (政府支持度)

### 市场潜力类
13. consumerDemand (消费者需求)
14. marketMaturity (市场成熟度)
15. marketGrowthPotential (市场增长潜力)
16. competitorCount (竞争者数量)
17. competitorInnovationCapability (竞争者创新能力)
18. competitiveBarriers (竞争壁垒)
19. businessModelDiversity (商业模式多样性)
20. brandValue (品牌价值)
21. cooperationOpportunities (合作机会)

### 社会效益类
22. ethnicCulturalHeritage (民族文化传承)
23. ethnicCulturalIntegration (民族文化融合)
24. ethnicPride (民族自豪感)
25. educationalSignificance (教育意义)
26. socialHarmony (社会和谐)

### 创新性类
27. ruleInnovation (规则创新)
28. venueEquipmentInnovation (场地设备创新)
29. commercializationInnovation (商业化创新)
30. crossSectorCooperationInnovation (跨界合作创新)
31. mediaCommunicationInnovation (媒体传播创新)
32. socialPlatformInnovation (社交平台创新)

## 导入结果

导入成功后，系统将：

1. **创建IP记录**：为每个专家创建一个独立的IP记录
2. **地址信息**：自动处理和拼接地址信息，在地图上显示项目分布
3. **评分映射**：将专家评分按指标映射到系统的32个指标位置
4. **错误处理**：报告导入过程中的任何错误

## 使用步骤

1. 准备Excel文件（.xlsx或.xls格式）
2. 确保文件包含必需列：expert、project_name、group_name
3. 可选添加地址列：province、city、district 
4. 包含指标评分数据（使用英文属性名作为列名）
5. 在IP管理页面点击"Excel导入"按钮
6. 选择准备好的Excel文件
7. 等待导入完成，查看导入结果日志

## 🆕 地址功能优势

- **地图可视化**：导入的项目将在Dashboard地图上显示分布情况
- **区域分析**：支持按省份、城市、区县进行数据分析
- **钻取功能**：可以从省份钻取到城市，再到区县级别
- **项目定位**：每个项目都有明确的地理位置信息

## 注意事项

1. **指标完整性**：建议包含所有32个系统指标的评分数据
2. **数据格式**：评分必须为数字格式
3. **指标匹配**：指标列名建议使用英文属性名以确保准确匹配
4. **文件大小**：支持最大10MB的文件
5. **地址格式**：地址字段支持中文，会自动处理空格和格式
6. **重复处理**：如果存在同名专家+项目+组别的记录，将更新现有记录

## 错误排查

### 常见错误及解决方案

1. **"未找到必要信息"**
   - 检查expert、project_name、group_name列是否存在且不为空

2. **"指标评分无效"**
   - 确认指标列的数值为有效数字格式
   - 检查列名是否与系统指标属性名匹配

3. **"地址信息格式错误"**
   - 确认地址字段为文本格式
   - 省份名称使用标准格式（如：广东省、新疆维吾尔自治区）

4. **"无法识别Excel数据结构"**
   - 确认使用推荐的专家-项目-指标格式
   - 检查必需列名是否正确

## 测试文件示例

**民族体育项目打分汇总表_new.xlsx** 格式示例：

| expert | project_name | group_name | province | city | district | historicalOrigin | culturalSymbolism | ... |
|--------|-------------|------------|----------|------|----------|------------------|-------------------|-----|
| 张教授 | 足球 | 测试组_3 | 广东省 | 广州市 | 越秀区 | 79 | 96 | ... |
| 李专家 | 赛马 | 传统体育 | 新疆维吾尔自治区 | 乌鲁木齐市 | 天山区 | 85 | 87 | ... | 