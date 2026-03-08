import React, { useState, useEffect } from 'react'

const parseExerciseContent = (text) => {
  const correct_answers = {}
  let gapCount = 0
  const content = text.replace(/{([^}]+)}/g, (match, answer) => {
    gapCount++
    const gapKey = `gap${gapCount}`
    correct_answers[gapKey] = answer
    return `{${gapKey}}`
  })
  return { content, correct_answers }
}

const ExerciseRenderer = ({ exercise, onComplete, token, initialInputs = {}, onAnswersChange }) => {
  const [inputs, setInputs] = useState(initialInputs)
  const [feedback, setFeedback] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    setInputs(initialInputs)
    setFeedback({})
    setIsCompleted(false)
    setStartTime(new Date())
  }, [exercise, initialInputs])

  const handleInputChange = (gapKey, value) => {
    const newInputs = { ...inputs, [gapKey]: value }
    setInputs(newInputs)
    if (onAnswersChange) onAnswersChange(newInputs)
  }

  const handleDragStart = (e, value) => {
    e.dataTransfer.setData("text/plain", value)
  }

  const handleDrop = (e, gapKey) => {
    e.preventDefault()
    const value = e.dataTransfer.getData("text/plain")
    if (value) handleInputChange(gapKey, value)
  }

  const checkAnswers = async () => {
    if (!exercise.correct_answers || typeof exercise.correct_answers !== 'object') return;

    let correctCount = 0
    let totalCount = Object.keys(exercise.correct_answers).length
    const newFeedback = {}

    Object.keys(exercise.correct_answers).forEach(gap => {
      const userVal = (inputs[gap] || "").trim().toLowerCase()
      const correctVal = String(exercise.correct_answers[gap]).toLowerCase()

      if (userVal === correctVal) {
        newFeedback[gap] = 'correct'
        correctCount++
      } else {
        newFeedback[gap] = 'incorrect'
      }
    })

    setFeedback(newFeedback)

    const isAllCorrect = correctCount === totalCount
    const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0

    if (token && exercise.id) {
      try {
        await fetch('/api/attempts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            exercise: exercise.id,
            start_time: startTime ? startTime.toISOString() : new Date().toISOString(),
            score: score,
            answers: inputs,
            is_correct: isAllCorrect
          })
        });
      } catch (err) { console.error("Error logging attempt:", err) }
    }

    if (isAllCorrect) {
      setIsCompleted(true)
      setTimeout(onComplete, 1500)
    } else {
      setTimeout(() => setFeedback({}), 2000)
    }
  }

  const renderContent = () => {
    if (!exercise || !exercise.content) return null;
    const parts = exercise.content.split(/({gap\d+})/)
    return parts.map((part, index) => {
      const match = part.match(/{gap(\d+)}/)
      if (match) {
        const gapKey = `gap${match[1]}`
        const correctAnswer = exercise.correct_answers ? exercise.correct_answers[gapKey] : "";

        if (exercise.interaction_type === 'drag_and_drop') {
          return (
            <span
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, gapKey)}
              className={`inline-input drop-zone ${feedback[gapKey] || ""} ${inputs[gapKey] ? 'filled' : ''}`}
            >
              {inputs[gapKey] || "..."}
            </span>
          )
        } else {
          return (
            <input
              key={index}
              type="text"
              value={inputs[gapKey] || ""}
              onChange={(e) => handleInputChange(gapKey, e.target.value)}
              className={`inline-input ${feedback[gapKey] || ""}`}
              style={{ width: `${(String(correctAnswer || "").length + 2) * 10}px` }}
              placeholder="..."
              disabled={isCompleted}
            />
          )
        }
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="exercise-box">
      <div className="exercise-text">{renderContent()}</div>

      {exercise.interaction_type === 'drag_and_drop' && !isCompleted && (
        <div className="drag-pool" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.isArray(exercise.options) && exercise.options.map((opt, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => handleDragStart(e, opt)}
              className="drag-item"
            >
              {opt}
            </div>
          ))}
        </div>
      )}

      {!isCompleted && (
        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={checkAnswers}>
          Comprobar
        </button>
      )}
      {isCompleted && (
        <div style={{ marginTop: '1.5rem', color: '#10b981', fontWeight: 'bold', animation: 'fadeIn 0.5s ease', textAlign: 'center', fontSize: '1.2rem' }}>
          ¡Excelente! 🎉
        </div>
      )}
    </div>
  )
}

