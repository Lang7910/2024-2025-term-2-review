## 第七章 MapReduce

**01 MapReduce 是哪个领域的编程模型？**  
- [ ] A. 集中式计算  
- [x] B. 分布式并行计算  
- [ ] C. 嵌入式计算  
- [ ] D. 云计算  

**02 在 MapReduce 体系结构中，哪个组件负责资源监控和作业调度？**  
- [ ] A. Client  
- [x] B. JobTracker  
- [ ] C. TaskTracker  
- [ ] D. Reduce  

**03 MapReduce 的处理单位是什么？**  
- [ ] A. Block  
- [x] B. Split  
- [ ] C. File  
- [ ] D. Node  

**04 在 Shuffle 过程中，哪个操作是在 Map 任务全部结束之前进行的？**  
- [ ] A. 归并  
- [ ] B. 排序  
- [ ] C. 分区  
- [x] D. 溢写  

**05 运行 MapReduce 程序前，需要启动 Hadoop 的哪个服务？**  
- [ ] A. YARN  
- [x] B. HDFS  
- [ ] C. MapReduce  
- [ ] D. ZooKeeper  

**06 MapReduce 的体系结构主要包括哪些组件？**  
- [x] A. Client  
- [x] B. JobTracker  
- [x] C. TaskTracker  
- [ ] D. Reduce  
- [ ] E. Map  

**07 在 MapReduce 模型中，Map 函数的主要作用包括哪些？**  
- [ ] A. 对输入数据进行切片  
- [x] B. 对切片后的数据执行处理逻辑  
- [x] C. 生成中间结果  
- [ ] D. 对中间结果进行排序和归并  
- [ ] E. 输出最终结果  

**08 Reduce 函数在 MapReduce 模型中负责哪些任务？**  
- [x] A. 接收 Map 函数输出的中间结果  
- [x] B. 对中间结果进行排序和归并  
- [x] C. 执行用户定义的处理逻辑来生成最终结果  
- [x] D. 将最终结果写回到分布式文件系统  
- [ ] E. 监控任务的执行进度和资源使用情况  

**09 MapReduce 的工作流程包括哪些主要阶段？**  
- [x] A. 从分布式文件系统读入数据  
- [x] B. 执行 Map 任务输出中间结果  
- [x] C. Shuffle 阶段：对中间结果进行分区、排序和整理  
- [x] D. 执行 Reduce 任务得到最终结果  
- [x] E. 将最终结果写入分布式文件系统  

**10 在 Shuffle 过程中，Map 端需要进行哪些操作？**  
- [x] A. 将缓存的数据溢写到本地磁盘  
- [x] B. 对溢写文件进行归并和排序  
- [x] C. 执行 Combiner 操作（如果可能）  
- [ ] D. 将归并和排序后的数据发送给 Reduce 端  
- [ ] E. 监控 Map 任务的执行进度  

**11 MapReduce 程序执行过程中，JobTracker 的职责包括哪些？**  
- [x] A. 接收 Client 提交的 MapReduce 作业  
- [x] B. 监控所有 TaskTracker 和作业的健康状况  
- [x] C. 跟踪任务的执行进度和资源使用量  
- [x] D. 选择合适的任务在空闲资源上执行  
- [ ] E. 输出最终结果到分布式文件系统  

**12 MapReduce 采用“数据向计算靠拢”的策略来提高计算效率。**  
- [x] 正确  
- [ ] 错误  

**13 MapReduce 将复杂的、运行于大规模集群上的并行计算过程高度抽象到了两个函数：______ 和 ______。**  
<details><summary>点击显示答案</summary>
Map 和 Reduce
</details>

**14 MapReduce 工作流程中，______ 过程非常关键，它负责把 Map 任务的中间结果分区、排序并整理后发送给 Reduce 任务。**  
<details><summary>点击显示答案</summary>
Shuffle
</details>

**15 简述 MapReduce 框架的主要组成部分。**  
<details><summary>点击显示答案</summary>
Client、JobTracker、TaskTracker
</details>

**16 简述在 MapReduce 模型中，Map 任务的主要职责是什么？**  
<details><summary>点击显示答案</summary>
对输入的 Split 数据执行用户定义的映射逻辑，生成中间的 `<key, value>` 对。
</details>

**17 简述 Reduce 任务在 MapReduce 作业中扮演什么角色。**  
<details><summary>点击显示答案</summary>
接收 Shuffle 后的中间结果，对其分组、排序、归并，并执行用户定义的归约逻辑，产生最终输出。
</details>

**18 请解释 MapReduce 中的 Shuffle 过程。**  
<details><summary>点击显示答案</summary>
在 Map 端，框架将内存中缓冲的中间 KV 对 spill 到本地磁盘，并进行多路归并排序（可执行 Combiner）；  
根据分区函数选取目标 Reduce，并通过网络将排序后的数据传输过去；  
在 Reduce 端，再次对所有来自不同 Map 端的数据进行合并排序，准备调用 Reduce 函数生成最终结果。
</details>
