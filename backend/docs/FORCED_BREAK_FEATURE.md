# 强制休息功能文档

## 功能概述

强制休息功能确保用户在连续学习一定时间后必须休息，以保护用户的健康和提高学习效率。当用户连续学习时间达到设定的阈值（默认60分钟）时，系统会自动强制用户进入休息模式。

## 功能特性

- **连续学习时间监控**: 实时跟踪用户的连续学习时间
- **自动强制休息**: 达到时间限制时自动触发休息模式
- **文字和语音提醒**: 提供多种形式的休息提醒
- **可配置的时间设置**: 支持自定义学习时长和休息时长
- **WebSocket实时通知**: 通过WebSocket向前端发送实时通知

## 配置参数

### 用户配置（ChildProfile）

- `workDurationBeforeForcedBreak`: 强制休息前的连续学习时长（分钟），默认60分钟
- `forcedBreakDuration`: 强制休息的持续时间（分钟），默认10分钟

### 默认配置位置

- `src/types/index.ts`: 系统默认配置
- `src/controllers/user.controller.ts`: 用户创建时的默认值

## 核心文件

### 1. 强制休息服务 (`src/services/forcedBreak.service.ts`)

主要功能：
- 监控用户连续学习时间
- 触发强制休息
- 管理休息状态
- 发送通知

核心函数：
- `checkAndHandleForcedBreak()`: 检查并处理强制休息
- `onStudySessionStart()`: 学习会话开始回调
- `onStudySessionEnd()`: 学习会话结束回调
- `onUserBreak()`: 用户休息回调
- `onUserResumeFromBreak()`: 用户恢复学习回调

### 2. 实时服务更新 (`src/services/realtime.service.ts`)

新增功能：
- `sendForcedBreakNotificationToUser()`: 发送强制休息通知
- 集成强制休息检查到定时任务中

### 3. 会话控制器更新 (`src/controllers/session.controller.ts`)

集成强制休息回调：
- 学习开始时调用 `onStudySessionStart()`
- 学习结束时调用 `onStudySessionEnd()`
- 休息开始时调用 `onUserBreak()`
- 休息结束时调用 `onUserResumeFromBreak()`

## 工作流程

### 1. 学习会话开始
```
用户开始学习 → 调用 onStudySessionStart() → 记录开始时间
```

### 2. 连续学习监控
```
每秒检查 → checkAndHandleForcedBreak() → 计算连续学习时间
```

### 3. 强制休息触发
```
达到时间限制 → 发送通知 → 强制进入休息状态 → 设置休息结束定时器
```

### 4. 休息结束
```
休息时间到 → 自动恢复学习状态 → 重新开始计时
```

## WebSocket通知格式

### 强制休息通知
```json
{
  "type": "forced_break_notification",
  "breakData": {
    "message": "您已连续学习60分钟，系统将强制进入休息模式，请休息10分钟后再继续学习。",
    "workDuration": 60,
    "breakDuration": 10,
    "isForced": true,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 数据库变更

### StudySession模型
- `breakHistory`: 新增强制休息记录，类型为 'forced'
- `activeBreakType`: 当前休息类型，强制休息时为 'forced'

### 休息记录格式
```json
{
  "startTime": "2024-01-01T12:00:00.000Z",
  "endTime": "2024-01-01T12:10:00.000Z",
  "type": "forced"
}
```

## 前端集成指南

### 1. 监听WebSocket通知
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'forced_break_notification') {
    // 处理强制休息通知
    showForcedBreakModal(data.breakData);
    playBreakReminder(); // 播放语音提醒
  }
};
```

### 2. 显示休息提醒
```javascript
function showForcedBreakModal(breakData) {
  // 显示强制休息模态框
  // 显示休息倒计时
  // 禁用学习相关功能
}
```

### 3. 语音提醒
```javascript
function playBreakReminder() {
  // 播放语音提醒
  const audio = new Audio('/sounds/break-reminder.mp3');
  audio.play();
}
```

## 测试

### 运行测试
```bash
# 编译TypeScript
npm run build

# 运行测试（需要数据库连接）
node dist/test/forcedBreak.test.js
```

### 测试场景
1. 连续学习60分钟后自动触发强制休息
2. 强制休息期间无法继续学习
3. 休息结束后自动恢复学习状态
4. 主动休息重置连续学习时间
5. WebSocket通知正确发送

## 配置建议

### 不同年龄段的建议配置

- **幼儿园**: 连续学习20分钟，休息5分钟
- **小学低年级**: 连续学习30分钟，休息5分钟
- **小学高年级**: 连续学习45分钟，休息10分钟

### 修改配置
```sql
-- 更新用户的强制休息配置
UPDATE child_profiles 
SET workDurationBeforeForcedBreak = 45, forcedBreakDuration = 10 
WHERE userId = 123;
```

## 注意事项

1. **性能考虑**: 强制休息检查每秒执行一次，确保不会影响系统性能
2. **数据一致性**: 确保休息记录正确保存到数据库
3. **用户体验**: 提供清晰的休息提醒和倒计时显示
4. **错误处理**: 妥善处理网络断开等异常情况
5. **可扩展性**: 预留接口支持更多类型的休息提醒

## 未来扩展

1. **智能休息建议**: 基于用户学习状态智能调整休息时间
2. **休息活动推荐**: 在休息期间推荐适合的活动
3. **家长监控**: 为家长提供孩子学习和休息情况的报告
4. **健康数据集成**: 结合眼部健康、坐姿等数据优化休息策略