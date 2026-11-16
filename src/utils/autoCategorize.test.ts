/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_CATEGORIES } from '../data/seedData.ts';
import { inferCategoryForItem } from './autoCategorize.ts';

test('Auto-categorizes common grocery, coffee, treat, dining, study, and transit items', () => {
  const eggs = inferCategoryForItem('Grade-A Eggs', INITIAL_CATEGORIES, 'expense');
  assert.equal(eggs?.categoryId, 'cat-groceries');

  const coffee = inferCategoryForItem('Mega Coffee Iced Latte', INITIAL_CATEGORIES, 'expense');
  assert.equal(coffee?.categoryId, 'cat-coffee');

  const iceCream = inferCategoryForItem('Baskin Robbins pint', INITIAL_CATEGORIES, 'expense');
  assert.equal(iceCream?.categoryId, 'cat-icecream');

  const meal = inferCategoryForItem('Lunch Kimbap & Tteokbokki', INITIAL_CATEGORIES, 'expense');
  assert.equal(meal?.categoryId, 'cat-dining');

  const textbook = inferCategoryForItem('Kyobo Bookstore Textbook', INITIAL_CATEGORIES, 'expense');
  assert.equal(textbook?.categoryId, 'cat-study');

  const metro = inferCategoryForItem('T-Money Subway Recharge', INITIAL_CATEGORIES, 'expense');
  assert.equal(metro?.categoryId, 'cat-transit');
});

test('Auto-categorizes charity keywords and income keywords accurately', () => {
  const zakat = inferCategoryForItem('Monthly Zakat Donation', INITIAL_CATEGORIES, 'expense');
  assert.equal(zakat?.categoryId, 'cat-charity');
  assert.equal(zakat?.isCharity, true);

  const stipend = inferCategoryForItem('Engineering Internship Stipend', INITIAL_CATEGORIES, 'income');
  assert.equal(stipend?.categoryId, 'cat-placement');

  const tutoring = inferCategoryForItem('Math Tutoring 2hrs', INITIAL_CATEGORIES, 'income');
  assert.equal(tutoring?.categoryId, 'cat-tutoring');
});

test('Returns null for empty or unknown text without forcing category changes', () => {
  assert.equal(inferCategoryForItem('', INITIAL_CATEGORIES, 'expense'), null);
  assert.equal(inferCategoryForItem('a', INITIAL_CATEGORIES, 'expense'), null);
  assert.equal(inferCategoryForItem('Miscellaneous Item XYZ', INITIAL_CATEGORIES, 'expense'), null);
});
