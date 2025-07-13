# gitlab CI/CD

### YAML 基础知识与语法

1. 什么是 YAML？
   YAML 是"YAML Ain't Markup Language"（YAML 不是一种标记语言）的递归缩写。在开发这种语言时，YAML 的意思其实是："Yet Another Markup Language"（仍是一种标记语言）。
   YAML 非常适合用来做以数据为中心的配置文件，它比 JSON 和 XML 更易读。

2. 基本语法

- 键值对: key: value（键值之间有空格）
- 大小写敏感
- 使用缩进表示层级关系
- 缩进不允许使用 tab，只允许空格
- 缩进的空格数不重要，只要同层级的元素左对齐即可
- '#'表示注释
- 字符串无需加引号，如果要加，与"表示字符串内容会被转义/不转义

3. 数据类型

- 3.1 字面量（简单数据类型）

```yaml
# 字符串
name: 张三

# 数字
age: 25
height: 175.5

# 布尔值
active: true
verified: false

# 日期
birth: 1999-09-09

# null
email: null
```

- 3.2 对象（复杂数据类型）

行内写法:

```yaml
person: { name: 张三, age: 25, job: 程序员 }
```

多行写法:

```yaml
person:
  name: 张三
  age: 25
  job: 程序员
```

- 3.3 数组

行内写法:

```yaml
interests: [编程, 旅行, 摄影]
```

多行写法:

```yaml
interests:
  - 编程
  - 旅行
  - 摄影
```

示例：

```ts
interface Pet {
  name: string;
  weight: number;
}

interface Person {
  userName: string;
  boss: boolean;
  birth: Date;
  age: number;
  personPet: Pet;
  interests: string[];
  animal: string[];
  score: Record<string, object>;
  salarys: Set;
  allPets: Record<string, Pet[]>;
}
```

对应的 yaml 为:

```yaml
person:
  username: 任我行
  boss: false
  birth: 1999-09-09
  age: 22
  personPet:
    name: 小狗
    weight: 90
  interests:
    - 编程
    - 音乐
    - 电影
  scores:
    math: 95
    english: 87
    physics: 92
```

### Pipeline 流水线

在每个项目中，使用名为 .gitlab-ci.yml 的 YAML 文件配置 Gitlab CI/CD 管道。在文件中可以定义一个或多个作业（Job）。每个作业必须具有唯一的名称（不能使用关键字），每个作业是独立执行的。作业定义了在约束条件下进行相关操作，每个作业至少要包含一个 script。

```yaml
job1:
  script: 'execute-script-for-job1'

job2:
  script: 'execute-script-for-job2'
```

这里在 pipeline（流水线）中定义了两个作业，每个作业运行不同的命令。命令可以是 shell 或者脚本。

下面列出保留字段，这些保留字段不能被定义为 job 名称：

| 关键字        | 是否必须 | 描述                                 |
| ------------- | -------- | ------------------------------------ |
| image         | 否       | 用于 docker 镜像                     |
| services      | 否       | 用于 docker 服务                     |
| stages        | 否       | 定义构建阶段                         |
| types         | 否       | `stages` 的别名（已废除）            |
| before_script | 否       | 定义在每个 job 之前运行的命令        |
| after_script  | 否       | 定义在每个 job 之后运行的命令        |
| variable      | 否       | 定义构建变量                         |
| cache         | 否       | 定义一组文件列表，可在后续运行中使用 |

<img src="/img/frontendEngineering/gitlab流水线.webp" alt="gitlab流水线" style="zoom: 33%;" />

上图是一个流水线图，build 和 deploy 是该流水线(pipeline)中的两个阶段(stages)

- Pipeline(流水线) - 整个自动化过程的集合
- Stage(阶段) - 流水线中的一个执行阶段，如上 build 和 deploy，按顺序执行
- Job(作业) - 阶段内的具体任务，如 build 阶段中有三个并行的作业 job

通常 runner 同一时间只能运行一个 job，如果要设置并发执行多个 job 就得设置

修改 gitlab-runner 并发数的方法：

配置文件路径示例（以默认路径为例）：

```bash
vim /home/gitlab-runner/config/config.toml
```

在文件中添加或修改如下内容：

```toml
concurrent = 5
```

这样，runner 就能同时并发执行 5 个作业了。

