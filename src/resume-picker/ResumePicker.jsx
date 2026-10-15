import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, ChevronRight, Copy, FileText, LockKeyhole, LogOut, PenLine, Search, ShieldCheck } from 'lucide-react'
import './resume-picker.css'

const API = '/api/resume-picker'
const TYPES = ['SWE', 'AI', 'Defense', 'QD', 'Quant']
const DESCRIPTIONS = {
  SWE: 'Software engineering', AI: 'AI & machine learning', Defense: 'Defense & physical systems',
  QD: 'Quantitative development', Quant: 'Quantitative research',
}

async function request(action, body, signal) {
  const response = await fetch(`${API}?action=${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    signal,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(typeof data.error === 'string' ? data.error : 'The request could not be completed. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

function Findings({ title, items, empty }) {
  return <section className="rp-findings"><h3>{title}</h3>{items?.length
    ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>
    : <p className="rp-muted">{empty}</p>}</section>
}

function Results({ result }) {
  const status = result.eligibility?.status || 'Risk'
  const failed = /fail|ineligible/i.test(status)
  const passed = /^pass$/i.test(status)
  return <section className="rp-results" aria-labelledby="rp-results-title">
    <div className="rp-section-heading"><h2 id="rp-results-title">Your comparison</h2><span className="rp-tag">{result.mode === 'ai' ? 'AI-assisted analysis' : 'Local analysis'}</span></div>
    <div className={`rp-eligibility ${failed ? 'rp-fail' : passed ? 'rp-pass' : 'rp-risk'}`} role="status">
      <ShieldCheck size={22} aria-hidden="true" />
      <div><h3>Eligibility: {status}</h3><p>{result.eligibility?.explanation}</p>{failed && <p><strong>Resume changes cannot resolve a failed eligibility requirement.</strong></p>}</div>
    </div>
    {!!result.eligibility?.checks?.length && <details className="rp-details"><summary>Review eligibility checks <span>{result.eligibility.checks.length}</span></summary><ul className="rp-checks">{result.eligibility.checks.map((check, index) => <li key={index}><strong>{check.requirement}</strong><span>{check.status}</span><p>{check.explanation}</p></li>)}</ul></details>}
    <div className="rp-recommendation">
      <div><span className="rp-muted">{failed ? 'Technical fit only' : 'Recommended resume'}</span><h3>{result.winner || 'No recommendation'}</h3></div>
      <div><p>{result.why}</p>{result.rawWinner && result.rawWinner !== result.winner && <p className="rp-raw">Raw score winner: <strong>{result.rawWinner}</strong>. The recommendation also considers the recruiter story.</p>}{result.track && <p className="rp-track"><strong>Suggested track:</strong> {result.track}</p>}</div>
    </div>
    <div className="rp-table-scroll" tabIndex="0" role="region" aria-label="Resume scorecard"><table className="rp-scorecard"><caption className="rp-sr-only">Resume scores for the current job description</caption><thead><tr><th scope="col">Resume</th><th scope="col">Weighted coverage</th><th scope="col">Cosine</th><th scope="col">Human rank</th><th scope="col">Recruiter story</th></tr></thead><tbody>{result.scorecard?.map(row => <tr key={row.resume} className={row.resume === result.winner ? 'rp-selected-row' : ''}><th scope="row">{row.resume}{row.resume === result.winner && <Check size={15} aria-label="Recommended" />}</th><td><div className="rp-coverage"><span>{Number(row.coverage).toFixed(1)}%</span><div aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, Number(row.coverage)))}%` }} /></div></div></td><td>{Number(row.cosine).toFixed(3)}</td><td>{row.humanRank ?? 'Unavailable'}</td><td>{row.story}</td></tr>)}</tbody></table></div>
    <p className="rp-score-note">Coverage measures visible support for the job’s requirements. Cosine compares emphasis across these five resumes; it is not a percentage qualified. Human rank is unavailable in local mode.</p>
    <div className="rp-findings-grid"><Findings title="Strongest matches" items={result.strongMatches} empty="No strong matches identified." /><Findings title="Under-signaled experience" items={result.underSignaled} empty="No supported experience identified as under-signaled." /><Findings title="Resume evidence gaps" items={result.realGaps} empty="No missing resume evidence identified by this analysis. Verify the original job description." /><Findings title="Suggested edits" items={result.edits} empty="No edits suggested." /></div>
    {!!result.concepts?.length && <details className="rp-details"><summary>Job concepts and weights <span>{result.concepts.length}</span></summary><div className="rp-concepts">{result.concepts.map((concept, index) => <div key={index}><strong>{concept.name}</strong><span>{String(concept.category || '').replaceAll('_', ' ')} · {concept.weight}</span></div>)}</div></details>}
    <details className="rp-details"><summary>Inspect resume evidence <span>{result.evidence?.length || 0}</span></summary>{result.evidence?.length ? <div className="rp-table-scroll" tabIndex="0" role="region" aria-label="Resume evidence"><table className="rp-evidence"><thead><tr><th scope="col">Concept</th><th scope="col">Resume</th><th scope="col">Evidence level</th><th scope="col">Exact quote & reasoning</th></tr></thead><tbody>{result.evidence.map((item, index) => <tr key={index}><th scope="row">{item.concept}</th><td>{item.resume}</td><td>{String(item.level).replaceAll('_', ' ')}</td><td>{item.quote && <blockquote>{item.quote}</blockquote>}<p>{item.reason}</p></td></tr>)}</tbody></table></div> : <p className="rp-details-empty">No evidence entries returned.</p>}</details>
    <div className="rp-limitations"><h3>Read before applying</h3><p>This comparison is decision support. Check eligibility, evidence, and suggested wording before using a resume. Add only experience you can truthfully support.</p>{result.limitations?.length > 0 && <ul>{result.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>}</div>
  </section>
}

