import { render, screen } from '@testing-library/react';
import AuthPage from './components/AuthPage';
import Ring from './components/Ring';
import { budgetState, pct, nutrient, fmt } from './lib/format';

test('pct and budgetState never produce NaN and use the colour rule', () => {
  expect(pct(50, 0)).toBe(0);
  expect(pct(NaN, 100)).toBe(0);
  expect(budgetState(50, 100)).toBe('under');
  expect(budgetState(90, 100)).toBe('on-track');
  expect(budgetState(120, 100)).toBe('over');
});

test('nutrient lookup and formatting', () => {
  expect(nutrient([{ key: 'protein', value: 12 }], 'protein')).toBe(12);
  expect(nutrient(undefined, 'protein')).toBe(0);
  expect(fmt(Infinity)).toBe('-');
});

test('auth page renders accessible form fields', () => {
  render(<AuthPage onDone={() => {}} />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});

test('ring labels remaining and over amounts', () => {
  const { rerender } = render(<Ring consumed={500} target={2000} unit="kcal" label="Calories" />);
  expect(screen.getByText('kcal left')).toBeInTheDocument();
  rerender(<Ring consumed={2300} target={2000} unit="kcal" label="Calories" />);
  expect(screen.getByText('kcal over')).toBeInTheDocument();
});
