# JSON Table Viewer

一个功能强大的 VS Code 插件，可以将 JSON 数据以交互式表格形式展示，自动支持 Light/Dark 主题。

## ✨ 功能特性

- 📊 **表格展示**: 将 JSON 数组或对象以清晰的表格形式展示
- 🎨 **主题支持**: 完美支持 VS Code 的 Light 和 Dark 主题，自动适配
- 🔍 **搜索功能**: 实时搜索表格内容，高亮显示匹配结果
- 📦 **嵌套对象**: 支持展开/折叠嵌套的对象和数组
- 🎯 **多种触发方式**: 
  - 命令面板
  - 右键菜单
  - 编辑器标题栏图标
  - 选中文本查看
- 🌈 **类型着色**: 不同数据类型使用不同颜色显示（数字、字符串、布尔值、null等）
- 📈 **数据统计**: 显示总行数和列数
- 🖱️ **交互体验**: 鼠标悬停高亮行，粘性表头方便滚动查看

## 🚀 使用方法

### 方法一：命令面板
1. 打开 JSON 文件
2. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
3. 输入 "View as Table" 并选择命令

### 方法二：右键菜单
1. 在 JSON 文件中右键点击
2. 选择 "View as Table"

### 方法三：编辑器标题栏
1. 打开 JSON 文件
2. 点击编辑器标题栏的表格图标

### 方法四：查看选中的 JSON
1. 选中任意 JSON 文本（即使在非 JSON 文件中）
2. 右键选择 "View Selection as Table"

## 📋 支持的 JSON 格式

### 数组格式（推荐）
```json
[
  {
    "id": 1,
    "name": "张三",
    "age": 28,
    "active": true
  },
  {
    "id": 2,
    "name": "李四",
    "age": 32,
    "active": false
  }
]
```

### 对象格式
```json
{
  "name": "张三",
  "age": 28,
  "email": "zhangsan@example.com"
}
```

### 嵌套对象
```json
[
  {
    "id": 1,
    "name": "张三",
    "address": {
      "city": "北京",
      "country": "中国"
    }
  }
]
```

## 🎯 主要功能说明

### 1. 智能表格生成
- 自动提取所有唯一键作为列
- 处理不同数据结构（数组、对象、原始值）
- 自动编号每一行

### 2. 数据类型可视化
- **数字**: 使用专用颜色显示
- **字符串**: 使用字符串颜色
- **布尔值**: true/false 用布尔值颜色
- **null/undefined**: 斜体警告色
- **对象/数组**: 可展开查看完整 JSON

### 3. 搜索与过滤
- 实时搜索所有单元格内容
- 自动高亮匹配结果
- 支持大小写不敏感搜索

### 4. 主题自适应
插件使用 VS Code 的 CSS 变量，完全自适应当前主题：
- `--vscode-foreground`: 前景色
- `--vscode-editor-background`: 背景色
- `--vscode-panel-border`: 边框色
- 以及其他所有 VS Code 主题变量

## 📦 安装与运行

### 开发模式测试
1. 在 VS Code 中打开此项目
2. 按 `F5` 启动扩展开发主机
3. 在新窗口中打开 `sample.json` 文件
4. 右键选择 "View as Table" 或点击编辑器标题栏的表格图标

### 打包安装
```bash
# 安装 vsce
npm install -g @vscode/vsce

# 打包
vsce package

# 安装生成的 .vsix 文件
code --install-extension json-table-viewer-0.0.1.vsix
```

## 🔧 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 运行测试
npm test
```

## 📝 更新日志

### 0.0.1
- ✨ 初始版本发布
- 📊 支持 JSON 表格展示
- 🎨 Light/Dark 主题支持
- 🔍 搜索功能
- 📦 嵌套对象展开

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**享受使用 JSON Table Viewer! 🎉**
