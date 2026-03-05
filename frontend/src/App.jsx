import React, { useState, useEffect } from 'react'

const ExerciseRenderer = ({ exercise, onComplete, token }) => {
  const [inputs, setInputs] = useState({})
  const [feedback, setFeedback] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    setInputs({})
    setFeedback({})
    setIsCompleted(false)
    setStartTime(new Date())
  }, [exercise])

  const handleInputChange = (gapKey, value) => {
    setInputs(prev => ({ ...prev, [gapKey]: value }))
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
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)

  // Auth states
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || "")

  // App logic states
  const [lessons, setLessons] = useState([])
  const [activities, setActivities] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)

  // Form states
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")

  // Activity form states
  const [activityTitle, setActivityTitle] = useState("")
  const [activityDesc, setActivityDesc] = useState("")
  const [activityType, setActivityType] = useState("task")
  const [activityPages, setActivityPages] = useState([])

  const [authStatus, setAuthStatus] = useState(null)

  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [userStats, setUserStats] = useState({ attempts: [], achievements: [], progress: [] })

  useEffect(() => {
    fetch('/api/ping/')
      .then(res => res.json())
      .then(data => { if (data.message) setBackendMessage(data.message) })
      .catch(err => console.error("Error fetching from backend:", err))

    if (token) {
      fetchUserProfile(token);
      fetchLessons(token);
      fetchActivities(token);
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

  const fetchActivities = async (authToken) => {
    try {
      const response = await fetch('/api/generics/', {
        headers: { 'Authorization': `Token ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Parse JSON strings to objects/arrays for exercises
        const parsedData = data.map(act => {
          if (act.exercises && Array.isArray(act.exercises)) {
            act.exercises = act.exercises.map(ex => {
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
          return act;
        });
        setActivities(parsedData);
      }
    } catch (err) { console.error("Error fetching activities:", err); }
  }

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/generics/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          title: activityTitle,
          description: activityDesc,
          activity_type: activityType,
          pages: activityPages
        }),
      });

      if (response.ok) {
        setIsNewActivityOpen(false);
        resetActivityForm();
        fetchActivities(token);
      }
    } catch (err) { console.error("Error creating activity:", err); }
  }

  const handleUpdateActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/generics/${editingActivity.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          title: activityTitle,
          description: activityDesc,
          activity_type: activityType,
          pages: activityPages
        }),
      });

      if (response.ok) {
        setEditingActivity(null);
        resetActivityForm();
        fetchActivities(token);
      }
    } catch (err) { console.error("Error updating activity:", err); }
  }

  const handleDeleteActivity = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta actividad?")) return;
    try {
      const response = await fetch(`/api/generics/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) fetchActivities(token);
    } catch (err) { console.error("Error deleting activity:", err); }
  }

  const handleAddPageToForm = () => {
    setActivityPages([...activityPages, {
      page_number: activityPages.length + 1,
      layout: 'cloze_drag_drop',
      instructions: 'Completa los huecos',
      exercises: []
    }]);
  }

  const handleAddExerciseToPage = (pageIndex) => {
    const updated = [...activityPages];
    updated[pageIndex].exercises.push({
      content: "Translate: I {gap1} a student.",
      interaction_type: "text_input",
      correct_answers: { gap1: "am" },
      options: [],
      order: updated[pageIndex].exercises.length
    });
    setActivityPages(updated);
  }

  const handleUpdatePageInForm = (pageIndex, field, value) => {
    const updated = [...activityPages];
    updated[pageIndex][field] = value;
    setActivityPages(updated);
  }

  const handleUpdateExerciseInForm = (pageIndex, exIndex, field, value) => {
    const updated = [...activityPages];
    if (field === 'correct_answers' || field === 'options') {
      try {
        updated[pageIndex].exercises[exIndex][field] = JSON.parse(value);
      } catch (e) {
        updated[pageIndex].exercises[exIndex][field] = value;
      }
    } else {
      updated[pageIndex].exercises[exIndex][field] = value;
    }
    setActivityPages(updated);
  }

  const handleRemovePageFromForm = (pageIndex) => {
    setActivityPages(activityPages.filter((_, i) => i !== pageIndex));
  }

  const handleRemoveExerciseFromForm = (pageIndex, exIndex) => {
    const updated = [...activityPages];
    updated[pageIndex].exercises = updated[pageIndex].exercises.filter((_, i) => i !== exIndex);
    setActivityPages(updated);
  }

  const generateGapsFromText = (pageIndex, exIndex, text, interactionType) => {
    let newText = text;
    let newAnswers = {};
    let newOptions = [];
    let gapCounter = 1;

    const matches = [...text.matchAll(/\{([^}]+)\}/g)];

    if (matches.length > 0 && !text.includes('{gap1}')) {
      matches.forEach(match => {
        const gapKey = `gap${gapCounter}`;
        const answer = match[1].trim();
        newText = newText.replace(match[0], `{${gapKey}}`);
        newAnswers[gapKey] = answer;
        if (!newOptions.includes(answer)) newOptions.push(answer);
        gapCounter++;
      });

      const updated = [...activityPages];
      updated[pageIndex].exercises[exIndex].content = newText;
      updated[pageIndex].exercises[exIndex].correct_answers = newAnswers;
      if (interactionType === 'drag_and_drop') {
        updated[pageIndex].exercises[exIndex].options = newOptions;
      }
      setActivityPages(updated);
    } else {
      alert("No se encontraron {respuestas} nuevas para parsear o el texto ya está procesado.");
    }
  }

  const resetActivityForm = () => {
    setActivityTitle(""); setActivityDesc(""); setActivityType("task"); setActivityPages([]);
  }

  const handleNextExercise = () => {
    if (!activeLesson) return;

    // Check if it's a generic Activity (legacy structure)
    if (activeLesson.exercises) {
      if (currentExerciseIdx < activeLesson.exercises.length - 1) {
        setCurrentExerciseIdx(prev => prev + 1)
      } else {
        setActiveLesson(null)
        alert("¡Increíble! Has terminado la actividad.")
      }
      return;
    }

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
      // Finished lesson
      setActiveLesson(null)
      alert("¡Increíble! Has terminado la lección.")
      fetchUserStats(); // Refresh stats to show new medals
    }
  }

  // Helper to determine what to render
  const getCurrentExercise = () => {
    if (!activeLesson) return null;
    if (activeLesson.exercises) return activeLesson.exercises[currentExerciseIdx]; // Generic Activity
    if (activeLesson.pages) {
      const page = activeLesson.pages[currentPageIdx];
      return page?.exercises?.[currentExerciseIdx];
    }
    return null;
  }

  const getTotalCount = () => {
    if (!activeLesson) return 0;
    if (activeLesson.exercises) return activeLesson.exercises.length;
    if (activeLesson.pages) {
      return activeLesson.pages.reduce((acc, page) => acc + (page.exercises?.length || 0), 0);
    }
    return 0;
  }

  const getProgressLabel = () => {
    if (!activeLesson) return "";
    if (activeLesson.exercises) return `Ejercicio ${currentExerciseIdx + 1} de ${activeLesson.exercises.length}`;
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
    setUser(null); setToken(""); setLessons([]); setActivities([]); setActiveLesson(null);
    localStorage.removeItem('token');
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
              <div style={{ marginBottom: '2rem' }}>
                <span className="badge">{getProgressLabel()}</span>
                <h2 style={{ marginTop: '0.8rem' }}>{activeLesson.title}</h2>
              </div>

              {getCurrentExercise() ? (
                <ExerciseRenderer
                  key={getCurrentExercise().id || currentExerciseIdx} // Force remount on exercise change
                  exercise={getCurrentExercise()}
                  onComplete={handleNextExercise}
                  token={token}
                />
              ) : (
                <div style={{ padding: '2rem', opacity: 0.7 }}>
                  No hay ejercicios configurados en esta capa. Avanza a la siguiente.
                  <br /><br />
                  <button className="btn btn-primary" onClick={handleNextExercise}>Continuar</button>
                </div>
              )}

              <button className="btn btn-secondary" style={{ marginTop: '2.5rem' }} onClick={() => { setActiveLesson(null); setCurrentPageIdx(0); setCurrentExerciseIdx(0); }}>Abandonar Lección</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h2>Mis Lecciones</h2>
                  <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>{lessons.length} disponibles</span>
                </div>
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
                  {lessons.length === 0 && <div className="empty-state">No hay lecciones. Cárgalas desde el panel de admin de Django.</div>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0 }}>Tareas del día</h2>
                  {user.role === 'creator' && (
                    <button className="btn btn-primary" onClick={() => { resetActivityForm(); setIsNewActivityOpen(true); }}>+ Nueva Tarea</button>
                  )}
                </div>
                <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                  {activities.map(act => (
                    <div
                      key={act.id}
                      className={`feature-card compact ${act.pages?.length > 0 ? 'clickable' : ''}`}
                      onClick={() => {
                        if (act.pages?.length > 0) {
                          setActiveLesson(act);
                          setCurrentPageIdx(0);
                          setCurrentExerciseIdx(0);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0 }}>{act.title}</h4>
                        {user.role === 'creator' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); setEditingActivity(act); setActivityTitle(act.title); setActivityDesc(act.description); setActivityType(act.activity_type); setActivityPages(act.pages || []); }} className="icon-btn">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id); }} className="icon-btn">🗑️</button>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', opacity: 0.7 }}>{act.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-small">{act.activity_type}</span>
                        {act.pages?.length > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>{act.pages.length} pág.</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <p style={{ opacity: 0.5 }}>No hay tareas pendientes.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Activity Modals */}
      {(isNewActivityOpen || editingActivity) && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ margin: '2rem auto', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingActivity ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
            <form onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity} className="modal-form">
              <label className="form-label">Título</label>
              <input type="text" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} required className="form-input" />
              <label className="form-label">Descripción</label>
              <textarea value={activityDesc} onChange={(e) => setActivityDesc(e.target.value)} className="form-input" style={{ minHeight: '60px' }} />
              <label className="form-label">Tipo</label>
              <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="form-input">
                <option value="task">Tarea</option>
                <option value="quiz">Cuestionario</option>
                <option value="exercise">Práctica</option>
              </select>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Páginas ({activityPages.length})</h3>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={handleAddPageToForm}>+ Añadir Página</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activityPages.map((page, pageIndex) => (
                    <div key={pageIndex} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>Página #{pageIndex + 1}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" onClick={() => handleAddExerciseToPage(pageIndex)} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>+ Ejercicio</button>
                          <button type="button" onClick={() => handleRemovePageFromForm(pageIndex)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>🗑️</button>
                        </div>
                      </div>

                      {/* Display Page Exercises */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
                        {page.exercises && page.exercises.map((ex, exIndex) => (
                          <div key={exIndex} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Ejercicio #{exIndex + 1}</span>
                              <button type="button" onClick={() => handleRemoveExerciseFromForm(pageIndex, exIndex)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.8rem' }}>❌</button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Contenido (ej: I {am} a student)"
                                value={ex.content}
                                onChange={(e) => handleUpdateExerciseInForm(pageIndex, exIndex, 'content', e.target.value)}
                                className="form-input"
                                style={{ flex: 1, fontSize: '0.85rem' }}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => generateGapsFromText(pageIndex, exIndex, ex.content, ex.interaction_type)}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Parser Huecos
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <select
                                value={ex.interaction_type}
                                onChange={(e) => handleUpdateExerciseInForm(pageIndex, exIndex, 'interaction_type', e.target.value)}
                                className="form-input"
                                style={{ flex: 1, fontSize: '0.85rem' }}
                              >
                                <option value="text_input">Escribir</option>
                                <option value="drag_and_drop">Arrastrar</option>
                              </select>
                              <input
                                type="text"
                                placeholder='Respuestas (JSON)'
                                value={typeof ex.correct_answers === 'object' ? JSON.stringify(ex.correct_answers) : ex.correct_answers}
                                onChange={(e) => handleUpdateExerciseInForm(pageIndex, exIndex, 'correct_answers', e.target.value)}
                                className="form-input"
                                style={{ flex: 2, fontSize: '0.85rem' }}
                              />
                            </div>
                            {ex.interaction_type === 'drag_and_drop' && (
                              <input
                                type="text"
                                placeholder='Opciones (JSON array)'
                                value={typeof ex.options === 'object' ? JSON.stringify(ex.options) : ex.options}
                                onChange={(e) => handleUpdateExerciseInForm(pageIndex, exIndex, 'options', e.target.value)}
                                className="form-input"
                                style={{ fontSize: '0.85rem', marginTop: '0.5rem', width: '100%' }}
                              />
                            )}
                          </div>
                        ))}
                        {(!page.exercises || page.exercises.length === 0) && (
                          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Esta página está vacía. Añade un ejercicio.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', position: 'sticky', bottom: 0, background: 'var(--bg-color)', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setIsNewActivityOpen(false); setEditingActivity(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingActivity ? 'Guardar' : 'Crear'}</button>
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
                    <th style={{ padding: '0.8rem' }}>Fecha</th>
                    <th style={{ padding: '0.8rem' }}>Tiempo</th>
                    <th style={{ padding: '0.8rem' }}>Puntaje</th>
                    <th style={{ padding: '0.8rem' }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.attempts?.length > 0 ? userStats.attempts.map((att, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.8rem' }}>{new Date(att.start_time).toLocaleString()}</td>
                      <td style={{ padding: '0.8rem' }}>{att.time_taken_seconds?.toFixed(1) || '?'}s</td>
                      <td style={{ padding: '0.8rem' }}>{att.score?.toFixed(0)}%</td>
                      <td style={{ padding: '0.8rem' }}>
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