前端本地打包和在 CI（如 GitLab Runner）上打包，本质流程是一样的：

都是先安装依赖（如 npm install/yarn/pnpm），再执行项目的打包命令（如 npm run build），只是在本地的话环境是在你电脑、而 CI 打包是在 Runner 所在的服务器上。

#### 三阶段部署流水线示例

```yaml
stages:
  - build # 打包阶段
  - image # 生成镜像阶段
  - deploy # 部署阶段

build-job:
  stage: build
  tags:
    - share # 指定 runner 标签
  script:
    - echo "正在build项目!"

image-job:
  stage: image
  script:
    - echo "正在生成镜像"

deploy-job:
  stage: deploy
  script:
    - echo "部署中"
```

- 上述 pipeline 流水线配置了 3 个 stage，对应打包、生成镜像、部署。
- 每个 job 名不能重复。
- tags 用于指定 runner。
- 每个 job 里用 script 指令写具体命令。

### script 中包含特殊字符处理

有时，脚本命令必须用单引号或双引号括起来。例如，包含冒号（:）的命令必须用单引号（'）包裹。YAML 解析器需要将文本解释为字符串而不是“键:值”对。

特殊字符包括：
`{ } [ ] , & \* # ? | - < > = ! % @ `

例如：

```yaml
job:
  script:
    - curl --request POST --header 'Content-Type: application/json' "https://gitlab/api/v4/projects"
```

要被认为是有效的 YAML，必须将整个命令用单引号或双引号括起来。如果命令已经使用单引号，则应尽可能将其更改为双引号（"）。

例如：

```yaml
job:
  script:
    - "curl --request POST --header 'Content-Type: application/json' 'https://gitlab/api/v4/projects'"
```

### before_script

before_script 用来定义所有 job 之前运行的命令，包括 deploy（部署）jobs，但是在修复 artifacts 之后。它可以是一个数组或者是多行字符串。before_script 如果执行失败，会导致整个作业失败，其他 job 将不再执行。作业失败不会影响 after_script 运行。

举例：

```yaml
before_script:
  - echo "全局 before_script，可以被覆盖"

job1:
  before_script:
    - echo "job1 的前置命令"
    - exit 1 # 这里故意让 before_script 失败
  script:
    - echo "job1 的脚本命令"

job2:
  script:
    - echo "job2 的脚本命令"
```

#### 执行效果说明

1. job1

- 执行自己的 before_script（输出“job1 的前置命令”，然后 exit 1 失败）。
  因为 before_script 失败，job1 标记为失败，script 部分不会被执行。

2. job2
   因为没有定义自己的 before_script，会继承全局的 before_script 并执行（输出“全局 before_script，可以被覆盖”字符串）。
   然后执行 job2 的脚本命令（输出“job2 的脚本命令”）。

### after_script

- after_script 用来定义所有 job 之后运行的命令。它必须是一个数组或者是多行字符串。
- 指定的脚本在新的 shell 中执行，与任何 before_script 或 script 脚本分开。

#### 示例

```yaml
job1:
  script:
    - echo "脚本运行中"
    - exit 1 # 故意抛错，模拟失败
  after_script:
    - echo "无论成功或失败，这里都会执行"
    - echo "收尾或清理工作"
```

效果说明：

- script 阶段执行遇到 exit 1，job1 失败。
- 但 after_script 阶段依然会被执行，用于日志、清理、通知等操作。

#### before_script 和 after_script 的例子:

```yaml
build-job:
  stage: build
  tags:
    - share
  script:
    - echo "正在build项目！"
    - echo "build2..."
  before_script:
    - ech "build之前运行的脚本" # 这里故意写错，应该是 echo
  after_script:
    - echo "项目build阶段已经执行完毕"

image-job:
  stage: image
  tags:
    - demo1
  script:
    - echo "正在生成镜像"

deploy-job:
  stage: deploy
```

说明：

1. before_script 语法错误导致当前 job 失败：比如 before_script 里写成了 ech 而不是 echo，会直接导致该 job（如 build-job）失败，script 里的内容不会再执行。

2. 当前 job 的 after_script 仍然会执行：
   即使 job 失败，after_script 还是会执行，用于做清理、日志等收尾工作。

