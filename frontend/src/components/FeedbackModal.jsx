import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  X,
  Send,
  CheckCircle2,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useChat } from '../context/ChatContext';

const FEEDBACK_TAGS = [
  'Accurate & Factual',
  'Clear & Well-Structured',
  'Grounded Citations',
  'Hallucinated Information',
  'Missing Context',
  'Slow Latency',
  'Irrelevant Chunk Match',
  'Super Helpful'
];

export default function FeedbackModal({ message, isOpen, onClose }) {
  const { recordFeedback } = useChat();
  const [ratingType, setRatingType] = useState(message?.feedback?.rating_type || 'thumbs_up');
  const [stars, setStars] = useState(message?.feedback?.stars || 5);
  const [selectedTags, setSelectedTags] = useState(message?.feedback?.tags || []);
  const [comment, setComment] = useState(message?.feedback?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !message) return null;

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recordFeedback(message.id, ratingType, stars, selectedTags, comment);
      setSubmitted(true);

      // Trigger celebratory micro-confetti on successful feedback
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }} onClick={onClose}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass-bright)',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Response Feedback</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Help train and evaluate our static bot & document QA quality
            </p>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>Thank You!</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Your feedback telemetry has been recorded to the observability dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Thumbs Up / Down Selector */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setRatingType('thumbs_up')}
                className="btn"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: ratingType === 'thumbs_up' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-tertiary)',
                  border: ratingType === 'thumbs_up' ? '1px solid var(--success)' : '1px solid var(--border-glass)',
                  color: ratingType === 'thumbs_up' ? 'var(--success)' : 'var(--text-secondary)'
                }}
              >
                <ThumbsUp size={18} /> Helpful Response
              </button>
              <button
                type="button"
                onClick={() => setRatingType('thumbs_down')}
                className="btn"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: ratingType === 'thumbs_down' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-tertiary)',
                  border: ratingType === 'thumbs_down' ? '1px solid var(--danger)' : '1px solid var(--border-glass)',
                  color: ratingType === 'thumbs_down' ? 'var(--danger)' : 'var(--text-secondary)'
                }}
              >
                <ThumbsDown size={18} /> Needs Improvement
              </button>
            </div>

            {/* Star Rating */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Star Rating
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setStars(starVal)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star
                      size={24}
                      color={starVal <= stars ? '#f59e0b' : 'var(--border-glass)'}
                      fill={starVal <= stars ? '#f59e0b' : 'transparent'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Evaluation Tags */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <Tag size={13} /> Select Tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {FEEDBACK_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-tertiary)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Comments */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Additional Comments (Optional)
              </label>
              <textarea
                className="input-text"
                rows={3}
                placeholder="What went well or what could be improved about this response?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Submit CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