export default function ResumePicker() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [locking, setLocking] = useState(false)
  const [library, setLibrary] = useState(null)
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [jd, setJd] = useState('')
  const [facts, setFacts] = useState('')
  const [companyType, setCompanyType] = useState('auto')
  const [mode, setMode] = useState('ai')
  const [apiKey, setApiKey] = useState('')
  const [activeResume, setActiveResume] = useState('SWE')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [question, setQuestion] = useState('')
  const [answerNotes, setAnswerNotes] = useState('')
  const [answerMax, setAnswerMax] = useState('200')
  const [answerUnit, setAnswerUnit] = useState('words')
  const [answerDraft, setAnswerDraft] = useState('')
  const [answerData, setAnswerData] = useState(null)
  const [answerLoading, setAnswerLoading] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const analysisController = useRef(null)
  const answerController = useRef(null)
  const resultRef = useRef(null)
  const answerWords = answerDraft.trim() ? answerDraft.trim().split(/\s+/u).length : 0
  const answerCharacters = Array.from(answerDraft).length
  const draftOverLimit = answerMax !== '' && (answerUnit === 'words' ? answerWords : answerCharacters) > Number(answerMax)

  const invalidateAnswer = useCallback(() => {
    answerController.current?.abort()
    setAnswerLoading(false)
    setAnswerDraft('')
    setAnswerData(null)
    setAnswerError('')
    setCopyStatus('')
  }, [])

  const relock = useCallback((message = '') => {
    analysisController.current?.abort()
    invalidateAnswer()
    setAuthenticated(false)
    setLibrary(null)
    setJd('')
    setFacts('')
    setApiKey('')
    setPassword('')
    setMode('ai')
    setCompanyType('auto')
    setResult(null)
    setAnalyzing(false)
    setQuestion('')
    setAnswerNotes('')
    setAnswerMax('200')
    setAnswerUnit('words')
    setError(message)
  }, [invalidateAnswer])

  useEffect(() => {
    const previous = document.documentElement.dataset.room
    document.documentElement.dataset.room = 'resume-picker'
    const previousTitle = document.title
    document.title = 'Resume picker | Parth Mhaske'
    const controller = new AbortController()
    request('session', undefined, controller.signal).then(data => setAuthenticated(Boolean(data.authenticated))).catch(error => {
      if (error.name !== 'AbortError' && error.status !== 401) setError(error.message)
    }).finally(() => { if (!controller.signal.aborted) setChecking(false) })
    return () => {
      controller.abort()
      analysisController.current?.abort()
      answerController.current?.abort()
      document.title = previousTitle
      if (previous === undefined) delete document.documentElement.dataset.room
      else document.documentElement.dataset.room = previous
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    const controller = new AbortController()
    request('resumes', undefined, controller.signal).then(data => {
      if (controller.signal.aborted) return
      setLibrary(data)
      setFacts(data.facts || '')
    }).catch(error => {
      if (controller.signal.aborted || error.name === 'AbortError') return
      if (error.status === 401) relock('Your session expired. Unlock to continue.')
      else setError(error.message)
    }).finally(() => { if (!controller.signal.aborted) setLoadingLibrary(false) })
    return () => controller.abort()
  }, [authenticated, relock])

  async function login(event) {
    event.preventDefault()
    if (locking || loggingIn) return
    setLoggingIn(true)
    setError('')
    try {
      await request('login', { password })
      setPassword('')
      setLoadingLibrary(true)
      setAuthenticated(true)
    } catch (error) { setError(error.message) }
    finally { setLoggingIn(false) }
  }

  function change(setter, value, affectsAnswer = true) {
    analysisController.current?.abort()
    setAnalyzing(false)
    setResult(null)
    setError('')
    if (affectsAnswer) invalidateAnswer()
    setter(value)
  }

  function changeAnswer(setter, value) {
    invalidateAnswer()
    setter(value)
  }

  async function draftAnswer(event) {
    event.preventDefault()
    if (answerLoading || !question.trim()) return
    invalidateAnswer()
    const controller = new AbortController()
    answerController.current = controller
    setAnswerLoading(true)
    try {
      const data = await request('answer', {
        question, jd, facts, companyType, notes: answerNotes,
        limit: answerMax === '' ? null : { unit: answerUnit, max: Number(answerMax) },
        ...(apiKey ? { apiKey } : {}),
      }, controller.signal)
      if (controller.signal.aborted) return
      if (!data.answer?.trim() && !data.needsConfirmation?.length) throw new Error('No draft or clarification was returned. Add relevant facts and try again.')
      setAnswerData(data)
      setAnswerDraft(data.answer || '')
    } catch (error) {
      if (controller.signal.aborted || error.name === 'AbortError') return
      if (error.status === 401) relock('Your session expired. Unlock to continue.')
      else setAnswerError(error.message)
    } finally { if (!controller.signal.aborted) setAnswerLoading(false) }
  }

  async function copyAnswer() {
    setCopyStatus('')
    try {
      await navigator.clipboard.writeText(answerDraft)
      setCopyStatus('Answer copied.')
    } catch {
      setCopyStatus('Copy failed. Select the draft text and copy it manually.')
    }
  }

  async function analyze(event) {
    event.preventDefault()
    analysisController.current?.abort()
    const controller = new AbortController()
    analysisController.current = controller
    setAnalyzing(true)
    setError('')
    setResult(null)
    try {
      const data = await request('analyze', { jd, facts, companyType, mode, ...(mode === 'ai' && apiKey ? { apiKey } : {}) }, controller.signal)
      if (controller.signal.aborted) return
      setResult(data)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }))
    } catch (error) {
      if (controller.signal.aborted || error.name === 'AbortError') return
      if (error.status === 401) relock('Your session expired. Unlock to continue.')
      else setError(error.message)
    } finally { if (!controller.signal.aborted) setAnalyzing(false) }
  }

  async function logout() {
    setLocking(true)
    relock()
    try { await request('logout', {}) }
    catch (error) { setError(`The server could not end the session: ${error.message} Close this browser when finished.`) }
    finally { setLocking(false) }
  }

  if (!authenticated) return <main className="rp-page rp-gate">
    <a className="rp-back" href="/">Parth Mhaske <ChevronRight size={14} aria-hidden="true" /> Private tools</a>
    <div className="rp-gate-panel"><div className="rp-gate-icon"><LockKeyhole size={25} aria-hidden="true" /></div><h1>Private resume picker</h1><p>Compare five resume versions against a job description. Unlock your workspace to continue.</p>
      {checking ? <p className="rp-status" role="status">Checking your session…</p> : <form onSubmit={login}><label htmlFor="rp-password">Password</label><input id="rp-password" type="password" autoComplete="current-password" autoFocus required disabled={loggingIn || locking} value={password} onChange={event => setPassword(event.target.value)} /><button className="rp-button rp-primary" disabled={loggingIn || locking} type="submit"><LockKeyhole size={16} aria-hidden="true" />{locking ? 'Locking…' : loggingIn ? 'Unlocking…' : 'Unlock workspace'}</button></form>}
      {error && <p className="rp-error" role="alert">{error}</p>}<p className="rp-gate-foot">Resumes and analysis require an authenticated session.</p>
    </div>
  </main>

  return <div className="rp-page">
    <header className="rp-header"><a className="rp-brand" href="/"><span>PM</span>Parth Mhaske</a><button className="rp-button rp-quiet" onClick={logout}><LogOut size={16} aria-hidden="true" />Lock workspace</button></header>
    <main className="rp-main"><div className="rp-intro"><div><h1>Resume picker</h1><p>One job description. Five perspectives on your experience.</p></div><div className="rp-tool-links"><span className="rp-private"><LockKeyhole size={13} aria-hidden="true" />Private workspace</span><a href="#application-answers">Application answers</a></div></div>
      {error && <div className="rp-error" role="alert">{error}</div>}
      {!library ? <div className="rp-loading" role="status">{loadingLibrary ? 'Loading your five resumes…' : 'Loading your resume library…'}{error && <button className="rp-button" onClick={() => window.location.reload()}>Reload workspace</button>}</div> : <>
        <div className="rp-workspace"><section className="rp-input-section" aria-labelledby="rp-job-title"><div className="rp-section-heading"><h2 id="rp-job-title">The opportunity</h2><span className="rp-muted">All five resumes compared</span></div>
          <form onSubmit={analyze}><label htmlFor="rp-jd">Job description <span className="rp-required">Required</span></label><textarea id="rp-jd" className="rp-jd" placeholder="Paste the full job description, including eligibility and required skills…" required value={jd} onChange={event => change(setJd, event.target.value)} />
            <label htmlFor="rp-facts">Your eligibility facts</label><p className="rp-field-help" id="rp-facts-help">Use current, truthful facts about education, graduation, work authorization, location, and availability. Unstated facts remain uncertain.</p><textarea id="rp-facts" aria-describedby="rp-facts-help" value={facts} onChange={event => change(setFacts, event.target.value)} placeholder="Add relevant eligibility facts…" rows={4} />
            <div className="rp-options"><div><label htmlFor="rp-company">Company context</label><select id="rp-company" value={companyType} onChange={event => change(setCompanyType, event.target.value)}><option value="auto">Detect from description</option><option value="large company">Large company</option><option value="startup">Startup</option><option value="quant">Quant / hedge fund</option><option value="defense">Defense / aerospace</option><option value="AI lab">AI lab / AI-native</option><option value="robotics">Robotics / autonomy</option></select></div><div><label htmlFor="rp-mode">Analysis method</label><select id="rp-mode" value={mode} onChange={event => change(setMode, event.target.value, false)}><option value="ai">AI-assisted analysis</option><option value="local">Local analysis</option></select></div></div>
            <p className="rp-field-help">{mode === 'local' ? 'Runs on this site’s server with fixed rules. No OpenAI request. Human ranking is unavailable.' : 'Sends the job description, all five resume texts, and your eligibility facts to OpenAI for analysis.'}</p>
            {mode === 'ai' && !library.aiAvailable && <div className="rp-api-key"><label htmlFor="rp-api-key">OpenAI API key</label><input id="rp-api-key" type="password" autoComplete="off" spellCheck="false" required value={apiKey} onChange={event => change(setApiKey, event.target.value)} /><p className="rp-field-help">Kept only while this page is open. It is not saved in your browser.</p></div>}
            <div className="rp-analyze-row"><button className="rp-button rp-primary" type="submit" disabled={analyzing || !jd.trim()}><Search size={17} aria-hidden="true" />{analyzing ? 'Comparing resumes…' : 'Compare resumes'}</button>{analyzing && <button className="rp-button rp-quiet" type="button" onClick={() => { analysisController.current?.abort(); setAnalyzing(false) }}>Cancel</button>}</div><p className="rp-memory-note">Job descriptions, edits, and API keys stay in this page’s memory. Reloading clears them.</p>
          </form>
        </section>
        <aside className="rp-library" aria-labelledby="rp-library-title"><div className="rp-section-heading"><h2 id="rp-library-title">Your resume library</h2><span className="rp-tag">5 versions</span></div><p className="rp-field-help">Scoring uses only evidence visible in each exact PDF.</p><div className="rp-resume-tabs" role="tablist" aria-label="Resume versions">{TYPES.map(type => <button key={type} id={`rp-tab-${type}`} role="tab" aria-selected={activeResume === type} aria-controls="rp-resume-preview" tabIndex={activeResume === type ? 0 : -1} className={activeResume === type ? 'rp-active' : ''} onClick={() => setActiveResume(type)} onKeyDown={event => {
          if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const index = TYPES.indexOf(type)
          const next = event.key === 'Home' ? TYPES[0] : event.key === 'End' ? TYPES.at(-1) : TYPES[(index + (event.key === 'ArrowRight' ? 1 : -1) + TYPES.length) % TYPES.length]
          setActiveResume(next)
          document.getElementById(`rp-tab-${next}`)?.focus()
        }}>{type}</button>)}</div>
          <div id="rp-resume-preview" role="tabpanel" aria-labelledby={`rp-tab-${activeResume}`} tabIndex="0"><div className="rp-resume-meta"><FileText size={21} aria-hidden="true" /><div><h3>{DESCRIPTIONS[activeResume]}</h3><p>{library.files?.[activeResume]}</p></div></div><a className="rp-download" href={`${API}?action=pdf&resume=${encodeURIComponent(activeResume)}`} target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={15} aria-hidden="true" />Open protected PDF</a><details className="rp-preview-details"><summary>Read extracted resume text</summary><pre>{library.resumes?.[activeResume] || 'No resume text available.'}</pre></details></div>
          <div className="rp-library-foot"><ShieldCheck size={17} aria-hidden="true" /><p>Eligibility comes first. A strong technical score never overrides a hard screen.</p></div>
          <details className="rp-preview-details rp-story-bank"><summary>Read saved story bank</summary><pre>{library.storyBank || 'No saved story bank is available.'}</pre></details>
        </aside></div>
        <div ref={resultRef} className="rp-result-anchor">{result ? <Results result={result} /> : <div className="rp-empty" role="status"><div><Search size={20} aria-hidden="true" /></div><p>{analyzing ? 'Reading requirements and checking visible resume evidence…' : 'Paste a job description to see the comparison.'}</p></div>}</div>
        <section id="application-answers" className="rp-answers" aria-labelledby="rp-answers-title">
          <div className="rp-section-heading"><h2 id="rp-answers-title">Application answers</h2><span className="rp-tag">AI-assisted drafting</span></div>
          <p className="rp-answer-intro">Draft an answer using all five PDFs and your saved story bank. The current job description, eligibility facts, company context, and extra notes are included. A job description is optional here.</p>
          <p className="rp-field-help">Your question and these source texts are sent to the configured AI provider. Review the draft and its sources before copying it into an application.</p>
          <div className="rp-answer-workspace">
            <form className="rp-answer-form" onSubmit={draftAnswer}>
              <label htmlFor="rp-question">Application question <span className="rp-required">Required</span></label>
              <textarea id="rp-question" required maxLength={8000} value={question} onChange={event => changeAnswer(setQuestion, event.target.value)} placeholder="Paste the question you need to answer…" rows={4} />
              <label htmlFor="rp-answer-notes">Extra notes or confirmed facts <span className="rp-required">Optional</span></label>
              <textarea id="rp-answer-notes" maxLength={10000} value={answerNotes} onChange={event => changeAnswer(setAnswerNotes, event.target.value)} placeholder="Add company specifics, personal context, or facts the saved sources do not cover…" rows={4} />
              <div className="rp-options"><div><label htmlFor="rp-answer-max">Maximum length</label><input id="rp-answer-max" type="number" min="1" max={answerUnit === 'words' ? 5000 : 20000} step="1" value={answerMax} onChange={event => changeAnswer(setAnswerMax, event.target.value)} placeholder="No limit" aria-describedby="rp-answer-limit-help" /></div><div><label htmlFor="rp-answer-unit">Length unit</label><select id="rp-answer-unit" value={answerUnit} onChange={event => changeAnswer(setAnswerUnit, event.target.value)}><option value="words">Words</option><option value="characters">Characters</option></select></div></div>
              <p className="rp-field-help" id="rp-answer-limit-help">Leave maximum length blank for no limit. Up to 5,000 words or 20,000 characters.</p>
              {!library.aiAvailable && <div className="rp-api-key"><label htmlFor="rp-answer-key">OpenAI API key for answers</label><input id="rp-answer-key" type="password" autoComplete="off" spellCheck="false" value={apiKey} onChange={event => change(setApiKey, event.target.value)} /><p className="rp-field-help">Kept only while this page is open. It is not saved in your browser.</p></div>}
              <div className="rp-analyze-row"><button className="rp-button rp-primary" type="submit" disabled={answerLoading || !question.trim()}><PenLine size={17} aria-hidden="true" />{answerLoading ? 'Drafting answer…' : answerData ? 'Regenerate answer' : 'Draft answer'}</button>{answerLoading && <button className="rp-button rp-quiet" type="button" onClick={() => { answerController.current?.abort(); setAnswerLoading(false) }}>Cancel draft</button>}</div>
              <p className="rp-memory-note">Questions, notes, and drafts are not saved. Reloading or locking clears them.</p>
              {answerError && <p className="rp-error rp-answer-error" role="alert">{answerError}</p>}
            </form>
            <div className="rp-draft-panel" aria-busy={answerLoading}>
              {answerLoading ? <p className="rp-draft-empty" role="status">Reading your sources and drafting within the requested length…</p> : answerData ? <>
                {answerData.needsConfirmation?.length > 0 && <div className="rp-confirmation" role="status"><h3>{answerDraft ? 'Confirm before using' : 'More facts needed'}</h3><ul>{answerData.needsConfirmation.map((item, index) => <li key={index}>{item}</li>)}</ul><p>Add confirmed details in Extra notes, then draft again.</p></div>}
                {answerDraft || answerData.answer ? <><label htmlFor="rp-answer-draft">Editable answer draft</label><textarea id="rp-answer-draft" value={answerDraft} onChange={event => { setAnswerDraft(event.target.value); setCopyStatus('') }} rows={12} aria-describedby="rp-draft-counts rp-draft-limit" /><div className="rp-draft-actions"><output id="rp-draft-counts" aria-live="polite">{answerWords} words · {answerCharacters} characters</output><button className="rp-button" type="button" onClick={copyAnswer} disabled={!answerDraft.trim()}><Copy size={15} aria-hidden="true" />Copy answer</button></div><p id="rp-draft-limit" className={draftOverLimit ? 'rp-over-limit' : 'rp-field-help'}>{draftOverLimit ? `Your edited draft exceeds the ${answerMax}-${answerUnit === 'words' ? 'word' : 'character'} limit. Shorten it before submitting.` : answerMax === '' ? 'No length limit set.' : `Requested maximum: ${answerMax} ${answerUnit}.`}</p>{copyStatus && <p className="rp-copy-status" role="status">{copyStatus}</p>}</> : null}
                <details className="rp-details rp-answer-sources"><summary>Sources for generated draft <span>{answerData.sources?.length || 0}</span></summary><p className="rp-field-help">These quotes support the generated version. Recheck sources after editing.</p>{answerData.sources?.length ? <ul>{answerData.sources.map((source, index) => <li key={index}><strong>{source.source}</strong><blockquote>{source.quote}</blockquote></li>)}</ul> : <p className="rp-details-empty">No supporting quotes returned. Confirm the facts before using an answer.</p>}</details>
                {answerData.model && <p className="rp-model-note">Generated with {answerData.model}{answerData.provider ? ` via ${answerData.provider}` : ''}.</p>}
              </> : <div className="rp-draft-empty"><PenLine size={22} aria-hidden="true" /><p>Your editable draft will appear here.</p><p className="rp-field-help">Start with a question. Extra facts help when the saved sources do not contain the answer.</p></div>}
            </div>
          </div>
        </section>
      </>}
    </main><footer className="rp-footer">Built for a truthful fit. Review the evidence before you apply.</footer>
  </div>
}
