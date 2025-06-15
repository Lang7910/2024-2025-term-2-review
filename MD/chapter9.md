## 第四章 分布式数据库 HBase

**01 HBase是哪种数据库的开源实现？**  
- [ ] A. MySQL  
- [x] B. BigTable  
- [ ] C. Oracle  
- [ ] D. SQL Server  

**02 HBase主要用于处理哪种类型的数据表？**  
- [ ] A. 小型表  
- [ ] B. 中型表  
- [x] C. 非常庞大的表  
- [ ] D. 任何大小的表  

**03 HBase的数据存储模式是什么？**  
- [ ] A. 行式存储  
- [x] B. 列式存储  
- [ ] C. 键值存储  
- [ ] D. 文档存储  

**04 在 HBase 中，负责表和 Region 管理工作的组件是什么？**  
- [ ] A. 客户端  
- [ ] B. Zookeeper 服务器  
- [x] C. Master 主服务器  
- [ ] D. Region 服务器  

**05 HBase通过哪个组件来实现协同服务管理？**  
- [ ] A. HDFS  
- [ ] B. MapReduce  
- [ ] C. Chubby  
- [x] D. Zookeeper  

**06 在 HBase 中，更新操作时旧版本的数据如何处理？**  
- [ ] A. 被覆盖删除  
- [x] B. 保留旧版本，生成新版本  
- [ ] C. 自动删除  
- [ ] D. 移动到历史表  

**07 HBase 系统架构中的 Region 服务器主要负责什么？**  
- [ ] A. 提供访问 HBase 的接口  
- [ ] B. 负责表和 Region 的管理工作  
- [x] C. 维护分配给自己的 Region，并响应用户的读写请求  
- [ ] D. 提供协同服务  

**08 HBase 的目标包括哪些？**  
- [x] A. 处理非常庞大的表  
- [ ] B. 只处理小型表  
- [x] C. 利用廉价计算机集群  
- [ ] D. 需要高性能的硬件  

**09 HBase 的数据模型包括哪些相关概念？**  
- [x] A. 表  
- [x] B. 行  
- [x] C. 列族  
- [x] D. 列限定符  

**10 HBase 的系统架构包括哪些主要部分？**  
- [x] A. Master 主服务器  
- [x] B. Region 服务器  
- [x] C. Zookeeper 集群  
- [ ] D. HDFS 和 MapReduce  

**11 HBase 的 HLog 有哪些作用？**  
- [ ] A. 提高对表的写操作性能  
- [ ] B. 记录 Region 服务器的状态  
- [x] C. 在 Region 服务器故障时恢复数据  
- [ ] D. 存储所有 Region 的行键范围信息  

**12 HBase 是一个分布式存储系统，起初的设计目的是为了解决典型的互联网搜索问题。**  
- [ ] A. 正确  
- [x] B. 错误  

**13 HBase 可以扩展到 PB 级别的数据和上千台机器，但只具备高性能和高可用性，不具备广泛应用性和可扩展性。**  
- [ ] A. 正确  
- [x] B. 错误  

**14 HBase 操作中存在复杂的表与表之间的关系，需要进行多表连接操作。**  
- [ ] A. 正确  
- [x] B. 错误  

**15 HBase 是基于行模式存储的，每个列族都由几个文件保存。**  
- [ ] A. 正确  
- [x] B. 错误  

**16 在 HBase 中，更新操作会删除数据旧的版本，只保留最新的当前值。**  
- [ ] A. 正确  
- [x] B. 错误  

**17 HBase 客户端在访问数据时，需要直接连接 Master 服务器来获取 Region 的存储位置信息。**  
- [ ] A. 正确  
- [x] B. 错误  

**18 HBase 从 0.96.0 版本之后，舍弃了三层结构，转而采用两层结构，其中 -ROOT- 表被去掉了。**  
- [x] A. 正确  
- [ ] B. 错误  

**19 HBase 采用了更加简单的数据模型，它把数据存储为未经解释的______。**  
<details><summary>点击显示答案</summary>
字节数组
</details>

**20 HBase 操作只有简单的______、查询、删除、清空等，避免了复杂的表和表之间的关系。**  
<details><summary>点击显示答案</summary>
插入
</details>

**21 HBase 只有一个索引，即______。**  
<details><summary>点击显示答案</summary>
行键
</details>

**22 HBase 的______服务器负责存储和维护分配给自己的 Region，处理来自客户端的读写请求。**  
<details><summary>点击显示答案</summary>
RegionServer
</details>

**23 简述在数据操作上，HBase 与传统关系数据库有何不同？**  
<details><summary>点击显示答案</summary>
HBase 是面向列簇的 NoSQL 存储，只支持基于行键的简单增删查改（Put/Get/Scan/Delete），不支持 SQL 查询、JOIN 与多表事务。
</details>

**24 简述 HBase 的三层寻址机制。**  
<details><summary>点击显示答案</summary>
客户端首先访问 –ROOT– 表，获取 .META. 表的 RegionServer 地址；  
再访问 .META. 表，找到目标用户表的 Region 所在的 RegionServer；  
最后直接连接该 RegionServer，读取或写入数据。
</details>
