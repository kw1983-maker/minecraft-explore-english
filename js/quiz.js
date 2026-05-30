// Quiz overlay controller: renders a multiple-choice question, handles
// answering (with retry + hint + explanation), and reports the outcome.
import { Sfx } from './audio.js';

export class Quiz {
  constructor() {
    this.el = {
      overlay: document.getElementById('quiz'),
      category: document.getElementById('quiz-category'),
      visual: document.getElementById('quiz-visual'),
      question: document.getElementById('quiz-question'),
      options: document.getElementById('quiz-options'),
      feedback: document.getElementById('quiz-feedback'),
      hint: document.getElementById('quiz-hint'),
      continue: document.getElementById('quiz-continue'),
      close: document.getElementById('quiz-close'),
    };
    this.active = false;
    this.solved = false;
    this.cb = {};

    this.el.hint.addEventListener('click', () => this._showHint());
    this.el.continue.addEventListener('click', () => this._finish());
    this.el.close.addEventListener('click', () => this._abandon());
  }

  isOpen() { return this.active; }

  // callbacks: { onCorrect, onWrong, onSolved, onAbandon }
  open(question, callbacks) {
    this.active = true;
    this.solved = false;
    this.question = question;
    this.cb = callbacks || {};

    this.el.category.textContent = question.category || 'Question';
    this.el.visual.textContent = question.visual || '';
    this.el.question.textContent = question.q;

    // build option buttons
    this.el.options.innerHTML = '';
    question.options.forEach((text, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = text;
      b.addEventListener('click', () => this._answer(i, b));
      this.el.options.appendChild(b);
    });

    this.el.feedback.className = 'quiz-feedback hidden';
    this.el.feedback.textContent = '';
    this.el.continue.classList.add('hidden');
    this.el.hint.classList.toggle('hidden', !question.hint);
    this.el.overlay.classList.remove('hidden');
  }

  _answer(i, btn) {
    if (this.solved) return;
    Sfx.click();
    if (i === this.question.answer) {
      this.solved = true;
      btn.classList.add('correct');
      this._disableOptions();
      Sfx.correct();
      this.el.feedback.className = 'quiz-feedback ok';
      this.el.feedback.innerHTML =
        `✅ <b>Correct!</b> ${this.question.explain || ''}`;
      this.el.feedback.classList.remove('hidden');
      this.el.hint.classList.add('hidden');
      this.el.continue.classList.remove('hidden');
      this.cb.onCorrect && this.cb.onCorrect();
    } else {
      // wrong: mark this option, let them try again (no penalty)
      btn.classList.add('wrong');
      btn.disabled = true;
      Sfx.wrong();
      this.el.feedback.className = 'quiz-feedback bad';
      this.el.feedback.textContent = '❌ Not quite — try again!';
      this.el.feedback.classList.remove('hidden');
      this.cb.onWrong && this.cb.onWrong();
    }
  }

  _showHint() {
    if (!this.question.hint) return;
    Sfx.click();
    this.el.feedback.className = 'quiz-feedback';
    this.el.feedback.style.background = 'rgba(255,210,63,0.12)';
    this.el.feedback.style.border = '2px solid rgba(255,210,63,0.5)';
    this.el.feedback.innerHTML = `💡 <b>Hint:</b> ${this.question.hint}`;
    this.el.feedback.classList.remove('hidden');
  }

  _disableOptions() {
    [...this.el.options.children].forEach((b) => {
      b.disabled = true;
      if (b.textContent === this.question.options[this.question.answer]) {
        b.classList.add('correct');
      }
    });
  }

  _close() {
    this.active = false;
    this.el.overlay.classList.add('hidden');
    // reset any inline styles set by hint
    this.el.feedback.style.background = '';
    this.el.feedback.style.border = '';
  }

  _finish() {
    Sfx.click();
    this._close();
    this.cb.onSolved && this.cb.onSolved();
  }

  _abandon() {
    Sfx.click();
    const wasSolved = this.solved;
    this._close();
    if (wasSolved) {
      this.cb.onSolved && this.cb.onSolved();
    } else {
      this.cb.onAbandon && this.cb.onAbandon();
    }
  }
}
