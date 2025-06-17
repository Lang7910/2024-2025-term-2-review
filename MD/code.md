# Map（Mapper）程序详解

```c
#include <stdio.h>
#include <string.h>

int main(){
    char* buffer = NULL;         // 用于存放从 stdin 读取的一行文本
    size_t b_size = 0;           // buffer 的当前分配大小，由 getline 动态调整
    ssize_t read_num = 0;        // 记录 getline 实际读取到的字符数 (-1 表示 EOF)

    // 不断从标准输入读取一行，直到遇到 EOF
    while (read_num != -1) {
        read_num = getline(&buffer, &b_size, stdin);
        // 如果成功读取到一行（未遇到 EOF）
        if (read_num != -1) {
            // 将末尾的换行符 '\n' （位于 buffer[read_num-1]）替换为字符串结束符 '\0'
            buffer[read_num - 1] = '\0';
            // 以空格分割单词
            char* seg = strtok(buffer, " ");
            while (seg) {
                // 输出格式：<单词>\t1\n，供 Reduce 程序汇总使用
                printf("%s\t1\n", seg);
                // 继续获取下一个单词
                seg = strtok(NULL, " ");
            }
        }
    }

    return 0;
}
```

**核心流程：**
1. **读取行**：用 `getline` 动态分配并读取一整行文本，避免固定缓冲区溢出。  
2. **去除换行**：将结尾的 `\n` 改写为 `\0`，方便后续字符串操作。  
3. **分词**：`strtok` 以空格分隔，将一行文本拆成若干单词。  
4. **输出键值对**：每遇到一个单词，就输出 `<单词>\t1`，代表该单词出现 1 次。  

---

# Reduce（Reducer）程序详解

```c
#include <stdio.h>
#include <string.h>

int main(){
    char* buffer1 = NULL;    // 保存上一行的单词
    char* buffer2 = NULL;    // 保存当前读取行的单词
    size_t len = 0;          // 由 getline 管理的 buffer 大小
    ssize_t read_num = 0;    // 记录 getline 读取字符数
    int word_count = 1;      // 当前单词的累加计数

    // 读取第一行，初始化 buffer1
    read_num = getline(&buffer1, &len, stdin);
    if (read_num != -1)
        buffer1[read_num - 1] = '\0';  // 去除换行符

    // 逐行读取剩余输入
    while (read_num != -1) {
        read_num = getline(&buffer2, &len, stdin);
        if (read_num != -1) {
            buffer2[read_num - 1] = '\0';  // 去除换行
            // 如果当前 key（buffer2）与上一行 key 相同
            if (strcmp(buffer1, buffer2) == 0) {
                word_count++;  // 计数累加
            } else {
                // key 变化，输出上一 key 及其总计数
                printf("%s -> %d\n", buffer1, word_count);
                // 重置计数并更新 buffer1
                word_count = 1;
                strcpy(buffer1, buffer2);
            }
        }
    }

    // 循环结束后，别忘了输出最后一个单词的计数
    printf("%s -> %d\n", buffer1, word_count);

    return 0;
}
```

**核心流程：**
1. **初始化**：先读取并保存第一行的 `<单词>\t1`（只保留单词部分）。  
2. **逐行比较**：不断读取后续行，与 `buffer1` 中保存的单词比较：  
   - **相同**：累加计数器 `word_count`。  
   - **不同**：输出上一个单词的总计数，然后重置 `word_count`，并把 `buffer2` 的内容复制给 `buffer1`。  
3. **结束处理**：循环结束后，别忘了输出最后一个单词和它的累积计数。  

---

以上两个程序分别实现了 MapReduce 的「Map 阶段」和「Reduce 阶段」功能：  
- **Map**：将文本拆解成若干 `<key, value>` 对，其中 `key` 为单词，`value` 初始为 `1`。  
- **Reduce**：对相同 `key` 的多条记录进行汇总，统计每个单词出现的总次数。  
