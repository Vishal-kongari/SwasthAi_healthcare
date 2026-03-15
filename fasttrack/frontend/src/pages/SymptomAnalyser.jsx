import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Send, MessageCircle, Loader2, AlertCircle, Stethoscope, Calendar, Heart, Lightbulb } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';
import './SymptomAnalyser.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function stripMarkdown(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/__/g, '')
    .replace(/_/g, '')
    .trim();
}

function structureAnalysis(text) {
  const cleaned = stripMarkdown(text);
  const sections = [];
  const possibleMatch = cleaned.match(/(?:Possible conditions?|Possible condition)[:\s]+([\s\S]*?)(?=When to see a doctor|Self-care|$)/i);
  const whenMatch = cleaned.match(/(?:When to see a doctor)[:\s]+([\s\S]*?)(?=Self-care|$)/i);
  const selfCareMatch = cleaned.match(/(?:Self-care(?:\s*tips?)?)[:\s]+([\s\S]*?)$/i);
  if (possibleMatch) sections.push({ id: 'conditions', title: 'Possible conditions', body: possibleMatch[1].trim(), icon: Stethoscope });
  if (whenMatch) sections.push({ id: 'doctor', title: 'When to see a doctor', body: whenMatch[1].trim(), icon: Calendar });
  if (selfCareMatch) sections.push({ id: 'selfcare', title: 'Self-care tips', body: selfCareMatch[1].trim(), icon: Heart });
  if (sections.length === 0) sections.push({ id: 'main', title: null, body: cleaned, icon: null });
  return sections;
}

export default function SymptomAnalyser() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null); // { analysis, explanation }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
      }
      if (final) setSymptoms((prev) => (prev ? `${prev} ${final}` : final).trim());
    };
    recognition.onerror = (e) => {
      if (e.error !== 'aborted') setError('Voice input error. Try again or type your symptoms.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const toggleVoice = () => {
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    setError('');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        setError('Could not start microphone. Check permissions.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = symptoms.trim();
    if (!text) {
      setError(t('symptomErrorDescribe'));
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/analyze-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult({ analysis: data.analysis, explanation: data.explanation || '', priority: data.priority || 'routine' });
      if (currentUser?.uid) {
        try {
          const symptomRef = ref(db, `users/${currentUser.uid}/symptomHistory/${Date.now()}`);
          await set(symptomRef, {
            symptoms: text,
            analysis: data.analysis,
            explanation: data.explanation || '',
            priority: data.priority || 'routine',
            date: new Date().toISOString(),
          });
        } catch (e) {
          console.error('Failed to save symptom to profile history', e);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sections = result?.analysis ? structureAnalysis(result.analysis) : [];
  const hasStructured = sections.length > 0 && sections[0].id !== 'main';

  return (
    <div className="symptom-analyser-page">
      <div className="symptom-bg-pattern" aria-hidden="true" />
      <div className="symptom-analyser-container">
        <nav className="symptom-nav">
          <Link to="/dashboard" className="symptom-back-link">
            <ArrowLeft size={20} /> {t('symptomBackToDashboard')}
          </Link>
        </nav>

        <header className="symptom-hero">
          <div className="symptom-hero-icon">
            <MessageCircle size={32} strokeWidth={2} />
          </div>
          <h1 className="symptom-hero-title">{t('symptomTitle')}</h1>
          <p className="symptom-hero-desc">{t('symptomDesc')}</p>
        </header>

        <form onSubmit={handleSubmit} className="symptom-card symptom-form-card">
          <label htmlFor="symptoms" className="symptom-label">{t('yourSymptoms')}</label>
          <textarea
            id="symptoms"
            placeholder={t('symptomPlaceholder')}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            disabled={loading}
            className="symptom-textarea"
          />
          <div className="symptom-actions">
            <button
              type="button"
              className={`symptom-voice-btn ${isListening ? 'is-listening' : ''}`}
              onClick={toggleVoice}
              title={isListening ? t('stop') : t('voiceInput')}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {isListening ? t('stop') : t('voiceInput')}
            </button>
            <button type="submit" className="symptom-submit-btn" disabled={loading || !symptoms.trim()}>
              {loading ? <Loader2 size={20} className="symptom-spin" /> : <Send size={20} />}
              {loading ? t('analysing') : t('getAnalysis')}
            </button>
          </div>
          {error && (
            <div className="symptom-err" role="alert">
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </form>

        {result && (
          <div className="symptom-results">
            <div className="symptom-analysis-card">
              <div className="symptom-card-header-row">
                <h2 className="symptom-card-heading">
                  <Stethoscope size={22} /> {t('analysis')}
                </h2>
                {result.priority && (
                  <span className={`symptom-priority-badge symptom-priority-${result.priority}`} role="status">
                    {result.priority === 'emergency' && t('emergency')}
                    {result.priority === 'urgent' && t('urgent')}
                    {result.priority === 'routine' && t('routine')}
                  </span>
                )}
              </div>
              {hasStructured ? (
                <div className="symptom-sections">
                  {sections.map((sec) => (
                    <div key={sec.id} className="symptom-section">
                      {sec.title && (
                        <h3 className="symptom-section-title">
                          {sec.icon && <sec.icon size={18} />}
                          {sec.id === 'conditions' ? t('possibleConditions') : sec.id === 'doctor' ? t('whenToSeeDoctor') : sec.id === 'selfcare' ? t('selfCareTips') : sec.title}
                        </h3>
                      )}
                      <div className="symptom-section-body">
                        {sec.body.split(/\n+/).map((p, i) => (
                          <p key={i}>{stripMarkdown(p).trim() || '\u00A0'}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="symptom-plain-body">
                  {stripMarkdown(result.analysis).split(/\n+/).map((p, i) => (
                    <p key={i}>{p.trim() || '\u00A0'}</p>
                  ))}
                </div>
              )}
              <p className="symptom-disclaimer">{t('symptomDisclaimer')}</p>
            </div>

            {result.explanation && (
              <div className="symptom-explainable-card">
                <h2 className="symptom-card-heading explainable-heading">
                  <Lightbulb size={22} /> {t('whyThisResponse')}
                </h2>
                <p className="symptom-explainable-text">{stripMarkdown(result.explanation)}</p>
                <p className="symptom-explainable-note">{t('explainableNote')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
