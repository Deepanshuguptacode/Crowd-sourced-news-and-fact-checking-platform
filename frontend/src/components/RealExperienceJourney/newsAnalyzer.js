/**
 * News Feed Analyzer — v3
 *
 * Extracts ACTUAL content from the first news card before hiding.
 * Stores title, description, and link text for form filling.
 */

import { NEWS_MOCK } from './constants';

export const analyzeNewsFeed = () => {
  const result = {
    newsTitle: '',
    newsDescription: '',
    newsLink: '',
  };

  const firstCard = document.querySelector('[data-tour="home-first-news-card"]');
  if (!firstCard) return result;

  // Extract title from h3 > a
  const titleEl = firstCard.querySelector('h3 a');
  result.newsTitle = titleEl?.textContent?.trim() || NEWS_MOCK.title;

  // Extract link from h3 > a href
  result.newsLink = titleEl?.getAttribute('href') || NEWS_MOCK.link;

  // Extract description — try multiple selectors
  const descEl =
    firstCard.querySelector('.prose p') ||
    firstCard.querySelector('p.text-gray-700') ||
    firstCard.querySelector('p.text-gray-600');
  result.newsDescription = descEl?.textContent?.trim() || NEWS_MOCK.description;

  return result;
};
