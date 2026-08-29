import React, { useState, useMemo } from 'react';
import { 
  Article, 
  AcademicEvent, 
  Journal, 
  WishlistItem, 
  NavTab, 
  JurisdictionType 
} from './types';
import { 
  INITIAL_ARTICLES, 
  INITIAL_EVENTS, 
  INITIAL_JOURNALS, 
  INITIAL_WISHLIST, 
  TOPIC_TAGS 
} from './data/mockData';
import { HeaderNav } from './components/HeaderNav';
import { GlobalSearch } from './components/GlobalSearch';
import { ArticleCard } from './components/ArticleCard';
import { EventSidebar } from './components/EventSidebar';
import { JournalShelf } from './components/JournalShelf';
import { WishlistSection } from './components/WishlistSection';
import { ArticleModal } from './components/ArticleModal';
import { getRemainingTime } from './lib/dateUtils';
import { 
  Filter, 
  Library, 
  Bookmark, 
  CalendarClock, 
  BookOpen,
  ArrowRight,
  Scale, 
  CheckCircle, 
  X
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('全部领域');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<JurisdictionType>('All');

  // Data State
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [events] = useState<AcademicEvent[]>(INITIAL_EVENTS);
  const [journals, setJournals] = useState<Journal[]>(INITIAL_JOURNALS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);

  // Modal State
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Urgent Events calculation (< 7 days)
  const urgentEventCount = useMemo(() => {
    return events.filter((e) => getRemainingTime(e.deadline).isUrgent).length;
  }, [events]);

  // Saved Articles Count
  const savedCount = useMemo(() => {
    return articles.filter((a) => a.saved).length;
  }, [articles]);

  // Pinned Journals Count
  const pinnedJournalCount = useMemo(() => {
    return journals.filter((j) => j.isPinned).length;
  }, [journals]);

  // Toggle Bookmark for Article
  const handleToggleSave = (id: string) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === id) {
          const nextSaved = !art.saved;
          showToast(nextSaved ? '已收藏文献至学者书签' : '已取消收藏该文献');
          return { ...art, saved: nextSaved };
        }
        return art;
      })
    );
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle((prev) => (prev ? { ...prev, saved: !prev.saved } : null));
    }
  };

  // Toggle Pin for Journal
  const handleTogglePin = (id: string) => {
    setJournals((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const nextPinned = !j.isPinned;
          showToast(nextPinned ? `已置顶关注《${j.nameCn}》` : `已取消《${j.nameCn}》的置顶`);
          return { ...j, isPinned: nextPinned };
        }
        return j;
      })
    );
  };

  // Filter by tag (from Article Card tag click)
  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setActiveTab('home');
    showToast(`已筛选标签：#${tag}`);
  };

  // Add new Wishlist Item
  const handleAddWishlistItem = (item: Omit<WishlistItem, 'id' | 'submittedAt' | 'votes' | 'status'>) => {
    const newItem: WishlistItem = {
      ...item,
      id: `wish-${Date.now()}`,
      submittedAt: new Date().toISOString().split('T')[0],
      votes: 1,
      userVoted: true,
      status: '待处理'
    };
    setWishlist((prev) => [newItem, ...prev]);
    showToast('心愿单已提交，感谢您的学术贡献！');
  };

  // Vote on Wishlist Item
  const handleVoteWishlistItem = (id: string) => {
    setWishlist((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const alreadyVoted = w.userVoted;
          const nextVotes = alreadyVoted ? w.votes - 1 : w.votes + 1;
          showToast(alreadyVoted ? '已取消点赞' : '点赞催更成功！+1');
          return {
            ...w,
            votes: nextVotes,
            userVoted: !alreadyVoted
          };
        }
        return w;
      })
    );
  };

  // Filter from Journal shelf to articles
  const handleFilterByJournal = (journalName: string) => {
    setSearchQuery(journalName);
    setActiveTab('home');
    showToast(`正在查阅《${journalName}》相关文献`);
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTag('全部领域');
    setSelectedJurisdiction('All');
  };

  // Filtered Articles based on Search & Tags & Jurisdiction
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        art.titleCn.toLowerCase().includes(q) ||
        art.titleOriginal.toLowerCase().includes(q) ||
        art.journalName.toLowerCase().includes(q) ||
        art.journalAbbr.toLowerCase().includes(q) ||
        art.authors.some((a) => a.toLowerCase().includes(q)) ||
        art.authorAffiliation.toLowerCase().includes(q) ||
        art.abstractCn.toLowerCase().includes(q) ||
        art.abstractOriginal.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q)) ||
        art.doi.toLowerCase().includes(q);

      const matchesTag = selectedTag === '全部领域' || art.tags.includes(selectedTag);

      const matchesJurisdiction =
        selectedJurisdiction === 'All' || art.jurisdiction === selectedJurisdiction;

      return matchesSearch && matchesTag && matchesJurisdiction;
    });
  }, [articles, searchQuery, selectedTag, selectedJurisdiction]);

  // Saved articles list
  const savedArticles = useMemo(() => {
    return articles.filter((a) => a.saved);
  }, [articles]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col text-[#09090B] font-sans selection:bg-[#0F52BA]/15 selection:text-[#0F52BA]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#09090B] text-white px-4 py-2.5 rounded-lg shadow-xl border border-zinc-800 text-xs sm:text-sm font-medium flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-[#0F52BA] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Header & Navigation */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedCount}
        urgentEventCount={urgentEventCount}
        pinnedJournalCount={pinnedJournalCount}
        wishlistCount={wishlist.length}
        onResetFilters={handleResetFilters}
      />

      {/* Global Search Bar */}
      <GlobalSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        selectedJurisdiction={selectedJurisdiction}
        setSelectedJurisdiction={setSelectedJurisdiction}
        totalResults={filteredArticles.length}
        onClearAll={handleResetFilters}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Quick Tag Pills Filter */}
            <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                <span className="font-semibold text-zinc-500 text-[11px] whitespace-nowrap flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-[#0F52BA]" />
                  学科分类:
                </span>
                {TOPIC_TAGS.map((tag) => (
                  <button
                    key={tag}
                    id={`topic-tag-btn-${tag}`}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedTag === tag
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 border border-zinc-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout: Main Literature Feed (Left/Center) + Academic Events DDL Sidebar (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* Left Column: Latest Literature Feed */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-900 text-white">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-editorial-heading font-bold text-lg text-zinc-900 tracking-tight">
                        最新域外法学文献流
                      </h2>
                      <p className="text-xs text-zinc-500">
                        核心期刊论文、双语论点要旨及判例评述
                      </p>
                    </div>
                  </div>

                  {selectedTag !== '全部领域' && (
                    <div className="flex items-center gap-1.5 text-xs bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200">
                      <span>学科: <strong>#{selectedTag}</strong></span>
                      <button
                        onClick={() => setSelectedTag('全部领域')}
                        className="text-zinc-400 hover:text-zinc-900 font-bold"
                        title="取消学科筛选"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Articles List */}
                <div className="space-y-3.5">
                  {filteredArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      searchQuery={searchQuery}
                      onTagClick={handleTagClick}
                      onToggleSave={handleToggleSave}
                      onOpenDetail={(art) => setSelectedArticle(art)}
                    />
                  ))}

                  {filteredArticles.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 space-y-3">
                      <Scale className="w-10 h-10 text-zinc-300 mx-auto" />
                      <h3 className="font-editorial-heading font-bold text-base text-zinc-900">
                        未检索到匹配的法学文献
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        建议尝试减少筛选条件，或前往“心愿单”提交该篇文献的收录建议。
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3.5 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-md hover:bg-[#0F52BA] transition-colors"
                      >
                        清除所有筛选条件
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Academic Events & DDL Countdown Sidebar */}
              <div className="lg:col-span-4 space-y-5">
                <EventSidebar
                  events={events}
                  onViewAllEvents={() => setActiveTab('events')}
                />

                {/* Quick Journal Shelf Mini-Widget */}
                <div className="bg-white text-zinc-900 rounded-xl p-5 shadow-2xs space-y-3 border border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-zinc-100 border border-zinc-200">
                        <Library className="w-3.5 h-3.5 text-[#0F52BA]" />
                      </div>
                      <h3 className="font-editorial-heading font-bold text-sm text-zinc-900">
                        置顶关注期刊
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('journals')}
                      className="text-xs text-[#0F52BA] hover:underline flex items-center gap-0.5 font-semibold text-[11px]"
                    >
                      <span>进入书架</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    已置顶 {pinnedJournalCount} 本核心法律评论，点击可快速检索对应期刊文献。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {journals
                      .filter((j) => j.isPinned)
                      .map((j) => (
                        <button
                          key={j.id}
                          onClick={() => handleFilterByJournal(j.nameOriginal)}
                          className="px-2 py-0.5 rounded-md bg-zinc-50 hover:bg-[#0F52BA] hover:text-white text-zinc-700 text-xs font-mono border border-zinc-200 transition-colors"
                          title="查看该期刊文献"
                        >
                          ★ {j.abbreviation}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: JOURNALS */}
        {activeTab === 'journals' && (
          <JournalShelf
            journals={journals}
            onTogglePin={handleTogglePin}
            onFilterByJournal={handleFilterByJournal}
          />
        )}

        {/* VIEW 3: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 sm:p-8 text-[#09090B] border border-zinc-200 shadow-2xs">
              <div className="max-w-3xl space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-sans font-semibold">
                  <CalendarClock className="w-3.5 h-3.5 text-[#0F52BA]" />
                  <span>Call for Papers & Academic Summits</span>
                </div>
                <h2 className="font-editorial-heading font-bold text-2xl sm:text-3xl text-[#09090B] tracking-tight">
                  国际学术研讨会与法学特刊征稿
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                  追踪知名法学院与国际学会征稿（CFP）。截稿日期不足 7 天的活动将启用红色紧急倒计时预警。
                </p>
              </div>
            </div>

            <EventSidebar events={events} isFullView={true} />
          </div>
        )}

        {/* VIEW 4: WISHLIST */}
        {activeTab === 'wishlist' && (
          <WishlistSection
            wishlist={wishlist}
            onAddWishlistItem={handleAddWishlistItem}
            onVoteWishlistItem={handleVoteWishlistItem}
          />
        )}

        {/* VIEW 5: SAVED ARTICLES */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 sm:p-8 text-[#09090B] border border-zinc-200 shadow-2xs">
              <div className="max-w-3xl space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-sans font-semibold">
                  <Bookmark className="w-3.5 h-3.5 text-[#0F52BA]" />
                  <span>Scholar Bookmark Archive</span>
                </div>
                <h2 className="font-editorial-heading font-bold text-2xl sm:text-3xl text-[#09090B] tracking-tight">
                  学者个人书签文献 ({savedArticles.length})
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                  集中管理您在研究中所收藏的文献与评注，支持在详情页一键生成并复制 Bluebook / GB-T 7714 引证。
                </p>
              </div>
            </div>

            {savedArticles.length > 0 ? (
              <div className="space-y-3.5">
                {savedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    searchQuery=""
                    onTagClick={handleTagClick}
                    onToggleSave={handleToggleSave}
                    onOpenDetail={(art) => setSelectedArticle(art)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 space-y-3">
                <Bookmark className="w-10 h-10 text-zinc-300 mx-auto" />
                <h3 className="font-editorial-heading font-bold text-base text-zinc-900">
                  暂无收藏的文献
                </h3>
                <p className="text-xs text-zinc-500">
                  在“文献流”中点击卡片上的书签按钮即可快速收藏。
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-3.5 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-md hover:bg-[#0F52BA] transition-colors"
                >
                  前往发现文献
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Deep Read Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onToggleSave={handleToggleSave}
      />

      {/* Footer */}
      <footer className="bg-white text-zinc-500 border-t border-zinc-200 mt-16 py-7 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#0F52BA]" />
            <span className="font-editorial-heading font-bold text-zinc-900 tracking-tight">
              LexExtern · 域外法学信息聚合平台
            </span>
            <span className="text-zinc-300">/</span>
            <span>学术开放检索原型 MVP</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-500">
            <span>数据源: HLR · YLJ · OJLS · CML Rev · MPI</span>
            <span>·</span>
            <span>严格遵守学术规范与引证标准</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