3. 后续 job 是否执行取决于 CI 配置：默认情况下，如果关键 job（如 build-job）失败，后续 job（如 image-job、deploy-job）不会被调度、不执行，相应的 after_script 也不会运行。这是流水线的默认保护机制，除非你有特殊配置（比如允许失败、手动跳过等）。

### .pre 和 .post

- .pre 阶段是整个流水线的第一个运行阶段。
- .post 阶段是整个流水线的最后一个运行阶段。
- 用户自定义的阶段都运行在 .pre 和 .post 之间。
- 如果流水线仅包含 .pre 或 .post 阶段的作业，则不会创建流水线。

示例 YAML：

```yaml
stages:
  - .pre
  - build
  - deploy
  - .post

pre-job:
  stage: .pre
  script:
    - echo ".pre 阶段正在运行"

build-job:
  stage: build
  script:
    - echo "build 阶段正在运行"

deploy-job:
  stage: deploy
  script:
    - echo "deploy 阶段正在运行"

post-job:
  stage: .post
  script:
    - echo "post 阶段正在运行"
```

说明：

- .pre 里的任务在整个 pipeline 最先执行，可用于准备环境等。
- .post 里的任务在所有阶段最后执行，可以用于收尾、通知、资源清理等。
- 正常用户 job 包含在中间自定义的阶段。

### stage

- stages 中的 job 是按阶段顺序执行的，先执行 build，再执行 deploy。
- .pre 阶段一定是所有阶段最先执行的，无论它在 yaml 文件中的位置如何，都会在 build 前执行。
- .post 阶段一定是整个流程最后执行的。
- 每一个 job 的执行顺序取决于 stages 的定义，每个 job 里面 script 的命令也是严格按顺序执行的。
- 一个阶段（stage）里可以创建多个作业并行执行，比如 build 阶段的 build1-job 和 build2-job，会同时被调度执行。

配置示例：

```yaml
stages:
  - .pre
  - build
  - deploy
  - .post

pre-job:
  stage: .pre
  script:
    - echo ".pre 阶段正在运行"
    - sleep 10

build1-job:
  stage: build
  script:
    - echo "build1 job 阶段正在运行"
    - sleep 10

build2-job:
  stage: build
  script:
    - echo "build2 job 阶段正在运行"
    - sleep 10

deploy-job:
  stage: deploy
  script:
    - echo "deploy 阶段正在运行"

post-job:
  stage: .post
  script:
    - echo "post 阶段正在运行"
```

要点总结：

- stages 定了执行顺序，实际执行时无论 job 定义在哪儿，都按 stages 顺序来分阶段执行；
- 同一阶段的多个 job（如 build1-job 和 build2-job）会并行执行；
- 每个 job 里的 script 命令是顺序执行的。

### variables

优先级顺序：runner 变量 > job 变量 > pipeline 变量

runner 变量

- 可以在 GitLab 设置里，CI/CD → 变量 页面进行配置。
- runner 变量一般用于 Runner 层面全局生效的配置。

示例 YAML

```yaml
stages:
  - build

variables: # pipeline 变量（管道变量）
  USER_NAME: 任我行
  GENDER: 男
  COMPANY: xxx有限公司

build-job:
  stage: build
  variables: # job 变量（作业变量）
    CITY: 北京
    COMPANY: xxx有限公司
    USER_NAME: 张三
    GENDER: 女
  script:
    - echo "公司名称是$COMPANY"
    - echo "姓名: $USER_NAME"
    - echo "性别: $GENDER"
    - echo "所在城市: $CITY"
```

说明

| 术语          | 常见别名            | 说明                        |
| ------------- | ------------------- | --------------------------- |
| pipeline 变量 | 流水线变量/管道变量 | .gitlab-ci.yml 的 variables |
| job 变量      | 作业变量            | 某 job 下的 variables       |
| runner 变量   | Runner 层变量       | Runner 环境里配置的变量     |

- pipeline 变量 / 流水线变量 / 管道变量

  - 指在 .gitlab-ci.yml 的 variables: 字段定义的全局变量，对整个 pipeline（流水线）内的所有作业都可见，除非被 job 变量覆盖。

- job 变量 / 作业变量：

  - 在某个 job 下 variables: 字段里定义，只对本 job 有效、优先级高于 pipeline 变量。

- runner 变量：
  - 在 CI/CD 系统 Runner 层面配置的变量，通常全局可用，优先级最高。

