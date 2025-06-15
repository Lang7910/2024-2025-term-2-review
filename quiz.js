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
      'chapter13.html'
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
      if (!questionText.match(/^\d+\s+/) && !questionText.includes('填空题') && !questionText.includes('判断题')) {
        return;
      }

      // Check if it's a fill-in-the-blank question (contains 3+ consecutive underscores)
      if (questionText.includes('___') || questionText.includes('填空题')) {
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
          questions.push({
            question: questionText,
            options: [], // No options for fill-in-the-blank
            correctAnswers: [correctAnswer],
            isMultipleChoice: false,
            isFillInBlank: true,
            questionType: 'fill-blank'
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
          const optionText = li.textContent.trim();
          
          if (checkbox && optionText) {
            options.push(optionText);
            
            if (checkbox.checked) {
              correctAnswers.push(optionText);
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
    

    return questions;
  }

  function getSelectedQuestionTypes() {
    const checkboxes = document.querySelectorAll('#question-type-checkboxes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  async function fetchQuestions(skipLoadQuestion = false) {
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

    console.log(`Fetched ${allQuestions.length} questions.`);
    if (allQuestions.length === 0) {
        questionArea.innerHTML = '<p>未能加载任何题目。请检查章节文件格式或路径。</p>';
        optionsArea.innerHTML = '';
        feedbackArea.innerHTML = '';
        nextQuestionBtn.style.display = 'none';
        return;
    }
    // 只有在没有跳过加载题目的情况下才加载随机题目
    if (!skipLoadQuestion) {
      loadRandomQuestion();
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
      
      // 恢复当前题目
      if (progressData.currentQuestion) {
        currentQuestion = progressData.currentQuestion;
        isQuestionAnswered = progressData.isQuestionAnswered || false;
        displayCurrentQuestion();
        
        // 恢复用户选择
        if (progressData.selectedAnswers && progressData.selectedAnswers.length > 0) {
          setTimeout(() => {
            restoreSelectedAnswers(progressData.selectedAnswers);
            
            // 如果已回答，显示反馈和禁用选项
            if (isQuestionAnswered) {
              showPreviousAnswer();
            }
          }, 100);
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
      const input = document.getElementById('fill-blank-input');
      return input && input.value.trim() ? [input.value.trim()] : [];
    } else {
      const selectedElements = optionsArea.querySelectorAll('li.selected');
      return Array.from(selectedElements).map(li => li.textContent);
    }
  }

  // 恢复选中的答案
  function restoreSelectedAnswers(selectedAnswers) {
    if (currentQuestion && currentQuestion.isFillInBlank) {
      const input = document.getElementById('fill-blank-input');
      if (input && selectedAnswers.length > 0) {
        input.value = selectedAnswers[0];
      }
    } else {
      const optionElements = optionsArea.querySelectorAll('li');
      optionElements.forEach(li => {
        if (selectedAnswers.includes(li.textContent)) {
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
      feedbackArea.textContent = `回答错误。正确答案是: ${currentQuestion.correctAnswers.join(', ')}`;
      feedbackArea.className = 'feedback incorrect';
    }
    
    disableOptions();
    nextQuestionBtn.disabled = false;
    nextQuestionBtn.style.display = 'inline-block';
    submitAnswerBtn.style.display = 'none';
    submitAnswerBtn.disabled = true;
  }

  // 显示当前题目（用于恢复进度）
  function displayCurrentQuestion() {
    if (!currentQuestion) return;
    
    feedbackArea.innerHTML = '';
    feedbackArea.className = 'feedback';
    optionsArea.innerHTML = '';
    
    let questionHtml = `<p><strong>${currentQuestion.question}</strong></p>`;
    if (currentQuestion.isMultipleChoice) {
      questionHtml += ` <span style="font-size: 0.8em; color: #888;">(多选题)</span>`;
    }
    questionArea.innerHTML = questionHtml;
    
    const ul = document.createElement('ul');
    ul.className = 'options';
    currentQuestion.options.forEach(option => {
      const li = document.createElement('li');
      li.textContent = option;
      li.style.pointerEvents = 'auto';
      li.style.opacity = '1';
      li.addEventListener('click', () => handleOptionClick(li, option));
      ul.appendChild(li);
    });
    optionsArea.appendChild(ul);
    
    if (currentQuestion.isMultipleChoice) {
      submitAnswerBtn.style.display = 'inline-block';
      nextQuestionBtn.style.display = 'none';
      submitAnswerBtn.disabled = true;
    } else {
      submitAnswerBtn.style.display = 'none';
      nextQuestionBtn.style.display = 'inline-block';
      nextQuestionBtn.disabled = !isQuestionAnswered;
    }
  }

  function resetScore() {
    totalScore = 0;
    questionsAnswered = 0;
    questionsCorrect = 0;
    answeredQuestions = [];
    isQuestionAnswered = false;
    updateScoreboard();
    const customPointsInput = document.getElementById('custom-points-input');
    if (customPointsInput) {
      customPointsInput.value = defaultPoints;
    }
    // 清除保存的进度
    localStorage.removeItem('quizProgress');
    loadRandomQuestion(); // Load next question after reset
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

  function loadRandomQuestion() {
    if (allQuestions.length === 0) {
      questionArea.innerHTML = '<p>没有更多题目了！</p>';
      optionsArea.innerHTML = '';
      feedbackArea.innerHTML = '';
      nextQuestionBtn.style.display = 'none';
      return;
    }

    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    currentQuestion = allQuestions[randomIndex];
    // To avoid repeating the same question immediately, you might want to remove it or mark as asked
    // allQuestions.splice(randomIndex, 1); 

    displayQuestion(currentQuestion);
  }

  function displayQuestion() {
    feedbackArea.innerHTML = '';
    feedbackArea.className = 'feedback'; // Reset feedback class
    optionsArea.innerHTML = ''; // Clear previous options
    isQuestionAnswered = false; // 重置回答状态

    if (allQuestions.length === 0) {
      questionArea.innerHTML = '<p>未能加载任何题目。请检查章节文件格式或路径。</p>';
      nextQuestionBtn.style.display = 'none';
      submitAnswerBtn.style.display = 'none';
      return;
    }

    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    currentQuestion = allQuestions[randomIndex];

    let questionHtml = `<p><strong>${currentQuestion.question}</strong></p>`;
    
    if (currentQuestion.isFillInBlank) {
      // Fill-in-the-blank question
      questionHtml += ` <span style="font-size: 0.8em; color: #888;">(填空题)</span>`;
      questionArea.innerHTML = questionHtml;
      
      // Create input field for fill-in-the-blank
      const inputContainer = document.createElement('div');
      inputContainer.style.cssText = 'margin: 20px 0; text-align: center;';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'fill-blank-input';
      input.placeholder = '请输入答案';
      input.className = 'fill-blank-input';
      
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
      optionsArea.appendChild(inputContainer);
      
      submitAnswerBtn.style.display = 'inline-block';
      nextQuestionBtn.style.display = 'none';
      submitAnswerBtn.disabled = false;
      
      // Focus on input
      setTimeout(() => input.focus(), 100);
      
    } else {
      // Multiple choice or true/false question
      if (currentQuestion.isMultipleChoice) {
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
      currentQuestion.options.forEach(option => {
        const li = document.createElement('li');
        li.textContent = option;
        // Reset styles and re-add event listener for new question
        li.style.pointerEvents = 'auto'; 
        li.style.opacity = '1';
        li.addEventListener('click', () => handleOptionClick(li, option));
        ul.appendChild(li);
      });
      optionsArea.appendChild(ul);

      if (currentQuestion.isMultipleChoice) {
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

  function handleOptionClick(liElement, option) {
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
      const input = document.getElementById('fill-blank-input');
      if (!input || !input.value.trim()) {
        feedbackArea.textContent = '请输入答案。';
        feedbackArea.className = 'feedback incorrect';
        return;
      }
      
      const userAnswer = input.value.trim();
      selectedAnswers = [userAnswer];
      
      // Check if answer is correct (case-insensitive and flexible matching)
      const correctAnswer = currentQuestion.correctAnswers[0];
      isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
                  correctAnswer.toLowerCase().includes(userAnswer.toLowerCase()) ||
                  userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
      
    } else {
      // Handle multiple choice and true/false questions
      const selectedOptionElements = Array.from(optionsArea.querySelectorAll('li.selected'));
      selectedAnswers = selectedOptionElements.map(li => li.textContent);

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

    if (isCorrect) {
      feedbackArea.textContent = `回答正确！获得 ${pointsForThisQuestion} 分。`;
      feedbackArea.className = 'feedback correct';
    } else {
      feedbackArea.textContent = `回答错误。正确答案是: ${currentQuestion.correctAnswers.join(', ')}`;
      feedbackArea.className = 'feedback incorrect';
    }

    // Disable options after answering
    if (currentQuestion.isFillInBlank) {
      const input = document.getElementById('fill-blank-input');
      if (input) {
        input.disabled = true;
        input.style.backgroundColor = '#f5f5f5';
      }
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

  nextQuestionBtn.addEventListener('click', displayQuestion);
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

  // 初始化
  // 设置智能默认筛选
  setDefaultSubjectSelection();
  
  const progressLoaded = loadProgress();
  
  if (!progressLoaded) {
    // 如果没有保存的进度，正常初始化
    fetchQuestions();
  } else {
    // 如果有保存的进度，仍需要加载题目数据以支持切换题目
    // 但不要覆盖已恢复的当前题目，所以跳过loadRandomQuestion()
    fetchQuestions(true);
  }

  if (resetScoreBtn) {
    resetScoreBtn.addEventListener('click', resetScore);
  }
  
  // 添加清除进度按钮
  addClearProgressButton();
});