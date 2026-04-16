import { useState } from "react";
import { useResearchController } from "./controllers/useResearchController";
import { Header } from "./views/components/Header";
import { RecentSearchesPage } from "./views/components/RecentSearchesPage";
import { ReportPanel } from "./views/components/ReportPanel";
import { SearchSection } from "./views/components/SearchSection";
import { SourcesSidebar } from "./views/components/SourcesSidebar";
import { StatsGrid } from "./views/components/StatsGrid";

const App = () => {
  const controller = useResearchController();
  const [activeView, setActiveView] = useState("assistant");
  const handleRecentSearchOpen = async (search) => {
    await controller.selectSearch(search);
    setActiveView("assistant");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_32%)]" />

      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        sessionId={controller.sessionId}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {activeView === "assistant" ? (
          <>
            <SearchSection
              bootstrapping={controller.bootstrapping}
              contextForm={controller.contextForm}
              error={controller.error}
              isLoading={controller.loading}
              lastQuery={controller.lastQuery}
              onContextChange={controller.updateContextField}
              onPromptSelect={controller.applyPrompt}
              onQueryChange={controller.setQuery}
              onResetSession={controller.resetSession}
              onSubmit={controller.handleSubmit}
              prompts={controller.prompts}
              query={controller.query}
              sessionId={controller.sessionId}
              sourceErrors={controller.sourceErrors}
            />

            <StatsGrid stats={controller.stats} />

            <section className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
              <ReportPanel
                citations={controller.citations}
                isLoading={controller.loading}
                lastQuery={controller.lastQuery}
                parsedAnswer={controller.parsedAnswer}
                responseData={controller.responseData}
                sectionLabelMap={controller.sectionLabelMap}
              />

              <SourcesSidebar
                history={controller.history}
                sessionContext={controller.contextForm}
                papers={controller.papers}
                trials={controller.trials}
              />
            </section>
          </>
        ) : (
          <RecentSearchesPage
            citations={controller.citations}
            history={controller.history}
            lastQuery={controller.lastQuery}
            parsedAnswer={controller.parsedAnswer}
            recentSearches={controller.recentSearches}
            responseData={controller.responseData}
            sectionLabelMap={controller.sectionLabelMap}
            selectedSearchId={controller.selectedSearchId}
            sessionContext={controller.contextForm}
            onSelectSearch={handleRecentSearchOpen}
          />
        )}
      </main>
    </div>
  );
};

export default App;
