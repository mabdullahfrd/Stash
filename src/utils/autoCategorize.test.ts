/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_CATEGORIES } from '../data/seedData.ts';
import { categorizeItemOrUncategorized, inferCategoryForItem } from './autoCategorize.ts';

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

test('Respects word boundaries and specificity rules for Chocolate bar, Apple Music, Campus Cafeteria Lunch, Smart Store, Price tag', () => {
  const choco = categorizeItemOrUncategorized('Chocolate bar', INITIAL_CATEGORIES, 'expense');
  assert.equal(choco.name, 'Treats & Snacks');

  const macaron = categorizeItemOrUncategorized('Strawberry Macaron', INITIAL_CATEGORIES, 'expense');
  assert.equal(macaron.name, 'Treats & Snacks');

  const appleMusic = categorizeItemOrUncategorized('Apple Music', INITIAL_CATEGORIES, 'expense');
  assert.equal(appleMusic.name, 'Subscriptions');

  const cafeteria = categorizeItemOrUncategorized('Campus Cafeteria Lunch', INITIAL_CATEGORIES, 'expense');
  assert.equal(cafeteria.name, 'Dining & Takeout');

  const smartStore = categorizeItemOrUncategorized('Smart Store', INITIAL_CATEGORIES, 'expense');
  assert.equal(smartStore.name, 'Uncategorized');

  const priceTag = categorizeItemOrUncategorized('Price tag', INITIAL_CATEGORIES, 'expense');
  assert.equal(priceTag.name, 'Uncategorized');
});

test('Auto-categorizes expanded expense and income categories accurately', () => {
  assert.equal(inferCategoryForItem('Netflix Standard Plan', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-subscriptions');
  assert.equal(inferCategoryForItem('Anytime Fitness Gym Membership', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-fitness');
  assert.equal(inferCategoryForItem('Olive Young Skincare Serum', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-beauty');
  assert.equal(inferCategoryForItem('CGV Cinema Movie Ticket', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-entertainment');
  assert.equal(inferCategoryForItem('Korean Air Flight Ticket', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-travel');
  assert.equal(inferCategoryForItem('Laundry Detergent & Tissues', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-household');
  assert.equal(inferCategoryForItem('MacBook USB-C Charger', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-tech');
  assert.equal(inferCategoryForItem('Friend Birthday Gift', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-gifts');
  assert.equal(inferCategoryForItem('Emergency Fund Deposit', INITIAL_CATEGORIES, 'expense')?.categoryId, 'cat-savings');

  assert.equal(inferCategoryForItem('Upwork Freelance UI Design', INITIAL_CATEGORIES, 'income')?.categoryId, 'cat-freelance');
  assert.equal(inferCategoryForItem('University Merit Scholarship', INITIAL_CATEGORIES, 'income')?.categoryId, 'cat-scholarship');
  assert.equal(inferCategoryForItem('Toss Savings Interest Dividend', INITIAL_CATEGORIES, 'income')?.categoryId, 'cat-investments');
  assert.equal(inferCategoryForItem('Coupang Order Refund', INITIAL_CATEGORIES, 'income')?.categoryId, 'cat-refunds');
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
