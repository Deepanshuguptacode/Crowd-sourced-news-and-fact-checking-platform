import { AI_VERDICT_RULES } from './constants';

const VerdictRulesPanel = () => (
  <div className="max-h-60 overflow-y-auto pr-1 space-y-3 text-xs">
    <div>
      <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
        📊 Credibility Score Ranges
      </h5>
      <div className="space-y-1">
        {AI_VERDICT_RULES.scoring.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${s.color}`} />
            <span className="font-mono text-gray-700 dark:text-gray-300 w-12">{s.range}</span>
            <span className="text-gray-600 dark:text-gray-400">{s.meaning}</span>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
        🎯 Top Comment Selection
      </h5>
      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
        {AI_VERDICT_RULES.topCommentSelection.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
        ⚖️ Comment Credibility
      </h5>
      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
        {AI_VERDICT_RULES.credibilityFactors.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
        🤖 AI Evaluation Criteria
      </h5>
      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
        {AI_VERDICT_RULES.aiEvaluation.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
        🗳️ Voting Thresholds
      </h5>
      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
        {AI_VERDICT_RULES.verificationThresholds.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default VerdictRulesPanel;