### 预定变量

预定变量是由 GitLab CI/CD 系统预定义的内置变量，在执行流水线时会自动读取，比如当前项目名称、分支、提交信息等，无需手动设置。

- CI_JOB_NAME: 当前作业的名称
- CI_PROJECT_NAME: 项目名称
- GITLAB_USER_LOGIN: 触发流水线的用户名
- CI_COMMIT_REF_NAME: 用于构建项目的分支或标签名称
- CI_COMMIT_REF_SLUG: 规范化的分支/标签名（适合作为 URL、路径等）
- CI_COMMIT_BRANCH: 提交所属的分支名
- CI_COMMIT_AUTHOR: 提交的作者
- CI_PIPELINE_SOURCE: 触发管道的来源（如 push、web、api 等）

### GitLab CI/CD 流水线默认触发机制及 Runner 工作原理说明

一般默认触发管道(流水线)的来源是 push，也就是当我们执行 push 操作之后，runner 监听到了，就会执行项目根目录下的 yaml 文件

注： GitLab Runner 和 GitLab 服务器可以部署在不同机器上，Runner 会在你 push 代码到 GitLab 后自动拉取最新代码进行部署和其他操作，两者通过网络协作完成整个流程。

### tags

用于从允许运行该项目的所有 Runner 列表中选择特定的 Runner。在 Runner 注册期间可以指定 Runner 标签，CI/CD 脚本中通过 tags 关键字指定要使用的 Runner。

示例 YAML

```yaml
stages:
  - build

pre-job:
  stage: .pre
  script:
    - echo ".pre 阶段正在运行"
    - sleep 8

build-job:
  stage: build
  tags:
    - happy_travel # 指定 Runner 标签
  script:
    - echo "build 阶段正在运行"
```

说明

- tags 字段是在 job 下配置的，用于选择带有特定标签（如 happy_travel）的 Runner 来执行该 job。

### allow_failure

- allow_failure 可用于允许某个 job 失败而不影响后续 CI/CD 流程。失败的 job 不会影响 commit 状态。
- 当允许 job 失败后，Pipeline 依然显示为成功（绿色），但会标注有 job 失败且“passed with warnings”。
- 适用于不关键或者可选的任务，即使失败也不需要中断整个流程。

示例讲解：

下面例子中，job1 和 job2 并行，如果 job1 失败，也不会影响进入下一 stage（deploy 阶段），因为 job1 设置了 allow_failure: true。

```yaml
stages:
  - test
  - deploy

job1:
  stage: test
  script:
    - execute_script_that_will_fail
  allow_failure: true # 允许 job1 失败

job2:
  stage: test
  script:
    - execute_script_that_will_succeed

job3:
  stage: deploy
  script:
    - deploy_to_staging
```

作用场景：

- 运行非关键的测试或检查（如代码风格检查）
- 执行可能偶尔失败但不应阻止部署的任务
- 实验性功能的测试

总结：

- 设置 allow_failure: true 的 job 即使失败，不会让 pipeline 变红，也不阻断后续 stage。
- 在合并请求、提交页等会看到警告提示，可手动关注和处理。

### when

when 用于实现发生故障时运行或即使发生故障也运行的作业。可以根据不同场景灵活控制 job 的执行时机。

when 可设置的值：

1. on_success

- 只有前面 stages 的所有作业成功时才执行。（默认值）

2. on_failure

- 当前面 stages 中任意一个 job 失败后才执行。

3. always

- 无论前面 stages 或 jobs 状态如何都会执行。

4. manual

- 需要人工手动触发执行（从 GitLab 8.10 开始支持）。

5. delayed -延时执行作业，需与 start_in 一起使用。

示例：

1. on_success（默认值）- 只有前面阶段全部成功才执行

```yaml
stages:
  - build
  - test
  - deploy

build-job:
  stage: build
  script:
    - echo "编译代码"

test-job:
  stage: test
  script:
    - echo "运行测试"
# 默认when: on_success，如果build-job失败则不会执行

deploy-job:
  stage: deploy
  script:
    - echo "部署应用"
  when: on_success # 明确指定，只有build和test阶段都成功才执行
```

2. on_failure - 当前面阶段任一作业失败后执行

