import React, { useState, useEffect } from 'react'

const ExerciseRenderer = ({ exercise, onComplete }) => {
  const [inputs, setInputs] = useState({})
  const [feedback, setFeedback] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)

  const handleInputChange = (gapKey, value) => {
    setInputs(prev => ({ ...prev, [gapKey]: value }))
  }

  const checkAnswers = () => {
    if (!exercise.correct_answers || typeof exercise.correct_answers !== 'object') return;

    let allCorrect = true
    const newFeedback = {}

    Object.keys(exercise.correct_answers).forEach(gap => {
      const userVal = (inputs[gap] || "").trim().toLowerCase()
      const correctVal = String(exercise.correct_answers[gap]).toLowerCase()

      if (userVal === correctVal) {
        newFeedback[gap] = 'correct'
      } else {
        newFeedback[gap] = 'incorrect'
        allCorrect = false
      }
    })

    setFeedback(newFeedback)
    if (allCorrect) {
      setIsCompleted(true)
      setTimeout(onComplete, 1500)
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
            <select
              key={index}
              value={inputs[gapKey] || ""}
              onChange={(e) => handleInputChange(gapKey, e.target.value)}
              className={`inline-input ${feedback[gapKey] || ""}`}
              disabled={isCompleted}
            >
              <option value="">...</option>
              {Array.isArray(exercise.options) && exercise.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
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
      {!isCompleted && (
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={checkAnswers}>
          Comprobar
        </button>
      )}
      {isCompleted && (
        <div style={{ marginTop: '1rem', color: '#10b981', fontWeight: 'bold', animation: 'fadeIn 0.5s ease' }}>
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
  const [activityExercises, setActivityExercises] = useState([])

  const [authStatus, setAuthStatus] = useState(null)

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
        setLessons(data);
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
        setActivities(data);
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
          exercises: activityExercises
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
          exercises: activityExercises
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

  const handleAddExerciseToForm = () => {
    setActivityExercises([...activityExercises, {
      content: "Translate: I {gap1} a student.",
      interaction_type: "text_input",
      correct_answers: { gap1: "am" },
      options: [],
      order: activityExercises.length
    }]);
  }

  const handleUpdateExerciseInForm = (index, field, value) => {
    const updated = [...activityExercises];
    if (field === 'correct_answers' || field === 'options') {
      try {
        updated[index][field] = JSON.parse(value);
      } catch (e) {
        // Keep as string for now if invalid JSON
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
    }
    setActivityExercises(updated);
  }

  const handleRemoveExerciseFromForm = (index) => {
    setActivityExercises(activityExercises.filter((_, i) => i !== index));
  }

  const handleNextExercise = () => {
    if (activeLesson?.exercises && currentExerciseIdx < activeLesson.exercises.length - 1) {
      setCurrentExerciseIdx(prev => prev + 1)
    } else {
      setActiveLesson(null)
      alert("¡Increíble! Has terminado.")
    }
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

  const resetActivityForm = () => {
    setActivityTitle(""); setActivityDesc(""); setActivityType("task"); setActivityExercises([]);
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
                <span className="badge">Ejercicio {currentExerciseIdx + 1} de {activeLesson.exercises?.length || 0}</span>
                <h2 style={{ marginTop: '0.8rem' }}>{activeLesson.title}</h2>
              </div>

              <ExerciseRenderer
                exercise={activeLesson.exercises[currentExerciseIdx]}
                onComplete={handleNextExercise}
              />

              <button className="btn btn-secondary" style={{ marginTop: '2.5rem' }} onClick={() => setActiveLesson(null)}>Abandonar Lección</button>
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
                    <div key={lesson.id} className="feature-card clickable" onClick={() => { setActiveLesson(lesson); setCurrentExerciseIdx(0); }}>
                      <div className="feature-icon">🎓</div>
                      <h3 className="feature-title">{lesson.title}</h3>
                      <p className="feature-desc">{lesson.description || `${lesson.exercises?.length || 0} ejercicios interactivos`}</p>
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
                      className={`feature-card compact ${act.exercises?.length > 0 ? 'clickable' : ''}`}
                      onClick={() => {
                        if (act.exercises?.length > 0) {
                          setActiveLesson(act);
                          setCurrentExerciseIdx(0);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0 }}>{act.title}</h4>
                        {user.role === 'creator' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); setEditingActivity(act); setActivityTitle(act.title); setActivityDesc(act.description); setActivityType(act.activity_type); setActivityExercises(act.exercises || []); }} className="icon-btn">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id); }} className="icon-btn">🗑️</button>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', opacity: 0.7 }}>{act.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-small">{act.activity_type}</span>
                        {act.exercises?.length > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>{act.exercises.length} ej.</span>
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ejercicios ({activityExercises.length})</h3>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={handleAddExerciseToForm}>+ Añadir</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activityExercises.map((ex, index) => (
                    <div key={index} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Ejercicio #{index + 1}</span>
                        <button type="button" onClick={() => handleRemoveExerciseFromForm(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>🗑️</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Contenido (ej: Hello {gap1})"
                          value={ex.content}
                          onChange={(e) => handleUpdateExerciseInForm(index, 'content', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select
                            value={ex.interaction_type}
                            onChange={(e) => handleUpdateExerciseInForm(index, 'interaction_type', e.target.value)}
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
                            onChange={(e) => handleUpdateExerciseInForm(index, 'correct_answers', e.target.value)}
                            className="form-input"
                            style={{ flex: 2, fontSize: '0.85rem' }}
                          />
                        </div>
                        {ex.interaction_type === 'drag_and_drop' && (
                          <input
                            type="text"
                            placeholder='Opciones (JSON array)'
                            value={typeof ex.options === 'object' ? JSON.stringify(ex.options) : ex.options}
                            onChange={(e) => handleUpdateExerciseInForm(index, 'options', e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.85rem' }}
                          />
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

      <footer>&copy; {new Date().getFullYear()} Preguntas. Todos los derechos reservados.</footer>

      <style>{`
        .exercise-box { background: rgba(255, 255, 255, 0.05); padding: 3rem; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 650px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .exercise-text { font-size: 1.6rem; line-height: 2.8; color: var(--text-color); }
        .inline-input { background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 12px; color: white; padding: 0.1rem 0.8rem; margin: 0 0.4rem; font-size: 1.3rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); outline: none; }
        .inline-input:focus { border-color: var(--primary); background: rgba(99, 102, 241, 0.15); box-shadow: 0 0 15px rgba(99, 102, 241, 0.3); }
        .inline-input.correct { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .inline-input.incorrect { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
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
