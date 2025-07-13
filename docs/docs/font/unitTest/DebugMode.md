# vitest 的调试技巧

## javascript debugger Terminal 调试

1. vscode 打开终端，点击+右边的下拉标，选择 javascript debugger Terminal，进入调试模式
2. 通过输入命令如 pnpm test 或 pnpm test 文件名，可以执行和调试测试文件。
3. 执行下一个测试只需点击一下，方便快捷。
4. 可以通过 control + c 退出调试模式。
5. 可以在 settings.json 中配置 skip files 等选项。

## Launch Scripts 调试

1. 在 launch.json 中进行配置，选择 vitest.js 作为脚本执行。
2. 配置 run 和 debug 选项，执行当前文件或测试脚本。
3. 通过 F5 快捷键执行测试，确保选择了正确的运行环境。

## Vite 插件调试

1. 安装 vscode 中的 Vitest 插件。
2. 通过插件面板或快捷键执行和调试测试。
3. 利用插件列表查看测试功能和执行结果。

## 可视化测试界面

1. 使用 vitest UI 查看所有可执行的测试。
2. 通过界面查看模块图和文件依赖关系。
3. 点击运行测试，观察执行结果。
