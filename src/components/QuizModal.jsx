import React, { useState } from 'react'
import { setItem, getItem } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/constants'

export function QuizModal({ isOpen, quiz, studentName, reactionId, onClose }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [saveError, setSaveError] = useState(null)

  if (!isOpen || !quiz) return null

  const questions = quiz.questions
  const question = questions[currentQ]

  const handleAnswer = (qId, optionIndex) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }))
  }

  const handleSubmit = () => {
    // Calculate score
    let correct = 0
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct++
    }
    setScore(correct)
    setSubmitted(true)

    // Save to localStorage
    const result = {
      studentName,
      module: 'Rates of Reaction',
      reaction: reactionId,
      score: correct,
      totalQuestions: questions.length,
      answers: { ...answers },
      timestamp: new Date().toISOString(),
    }

    try {
      const existing = getItem(STORAGE_KEYS.QUIZ_RESULTS, [])
      existing.push(result)
      const saved = setItem(STORAGE_KEYS.QUIZ_RESULTS, existing)
      if (!saved) {
        setSaveError('Quiz saving unavailable — please tell your teacher.')
      }
    } catch {
      setSaveError('Quiz saving unavailable — please tell your teacher.')
    }
  }

  const handleClose = () => {
    setCurrentQ(0)
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setSaveError(null)
    onClose()
  }

  const allAnswered = questions.every(q => answers[q.id] !== undefined)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto py-8"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl w-full mx-4"
        style={{ background: '#22262f', border: '1px solid #363c4a', maxWidth: 560 }}>

        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #363c4a' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>{quiz.title}</h2>
          <button onClick={handleClose} className="text-xl cursor-pointer border-0 bg-transparent"
            style={{ color: '#6b7585', minHeight: 44, minWidth: 44 }}>&times;</button>
        </div>

        {!submitted ? (
          <>
            {/* Question Navigator */}
            <div className="px-5 pt-4 flex gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(idx)}
                  className="w-8 h-8 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors"
                  style={{
                    background: idx === currentQ ? '#4f9cf0' : answers[q.id] !== undefined ? '#3dba7e40' : '#2a2f3a',
                    color: idx === currentQ ? '#fff' : '#8a95a8',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Question */}
            <div className="p-5">
              <p className="text-sm mb-1" style={{ color: '#6b7585' }}>
                Question {currentQ + 1} of {questions.length}
              </p>
              <p className="text-base font-medium mb-4" style={{ color: '#e8eaf0' }}>
                {question.question}
              </p>

              <div className="space-y-2">
                {question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(question.id, idx)}
                    className="w-full text-left p-3 rounded-lg text-sm cursor-pointer border-0 transition-colors"
                    style={{
                      background: answers[question.id] === idx ? '#4f9cf020' : '#2a2f3a',
                      border: answers[question.id] === idx ? '2px solid #4f9cf0' : '2px solid transparent',
                      color: '#e8eaf0',
                      minHeight: 44,
                    }}
                  >
                    <span className="font-mono mr-2" style={{ color: '#6b7585' }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="px-5 pb-5 flex justify-between">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 rounded-lg text-sm cursor-pointer border-0 disabled:opacity-30"
                style={{ background: '#2a2f3a', color: '#8a95a8', minHeight: 44 }}
              >
                &larr; Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0"
                  style={{ background: '#4f9cf0', color: '#fff', minHeight: 44 }}
                >
                  Next &rarr;
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: '#3dba7e', color: '#fff', minHeight: 44 }}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </>
        ) : (
          /* Results */
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">
              {score === questions.length ? '\uD83C\uDF89' : score >= questions.length * 0.6 ? '\uD83D\uDC4D' : '\uD83D\uDCDA'}
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#e8eaf0' }}>
              {score} / {questions.length}
            </h3>
            <p className="text-sm mb-2" style={{ color: '#8a95a8' }}>
              {score === questions.length ? 'Perfect score! Excellent work!' :
               score >= questions.length * 0.8 ? 'Great job! Almost perfect!' :
               score >= questions.length * 0.6 ? 'Good effort! Review the concepts you missed.' :
               'Keep practising! Try the simulation again and focus on the concepts.'}
            </p>
            {saveError && (
              <p className="text-xs mt-2" style={{ color: '#e05555' }}>{saveError}</p>
            )}

            {/* Show correct/incorrect */}
            <div className="mt-6 space-y-3 text-left">
              {questions.map((q, idx) => {
                const correct = answers[q.id] === q.correctIndex
                return (
                  <div key={q.id} className="p-3 rounded-lg text-sm" style={{
                    background: correct ? '#3dba7e15' : '#e0555515',
                    border: `1px solid ${correct ? '#3dba7e40' : '#e0555540'}`,
                  }}>
                    <div className="flex items-start gap-2">
                      <span>{correct ? '\u2705' : '\u274C'}</span>
                      <div>
                        <p className="font-medium" style={{ color: '#e8eaf0' }}>{q.question}</p>
                        {!correct && (
                          <p className="mt-1" style={{ color: '#3dba7e' }}>
                            Correct: {q.options[q.correctIndex]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleClose}
              className="mt-6 px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer border-0"
              style={{ background: '#4f9cf0', color: '#fff', minHeight: 44 }}
            >
              Back to Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
