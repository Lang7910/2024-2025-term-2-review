// quiz.js - Logic for the quiz page

document.addEventListener('DOMContentLoaded', () => {
  const questionArea = document.getElementById('question-area');
  const optionsArea = document.getElementById('options-area');
  const feedbackArea = document.getElementById('feedback-area');
  const nextQuestionBtn = document.getElementById('next-question-btn');
  const submitAnswerBtn = document.getElementById('submit-answer-btn'); // Get the new button

  // Scoreboard elements
  const totalScoreEl = document.getElementById('total-score');
  const questionsAnsweredEl = document.getElementById('questions-answered');
  const questionsCorrectEl = document.getElementById('questions-correct');
  const accuracyRateEl = document.getElementById('accuracy-rate');
  const resetScoreBtn = document.getElementById('reset-score-btn');

  let totalScore = 0;
  let questionsAnswered = 0;
  let questionsCorrect = 0;
  let defaultPoints = 2; // Default points per question

  let allQuestions = [];
  let currentQuestion = null;
  let answeredQuestions = []; // 记录已答题目ID
  let isQuestionAnswered = false; // 当前题目是否已回答
  
  // 随机模式相关变量
  let randomMode = 'random-without-replacement'; // 默认为不放回抽样'sequential', 'random-with-replacement', 'random-without-replacement', 'adaptive'
  let questionPool = []; // 当前题目池
  let currentQuestionIndex = 0; // 顺序模式下的当前题目索引
  let usedQuestions = []; // 不放回抽样模式下已使用的题目
  let shuffleOptions = true; // 是否打乱选项顺序

  // Fisher-Yates 洗牌算法
  function shuffleArray(array) {
    const shuffled = [...array]; // 创建副本，避免修改原数组
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 根据考试时间动态设置默认筛选
  function setDefaultSubjectSelection() {
    const examDates = [
      { subject: 'data', name: '数据技术基础', date: new Date('2025-06-17T09:00:00+08:00') },
      { subject: 'manufacturing', name: '制造智能技术基础', date: new Date('2025-06-19T09:00:00+08:00') },
      { subject: 'industrial', name: '工业互联网基础', date: new Date('2025-06-20T09:00:00+08:00') }
    ];
    
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
    
    // 找到最近的考试
    let nextExam = null;
    let minDiff = Infinity;
    
    examDates.forEach(exam => {
      const diff = exam.date.getTime() - beijingTime.getTime();
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextExam = exam;
      }
    });
    
    // 如果没有找到未来的考试，默认选择最后一个考试
    if (!nextExam) {
      nextExam = examDates[examDates.length - 1];
    }
    
    // 设置默认选中最近的考试科目
    const checkboxes = document.querySelectorAll('#subject-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = checkbox.value === nextExam.subject;
    });
    
    console.log(`默认选择科目: ${nextExam.name} (${nextExam.subject})`);
  }

  // Define chapter files by category
  const allChapterFiles = {
    manufacturing: [
      'chapter1.html',
      'chapter2.html',
      'chapter3.html',
      'chapter3-1.html',
      'chapter3-2.html',
      'chapter4.html',
      'chapter5.html'
    ],
    data: [
      'chapter6.html',
      'chapter7.html',
      'chapter8.html',
      'chapter9.html',
      'chapter10.html',
      'chapter11.html',
      'chapter12.html'
    ],
    industrial: [
      'chapter13.html',
      'chapter14.html'
    ]
  };
  
  // Get all chapter files
  const getAllChapterFiles = () => {
    return [...allChapterFiles.manufacturing, ...allChapterFiles.data, ...allChapterFiles.industrial];
  };
  
  // Get chapter files based on selected subjects (multiple selection)
  const getChapterFilesBySubjects = (subjects) => {
    if (!subjects || subjects.length === 0) {
      return getAllChapterFiles(); // If no subjects selected, return all
    }
    
    let files = [];
    subjects.forEach(subject => {
      switch(subject) {
        case 'manufacturing':
          files = files.concat(allChapterFiles.manufacturing);
          break;
        case 'data':
          files = files.concat(allChapterFiles.data);
          break;
        case 'industrial':
          files = files.concat(allChapterFiles.industrial);
          break;
      }
    });
    return files;
  };

  function parseQuestions(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const questions = [];

    // Find all question paragraphs
    const questionElements = doc.querySelectorAll('p strong');

    questionElements.forEach(element => {
      const questionText = element.textContent.trim();
      
      // Skip if it's not a question (no question number or specific patterns)
      if (!questionText.match(/^\d+\s+/) && !questionText.includes('填空题') && !questionText.includes('判断题') && !/(简答|说明|论述|分析|\[简答\])/.test(questionText)) {
        return;
      }

      // Check if it's an essay question (简答题, 说明题, 论述题, 分析题, or contains [简答])
      const essayPattern = /(简答|说明|论述|分析|\[简答\])/;
      if (essayPattern.test(questionText)) {
        // Handle essay questions as fill-in-the-blank type
        let currentElement = element.parentElement.nextElementSibling;
        let correctAnswer = '';
        
        // Look for the answer in details element
        while (currentElement) {
          if (currentElement.tagName === 'DETAILS') {
            const answerText = currentElement.textContent.trim();
            // Extract answer from "点击显示答案" details
            correctAnswer = answerText.replace('点击显示答案', '').trim();
            break;
          }
          currentElement = currentElement.nextElementSibling;
        }
        
        if (correctAnswer) {
          questions.push({
            question: questionText,
            options: [], // No options for essay questions
            correctAnswers: [correctAnswer],
            isMultipleChoice: false,
            isFillInBlank: true,
            questionType: 'essay'
          });
        }
        return;
      }

      // Check if it's a fill-in-the-blank question (contains 3+ consecutive underscores)
      if (/_{3,}/.test(questionText) || questionText.includes('填空题')) {
        // Handle fill-in-the-blank questions
        let currentElement = element.parentElement.nextElementSibling;
        let correctAnswer = '';
        
        // Look for the answer in details element
        while (currentElement) {
          if (currentElement.tagName === 'DETAILS') {
            const answerText = currentElement.textContent.trim();
            // Extract answer from "点击显示答案" details
            correctAnswer = answerText.replace('点击显示答案', '').trim();
            break;
          }
          currentElement = currentElement.nextElementSibling;
        }
        
        if (correctAnswer) {
          // 统计空位数量
          const blanks = (questionText.match(/_{3,}/g) || []).length;
          
          // 拆分正确答案（支持多种分隔符：逗号、分号、竖线、空格）
          let correctAnswers;
          if (blanks > 1) {
            // 尝试不同的分隔符
            if (correctAnswer.includes('|')) {
              correctAnswers = correctAnswer.split('|').map(ans => ans.trim()).filter(ans => ans);
            } else if (correctAnswer.includes(';') || correctAnswer.includes('；')) {
              correctAnswers = correctAnswer.split(/[;；]/).map(ans => ans.trim()).filter(ans => ans);
            } else if (correctAnswer.includes(',') || correctAnswer.includes('，')) {
              correctAnswers = correctAnswer.split(/[,，]/).map(ans => ans.trim()).filter(ans => ans);
            } else {
              // 按空格分割，但保留原始答案作为备选
              const spaceSplit = correctAnswer.split(/\s+/).filter(ans => ans.trim());
              correctAnswers = spaceSplit.length === blanks ? spaceSplit : [correctAnswer];
            }
            
            // 如果拆分后的答案数量不匹配空位数量，回退到单一答案
            if (correctAnswers.length !== blanks) {
              correctAnswers = [correctAnswer];
            }
          } else {
            correctAnswers = [correctAnswer];
          }
          
          questions.push({
            question: questionText,
            options: [], // No options for fill-in-the-blank
            correctAnswers: correctAnswers,
            isMultipleChoice: false,
            isFillInBlank: true,
            questionType: 'fill-blank',
            blankCount: blanks // 记录空位数量
          });
        }
        return;
      }

      let currentElement = element.parentElement.nextElementSibling;
      const options = [];
      const correctAnswers = [];
      let isMultipleChoice = false;

      // Look for task list (options)
      while (currentElement && currentElement.tagName === 'UL' && currentElement.classList.contains('contains-task-list')) {
        const listItems = currentElement.querySelectorAll('li.task-list-item');
        
        listItems.forEach(li => {
          const checkbox = li.querySelector('input[type="checkbox"]');
          const rawText = li.textContent.trim();
          
          if (checkbox && rawText) {
            // 去掉开头的字母前缀（如 "A. "、"B、" 等）
            const cleanText = rawText.replace(/^[A-Z]\s*[.、]\s*/, '');
            options.push(cleanText);
            
            if (checkbox.checked) {
              correctAnswers.push(cleanText);
            }
          }
        });
        
        currentElement = currentElement.nextElementSibling;
      }

      // Determine if it's multiple choice (more than one correct answer)
      if (correctAnswers.length > 1) {
        isMultipleChoice = true;
      }

      // Determine question type
      let questionType = 'single-choice';
      if (isMultipleChoice) {
        questionType = 'multiple-choice';
      } else if (options.length === 2 && (options.some(opt => opt.includes('正确') || opt.includes('A. 正确')) && options.some(opt => opt.includes('错误') || opt.includes('B. 错误')))) {
        questionType = 'true-false';
      }

      // Only add questions that have options and correct answers
      if (options.length > 0 && correctAnswers.length > 0) {
        questions.push({
          question: questionText,
          options: options,
          correctAnswers: correctAnswers,
          isMultipleChoice: isMultipleChoice,
          isFillInBlank: false,
          questionType: questionType
        });
      }
    });
    

    // 为每道题初始化自适应刷题相关字段
    questions.forEach(question => {
      if (!question.hasOwnProperty('history')) {
        question.history = [];
      }
      if (!question.hasOwnProperty('weight')) {
        question.weight = 50; // 初始权重
      }
      if (!question.hasOwnProperty('mastered')) {
        question.mastered = false;
      }
    });

    return questions;
  }

  // === 自适应刷题功能 ===
  const STEP_UP = 20;     // 连续错一次就 +20
  const STEP_DOWN = 10;   // 连续对一次就 -10
  const MAX_W = 100;
  const MIN_W = 5;
  const WINDOW = 3;       // 最近 3 次全对才降权

  function selectAdaptiveQuestion() {
    const pool = allQuestions.filter(q => !q.mastered);     // mastered = 权重≤minWeight
    if (pool.length === 0) {
      // 所有题目都已掌握，重置所有题目的掌握状态
      allQuestions.forEach(q => {
        q.mastered = false;
        q.weight = Math.max(MIN_W + 10, q.weight); // 稍微提高权重，避免立即再次被标记为掌握
      });
      return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    
    const totalWeight = pool.reduce((sum, q) => sum + q.weight, 0);
    if (totalWeight === 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    
    const threshold = Math.random() * totalWeight;
    let running = 0;
    for (const q of pool) {
      running += q.weight;
      if (running >= threshold) return q;                   // 权重越高越可能被选中
    }
    return pool[pool.length - 1]; // 备用返回
  }

  function updateAdaptiveStats(question, isCorrect) {
    question.history.push(isCorrect);
    if (question.history.length > WINDOW) question.history.shift();

    if (!isCorrect) {
      question.weight = Math.min(MAX_W, question.weight + STEP_UP);
      question.mastered = false; // 答错了就不再是掌握状态
    } else if (question.history.length >= WINDOW && question.history.every(Boolean)) {           // 最近 WINDOW 次全对
      question.weight = Math.max(MIN_W, question.weight - STEP_DOWN);
      if (question.weight === MIN_W) question.mastered = true;
    }
  }
  // === 自适应刷题功能结束 ===



  async function fetchQuestions(skipLoadQuestion = false, preserveIndex = false) {
    console.log('Fetching questions from chapter files...');
    allQuestions = []; // Reset questions
    const parser = new DOMParser();
    
    // Get selected subjects from checkboxes
    const subjectCheckboxes = document.querySelectorAll('#subject-checkboxes input[type="checkbox"]:checked');
    const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value);
    const chapterFiles = getChapterFilesBySubjects(selectedSubjects);
    
    console.log(`Loading questions for subjects: ${selectedSubjects.join(', ')}, files: ${chapterFiles.length}`);

    for (const filePath of chapterFiles) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          console.warn(`Failed to fetch ${filePath}: ${response.statusText}`);
          continue;
        }
        const htmlText = await response.text();
        const questions = parseQuestions(htmlText);
        allQuestions.push(...questions);
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }

    // Apply question type filter
    const selectedQuestionTypes = getSelectedQuestionTypes();
    if (selectedQuestionTypes.length > 0) {
      allQuestions = allQuestions.filter(question => {
        return selectedQuestionTypes.includes(question.questionType);
      });
    }

    console.log(`成功加载 ${allQuestions.length} 道题目`);
    
    // ☑️ 新题库到位 → 重置抽题指针
    if (!preserveIndex) {
      usedQuestions = []; // 只有确实换了科目/题型/题库时才清零
    }
    if (!preserveIndex || randomMode !== 'sequential') {
      currentQuestionIndex = 0; // 只有需要时才归零
    }
    
    if (allQuestions.length === 0) {
        questionArea.innerHTML = '<p>未能加载任何题目。请检查章节文件格式或路径。</p>';
        optionsArea.innerHTML = '';
        feedbackArea.innerHTML = '';
        nextQuestionBtn.style.display = 'none';
        return;
    }
    // 只有在没有跳过加载题目的情况下才加载随机题目
    if (!skipLoadQuestion) {
      selectNextQuestion();
    }
    updateScoreboard(); // Initialize scoreboard display
  }

  function updateScoreboard() {
    if (!totalScoreEl) return; // Guard against missing elements if HTML hasn't loaded them yet
    totalScoreEl.textContent = totalScore;
    questionsAnsweredEl.textContent = questionsAnswered;
    questionsCorrectEl.textContent = questionsCorrect;
    const accuracy = questionsAnswered > 0 ? ((questionsCorrect / questionsAnswered) * 100).toFixed(1) : 0;
    accuracyRateEl.textContent = `${accuracy}%`;
    
    // 在自适应模式下显示剩余待巩固题目数
    if (randomMode === 'adaptive' && allQuestions.length > 0) {
      const remainingQuestions = allQuestions.filter(q => !q.mastered).length;
      let adaptiveInfoEl = document.getElementById('adaptive-info');
      if (!adaptiveInfoEl) {
        adaptiveInfoEl = document.createElement('div');
        adaptiveInfoEl.id = 'adaptive-info';
        adaptiveInfoEl.style.cssText = `
          font-size: 0.9em;
          color: #666;
          margin-top: 5px;
          text-align: center;
        `;
        // 添加到计分板中
        const scoreboard = document.querySelector('.scoreboard');
        if (scoreboard) {
          scoreboard.appendChild(adaptiveInfoEl);
        }
      }
      adaptiveInfoEl.textContent = `剩余待巩固题：${remainingQuestions} 道`;
    } else {
      // 非自适应模式时隐藏这个信息
      const adaptiveInfoEl = document.getElementById('adaptive-info');
      if (adaptiveInfoEl) {
        adaptiveInfoEl.style.display = 'none';
      }
    }
  }

  // 保存进度到 localStorage
  function saveProgress() {
    const progressData = {
      totalScore,
      questionsAnswered,
      questionsCorrect,
      currentQuestion,
      selectedAnswers: getCurrentSelectedAnswers(),
      isQuestionAnswered,
      customPoints: document.getElementById('custom-points-input')?.value || defaultPoints,
      selectedSubjects: getSelectedSubjects(),
      selectedQuestionTypes: getSelectedQuestionTypes(),
      answeredQuestions,
      randomMode,
      currentQuestionIndex,
      usedQuestions,
      shuffleOptions: document.getElementById('shuffle-options-checkbox')?.checked ?? shuffleOptions,
      // 保存自适应刷题数据
      adaptiveData: allQuestions.map(q => ({
        question: q.question,
        history: q.history || [],
        weight: q.weight || 50,
        mastered: q.mastered || false
      })),
      timestamp: Date.now()
    };
    localStorage.setItem('quizProgress', JSON.stringify(progressData));
  }

  // 从 localStorage 恢复进度
  function loadProgress() {
    const saved = localStorage.getItem('quizProgress');
    if (!saved) return false;
    
    try {
      const progressData = JSON.parse(saved);
      
      // 检查数据是否过期（24小时后过期）
      const isExpired = Date.now() - progressData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem('quizProgress');
        return false;
      }
      
      // 恢复计分板数据
      totalScore = progressData.totalScore || 0;
      questionsAnswered = progressData.questionsAnswered || 0;
      questionsCorrect = progressData.questionsCorrect || 0;
      answeredQuestions = progressData.answeredQuestions || [];
      
      // 恢复随机模式相关变量
      randomMode = progressData.randomMode || 'random-without-replacement';
      currentQuestionIndex = progressData.currentQuestionIndex || 0;
      usedQuestions = progressData.usedQuestions || [];
      
      // 恢复用户设置
      if (progressData.customPoints) {
        const customPointsInput = document.getElementById('custom-points-input');
        if (customPointsInput) {
          customPointsInput.value = progressData.customPoints;
        }
      }
      
      // 恢复抽题范围选择 (只有在保存的进度存在时才恢复)
      if (progressData.selectedSubjects) {
        restoreSubjectSelection(progressData.selectedSubjects);
      }
      
      // 恢复题目类型选择
      if (progressData.selectedQuestionTypes) {
        restoreQuestionTypeSelection(progressData.selectedQuestionTypes);
      }
      
      // 恢复随机模式选择
      const randomModeSelect = document.getElementById('random-mode-select');
      if (randomModeSelect) {
        randomModeSelect.value = randomMode;
      }
      
      // 恢复选项打乱设置
      if (progressData.shuffleOptions !== undefined) {
        shuffleOptions = progressData.shuffleOptions;
        const shuffleCheckbox = document.getElementById('shuffle-options-checkbox');
        if (shuffleCheckbox) {
          shuffleCheckbox.checked = shuffleOptions;
        }
      }
      
      // 恢复自适应刷题数据
      if (progressData.adaptiveData && Array.isArray(progressData.adaptiveData)) {
        // 创建一个映射以快速查找保存的数据
        const adaptiveMap = new Map();
        progressData.adaptiveData.forEach(data => {
          adaptiveMap.set(data.question, data);
        });
        
        // 将保存的数据应用到当前题目
        allQuestions.forEach(question => {
          const savedData = adaptiveMap.get(question.question);
          if (savedData) {
            question.history = savedData.history || [];
            question.weight = savedData.weight || 50;
            question.mastered = savedData.mastered || false;
          }
        });
      }
      
      // 恢复当前题目
      if (progressData.currentQuestion) {
        currentQuestion = progressData.currentQuestion;
        isQuestionAnswered = progressData.isQuestionAnswered || false;
        displayQuestion(progressData.currentQuestion);
        
        // 恢复用户选择
        if (progressData.selectedAnswers && progressData.selectedAnswers.length > 0) {
          restoreSelectedAnswers(progressData.selectedAnswers);
          
          // 如果已回答，显示反馈和禁用选项
          if (isQuestionAnswered) {
            showPreviousAnswer();
          }
        }
      }
      
      updateScoreboard();
      return true;
    } catch (error) {
      console.error('Failed to load progress:', error);
      localStorage.removeItem('quizProgress');
      return false;
    }
  }

  // 获取当前选中的答案
  function getCurrentSelectedAnswers() {
    if (currentQuestion && currentQuestion.isFillInBlank) {
      const inputs = document.querySelectorAll('.fill-blank-input');
      return Array.from(inputs).map(input => input.value.trim()).filter(value => value);
    } else {
      const selectedElements = optionsArea.querySelectorAll('li.selected');
      return Array.from(selectedElements).map(li => li.dataset.answer || li.textContent);
    }
  }

  // 恢复选中的答案
  function restoreSelectedAnswers(selectedAnswers) {
    if (currentQuestion && currentQuestion.isFillInBlank) {
      const inputs = document.querySelectorAll('.fill-blank-input');
      inputs.forEach((input, index) => {
        if (selectedAnswers[index]) {
          input.value = selectedAnswers[index];
        }
      });
    } else {
      const optionElements = optionsArea.querySelectorAll('li');
      optionElements.forEach(li => {
        const answerText = li.dataset.answer || li.textContent;
        if (selectedAnswers.includes(answerText)) {
          li.classList.add('selected');
        }
      });
      
      // 更新按钮状态
      if (currentQuestion && currentQuestion.isMultipleChoice) {
        submitAnswerBtn.disabled = selectedAnswers.length === 0;
      }
    }
  }

  // 恢复抽题范围选择
  function restoreSubjectSelection(selectedSubjects) {
    const checkboxes = document.querySelectorAll('#subject-checkboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.checked = selectedSubjects.includes(cb.value);
    });
  }

  function restoreQuestionTypeSelection(selectedQuestionTypes) {
    const checkboxes = document.querySelectorAll('#question-type-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectedQuestionTypes.includes(checkbox.value);
    });
  }

  // 获取选中的科目
  function getSelectedSubjects() {
    const checkboxes = document.querySelectorAll('#subject-checkboxes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // 获取选中的题目类型
  function getSelectedQuestionTypes() {
    const checkboxes = document.querySelectorAll('#question-type-checkboxes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // 显示之前的答案反馈
  function showPreviousAnswer() {
    if (!currentQuestion || !isQuestionAnswered) return;
    
    const selectedAnswers = getCurrentSelectedAnswers();
    if (selectedAnswers.length === 0) return;
    
    let isCorrect = false;
    if (currentQuestion.isMultipleChoice) {
      isCorrect = selectedAnswers.length === currentQuestion.correctAnswers.length &&
                  selectedAnswers.every(answer => currentQuestion.correctAnswers.includes(answer)) &&
                  currentQuestion.correctAnswers.every(answer => selectedAnswers.includes(answer));
    } else {
      isCorrect = currentQuestion.correctAnswers.includes(selectedAnswers[0]);
    }
    
    const customPointsInput = document.getElementById('custom-points-input');
    let pointsForThisQuestion = defaultPoints;
    if (customPointsInput && customPointsInput.value) {
      const parsedPoints = parseInt(customPointsInput.value, 10);
      if (!isNaN(parsedPoints) && parsedPoints > 0) {
        pointsForThisQuestion = parsedPoints;
      }
    }
    
    if (isCorrect) {
      feedbackArea.textContent = `回答正确！获得 ${pointsForThisQuestion} 分。`;
      feedbackArea.className = 'feedback correct';
    } else {
      // 将正确答案转换为当前显示的选项编号
      const correctLabels = currentQuestion.correctAnswers.map(correctAnswer => {
        const optionsToDisplay = currentQuestion.shuffledOptions || currentQuestion.options;
        const index = optionsToDisplay.findIndex(option => option === correctAnswer);
        if (index !== -1) {
          const getLabel = i => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? '-' + Math.floor(i / 26) : '');
          return `${getLabel(index)}. ${correctAnswer}`;
        }
        return correctAnswer; // 如果找不到索引，返回原始答案
      });
      feedbackArea.textContent = `回答错误。正确答案是: ${correctLabels.join(', ')}`;
      feedbackArea.className = 'feedback incorrect';
    }
    
    if (currentQuestion.isFillInBlank) {
      document.querySelectorAll('.fill-blank-input')
        .forEach(inp => {
          inp.disabled = true;
          inp.style.backgroundColor = '#f5f5f5';
        });
    }
    disableOptions();
    nextQuestionBtn.disabled = false;
    nextQuestionBtn.style.display = 'inline-block';
    submitAnswerBtn.style.display = 'none';
    submitAnswerBtn.disabled = true;
  }

  // 显示当前题目（用于恢复进度）
  function displayCurrentQuestion() {
    if (currentQuestion) displayQuestion(currentQuestion);
  }

  function resetScore() {
    totalScore = 0;
    questionsAnswered = 0;
    questionsCorrect = 0;
    answeredQuestions = [];
    isQuestionAnswered = false;
    // 重置随机模式相关变量
    currentQuestionIndex = 0;
    usedQuestions = [];
    updateScoreboard();
    const customPointsInput = document.getElementById('custom-points-input');
    if (customPointsInput) {
      customPointsInput.value = defaultPoints;
    }
    // 清除保存的进度
    localStorage.removeItem('quizProgress');
    selectNextQuestion(); // Load next question after reset
  }

  function clearProgress() {
    if (confirm('确定要清除所有做题进度吗？这将重置所有数据。')) {
      localStorage.removeItem('quizProgress');
      location.reload();
    }
  }

  function disableOptions() {
    const optionElements = optionsArea.querySelectorAll('li');
    optionElements.forEach(optLi => {
      // Clone and replace to remove all event listeners
      const newLi = optLi.cloneNode(true);
      optLi.parentNode.replaceChild(newLi, optLi);
      newLi.style.pointerEvents = 'none'; // Disable click
      newLi.style.opacity = '0.7'; // Visually indicate they are disabled
    });
  }

  function selectNextQuestion(forceNew = false) {
    if (allQuestions.length === 0) {
      questionArea.innerHTML = '<p>没有更多题目了！</p>';
      optionsArea.innerHTML = '';
      feedbackArea.innerHTML = '';
      nextQuestionBtn.style.display = 'none';
      return;
    }

    let selectedQuestion = null;
    
    switch (randomMode) {
      case 'sequential':
        // 顺序播放模式
        if (currentQuestionIndex >= allQuestions.length) {
          currentQuestionIndex = 0; // 循环播放
        }
        selectedQuestion = allQuestions[currentQuestionIndex];
        currentQuestionIndex++;
        break;
        
      case 'random-without-replacement':
        // 不放回抽样模式
        const availableQuestions = allQuestions.filter(q => !usedQuestions.includes(q.question));
        if (availableQuestions.length === 0) {
          // 所有题目都用完了，重新开始
          usedQuestions = [];
          const randomIndex = Math.floor(Math.random() * allQuestions.length);
          selectedQuestion = allQuestions[randomIndex];
          usedQuestions.push(selectedQuestion.question);
        } else {
          const randomIndex = Math.floor(Math.random() * availableQuestions.length);
          selectedQuestion = availableQuestions[randomIndex];
          usedQuestions.push(selectedQuestion.question);
        }
        break;
        
      case 'adaptive':
        // 自适应刷题模式
        selectedQuestion = selectAdaptiveQuestion();
        break;
        
      case 'random-with-replacement':
      default:
        // 放回抽样模式（默认）
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        selectedQuestion = allQuestions[randomIndex];
        break;
    }
    
    currentQuestion = selectedQuestion;
    displayQuestion(currentQuestion);
  }

  function displayQuestion(question = null) {
    feedbackArea.innerHTML = '';
    feedbackArea.className = 'feedback'; // Reset feedback class
    optionsArea.innerHTML = ''; // Clear previous options
    isQuestionAnswered = false; // 重置回答状态

    // 仅当既没有可显示的题，也还尚未载入题库时才提示
    if (!question && allQuestions.length === 0) {
      questionArea.innerHTML = '<p>未能加载任何题目。请检查章节文件格式或路径。</p>';
      nextQuestionBtn.style.display = 'none';
      submitAnswerBtn.style.display = 'none';
      return;
    }

    // 使用传入的参数或全局变量
    const questionToDisplay = question || currentQuestion;
    if (!questionToDisplay) {
      return;
    }
    
    // 更新全局变量
    if (question) {
      currentQuestion = question;
    }

    let questionHtml = `<p><strong>${questionToDisplay.question}</strong></p>`;
    
    if (questionToDisplay.isFillInBlank) {
      // Check if it's an essay question or fill-in-the-blank
      const isEssayQuestion = questionToDisplay.questionType === 'essay';
      
      if (isEssayQuestion) {
        // Essay question - show/hide answer button
        questionHtml += ` <span style="font-size: 0.8em; color: #888;">(简答题)</span>`;
        questionArea.innerHTML = questionHtml;
        
        // Create answer display container
        const answerContainer = document.createElement('div');
        answerContainer.style.cssText = 'margin: 20px 0; text-align: center;';
        
        // Create show/hide answer button
        const toggleAnswerBtn = document.createElement('button');
        toggleAnswerBtn.textContent = '显示答案';
        toggleAnswerBtn.className = 'btn';
        toggleAnswerBtn.style.cssText = `
          padding: 10px 20px;
          font-size: 1em;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-bottom: 15px;
        `;
        
        // Create answer display area
        const answerDisplay = document.createElement('div');
        answerDisplay.style.cssText = `
          display: none;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 5px;
          margin-top: 10px;
          text-align: left;
          white-space: pre-wrap;
        `;
        
        // Apply dark mode styling if needed
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        if (isDarkMode) {
          answerDisplay.style.backgroundColor = '#2a2a2a';
          answerDisplay.style.borderColor = '#555';
          answerDisplay.style.color = '#e0e0e0';
        }
        
        answerDisplay.textContent = questionToDisplay.correctAnswers[0];
        
        // Toggle answer visibility
        let isAnswerVisible = false;
        toggleAnswerBtn.addEventListener('click', () => {
          isAnswerVisible = !isAnswerVisible;
          if (isAnswerVisible) {
            answerDisplay.style.display = 'block';
            toggleAnswerBtn.textContent = '隐藏答案';
          } else {
            answerDisplay.style.display = 'none';
            toggleAnswerBtn.textContent = '显示答案';
          }
        });
        
        answerContainer.appendChild(toggleAnswerBtn);
        answerContainer.appendChild(answerDisplay);
        optionsArea.appendChild(answerContainer);
        
        // For essay questions, always show next button and hide submit button
        submitAnswerBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'inline-block';
        nextQuestionBtn.disabled = false;
        
      } else {
        // Regular fill-in-the-blank question
        const blankCount = questionToDisplay.blankCount || 1;
        const isMultipleBlank = blankCount > 1;
        
        questionHtml += ` <span style="font-size: 0.8em; color: #888;">(填空题${isMultipleBlank ? ` - ${blankCount}个空` : ''})</span>`;
        questionArea.innerHTML = questionHtml;
        
        // Create input container for fill-in-the-blank
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'margin: 20px 0; text-align: center;';
        
        // 生成多个输入框
        for (let i = 0; i < blankCount; i++) {
          if (i > 0) {
            // 添加空格分隔
            const spacer = document.createElement('div');
            spacer.style.cssText = 'height: 15px;';
            inputContainer.appendChild(spacer);
          }
          
          // 如果是多空题，添加序号标签
          if (isMultipleBlank) {
            const label = document.createElement('div');
            label.textContent = `第${i + 1}空:`;
            label.style.cssText = `
              font-size: 0.9em;
              color: #666;
              margin-bottom: 5px;
              text-align: left;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            `;
            inputContainer.appendChild(label);
          }
          
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = isMultipleBlank ? `请输入第${i + 1}空答案` : '请输入答案';
          input.className = 'fill-blank-input';
          input.dataset.blankIndex = i; // 记录空位索引
          
          // Apply comprehensive styling
          const isDarkMode = document.documentElement.classList.contains('dark-mode');
          input.style.cssText = `
            width: 100%;
            max-width: 400px;
            padding: 15px 20px;
            font-size: 1.2em;
            font-family: inherit;
            border: 2px solid ${isDarkMode ? '#555' : '#ddd'};
            border-radius: 8px;
            box-sizing: border-box;
            background-color: ${isDarkMode ? '#2a2a2a' : '#fff'};
            color: ${isDarkMode ? '#e0e0e0' : '#333'};
            transition: all 0.3s ease;
            outline: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: block;
            margin: 0 auto;
          `;
          
          // Add hover and focus effects
          input.addEventListener('mouseenter', () => {
            const isDark = document.documentElement.classList.contains('dark-mode');
            input.style.borderColor = isDark ? '#777' : '#bbb';
            input.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          });
          
          input.addEventListener('mouseleave', () => {
            if (document.activeElement !== input) {
              const isDark = document.documentElement.classList.contains('dark-mode');
              input.style.borderColor = isDark ? '#555' : '#ddd';
              input.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          });
          
          input.addEventListener('focus', () => {
            const isDark = document.documentElement.classList.contains('dark-mode');
            input.style.borderColor = '#007bff';
            input.style.boxShadow = `0 0 0 3px ${isDark ? 'rgba(0,123,255,0.3)' : 'rgba(0,123,255,0.25)'}`;
          });
          
          input.addEventListener('blur', () => {
            const isDark = document.documentElement.classList.contains('dark-mode');
            input.style.borderColor = isDark ? '#555' : '#ddd';
            input.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          });
          
          // Add input validation styling
          input.addEventListener('input', () => {
            const value = input.value.trim();
            const isDark = document.documentElement.classList.contains('dark-mode');
            
            if (value.length > 0) {
              input.style.borderColor = isDark ? '#28a745' : '#28a745';
            } else {
              input.style.borderColor = isDark ? '#555' : '#ddd';
            }
          });
          
          inputContainer.appendChild(input);
        }
        
        optionsArea.appendChild(inputContainer);
        
        submitAnswerBtn.style.display = 'inline-block';
        nextQuestionBtn.style.display = 'none';
        submitAnswerBtn.disabled = false;
        
        // Focus on first input
        setTimeout(() => {
          const firstInput = inputContainer.querySelector('.fill-blank-input');
          if (firstInput) firstInput.focus();
        }, 100);
      }
      
    } else {
      // Multiple choice or true/false question
      if (questionToDisplay.isMultipleChoice) {
        questionHtml += ` <span style="font-size: 0.8em; color: #888;">(多选题)</span>`;
        submitAnswerBtn.style.display = 'inline-block';
        nextQuestionBtn.style.display = 'none';
      } else {
        submitAnswerBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'inline-block';
      }
      questionArea.innerHTML = questionHtml;

      const ul = document.createElement('ul');
      ul.className = 'options';
      
      // 获取选项打乱设置
      const shuffleCheckbox = document.getElementById('shuffle-options-checkbox');
      let shouldShuffle = shuffleCheckbox ? shuffleCheckbox.checked : shuffleOptions;
      
      // 判断题不进行打乱（通常只有"正确/错误"两项，固定顺序更符合用户习惯）
      if (questionToDisplay.questionType === 'true-false') {
        shouldShuffle = false;
      }
      
      // 缓存洗牌结果，避免重复加载时选项顺序变化
      let optionsToDisplay;
      if (!questionToDisplay.shuffledOptions) {
        questionToDisplay.shuffledOptions = shouldShuffle
          ? shuffleArray([...questionToDisplay.options])
          : [...questionToDisplay.options];
      }
      optionsToDisplay = questionToDisplay.shuffledOptions;
      
      // 处理带编号前缀的选项
      const getLabel = i => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? '-' + Math.floor(i / 26) : '');
      
      optionsToDisplay.forEach((option, index) => {
        const li = document.createElement('li');
        
        // 由于parseQuestions已经去掉了前缀，option现在就是干净的文本
        // 自动重新编号
        li.textContent = `${getLabel(index)}. ${option}`;
        
        // 保存干净的答案文本用于答案比对（关键：用于选项恢复）
        li.dataset.answer = option;
        
        // Reset styles and re-add event listener for new question
        li.style.pointerEvents = 'auto'; 
        li.style.opacity = '1';
        
        // 点击事件中传递原始选项文本用于答案检查
        li.addEventListener('click', () => handleOptionClick(li));
        ul.appendChild(li);
      });
      optionsArea.appendChild(ul);

      if (questionToDisplay.isMultipleChoice) {
          submitAnswerBtn.style.display = 'inline-block';
          nextQuestionBtn.style.display = 'none';
          submitAnswerBtn.disabled = true;
      } else {
          submitAnswerBtn.style.display = 'none';
          nextQuestionBtn.style.display = 'inline-block';
          nextQuestionBtn.disabled = true;
      }
    }
    
    // 保存进度
    saveProgress();
  }

  function handleOptionClick(liElement) {
    if (!currentQuestion || isQuestionAnswered) return;

    if (currentQuestion.isMultipleChoice) {
      liElement.classList.toggle('selected');
      const selectedOptions = optionsArea.querySelectorAll('li.selected');
      submitAnswerBtn.disabled = selectedOptions.length === 0;
    } else {
      // Single choice: clear previous selections and mark new one
      const allOptions = optionsArea.querySelectorAll('li');
      allOptions.forEach(opt => {
        opt.classList.remove('selected');
      });
      liElement.classList.add('selected');
      checkAnswer(); // Check answer immediately for single choice
      disableOptions(); // Disable options after an answer is selected for single-choice
      nextQuestionBtn.disabled = false; // Enable next question button
    }
    
    // 保存进度
    saveProgress();
  }

  function checkAnswer() {
    if (!currentQuestion || isQuestionAnswered) return;

    let selectedAnswers = [];
    let isCorrect = false;
    
    if (currentQuestion.isFillInBlank) {
      // Handle fill-in-the-blank questions
      const inputs = document.querySelectorAll('.fill-blank-input');
      const userAnswers = Array.from(inputs).map(input => input.value.trim());
      
      // 检查是否有空的输入框
      if (userAnswers.some(answer => !answer)) {
        feedbackArea.textContent = '请填写所有空格。';
        feedbackArea.className = 'feedback incorrect';
        return;
      }
      
      selectedAnswers = userAnswers;
      const correctAnswers = currentQuestion.correctAnswers;
      
      // 判分逻辑
      if (correctAnswers.length === 1 && userAnswers.length === 1) {
        // 单空填空题：使用原有的灵活匹配逻辑
        const userAnswer = userAnswers[0];
        const correctAnswer = correctAnswers[0];
        isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
                    correctAnswer.toLowerCase().includes(userAnswer.toLowerCase()) ||
                    userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
      } else if (correctAnswers.length === userAnswers.length) {
        // 多空填空题：逐一精确比对
        isCorrect = correctAnswers.every((correctAnswer, index) => {
          const userAnswer = userAnswers[index];
          return userAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
                 correctAnswer.toLowerCase().includes(userAnswer.toLowerCase()) ||
                 userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
        });
      } else {
        // 答案数量不匹配
        isCorrect = false;
      }
      
    } else {
      // Handle multiple choice and true/false questions
      const selectedOptionElements = Array.from(optionsArea.querySelectorAll('li.selected'));
      selectedAnswers = selectedOptionElements.map(li => li.dataset.answer || li.textContent);

      if (selectedAnswers.length === 0) {
        feedbackArea.textContent = '请至少选择一个答案。';
        feedbackArea.className = 'feedback incorrect';
        return;
      }

      if (currentQuestion.isMultipleChoice) {
        isCorrect = selectedAnswers.length === currentQuestion.correctAnswers.length &&
                    selectedAnswers.every(answer => currentQuestion.correctAnswers.includes(answer)) &&
                    currentQuestion.correctAnswers.every(answer => selectedAnswers.includes(answer));
      } else {
        isCorrect = currentQuestion.correctAnswers.includes(selectedAnswers[0]);
      }
    }

    // Get points from custom input or use default
    const customPointsInput = document.getElementById('custom-points-input');
    let pointsForThisQuestion = defaultPoints;
    if (customPointsInput && customPointsInput.value) {
        const parsedPoints = parseInt(customPointsInput.value, 10);
        if (!isNaN(parsedPoints) && parsedPoints > 0) {
            pointsForThisQuestion = parsedPoints;
        }
    }

    // 只有在第一次回答时才计分
    if (!isQuestionAnswered) {
      questionsAnswered++;
      if (isCorrect) {
        totalScore += pointsForThisQuestion;
        questionsCorrect++;
      }
      
      // 记录题目ID（使用题目文本作为ID）
      const questionId = currentQuestion.question;
      if (!answeredQuestions.includes(questionId)) {
        answeredQuestions.push(questionId);
      }
    }

    isQuestionAnswered = true;

    // 更新自适应刷题统计
    if (randomMode === 'adaptive') {
      updateAdaptiveStats(currentQuestion, isCorrect);
    }

    if (isCorrect) {
    feedbackArea.textContent = `回答正确！获得 ${pointsForThisQuestion} 分。`;
    feedbackArea.className = 'feedback correct';
  } else {
    // 将正确答案转换为当前显示的选项编号
    const correctLabels = currentQuestion.correctAnswers.map(correctAnswer => {
      const optionsToDisplay = currentQuestion.shuffledOptions || currentQuestion.options;
      const index = optionsToDisplay.findIndex(option => option === correctAnswer);
      if (index !== -1) {
        const getLabel = i => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? '-' + Math.floor(i / 26) : '');
        return `${getLabel(index)}. ${correctAnswer}`;
      }
      return correctAnswer; // 如果找不到索引，返回原始答案
    });
    feedbackArea.textContent = `回答错误。正确答案是: ${correctLabels.join(', ')}`;
    feedbackArea.className = 'feedback incorrect';
  }

    // Disable options after answering
    if (currentQuestion.isFillInBlank) {
      document.querySelectorAll('.fill-blank-input')
        .forEach(inp => {
          inp.disabled = true;
          inp.style.backgroundColor = '#f5f5f5';
        });
    } else {
      disableOptions();
    }

    nextQuestionBtn.disabled = false;
    nextQuestionBtn.style.display = 'inline-block';
    submitAnswerBtn.style.display = 'none';
    submitAnswerBtn.disabled = true;
    updateScoreboard();
    
    // 保存进度
    saveProgress();
  }

  nextQuestionBtn.addEventListener('click', selectNextQuestion);
  submitAnswerBtn.addEventListener('click', checkAnswer); // Add event listener for the new button

  // Add event listeners for subject checkboxes
  const subjectCheckboxes = document.querySelectorAll('#subject-checkboxes input[type="checkbox"]');
  subjectCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (event) => {
      // 只有在有未完成的题目时才提示用户
      if (currentQuestion && !isQuestionAnswered && (questionsAnswered > 0 || getCurrentSelectedAnswers().length > 0)) {
        const confirmChange = confirm('切换抽题范围将会丢失当前题目的进度，是否继续？');
        if (!confirmChange) {
          // 用户取消，恢复checkbox状态
          event.target.checked = !event.target.checked;
          return;
        }
      }
      
      const selectedSubjects = Array.from(document.querySelectorAll('#subject-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value);
      console.log('Selected subjects changed to:', selectedSubjects.join(', '));
      
      // 清除当前题目状态
      currentQuestion = null;
      isQuestionAnswered = false;
      
      // 清空界面
      questionArea.innerHTML = '';
      optionsArea.innerHTML = '';
      feedbackArea.innerHTML = '';
      
      // 保存新的抽题范围设置
      saveProgress();
      
      // 重新加载题目
      fetchQuestions();
    });
  });

  // Add event listeners for question type checkboxes
  const questionTypeCheckboxes = document.querySelectorAll('#question-type-checkboxes input[type="checkbox"]');
  questionTypeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (event) => {
      // 只有在有未完成的题目时才提示用户
      if (currentQuestion && !isQuestionAnswered && (questionsAnswered > 0 || getCurrentSelectedAnswers().length > 0)) {
        const confirmChange = confirm('切换题目类型将会丢失当前题目的进度，是否继续？');
        if (!confirmChange) {
          // 用户取消，恢复checkbox状态
          event.target.checked = !event.target.checked;
          return;
        }
      }
      
      const selectedQuestionTypes = Array.from(document.querySelectorAll('#question-type-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value);
      console.log('Selected question types changed to:', selectedQuestionTypes.join(', '));
      
      // 清除当前题目状态
      currentQuestion = null;
      isQuestionAnswered = false;
      
      // 清空界面
      questionArea.innerHTML = '';
      optionsArea.innerHTML = '';
      feedbackArea.innerHTML = '';
      
      // 保存新的题目类型设置
      saveProgress();
      
      // 重新加载题目
      fetchQuestions();
    });
  });

  // Add event listener for random mode select
  const randomModeSelect = document.getElementById('random-mode-select');
  if (randomModeSelect) {
    randomModeSelect.addEventListener('change', (event) => {
      const newMode = event.target.value;
      console.log('Random mode changed to:', newMode);
      
      // 更新随机模式
      randomMode = newMode;
      
      // 重置相关变量
      currentQuestionIndex = 0;
      usedQuestions = [];
      
      // 保存设置
      saveProgress();
      
      // 如果当前没有题目或题目已回答，立即加载下一题
      if (!currentQuestion || isQuestionAnswered) {
        selectNextQuestion();
      }
    });
  }

  // 添加选项打乱复选框的事件监听器
  const shuffleCheckbox = document.getElementById('shuffle-options-checkbox');
  if (shuffleCheckbox) {
    shuffleCheckbox.addEventListener('change', (e) => {
      shuffleOptions = e.target.checked;
      console.log('Shuffle options changed to:', shuffleOptions);
      saveProgress();
    });
  }

  // 添加清除进度按钮到计分板
  function addClearProgressButton() {
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-progress-btn';
    clearBtn.textContent = '清除进度';
    clearBtn.style.cssText = `
      padding: 5px 10px;
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.8em;
      font-weight: 500;
      transition: all 0.3s ease;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-left: 5px;
    `;
    
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.background = 'linear-gradient(135deg, #c82333 0%, #a71e2a 100%)';
      clearBtn.style.transform = 'translateY(-1px)';
      clearBtn.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
    });
    
    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
      clearBtn.style.transform = 'translateY(0)';
      clearBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    clearBtn.addEventListener('click', clearProgress);
    
    // 将按钮添加到重置按钮旁边
    const resetBtn = document.getElementById('reset-score-btn');
    if (resetBtn && resetBtn.parentNode) {
      resetBtn.parentNode.insertBefore(clearBtn, resetBtn.nextSibling);
    }
  }

  // 添加重置巩固按钮
  function addResetMasteryButton() {
    const resetMasteryBtn = document.createElement('button');
    resetMasteryBtn.id = 'reset-mastery-btn';
    resetMasteryBtn.textContent = '重置巩固';
    resetMasteryBtn.style.cssText = `
      padding: 5px 10px;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.8em;
      font-weight: 500;
      transition: all 0.3s ease;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-left: 5px;
      display: none;
    `;
    
    resetMasteryBtn.addEventListener('mouseenter', () => {
      resetMasteryBtn.style.background = 'linear-gradient(135deg, #20c997 0%, #17a2b8 100%)';
      resetMasteryBtn.style.transform = 'translateY(-1px)';
      resetMasteryBtn.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
    });
    
    resetMasteryBtn.addEventListener('mouseleave', () => {
      resetMasteryBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      resetMasteryBtn.style.transform = 'translateY(0)';
      resetMasteryBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    resetMasteryBtn.addEventListener('click', function() {
      if (confirm('确定要重置所有题目的掌握状态吗？这将清除自适应学习的进度。')) {
        resetAdaptiveMastery();
      }
    });
    
    // 将按钮添加到清除进度按钮旁边
    const clearBtn = document.getElementById('clear-progress-btn');
    if (clearBtn && clearBtn.parentNode) {
      clearBtn.parentNode.insertBefore(resetMasteryBtn, clearBtn.nextSibling);
    }
    
    // 监听随机模式变化，控制按钮显示
    const randomModeSelect = document.getElementById('random-mode-select');
    if (randomModeSelect) {
      const updateButtonVisibility = () => {
        resetMasteryBtn.style.display = randomModeSelect.value === 'adaptive' ? 'inline-block' : 'none';
      };
      
      randomModeSelect.addEventListener('change', updateButtonVisibility);
      updateButtonVisibility(); // 初始化时也要检查
    }
  }

  // 重置自适应掌握状态
  function resetAdaptiveMastery() {
    allQuestions.forEach(question => {
      question.history = [];
      question.weight = 50;
      question.mastered = false;
    });
    
    // 保存更新后的状态
    saveProgress();
    
    // 更新计分板显示
    updateScoreboard();
    
    // 显示提示信息
    const feedbackArea = document.getElementById('feedback-area');
    if (feedbackArea) {
      feedbackArea.innerHTML = '<div class="feedback neutral">已重置所有题目的掌握状态，自适应学习重新开始！</div>';
      setTimeout(() => {
        feedbackArea.innerHTML = '';
      }, 3000);
    }
    
    console.log('自适应掌握状态已重置');
  }

  // 初始化
  // 设置智能默认筛选
  setDefaultSubjectSelection();
  
  // 设置随机模式默认值（仅在首次加载时）
  const progressLoaded = loadProgress();
  if (randomModeSelect && !progressLoaded) {
    randomModeSelect.value = 'random-without-replacement';
    randomMode = 'random-without-replacement';
  }
  
  // 设置选项打乱默认值（仅在首次加载时）
  if (shuffleCheckbox && !progressLoaded) {
    shuffleCheckbox.checked = shuffleOptions;
  }
  
  if (!progressLoaded) {
    // 如果没有保存的进度，正常初始化
    fetchQuestions();
  } else {
    // 有保存进度时加载题目数据，但不要覆盖已恢复的指针
    fetchQuestions(true, true); // 第二个参数 = preserveIndex
  }

  if (resetScoreBtn) {
    resetScoreBtn.addEventListener('click', resetScore);
  }
  
  // 添加清除进度按钮
  addClearProgressButton();
  
  // 添加重置巩固按钮
  addResetMasteryButton();
  
  // === 键盘快捷键：Enter = 提交 / 下一题 ==========================
  document.addEventListener('keydown', e => {
    // 只处理 Enter / ↵（兼容主键盘和数字键盘）
    if (e.key !== 'Enter' && e.key !== 'NumpadEnter') return;

    // 若焦点在 <textarea> 里（简答题换行），放行默认行为
    if (e.target.tagName === 'TEXTAREA') return;

    // 优先触发「确认答案」
    if (submitAnswerBtn &&
        submitAnswerBtn.style.display !== 'none' &&
        !submitAnswerBtn.disabled) {
      submitAnswerBtn.click();
      e.preventDefault();
      return;
    }

    // 其次触发「下一题」
    if (nextQuestionBtn &&
        nextQuestionBtn.style.display !== 'none' &&
        !nextQuestionBtn.disabled) {
      nextQuestionBtn.click();
      e.preventDefault();
    }
  });
});