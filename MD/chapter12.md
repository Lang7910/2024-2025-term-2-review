## 第十章 Spark

**01 Spark 是一个什么类型的框架？**  
- [ ] A. 实时流处理框架  
- [x] B. 分布式内存计算框架  
- [ ] C. 数据库管理系统  
- [ ] D. 网络通信框架  

**02 以下哪个不是 Spark 的生态系统组件？**  
- [ ] A. Spark SQL  
- [ ] B. Spark Streaming  
- [x] C. Hadoop YARN  
- [ ] D. MLlib  

**03 RDD 在 Spark 中代表什么？**  
- [x] A. 弹性分布式数据集  
- [ ] B. 实时数据流  
- [ ] C. 内存数据库表  
- [ ] D. 分布式文件系统  

**04 以下哪个操作会触发 Spark 对 RDD 的真正计算？**  
- [ ] A. map  
- [ ] B. filter  
- [x] C. reduce  
- [ ] D. cache  

**05 在 Spark 中，DAG 代表什么？**  
- [x] A. 有向无环图  
- [ ] B. 分布式算法图  
- [ ] C. 实时数据流图  
- [ ] D. 内存数据结构图  

**06 在 Spark 中，哪个组件负责将 DAG 分解成多个阶段和任务？**  
- [ ] A. SparkContext  
- [x] B. DAGScheduler  
- [ ] C. TaskScheduler  
- [ ] D. Worker Node  

**07 RDD 的设计与运行原理中，以下哪些描述是正确的？**  
- [x] A. RDD 是分布式内存的一个抽象概念  
- [x] B. RDD 之间的转换操作形成依赖关系，可以实现管道化  
- [x] C. RDD 采用惰性调用，真正的计算发生在行动操作  
- [ ] D. RDD 的数据必须存储在 HDFS 中  

**08 以下哪些操作是 RDD 的转换操作？**  
- [x] A. map  
- [x] B. filter  
- [ ] C. reduce  
- [ ] D. collect  

**09 Spark 是一个开源的分布式计算系统。**  
- [x] A. 正确  
- [ ] B. 错误  

**10 Spark 只能用于批处理作业，不能处理实时数据流。**  
- [ ] A. 正确  
- [x] B. 错误  

**11 RDD（弹性分布式数据集）是 Spark 中的核心概念，它代表了一个不可变的分布式对象集合。**  
- [x] A. 正确  
- [ ] B. 错误  

**12 在 Spark 中，一个作业（Job）可以被划分为多个阶段（Stage），每个阶段包含多个任务（Task）。**  
- [x] A. 正确  
- [ ] B. 错误  

**13 在 Spark 中，______ 操作是创建 RDD 的主要方式，而 ______ 操作则用于触发实际的计算。**  
<details><summary>点击显示答案</summary>
转换；行动
</details>

**14 描述 Spark 中的转换操作和行动操作的区别。**  
<details><summary>点击显示答案</summary>
**转换操作（transformation）**：对已有 RDD 进行加工（如 map、filter、flatMap 等），生成新的 RDD；这些操作都是惰性求值，只是记录血缘（lineage），不会立刻执行。  
**行动操作（action）**：触发整个依赖 DAG 的真正计算，并将结果返回给 Driver 或写入外部存储（如 reduce、collect、count、saveAsTextFile 等）。
</details>