```yaml
stages:
  - test
  - notify

test-app:
  stage: test
  script:
    - echo "运行测试"
    - exit 1 # 模拟测试失败

notify-error:
  stage: notify
  script:
    - echo "发送失败通知邮件给团队"
  when: on_failure # 只有当test-app失败时才执行
```

3. always - 无论前面阶段结果如何都执行

```yaml
stages:
  - deploy
  - cleanup

deploy-app:
  stage: deploy
  script:
    - echo "部署应用"
  # 可能成功也可能失败

cleanup-resources:
  stage: cleanup
  script:
    - echo "清理临时文件和资源"
  when: always # 无论部署成功还是失败，都要执行清理工作
```

4. manual - 需要手动触发执行

```yaml
stages:
  - build
  - deploy

build-job:
  stage: build
  script:
    - echo "构建应用"

deploy-to-production:
  stage: deploy
  script:
    - echo "部署到生产环境"
  when: manual # 需要在GitLab UI中手动点击按钮触发
  environment: production
```

5. delayed - 延时执行，需与 start_in 结合

```yaml
stages:
  - deploy
  - verify

deploy-job:
  stage: deploy
  script:
    - echo "部署新版本"

verify-deployment:
  stage: verify
  script:
    - echo "验证部署是否正常"
  when: delayed # 延时执行
  start_in: '30 minutes' # 30分钟后自动执行
```

总结：

- when 可以更精细地控制 job 的触发和执行逻辑，适用于各类 CI/CD 场景。
- 常用组合如“失败时发送告警”、“手动触发生产部署”、“延迟发布”等。

### retry: when & retry: max

- retry 用于作业（job）失败时自动重试。
  - max：最大重试次数（大于等于 0，小于等于 2）。
  - when：需要重试的失败类型。

<span style='color:red'>常见 when 错误类型</span>

- always ：在发生任何故障时重试（默认）
- unknown_failure ：因未知原因失败时
- script_failure ：脚本执行失败时重试
- api_failure ：API 失败重试
- stuck_or_timeout_failure ：作业卡住或超时时重试
- runner_system_failure ：运行系统发生故障
- runner_unsupported ：Runner 不受支持
- stale_schedule ：延迟的作业无法执行
- job_execution_timeout ：超出作业最大执行时间
- archived_failure ：作业已存档无法运行
- unmet_prerequisites ：未完成先决条件
- scheduler_failure ：调度程序没能将作业分配给 Runner
- data_integrity_failure ：检测到结构完整性问题

默认情况下，只要 job 失败，满足 when 类型且未超过 max 次数，就会自动重试。

```yaml
stages:
  - build

build-job:
  stage: build
  timeout: 3s # 作业超时时间为 3 秒
  tags:
    - group
  script:
    - echo "build"
    - sleep 5 # 故意超时
  retry:
    max: 1 # 超时失败时，最多重试 1 次
    when: job_execution_timeout
```

- 作业超时时间为 3 秒,脚本中故意休眠 5 秒，会导致作业超时失败。
- retry 的 when 字段为 job_execution_timeout,当检测到作业运行超时时，会按照 max: 1 的设置重试 1 次（总共会执行 2 次，包括原始和重试）。

总结说明

- 只要脚本超时（比如这里 sleep 5 秒 > 超时时间 3 秒），就会根据 retry 设置重试 1 次。
- retry.when 用于指定重试的错误类型，这里只在 “作业超时” 时自动重试。

### timeout

- 使用 timeout 为特定作业配置超时时间。如果作业运行超出了设定的时间限制，则作业失败。

超时设置有三种：

- 作业级（job-level）
- 项目级（project-level）
- runner 级（runner-level）。

情况示例
runner 超时 24 小时，项目 CI/CD 超时 2 小时

- → 作业 2 小时后超时

runner 未设置，项目 CI/CD 超时 2 小时

- → 作业 2 小时后超时

runner 超时 30 分钟，项目 CI/CD 超时 2 小时

- → 作业 30 分钟后超时

- 哪个级别的超时时间更短，就按哪个执行。（谁短听谁的，三个超时时间，最短生效。）

配置示例

```yaml
build:
  script: build.sh
  timeout: 3 hours 30 minutes

test:
  script: rspec
  timeout: 3h 30m
```

- timeout 支持多种时间格式：3 hours 30 minutes 或 3h 30m
- 每个作业都可以单独设置自己的超时时间
