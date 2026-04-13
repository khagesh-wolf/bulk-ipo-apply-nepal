/**
 * Store barrel — re-exports all Zustand stores and their selectors.
 */

export {
  useAccountStore,
  selectActiveAccounts,
  selectAccountById,
} from './accountStore';

export {
  useIPOStore,
  selectOpenIssues,
  selectUpcomingIssues,
  selectApplicationsByAccount,
  selectApplicationsByIssue,
} from './ipoStore';

export {
  useMarketStore,
  selectMarketIsUp,
  selectFormattedChange,
  selectTopNGainers,
  selectTopNLosers,
  selectTopNTurnover,
} from './marketStore';

export {
  useNewsStore,
  selectFilteredArticles,
  selectArticlesByCategory,
  selectAvailableCategories,
} from './newsStore';

export {
  useWatchlistStore,
  selectActiveAlerts,
  selectTriggeredAlerts,
  selectAlertsBySymbol,
  selectWatchlistSymbols,
} from './watchlistStore';