function App() {
  const [backendMessage, setBackendMessage] = useState("")
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  // Auth states
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || "")

  // App logic states
  const [lessons, setLessons] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)

  // Form states
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")

  const [authStatus, setAuthStatus] = useState(null)

  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [userStats, setUserStats] = useState({ attempts: [], achievements: [], progress: [] })

  // Lesson session state
  const [lessonAnswers, setLessonAnswers] = useState({}) // { [exerciseId]: { gap1: "val" } }
  const [showResults, setShowResults] = useState(false)
  const [lessonSummary, setLessonSummary] = useState({ score: 0, correct: 0, total: 0 })

  // Creator states
  const [isNewLessonOpen, setIsNewLessonOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [newLessonData, setNewLessonData] = useState({ title: "", description: "" })
  const [activePageForEdit, setActivePageForEdit] = useState(null)
  const [isNewPageOpen, setIsNewPageOpen] = useState(false)
  const [isNewExerciseOpen, setIsNewExerciseOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState(null)
  const [editingLessonMeta, setEditingLessonMeta] = useState(null)

  useEffect(() => {
    fetch('/api/ping/')
      .then(res => res.json())
      .then(data => { if (data.message) setBackendMessage(data.message) })
      .catch(err => console.error("Error fetching from backend:", err))

    if (token) {
      fetchUserProfile(token);
      fetchLessons(token);
    }
  }, [token])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/students/me/stats/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
        setIsStatsOpen(true);
      }
    } catch (err) { console.error("Error fetching stats:", err); }
  }

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch('/api/users/me/', {
        headers: { 'Authorization': `Token ${authToken}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        handleLogout();
      }
    } catch (err) { console.error("Error fetching profile:", err); }
  }

  const fetchLessons = async (authToken) => {
    try {
      const response = await fetch('/api/lessons/', {
        headers: { 'Authorization': `Token ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        const parsedData = data.map(lesson => {
          if (lesson.pages && Array.isArray(lesson.pages)) {
            lesson.pages = lesson.pages.map(page => {
              if (page.exercises && Array.isArray(page.exercises)) {
                page.exercises = page.exercises.map(ex => {
                  let parsedAnswers = ex.correct_answers;
                  let parsedOptions = ex.options;

                  if (typeof parsedAnswers === 'string') {
                    try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { }
                  }
                  if (typeof parsedOptions === 'string') {
                    try { parsedOptions = JSON.parse(parsedOptions); } catch (e) { }
                  }
                  return { ...ex, correct_answers: parsedAnswers || {}, options: parsedOptions || [] };
                });
              }
              return page;
            });
          }
          return lesson;
        });
        setLessons(parsedData);
      }
    } catch (err) { console.error("Error fetching lessons:", err); }
  }

  const handlePrevExercise = () => {
    if (!activeLesson) return;

    if (currentExerciseIdx > 0) {
      // Prev exercise in same page
      setCurrentExerciseIdx(prev => prev - 1)
    } else if (currentPageIdx > 0) {
      // Prev page
      const prevPageIdx = currentPageIdx - 1
      const prevPage = activeLesson.pages[prevPageIdx]
      setCurrentPageIdx(prevPageIdx)
      setCurrentExerciseIdx(prevPage?.exercises?.length ? prevPage.exercises.length - 1 : 0)
    }
  }

  const handleNextExercise = () => {
    if (!activeLesson) return;

    // New structure: Lesson -> Pages -> Exercises
    const currentPage = activeLesson.pages[currentPageIdx];
    if (currentPage && currentPage.exercises && currentExerciseIdx < currentPage.exercises.length - 1) {
      // Next exercise in same page
      setCurrentExerciseIdx(prev => prev + 1)
    } else if (currentPageIdx < activeLesson.pages.length - 1) {
      // Next page
      setCurrentPageIdx(prev => prev + 1)
      setCurrentExerciseIdx(0)
    } else {
      // Finished lesson - Evaluate!
      evaluateLesson()
    }
  }

  const evaluateLesson = () => {
    if (!activeLesson) return;

    let totalGaps = 0;
    let correctGaps = 0;

    activeLesson.pages.forEach(page => {
      page.exercises?.forEach(ex => {
        const userAnswers = lessonAnswers[ex.id] || {};
        const correctAnswers = ex.correct_answers || {};

        Object.keys(correctAnswers).forEach(gapKey => {
          totalGaps++;
          const userVal = (userAnswers[gapKey] || "").trim().toLowerCase();
          const correctVal = String(correctAnswers[gapKey]).toLowerCase();
          if (userVal === correctVal) {
            correctGaps++;
          }
        });
      });
    });

    const score = totalGaps > 0 ? (correctGaps / totalGaps) * 100 : 0;
    setLessonSummary({ score, correct: correctGaps, total: totalGaps });
    setShowResults(true);

    // Persist Lesson Attempt
    if (token && activeLesson.id) {
      fetch('/api/attempts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({
          lesson: activeLesson.id,
          score: score,
          answers: lessonAnswers,
          is_correct: score >= 80,
          start_time: new Date().toISOString(), // Simplified lesson start time
        })
      }).then(() => fetchUserStats());
    } else {
      fetchUserStats();
    }
  }

  // Helper to determine what to render
  const getCurrentExercise = () => {
    if (!activeLesson) return null;
    if (activeLesson.pages) {
      const page = activeLesson.pages[currentPageIdx];
      return page?.exercises?.[currentExerciseIdx];
    }
    return null;
  }

  const getTotalCount = () => {
    if (!activeLesson) return 0;
    if (activeLesson.pages) {
      return activeLesson.pages.reduce((acc, page) => acc + (page.exercises?.length || 0), 0);
    }
    return 0;
  }

  const getProgressLabel = () => {
    if (!activeLesson) return "";
    if (activeLesson.pages) {
      const page = activeLesson.pages[currentPageIdx];
      return `Página ${currentPageIdx + 1} de ${activeLesson.pages.length} - Ejercicio ${currentExerciseIdx + 1} de ${page?.exercises?.length || 0}`;
    }
    return "";
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthStatus({ type: 'loading', msg: 'Creando cuenta...' });
    try {
      const response = await fetch('/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      });
      if (response.ok) {
        setAuthStatus({ type: 'success', msg: '¡Cuenta creada con éxito! Iniciando...' });
        setTimeout(() => { setIsSignupOpen(false); setIsLoginOpen(true); setAuthStatus(null); }, 2000);
      } else {
        const errorData = await response.json();
        setAuthStatus({ type: 'error', msg: `Error: ${JSON.stringify(errorData)}` });
      }
    } catch (err) { setAuthStatus({ type: 'error', msg: 'Error de conexión.' }); }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthStatus({ type: 'loading', msg: 'Iniciando sesión...' });
    try {
      const response = await fetch('/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setAuthStatus({ type: 'success', msg: '¡Sesión iniciada!' });
        setTimeout(() => { setIsLoginOpen(false); setAuthStatus(null); }, 1500);
      } else {
        setAuthStatus({ type: 'error', msg: 'Credenciales inválidas.' });
      }
    } catch (err) { setAuthStatus({ type: 'error', msg: 'Error de conexión.' }); }
  }

  const handleLogout = () => {
    setUser(null); setToken(""); setLessons([]); setActiveLesson(null);
    localStorage.removeItem('token');
  }

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/lessons/${editingLessonMeta.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(editingLessonMeta),
      });
      if (response.ok) {
        setEditingLessonMeta(null);
        fetchLessons(token);
      }
    } catch (err) { console.error("Error updating lesson:", err); }
  }

  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const lessonData = JSON.parse(event.target.result);

        // 1. Create Lesson
        const resLesson = await fetch('/api/lessons/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
          body: JSON.stringify({ title: lessonData.title, description: lessonData.description || "" }),
        });
        if (!resLesson.ok) throw new Error("Failed to create lesson");
        const newLesson = await resLesson.json();

        // 2. Create Pages & Exercises
        if (lessonData.pages && Array.isArray(lessonData.pages)) {
          for (const page of lessonData.pages) {
            const resPage = await fetch('/api/pages/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
              body: JSON.stringify({
                lesson: newLesson.id,
                page_number: page.page_number || 1,
                instructions: page.instructions || ""
              }),
            });
            if (!resPage.ok) continue;
            const newPage = await resPage.json();

            if (page.exercises && Array.isArray(page.exercises)) {
              for (const ex of page.exercises) {
                const { content, correct_answers } = parseExerciseContent(ex.content);
                await fetch('/api/exercises/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                  body: JSON.stringify({
                    page: newPage.id,
                    content: content,
                    interaction_type: ex.interaction_type || 'text_input',
                    correct_answers: JSON.stringify(correct_answers),
                    options: JSON.stringify(Object.values(correct_answers))
                  }),
                });
              }
            }
          }
        }
        fetchLessons(token);
        alert("¡Lección importada con éxito!");
      } catch (err) {
        console.error("Error importing JSON:", err);
        alert("Error al importar el archivo JSON. Revisa el formato.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  }

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/lessons/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(newLessonData),
      });
      if (response.ok) {
        setIsNewLessonOpen(false);
        setNewLessonData({ title: "", description: "" });
        fetchLessons(token);
      }
    } catch (err) { console.error("Error creating lesson:", err); }
  }

  const handleDeleteLesson = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta lección?")) return;
    try {
      const response = await fetch(`/api/lessons/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      });
      if (response.ok) fetchLessons(token);
    } catch (err) { console.error("Error deleting lesson:", err); }
  }

  const handleAddPage = async (lessonId) => {
    const pageNumber = lessons.find(l => l.id === lessonId)?.pages?.length + 1 || 1;
    try {
      const response = await fetch('/api/pages/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ lesson: lessonId, page_number: pageNumber, layout: 'cloze_drag_drop' }),
      });
      if (response.ok) fetchLessons(token);
    } catch (err) { console.error("Error adding page:", err); }
  }

  const handleDeletePage = async (pageId) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta página y todos sus ejercicios?")) return;
    try {
      const response = await fetch(`/api/pages/${pageId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      });
      if (response.ok) fetchLessons(token);
    } catch (err) { console.error("Error deleting page:", err); }
  }

  const handleCreateExercise = async (e, pageId) => {
    e.preventDefault();
    const rawContent = e.target.content.value;
    const type = e.target.type.value;
    const { content, correct_answers } = parseExerciseContent(rawContent);
    const options = type === 'drag_and_drop' ? e.target.options.value.split(',').map(o => o.trim()) : [];

    const payload = {
      page: pageId,
      content,
      interaction_type: type,
      correct_answers,
      options: options.length > 0 ? options : Object.values(correct_answers)
    };

    try {
      const method = editingExercise ? 'PATCH' : 'POST';
      const url = editingExercise ? `/api/exercises/${editingExercise.id}/` : '/api/exercises/';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setIsNewExerciseOpen(false);
        setEditingExercise(null);
        fetchLessons(token);
      }
    } catch (err) { console.error("Error saving exercise:", err); }
  }

  const handleDeleteExercise = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ejercicio?")) return;
    try {
      const response = await fetch(`/api/exercises/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      });
      if (response.ok) fetchLessons(token);
    } catch (err) { console.error("Error deleting exercise:", err); }
  }

  const getRawContentFromExercise = (ex) => {
    if (!ex || !ex.content) return "";
    let raw = ex.content;
    Object.keys(ex.correct_answers || {}).forEach(gapKey => {
      raw = raw.replace(`{${gapKey}}`, `{${ex.correct_answers[gapKey]}}`);
    });
    return raw;
  }

  const openSignup = () => { setAuthStatus(null); setUsername(""); setPassword(""); setEmail(""); setIsSignupOpen(true); setIsLoginOpen(false); }
  const openLogin = () => { setAuthStatus(null); setUsername(""); setPassword(""); setIsLoginOpen(true); setIsSignupOpen(false); }

  return (
    <>
      <header>
        <div className="logo" onClick={() => setActiveLesson(null)} style={{ cursor: 'pointer' }}>Preguntas</div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Hola, <strong>{user.username}</strong></span>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={fetchUserStats}>Mis Estadísticas 📊</button>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={handleLogout}>Cerrar Sesión</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={openLogin}>Iniciar Sesión</button>
              <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={openSignup}>Registrarse</button>
            </>
          )}
        </nav>
      </header>

      <main>
        <div className="glass-container">
          {!user ? (
            <>
              <h1>Bienvenido a Preguntas</h1>
              {backendMessage && (
                <div className="status-badge">📡 Backend dice: <span style={{ color: 'var(--primary)' }}>{backendMessage}</span></div>
              )}
              <p>Domina cualquier materia con nuestros ejercicios interactivos de próxima generación.</p>
              <div className="btn-group">
                <button className="btn btn-primary" onClick={openSignup}>Comenzar ahora</button>
              </div>
            </>
          ) : activeLesson ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              {showResults ? (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                    {lessonSummary.score >= 100 ? "🏆" : lessonSummary.score >= 70 ? "🌟" : "📚"}
                  </div>
                  <h1>¡Lección Completada!</h1>
                  <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {lessonSummary.score.toFixed(0)}%
                    </div>
                    <p style={{ opacity: 0.7 }}>Has acertado {lessonSummary.correct} de {lessonSummary.total} preguntas.</p>
                  </div>

                  <div className="glass-container" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)' }}>
                    <h3>{lessonSummary.score === 100 ? "¡Desempeño Perfecto!" : lessonSummary.score >= 70 ? "¡Buen trabajo!" : "Sigue practicando"}</h3>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Tu progreso ha sido guardado. Sigue así para desbloquear más medallas.</p>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem' }}
                    onClick={() => {
                      setActiveLesson(null);
                      setShowResults(false);
                      setLessonAnswers({});
                      setCurrentPageIdx(0);
                      setCurrentExerciseIdx(0);
                    }}
                  >
                    Volver al Inicio
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '2rem' }}>
                    <span className="badge">{getProgressLabel()}</span>
                    <h2 style={{ marginTop: '0.8rem' }}>{activeLesson.title}</h2>
                  </div>

                  {getCurrentExercise() ? (
                    <>
                      <ExerciseRenderer
                        key={getCurrentExercise().id || currentExerciseIdx} // Force remount on exercise change
                        exercise={getCurrentExercise()}
                        onComplete={handleNextExercise}
                        token={token}
                        initialInputs={lessonAnswers[getCurrentExercise().id] || {}}
                        onAnswersChange={(newInputs) => setLessonAnswers(prev => ({ ...prev, [getCurrentExercise().id]: newInputs }))}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, opacity: (currentPageIdx === 0 && currentExerciseIdx === 0) ? 0.3 : 1 }}
                          onClick={handlePrevExercise}
                          disabled={currentPageIdx === 0 && currentExerciseIdx === 0}
                        >
                          Anterior
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1 }}
                          onClick={handleNextExercise}
                        >
                          {(currentPageIdx === activeLesson.pages.length - 1 && currentExerciseIdx === (activeLesson.pages[currentPageIdx]?.exercises?.length - 1)) ? "Finalizar" : "Siguiente"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', opacity: 0.7 }}>
                      No hay ejercicios configurados en esta capa. Avanza a la siguiente.
                      <br /><br />
                      <button className="btn btn-primary" onClick={handleNextExercise}>Continuar</button>
                    </div>
                  )}

                  <button className="btn btn-secondary" style={{ marginTop: '2.5rem' }} onClick={() => { setActiveLesson(null); setCurrentPageIdx(0); setCurrentExerciseIdx(0); setLessonAnswers({}); setShowResults(false); }}>Abandonar Lección</button>
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Mis Lecciones</h2>
                  {user.role === 'creator' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn btn-primary" onClick={() => setIsNewLessonOpen(true)}>+ Nueva Lección</button>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                        📤 Importar JSON
                        <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                  {user.role === 'student' && (
                    <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>{lessons.length} disponibles</span>
                  )}
                </div>

                {user.role === 'creator' ? (
                  <div style={{ marginTop: '2rem' }}>
                    {lessons.map(lesson => (
                      <div key={lesson.id} className="glass-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: 0 }}>{lesson.title}</h3>
                            <p style={{ opacity: 0.7, margin: '0.5rem 0' }}>{lesson.description}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="icon-btn" onClick={() => setActivePageForEdit(lesson.id === activePageForEdit ? null : lesson.id)}>
                              {activePageForEdit === lesson.id ? "🔼" : "⚙️"}
                            </button>
                            <button className="icon-btn" onClick={() => setEditingLessonMeta(lesson)}>✏️</button>
                            <button className="icon-btn" onClick={() => handleDeleteLesson(lesson.id)}>🗑️</button>
                          </div>
                        </div>

                        {activePageForEdit === lesson.id && (
                          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h4>Páginas y Ejercicios</h4>
                              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleAddPage(lesson.id)}>+ Añadir Página</button>
                            </div>
                            {lesson.pages?.map(page => (
                              <div key={page.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Página {page.page_number} ({page.layout})</span>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => setIsNewExerciseOpen(page.id)}>+ Ejercicio</button>
                                    <button className="icon-btn" onClick={() => handleDeletePage(page.id)} style={{ fontSize: '0.8rem' }}>🗑️</button>
                                  </div>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                  {page.exercises?.map(ex => (
                                    <div key={ex.id} style={{ fontSize: '0.9rem', opacity: 0.8, padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <span>• {ex.content} <span style={{ opacity: 0.5 }}>({ex.interaction_type})</span></span>
                                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button className="icon-btn" style={{ fontSize: '0.8rem' }} onClick={() => { setEditingExercise(ex); setIsNewExerciseOpen(page.id); }}>✏️</button>
                                        <button className="icon-btn" style={{ fontSize: '0.8rem' }} onClick={() => handleDeleteExercise(ex.id)}>🗑️</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {isNewExerciseOpen === page.id && (
                                  <div className="modal-overlay">
                                    <div className="modal-content glass-container" style={{ maxWidth: '500px' }}>
                                      <h3>{editingExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"} (Página {page.page_number})</h3>
                                      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Usa {"{respuesta}"} en el contenido. El sistema lo convertirá a hueco automáticamente.</p>
                                      <form onSubmit={(e) => handleCreateExercise(e, page.id)} className="modal-form">
                                        <label className="form-label">Contenido</label>
                                        <textarea
                                          name="content"
                                          className="form-input"
                                          style={{ minHeight: '100px' }}
                                          placeholder="Ej: El sol es {amarillo}."
                                          required
                                          defaultValue={editingExercise ? getRawContentFromExercise(editingExercise) : ""}
                                        />
                                        <label className="form-label">Tipo</label>
                                        <select name="type" className="form-input" defaultValue={editingExercise?.interaction_type || "text_input"}>
                                          <option value="text_input">Escribir</option>
                                          <option value="drag_and_drop">Arrastrar</option>
                                        </select>
                                        <label className="form-label">Opciones Extras (Separadas por coma, solo para Arrastrar)</label>
                                        <input
                                          name="options"
                                          className="form-input"
                                          placeholder="Opcional: azul, verde, rojo"
                                          defaultValue={editingExercise?.options?.join(', ') || ""}
                                        />
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setIsNewExerciseOpen(false); setEditingExercise(null); }}>Cancelar</button>
                                          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingExercise ? "Actualizar" : "Guardar"}</button>
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="features-grid" style={{ marginTop: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {lessons.map(lesson => (
                      <div key={lesson.id} className="feature-card clickable" onClick={() => { setActiveLesson(lesson); setCurrentPageIdx(0); setCurrentExerciseIdx(0); }}>
                        <div className="feature-icon">🎓</div>
                        <h3 className="feature-title">{lesson.title}</h3>
                        <p className="feature-desc">{lesson.description || `${lesson.pages?.length || 0} páginas interactivas`}</p>
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>
                          Empezar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lessons.length === 0 && <div className="empty-state">No hay lecciones. {user.role === 'creator' ? 'Crea una ahora.' : 'Espera a que un creador las publique.'}</div>}
              </div>
            </>
          )}
        </div>
      </main>

      {/* New Lesson Modal */}
      {isNewLessonOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ margin: '2rem auto', maxWidth: '400px' }}>
            <h2>Nueva Lección</h2>
            <form onSubmit={handleCreateLesson} className="modal-form">
              <label className="form-label">Título</label>
              <input type="text" value={newLessonData.title} onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })} required className="form-input" />
              <label className="form-label">Descripción</label>
              <textarea value={newLessonData.description} onChange={(e) => setNewLessonData({ ...newLessonData, description: e.target.value })} className="form-input" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsNewLessonOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Metadata Modal */}
      {editingLessonMeta && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ margin: '2rem auto', maxWidth: '400px' }}>
            <h2>Editar Lección</h2>
            <form onSubmit={handleUpdateLesson} className="modal-form">
              <label className="form-label">Título</label>
              <input type="text" value={editingLessonMeta.title} onChange={(e) => setEditingLessonMeta({ ...editingLessonMeta, title: e.target.value })} required className="form-input" />
              <label className="form-label">Descripción</label>
              <textarea value={editingLessonMeta.description || ""} onChange={(e) => setEditingLessonMeta({ ...editingLessonMeta, description: e.target.value })} className="form-input" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingLessonMeta(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {isSignupOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ margin: '2rem auto', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Crear Cuenta</h2>
            <form onSubmit={handleSignup} className="modal-form">
              <label className="form-label">Usuario</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="form-input" />
              <label className="form-label">Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" />
              <label className="form-label">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" />
              <label className="form-label">Rol</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input">
                <option value="student">Estudiante</option>
                <option value="creator">Creador</option>
              </select>
              {authStatus && <div className={`auth-msg ${authStatus.type}`}>{authStatus.msg}</div>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsSignupOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Registrarse</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ margin: '2rem auto', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Iniciar Sesión</h2>
            <form onSubmit={handleLogin} className="modal-form">
              <label className="form-label">Usuario</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="form-input" />
              <label className="form-label">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" />
              {authStatus && <div className={`auth-msg ${authStatus.type}`}>{authStatus.msg}</div>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsLoginOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ margin: '2rem auto', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Mis Estadísticas 🏆</h2>
              <button onClick={() => setIsStatsOpen(false)} className="icon-btn">❌</button>
            </div>

            <h3 style={{ marginTop: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Medallas Desbloqueadas</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {userStats.achievements?.length > 0 ? userStats.achievements.map((ua, i) => (
                <div key={i} className="badge" style={{ padding: '0.8rem 1.5rem', background: 'linear-gradient(45deg, #f59e0b, #d97706)', fontSize: '1rem', animation: 'fadeIn 0.5s ease' }}>
                  {ua.achievement?.icon_url || '🥇'} {ua.achievement?.name}
                </div>
              )) : <span style={{ opacity: 0.5 }}>Aún no has ganado medallas. ¡Sigue practicando!</span>}
            </div>

            <h3 style={{ marginTop: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Historial de Intentos</h3>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Objetivo / Fecha</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Tiempo</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Puntaje</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.attempts?.length > 0 ? userStats.attempts.map(att => (
                    <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 'bold', color: att.lesson ? 'var(--primary)' : 'inherit' }}>
                          {att.lesson ? `🎓 Lección: ${att.lesson_title}` : `📝 Ejercicio ${att.exercise}`}
                        </div>
                        <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>{new Date(att.end_time).toLocaleString()}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '1rem' }}>{att.time_taken_seconds.toFixed(1)}s</td>
                      <td style={{ textAlign: 'center', padding: '1rem' }}>{att.score?.toFixed(0)}%</td>
                      <td style={{ textAlign: 'center', padding: '1rem' }}>
                        {att.is_correct ? <span className="badge-small" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Perfecto</span>
                          : <span className="badge-small" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>Fallido</span>}
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>No hay intentos registrados.</td></tr>}
                </tbody>
              </table>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setIsStatsOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      <footer>&copy; {new Date().getFullYear()} Preguntas. Todos los derechos reservados.</footer>

      <style>{`
        .exercise-box { background: rgba(255, 255, 255, 0.05); padding: 3rem; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 650px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .exercise-text { font-size: 1.6rem; line-height: 2.8; color: var(--text-color); }
        .inline-input { background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 12px; color: white; padding: 0.1rem 0.8rem; margin: 0 0.4rem; font-size: 1.3rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); outline: none; }
        .inline-input:focus { border-color: var(--primary); background: rgba(99, 102, 241, 0.15); box-shadow: 0 0 15px rgba(99, 102, 241, 0.3); }
        .inline-input.correct { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .inline-input.incorrect { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        .drop-zone { display: inline-block; min-width: 80px; text-align: center; border-style: dashed; }
        .drop-zone.filled { border-style: solid; }
        .drag-item { background: rgba(99, 102, 241, 0.2); border: 2px solid var(--primary); padding: 0.5rem 1.5rem; border-radius: 12px; font-weight: bold; cursor: grab; font-size: 1.2rem; transition: transform 0.2s; user-select: none; }
        .drag-item:active { cursor: grabbing; transform: scale(0.95); }
        
        .badge { background: var(--primary); padding: 0.4rem 1rem; border-radius: 30px; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px; }
        .badge-small { background: rgba(255,255,255,0.1); padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; }
        .status-badge { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); borderRadius: 8px; padding: 0.8rem 1.2rem; margin-bottom: 2rem; display: inline-block; font-weight: 600; }
        .feature-card.clickable:hover { transform: translateY(-8px); border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }
        .feature-card.compact { padding: 1.2rem; }
        .empty-state { padding: 2rem; opacity: 0.5; border: 2px dashed rgba(255,255,255,0.1); border-radius: 16px; width: 100%; }
        .icon-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.5; transition: opacity 0.2s; }
        .icon-btn:hover { opacity: 1; }
        .modal-form { display: flex; flex-direction: column; gap: 0.8rem; text-align: left; }
        .auth-msg { font-size: 0.9rem; margin-top: 0.5rem; }
        .auth-msg.error { color: #ef4444; }
        .auth-msg.success { color: #10b981; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  )
}

export default App
