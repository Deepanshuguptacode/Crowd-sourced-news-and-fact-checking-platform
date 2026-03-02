/**
 * Constants for the RealExperienceJourney tour system.
 */

export const AI_VERDICT_RULES = {
  scoring: [
    { range: '81–100', meaning: 'Highly credible and verified', color: 'bg-green-500' },
    { range: '61–80', meaning: 'Likely true with minor concerns', color: 'bg-green-400' },
    { range: '41–60', meaning: 'Uncertain / mixed evidence', color: 'bg-yellow-500' },
    { range: '21–40', meaning: 'Likely false or misleading', color: 'bg-red-400' },
    { range: '0–20', meaning: 'Definitely fake / misinformation', color: 'bg-red-600' },
  ],
  topCommentSelection: [
    'Comments split by stance: "In Favor" vs "Against" (General excluded)',
    'If AI groups exist → highest-scored comment from each group (ensures diversity)',
    'Fallback → top comments by raw score (upvotes − downvotes)',
    'Up to 8 supporting + 8 opposing = max 16 sent to AI',
  ],
  credibilityFactors: [
    'Comment score = Expert Upvotes − Expert Downvotes',
    'Only verified domain experts can vote on comments',
    'Expert comments weighted more heavily than community',
    'Evidence links increase credibility signal weight',
  ],
  aiEvaluation: [
    'Quality & credibility of the news source',
    'Evidence in top community & expert comments',
    'Expert vs community consensus alignment',
    'Consistency of information across comments',
    'Potential for harm if the news is false',
  ],
  verificationThresholds: [
    'Needs ≥5 total community votes to change status',
    '>50% upvotes → Status: "Verified"',
    '>50% downvotes → Status: "Fake"',
    '50/50 split → Status remains "Pending"',
  ],
};

/** Fallback mock data — used ONLY when actual text extraction fails */
export const DEBATE_MOCK = {
  similar:
    'AI moderation can efficiently handle the massive scale of online content, processing millions of posts in seconds — something human moderators simply cannot match.',
  newGroup:
    'The economic impact of AI moderation on the content moderation job market needs careful consideration and transition planning.',
  counter:
    'While AI speed is impressive, it frequently misunderstands context, satire, and cultural nuances — leading to wrongful censorship of legitimate speech.',
  offTopic:
    'I think blockchain technology is more important for the future of social media than any AI tool could ever be.',
};

export const NEWS_MOCK = {
  title: 'Study: Global Renewable Energy Capacity Surpasses Coal for First Time',
  description:
    "A landmark report by the International Energy Agency reveals that global renewable energy generation capacity has officially overtaken coal-fired power for the first time in history, marking a pivotal shift in the world's energy landscape.",
  link: 'https://www.iea.org/news/renewable-capacity-milestone',
  comment:
    'This aligns with recent data from Bloomberg NEF showing a 40% increase in solar installations last year. The methodology appears sound and peer-reviewed.',
};
